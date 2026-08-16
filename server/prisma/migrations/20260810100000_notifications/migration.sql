-- CreateTable: Notification - per-user, company-scoped rows. Broadcast/
-- role-based events fan out into one row per targeted user at write time
-- (see notification.service.ts), so this table never needs to store a role
-- filter - every read/unread/list query is a plain `where: { userId }`.
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('INVOICE_CREATED', 'INVOICE_PAID', 'PAYMENT_RECEIVED', 'EXPENSE_ADDED', 'LOW_STOCK', 'NEW_USER_INVITATION', 'COMPANY_UPDATED', 'SUBSCRIPTION_EXPIRY', 'SYSTEM') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` VARCHAR(1000) NOT NULL,
    `link` VARCHAR(500) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_companyId_idx`(`companyId`),
    INDEX `notifications_userId_isRead_idx`(`userId`, `isRead`),
    INDEX `notifications_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
