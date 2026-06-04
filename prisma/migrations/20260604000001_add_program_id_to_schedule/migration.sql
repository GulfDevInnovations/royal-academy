-- AlterTable: link ClassSchedule to a Program (optional)
ALTER TABLE `class_schedules` ADD COLUMN `programId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `class_schedules` ADD CONSTRAINT `class_schedules_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
