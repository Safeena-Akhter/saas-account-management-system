-- CreateTable: platform_settings is a singleton - exactly one row, always
-- with id = 'platform' (see the @default("platform") on
-- PlatformSettings.id in schema.prisma). Not seeded here; the repository
-- creates the default row lazily on first read/write, same lazy-init
-- approach as any other "config that doesn't exist until someone touches
-- it" table would use.
CREATE TABLE `platform_settings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'platform',
    `platformName` VARCHAR(191) NOT NULL DEFAULT 'AccounTrack',
    `supportEmail` VARCHAR(191) NULL,
    `supportPhone` VARCHAR(191) NULL,
    `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
