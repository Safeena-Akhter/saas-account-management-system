import { z } from "zod";

// Roles an owner can assign through this module - Manager, Accountant, or
// Employee only. Business Owner and Super Admin are never selectable here:
// see constants/roles.ts's INVITABLE_ROLES for why (the service layer
// re-checks this independently via INVITABLE_ROLES.includes(...), so this
// schema is the first line of defense, not the only one).
const assignableRoleSchema = z.enum(["MANAGER", "ACCOUNTANT", "EMPLOYEE"]);

// No `password` field: per spec, the owner never sets a new user's
// password. The server generates a secure temporary password (hashed
// before it's ever stored) and emails the employee an invitation link to
// set their own - see user.service.ts's createCompanyUser and
// invitation.service.ts's acceptInvitation.
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  role: assignableRoleSchema
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    role: assignableRoleSchema.optional(),
    isActive: z.boolean().optional()
  })
  .refine(data => Object.keys(data).length > 0, { message: "No fields provided to update" });

// GET /users?search=...&page=...&pageSize=...
// z.coerce because query string values arrive as strings even for
// numeric params - `?page=2` is `req.query.page === "2"`.
export const listUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

// ---------------------------------------------------------------------------
// Self-service Profile & Preferences (Settings module) - distinct from
// createUserSchema/updateUserSchema above, which are for an Owner managing
// *other* users. These are for "update my own profile", so there's no role
// or isActive field here - a user can never change their own role or
// activation status.
// ---------------------------------------------------------------------------

// Email is deliberately excluded: changing it would need re-verification
// (it's how login and invitations work) which is a bigger flow than this
// settings form covers - out of scope for this pass, left as a documented
// follow-up rather than silently allowed to drift from emailVerifiedAt.
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
    phone: z
      .string()
      .trim()
      .max(30, "Phone number is too long")
      .optional()
      .or(z.literal("").transform(() => undefined))
  })
  .refine(data => Object.keys(data).length > 0, { message: "No fields provided to update" });

// Fixed allow-lists, not free text - these values are interpreted by the
// frontend (theme switch, i18n locale, date/currency formatting), so an
// arbitrary string would either be silently ignored or break rendering.
// Extending any of these to a 5th option is a one-line change here, no
// migration needed (see schema.prisma's comment on these columns).
export const updatePreferencesSchema = z
  .object({
    theme: z.enum(["light", "dark", "system"]).optional(),
    language: z.enum(["en", "fr", "ar"]).optional(),
    dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),
    // Display STYLE for money amounts, not a currency choice - the actual
    // currency always comes from the company's own `currency` field (set in
    // Business Settings, company-wide, never per-user - see
    // company.validator.ts's updateCompanyProfileSchema). "symbol" shows
    // e.g. "Rs2,000.00"; "code" shows "PKR 2,000.00". See client's
    // utils/currency.ts for exactly how each renders per currency.
    currencyFormat: z.enum(["symbol", "code"]).optional()
  })
  .refine(data => Object.keys(data).length > 0, { message: "No fields provided to update" });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
