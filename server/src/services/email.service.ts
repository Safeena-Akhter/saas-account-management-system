import { sendEmail } from "../config/mailer";
import { env } from "../config/env";
import { verificationEmailTemplate } from "../templates/verificationEmail";
import { resetPasswordEmailTemplate } from "../templates/resetPasswordEmail";
import { invitationEmailTemplate } from "../templates/invitationEmail";

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Verify your AccountTrack AMS account",
    html: verificationEmailTemplate(name, verificationUrl)
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset your AccountTrack AMS password",
    html: resetPasswordEmailTemplate(name, resetUrl)
  });
}

export async function sendInvitationEmail(
  email: string,
  name: string,
  companyName: string,
  role: string,
  token: string
) {
  // Path form, not a query param (`/invitation/{token}`) - matches the spec
  // exactly and is what the frontend route at
  // app/[lang]/(blank-layout-pages)/(guest-only)/invitation/[token] expects.
  const invitationUrl = `${env.CLIENT_URL}/invitation/${token}`;

  await sendEmail({
    to: email,
    subject: `You've been invited to join ${companyName}`,
    html: invitationEmailTemplate(name, companyName, role, invitationUrl)
  });
}
