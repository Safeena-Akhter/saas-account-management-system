import type { Role } from "@prisma/client";

import { canManageRole, INVITABLE_ROLES, USER_MANAGEMENT_VIEW_ROLES } from "../constants/roles";
import {
  countActiveOwners,
  countOwners,
  createCompanyUser as createCompanyUserRow,
  deleteCompanyUser as deleteCompanyUserRow,
  findByIdAndCompany,
  findManyByCompany,
  findUserByEmail,
  findUserById,
  updateAvatar as updateAvatarRow,
  updateCompanyUser as updateCompanyUserRow,
  updatePreferences as updatePreferencesRow,
  updateSelfProfile
} from "../repositories/user.repository";
import { cloudinary } from "../config/cloudinary";
import { toPublicUser } from "./auth.service";
import { AppError } from "../utils/AppError";
import { hashPassword } from "../utils/hash";
import { generateTemporaryPassword } from "../utils/password";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdatePreferencesInput,
  UpdateProfileInput,
  UpdateUserInput
} from "../validators/user.validator";
import { randomBytes } from "crypto";
import {
  createInvitationToken,
  deleteInvitationTokensForUser
} from "../repositories/invitation.repository";
import { sendInvitationEmail } from "./email.service";
import { findCompanyById } from "../repositories/company.repository";
import { createForRoles, notifyOrIgnore } from "./notification.service";
import { enforceLimit } from "./planLimit.service";

// Same 24h window as email verification - long enough that a new hire
// checking their inbox the next morning isn't locked out, short enough that
// a stale, unused invite doesn't sit valid indefinitely.
const INVITATION_TTL_MS = 24 * 60 * 60 * 1000;

type Actor = { id: string; role: Role; companyId: string };

export async function listCompanyUsers(actor: Actor, query: ListUsersQuery) {
  const { search, page, pageSize } = query;

  const { users, total } = await findManyByCompany({ companyId: actor.companyId, search, page, pageSize });

  return {
    users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
  };
}

export async function createCompanyUser(actor: Actor, input: CreateUserInput) {
  // Route-level `requireRole("BUSINESS_OWNER")` (user.routes.ts) and the
  // Zod schema's assignableRoleSchema (user.validator.ts) already keep this
  // to Manager/Accountant/Employee - this is the service-layer
  // defense-in-depth check: if either of those were ever loosened, this
  // line is what actually stops an owner (or worse, a role check that
  // regressed to allow non-owners in) from minting a Business Owner or
  // Super Admin account.
  if (!INVITABLE_ROLES.includes(input.role)) {
    throw new AppError("You do not have permission to assign this role", 403);
  }

  // Plan.maxUsers - checked before the email-uniqueness lookup below so a
  // company at its cap gets the limit message rather than a confusing
  // "email exists" check running for a user that was never going to be
  // creatable anyway.
  await enforceLimit(actor.companyId, "users");

  const existing = await findUserByEmail(input.email);

  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  // Never shown to the owner, never logged, never emailed anywhere -
  // this exists only so the row satisfies the schema's NOT NULL password
  // column. The employee sets their real password via the invitation link
  // below; nobody can log in with this value because emailVerifiedAt stays
  // null until they do (see login's unverified-user check in
  // auth.service.ts).
  const temporaryPassword = generateTemporaryPassword();
  const hashedPassword = await hashPassword(temporaryPassword);

  const user = await createCompanyUserRow({
    name: input.name,
    email: input.email,
    hashedPassword,
    role: input.role,
    companyId: actor.companyId
  });

  await issueInvitation(user.id, user.email, user.name, input.role, actor.companyId);

  // Owner/Manager (USER_MANAGEMENT_VIEW_ROLES - the roles that can see the
  // User Management module at all), excluding whichever Owner just sent the
  // invite.
  void notifyOrIgnore(() =>
    createForRoles(
      actor.companyId,
      USER_MANAGEMENT_VIEW_ROLES,
      {
        type: "NEW_USER_INVITATION",
        title: "New user invited",
        message: `${user.name} (${user.email}) was invited as ${input.role}.`,
        link: "/user-management"
      },
      actor.id
    )
  );

  return user;
}

// Shared by createCompanyUser (first invite) and resendInvitation (re-send
// after the first expired or was lost) - always starts by clearing any
// existing token for the user so there is never more than one live
// invitation, and a resent link immediately invalidates the old one rather
// than leaving two valid tokens outstanding.
async function issueInvitation(userId: string, email: string, name: string, role: Role, companyId: string) {
  const company = await findCompanyById(companyId);
  const token = randomBytes(32).toString("hex");

  await deleteInvitationTokensForUser(userId);
  await createInvitationToken(userId, token, new Date(Date.now() + INVITATION_TTL_MS));
  await sendInvitationEmail(email, name, company?.name ?? "", role, token);
}

export async function resendInvitation(actor: Actor, targetUserId: string) {
  const target = await findByIdAndCompany(targetUserId, actor.companyId);

  if (!target) {
    throw new AppError("User not found", 404);
  }

  if (!canManageRole(actor.role, target.role)) {
    throw new AppError("You do not have permission to manage this user", 403);
  }

  // Resending only makes sense for a user who never accepted their
  // original invite - accepting sets emailVerifiedAt, so a verified user
  // already has a working password and this action doesn't apply to them.
  if (target.emailVerifiedAt) {
    throw new AppError("This user has already activated their account", 400);
  }

  await issueInvitation(target.id, target.email, target.name, target.role, actor.companyId);

  return target;
}

export async function updateCompanyUser(actor: Actor, targetUserId: string, input: UpdateUserInput) {
  const target = await findByIdAndCompany(targetUserId, actor.companyId);

  // 404, not 403: don't reveal whether a user id exists in a company the
  // actor can't otherwise see into.
  if (!target) {
    throw new AppError("User not found", 404);
  }

  if (!canManageRole(actor.role, target.role)) {
    throw new AppError("You do not have permission to modify this user", 403);
  }

  if (input.role && !INVITABLE_ROLES.includes(input.role)) {
    throw new AppError("You do not have permission to assign this role", 403);
  }

  if (target.id === actor.id) {
    throw new AppError("You cannot change your own role or active status here. Use Profile settings instead.", 400);
  }

  // Guard against locking a company out entirely: demoting or deactivating
  // its last remaining Business Owner would leave nobody able to manage
  // users, billing, or the company profile at all.
  const isDemotingOwner = target.role === "BUSINESS_OWNER" && input.role && (input.role as Role) !== "BUSINESS_OWNER";
  const isDeactivatingOwner = target.role === "BUSINESS_OWNER" && input.isActive === false;

  if (isDemotingOwner || isDeactivatingOwner) {
    const activeOwners = await countActiveOwners(actor.companyId);

    if (activeOwners <= 1) {
      throw new AppError(
        isDeactivatingOwner
          ? "Cannot deactivate the only active Business Owner"
          : "Cannot change the role of the only active Business Owner",
        400
      );
    }
  }

  const result = await updateCompanyUserRow(targetUserId, actor.companyId, {
    name: input.name,
    role: input.role,
    isActive: input.isActive
  });

  if (result.count === 0) {
    throw new AppError("User not found", 404);
  }

  return findByIdAndCompany(targetUserId, actor.companyId);
}

// Thin, explicit wrappers around updateCompanyUser so the routes/controller
// layer can expose single-purpose "Activate User" / "Deactivate User"
// actions (per the feature spec) without the caller having to know the
// underlying PATCH body shape - and so each action reads unambiguously in
// route definitions and any future audit logging.
export function activateCompanyUser(actor: Actor, targetUserId: string) {
  return updateCompanyUser(actor, targetUserId, { isActive: true });
}

export function deactivateCompanyUser(actor: Actor, targetUserId: string) {
  return updateCompanyUser(actor, targetUserId, { isActive: false });
}

export async function deleteCompanyUser(actor: Actor, targetUserId: string) {
  const target = await findByIdAndCompany(targetUserId, actor.companyId);

  if (!target) {
    throw new AppError("User not found", 404);
  }

  if (!canManageRole(actor.role, target.role)) {
    throw new AppError("You do not have permission to delete this user", 403);
  }

  if (target.id === actor.id) {
    throw new AppError("You cannot delete your own account here", 400);
  }

  // Unlike the deactivate guard (which only cares about *active* owners,
  // since a deactivated owner could later be reactivated), deletion is
  // permanent - so this blocks removing the last Business Owner regardless
  // of that owner's active status.
  if (target.role === "BUSINESS_OWNER") {
    const owners = await countOwners(actor.companyId);

    if (owners <= 1) {
      throw new AppError("Cannot delete the only Business Owner", 400);
    }
  }

  await deleteCompanyUserRow(targetUserId, actor.companyId);
}

// ---------------------------------------------------------------------------
// Settings module: Profile, Preferences, Active Sessions' avatar upload.
// Self-service - every function here acts on `userId` (always
// req.user!.id, see auth.controller.ts), never a route param, and has no
// companyId check: a user always has full rights over their own row,
// including SUPER_ADMIN, who has no companyId at all.
// ---------------------------------------------------------------------------

export async function updateMyProfile(userId: string, input: UpdateProfileInput) {
  const user = await updateSelfProfile(userId, input);

  return toPublicUser(user);
}

// Same memory-buffer-streamed-straight-to-Cloudinary approach as
// company.service.ts's uploadCompanyLogo - kept as its own small helper
// here rather than importing that module's private one, same
// each-service-is-self-contained style the rest of this codebase uses.
function uploadAvatarBuffer(buffer: Buffer, userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "ams/user-avatars",
        public_id: userId,
        overwrite: true,
        resource_type: "image"
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}

export async function updateMyAvatar(userId: string, file?: Express.Multer.File) {
  if (!file) {
    throw new AppError("No avatar file was uploaded", 422);
  }

  let avatarUrl: string;

  try {
    avatarUrl = await uploadAvatarBuffer(file.buffer, userId);
  } catch (err) {
    // Logged (not just swallowed) because "Could not upload avatar" alone
    // gives no way to tell a genuine Cloudinary outage apart from missing/
    // invalid CLOUDINARY_* env vars, which is the most common cause of this
    // during local setup - check the server console for the real cause.
    console.error("Avatar upload to Cloudinary failed:", err);
    throw new AppError("Could not upload avatar, please try again", 502);
  }

  const user = await updateAvatarRow(userId, avatarUrl);

  return toPublicUser(user);
}

export async function updateMyPreferences(userId: string, input: UpdatePreferencesInput) {
  const user = await updatePreferencesRow(userId, input);

  return toPublicUser(user);
}

// Not currently called anywhere - kept for symmetry/future use (e.g. a
// lightweight GET before rendering the Settings form without going through
// /auth/me). findUserById already includes `company`, matching
// toPublicUser's expected shape.
export async function getMyProfile(userId: string) {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toPublicUser(user);
}
