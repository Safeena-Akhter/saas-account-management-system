import { AppError } from "../utils/AppError";
import { hashPassword } from "../utils/hash";
import { activateInvitedUser } from "../repositories/user.repository";
import {
  deleteInvitationTokensForUser,
  findInvitationToken
} from "../repositories/invitation.repository";
import type { AcceptInvitationInput } from "../validators/invitation.validator";

// Returns only what the acceptance page needs to display before the
// employee sets a password (name/company/role) - never the temporary
// password, never anything else about the account.
export async function validateInvitationToken(token: string) {
  const record = await findInvitationToken(token);

  if (!record) {
    throw new AppError("This invitation link is invalid or has already been used.", 400);
  }

  if (record.expiresAt < new Date()) {
    throw new AppError("This invitation link has expired. Ask your Business Owner to resend it.", 400);
  }

  return {
    name: record.user.name,
    email: record.user.email,
    role: record.user.role,
    companyName: record.user.company?.name ?? ""
  };
}

export async function acceptInvitation(token: string, input: AcceptInvitationInput) {
  const record = await findInvitationToken(token);

  if (!record) {
    throw new AppError("This invitation link is invalid or has already been used.", 400);
  }

  if (record.expiresAt < new Date()) {
    // Clean up the dead token rather than leaving it around indefinitely -
    // same reasoning as resetPassword's expired-token cleanup.
    await deleteInvitationTokensForUser(record.userId);
    throw new AppError("This invitation link has expired. Ask your Business Owner to resend it.", 400);
  }

  const hashedPassword = await hashPassword(input.password);

  await activateInvitedUser(record.userId, hashedPassword);

  // Single-use: delete every invitation token for this user (not just this
  // one) so a resent-but-unused older/newer token can't be replayed either.
  await deleteInvitationTokensForUser(record.userId);
}
