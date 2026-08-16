import { z } from "zod";

// Shared by register, reset-password, and change-password so the same
// strength rule applies everywhere a password is ever set - a weak password
// slipping through on reset (but not register) would be a pointless gap.
const passwordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password cannot exceed 100 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const registerSchema = z.object({
 name: z
  .string()
  .trim()
  .min(3, "Name must be at least 3 characters")
  .max(100, "Name cannot exceed 100 characters"),
 companyName: z
  .string()
  .trim()
  .min(3, "Company name must be at least 3 characters")
  .max(150, "Company name cannot exceed 150 characters"),
 email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
 password: passwordSchema
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional()
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address")
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address")
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema
  })
  // Mirrors the register-form UX rule (new password must differ from the
  // current one) server-side too, since this endpoint can be hit directly.
  .refine(data => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password",
    path: ["newPassword"]
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
