/*
  Warnings:

  - You are about to alter the column `token` on the `email_verification_tokens` table. The data in that column could be lost. The data in that column will be cast from `VarChar(512)` to `VarChar(6)`.
  - Added the required column `email` to the `email_verification_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `email_verification_tokens_token_key` ON `email_verification_tokens`;

-- AlterTable
ALTER TABLE `email_verification_tokens` ADD COLUMN `email` VARCHAR(255) NOT NULL,
    MODIFY `token` VARCHAR(6) NOT NULL;

-- CreateIndex
CREATE INDEX `email_verification_tokens_email_idx` ON `email_verification_tokens`(`email`);
