-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `invoices_companyId_deletedAt_idx` ON `invoices`(`companyId`, `deletedAt`);
