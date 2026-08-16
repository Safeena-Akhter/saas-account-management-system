-- AlterTable: Profile Settings (phone, avatar) + Preferences (theme,
-- language, dateFormat, currencyFormat) on User.
ALTER TABLE `users`
  ADD COLUMN `phone` VARCHAR(30) NULL,
  ADD COLUMN `avatarUrl` VARCHAR(500) NULL,
  ADD COLUMN `theme` VARCHAR(20) NOT NULL DEFAULT 'system',
  ADD COLUMN `language` VARCHAR(10) NOT NULL DEFAULT 'en',
  ADD COLUMN `dateFormat` VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',
  ADD COLUMN `currencyFormat` VARCHAR(20) NOT NULL DEFAULT 'symbol';

-- AlterTable: Active Sessions - device metadata captured at token-issue
-- time (see auth.service.ts's issueTokenPair).
ALTER TABLE `refresh_tokens`
  ADD COLUMN `userAgent` VARCHAR(255) NULL,
  ADD COLUMN `ipAddress` VARCHAR(45) NULL,
  ADD COLUMN `lastUsedAt` DATETIME(3) NULL;
