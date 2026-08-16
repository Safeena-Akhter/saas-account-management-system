import nodemailer from "nodemailer";
import { env } from "./env";

// Create reusable transporter
export const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465, // true for SSL, false for TLS (587)

  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

// Verify SMTP connection when server starts
export async function verifyMailerConnection() {
  try {
    await transporter.verify();
    console.log("✅ Email server connected successfully.");
  } catch (error) {
    console.error("❌ Email server connection failed.");
    console.error(error);
  }
}

// Generic email sender
export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const info = await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html
});

console.log(info);

return info;
}