-- CreateTable
CREATE TABLE `programs` (
    `id` VARCHAR(191) NOT NULL,
    `subClassId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `description_ar` TEXT NULL,
    `coverUrl` VARCHAR(191) NULL,
    `capacity` INTEGER NOT NULL DEFAULT 10,
    `durationMinutes` INTEGER NOT NULL DEFAULT 60,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'OMR',
    `level` VARCHAR(191) NULL,
    `ageGroup` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sessionType` ENUM('PUBLIC', 'TRIAL', 'WORKSHOP', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `oncePriceMonthly` DECIMAL(10, 2) NULL,
    `twicePriceMonthly` DECIMAL(10, 2) NULL,
    `trialPrice` DECIMAL(10, 2) NOT NULL DEFAULT 10,
    `isTrialAvailable` BOOLEAN NOT NULL DEFAULT true,
    `isReschedulable` BOOLEAN NOT NULL DEFAULT false,
    `isOfferActive` BOOLEAN NOT NULL DEFAULT false,
    `offerLabel` VARCHAR(191) NULL,
    `offerDescription` TEXT NULL,
    `offerExpiresAt` DATETIME(3) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_teachers` (
    `teacherId` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`teacherId`, `programId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `programs` ADD CONSTRAINT `programs_subClassId_fkey` FOREIGN KEY (`subClassId`) REFERENCES `sub_classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_teachers` ADD CONSTRAINT `program_teachers_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teacher_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_teachers` ADD CONSTRAINT `program_teachers_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
