-- AlterTable
ALTER TABLE `classes` ADD COLUMN `mediaKind` VARCHAR(191) NULL,
                      ADD COLUMN `mediaUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `sub_classes` ADD COLUMN `mediaKind` VARCHAR(191) NULL,
                           ADD COLUMN `mediaUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `programs` ADD COLUMN `mediaKind` VARCHAR(191) NULL,
                        ADD COLUMN `mediaUrl` VARCHAR(191) NULL;
