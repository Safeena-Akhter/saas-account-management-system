import { z } from "zod";

// Same password-strength rule as register/reset/change - see
// auth.validator.ts's passwordSchema. Duplicated rather than imported to
// keep the user-management/invitation slice independent of the auth
// module's internals; if these ever need to diverge (e.g. a stricter policy
// for platform-invited accounts) there's no shared schema to untangle.
const passwordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password cannot exceed 100 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const acceptInvitationSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
