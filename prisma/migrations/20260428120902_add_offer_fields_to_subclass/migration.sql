-- AlterTable
ALTER TABLE `sub_classes` ADD COLUMN `isOfferActive` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `offerDescription` TEXT NULL,
    ADD COLUMN `offerExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `offerLabel` VARCHAR(191) NULL;
