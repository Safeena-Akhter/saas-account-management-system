import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import { AppError } from "../utils/AppError";

// Memory storage, not disk: the file only ever needs to exist long enough to
// be streamed straight through to Cloudinary (see company.service.ts). We
// never want uploaded logos landing on the API server's own filesystem.
const storage = multer.memoryStorage();

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

function fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError("Logo must be a PNG, JPEG, WEBP, or SVG image", 422));
    return;
  }

  cb(null, true);
}

const parseLogoField = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_LOGO_SIZE_BYTES, files: 1 }
}).single("logo");

// Thin wrapper so a MulterError (e.g. file too large) reaches the app's
// centralized error handler as a proper AppError with a sane status code,
// instead of falling through as an unhandled 500.
export function uploadLogo(req: Request, res: Response, next: NextFunction) {
  parseLogoField(req, res, err => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("Logo must be smaller than 5MB", 413));
    }

    if (err instanceof AppError) {
      return next(err);
    }

    return next(new AppError("Could not process the uploaded file", 400));
  });
}

// Receipt uploads - same memory-storage/Cloudinary-streaming approach as
// the logo uploader above, but a receipt is a photo or scan of a paper
// document, so PDFs are allowed alongside images (a logo never is).
const MAX_RECEIPT_SIZE_BYTES = 8 * 1024 * 1024; // 8MB - receipts scanned at higher DPI run larger than a logo

const ALLOWED_RECEIPT_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

function receiptFileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!ALLOWED_RECEIPT_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError("Receipt must be a PNG, JPEG, WEBP image, or a PDF", 422));
    return;
  }

  cb(null, true);
}

const parseReceiptField = multer({
  storage,
  fileFilter: receiptFileFilter,
  limits: { fileSize: MAX_RECEIPT_SIZE_BYTES, files: 1 }
}).single("receipt");

export function uploadReceipt(req: Request, res: Response, next: NextFunction) {
  parseReceiptField(req, res, err => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("Receipt must be smaller than 8MB", 413));
    }

    if (err instanceof AppError) {
      return next(err);
    }

    return next(new AppError("Could not process the uploaded file", 400));
  });
}

// Avatar uploads (Settings module's Profile Settings) - same memory-storage
// approach as the logo uploader above, smaller size cap since an avatar is
// a small square photo, not a print-quality logo. No SVG here (unlike the
// logo uploader): an SVG profile photo is an unusual, XSS-adjacent format
// for user-uploaded content displayed inline in the app chrome (navbar,
// dropdowns) rather than an isolated <img> the company logo mostly is.
const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

const ALLOWED_AVATAR_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function avatarFileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
    cb(new AppError("Avatar must be a PNG, JPEG, or WEBP image", 422));
    return;
  }

  cb(null, true);
}

const parseAvatarField = multer({
  storage,
  fileFilter: avatarFileFilter,
  limits: { fileSize: MAX_AVATAR_SIZE_BYTES, files: 1 }
}).single("avatar");

export function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  parseAvatarField(req, res, err => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("Avatar must be smaller than 3MB", 413));
    }

    if (err instanceof AppError) {
      return next(err);
    }

    return next(new AppError("Could not process the uploaded file", 400));
  });
}
