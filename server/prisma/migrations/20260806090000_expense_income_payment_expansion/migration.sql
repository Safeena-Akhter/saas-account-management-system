-- AlterTable: Payment - Supplier Payment support (type/status/supplierId)
-- Defaults preserve every existing row's meaning exactly: type=RECEIVED and
-- status=COMPLETED is what every payment recorded before this migration
-- already was.
ALTER TABLE `payments`
  ADD COLUMN `type` ENUM('RECEIVED', 'PAID') NOT NULL DEFAULT 'RECEIVED',
  ADD COLUMN `status` ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN `supplierId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `payments_supplierId_idx` ON `payments`(`supplierId`);
CREATE INDEX `payments_companyId_type_idx` ON `payments`(`companyId`, `type`);
CREATE INDEX `payments_companyId_status_idx` ON `payments`(`companyId`, `status`);

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: ExpenseCategory
CREATE TABLE `expense_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `companyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `expense_categories_companyId_idx`(`companyId`),
    UNIQUE INDEX `expense_categories_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: Expense - receipt upload + optional category FK
ALTER TABLE `expenses`
  ADD COLUMN `receiptUrl` VARCHAR(2048) NULL,
  ADD COLUMN `expenseCategoryId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `expenses_expenseCategoryId_idx` ON `expenses`(`expenseCategoryId`);

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_expenseCategoryId_fkey` FOREIGN KEY (`expenseCategoryId`) REFERENCES `expense_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: IncomeCategory
CREATE TABLE `income_categories` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `companyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `income_categories_companyId_idx`(`companyId`),
    UNIQUE INDEX `income_categories_companyId_name_key`(`companyId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: Income
CREATE TABLE `incomes` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `incomeDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `method` ENUM('CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE', 'OTHER') NOT NULL DEFAULT 'CASH',
    `notes` VARCHAR(500) NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NULL,
    `incomeCategoryId` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `incomes_companyId_idx`(`companyId`),
    INDEX `incomes_companyId_incomeDate_idx`(`companyId`, `incomeDate`),
    INDEX `incomes_incomeCategoryId_idx`(`incomeCategoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `expense_categories` ADD CONSTRAINT `expense_categories_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `income_categories` ADD CONSTRAINT `income_categories_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `incomes` ADD CONSTRAINT `incomes_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_incomeCategoryId_fkey` FOREIGN KEY (`incomeCategoryId`) REFERENCES `income_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `incomes` ADD CONSTRAINT `incomes_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
