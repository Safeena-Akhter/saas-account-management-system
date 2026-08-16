// Centralized environment configuration.
// Loads and validates process.env once, at startup, so the rest of the app
// can trust `env.X` instead of reading process.env ad-hoc everywhere.

import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;

  if (value === undefined || value === "") {
    // Fail fast and loud at boot rather than mysteriously later (e.g. inside
    // a request handler when JWT_ACCESS_SECRET turns out to be undefined).
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];

  return value === undefined || value === "" ? fallback : value;
}

export const env = {
  NODE_ENV: optional("NODE_ENV", "development"),
  PORT: Number(optional("PORT", "5000")),

  // Database
  DATABASE_URL: required("DATABASE_URL"),

  // Auth
  JWT_ACCESS_SECRET: required("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  JWT_ACCESS_EXPIRES_IN: optional("JWT_ACCESS_EXPIRES_IN", "15m"),
  JWT_REFRESH_EXPIRES_IN: optional("JWT_REFRESH_EXPIRES_IN", "30d"),

  // CORS - comma separated list of allowed frontend origins
  CORS_ORIGIN: optional("CORS_ORIGIN", "http://localhost:3000"),

  // Cloudinary (image uploads) - optional in dev, required once upload
  // features are actually wired up in later phases
  CLOUDINARY_CLOUD_NAME: optional("CLOUDINARY_CLOUD_NAME", ""),
  CLOUDINARY_API_KEY: optional("CLOUDINARY_API_KEY", ""),
  CLOUDINARY_API_SECRET: optional("CLOUDINARY_API_SECRET", ""),

  // Email (Nodemailer) - optional in dev
  CLIENT_URL: optional("CLIENT_URL", "http://localhost:3000"),
  SMTP_HOST: optional("SMTP_HOST", ""),
  SMTP_PORT: Number(optional("SMTP_PORT", "587")),
  SMTP_USER: optional("SMTP_USER", ""),
  SMTP_PASS: optional("SMTP_PASS", ""),
  SMTP_FROM: optional("SMTP_FROM", "AMS <no-reply@ams.local>")
} as const;

export const isProduction = env.NODE_ENV === "production";
