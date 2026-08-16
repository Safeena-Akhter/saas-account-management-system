/*
  Fixes a regression from the previous migration: `token` was shrunk to
  VARCHAR(6) for an OTP-style flow that was never finished, but the service
  layer generates crypto.randomBytes(32).toString("hex") tokens, which are
  always exactly 64 characters. Any existing rows (necessarily truncated or
  rejected already) are not recoverable and are cleared out - the app
  already treats a missing/invalid token as "invalid verification link" and
  a user can safely request a fresh one.
*/

-- Clear any rows that were already truncated under the VARCHAR(6) column,
-- since they can no longer match a real 64-char token anyway.
DELETE FROM `email_verification_tokens`;

-- AlterTable
ALTER TABLE `email_verification_tokens`
    MODIFY `token` VARCHAR(64) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `email_verification_tokens_token_key` ON `email_verification_tokens`(`token`);
