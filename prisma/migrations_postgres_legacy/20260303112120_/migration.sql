/*
  Warnings:

  - You are about to drop the column `isPublic` on the `class_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `trialBookingId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `isTrialAvailable` on the `sub_classes` table. All the data in the column will be lost.
  - You are about to drop the column `oncePriceMonthly` on the `sub_classes` table. All the data in the column will be lost.
  - You are about to drop the column `sessionType` on the `sub_classes` table. All the data in the column will be lost.
  - You are about to drop the column `trialPrice` on the `sub_classes` table. All the data in the column will be lost.
  - You are about to drop the column `twicePriceMonthly` on the `sub_classes` table. All the data in the column will be lost.
  - You are about to drop the `monthly_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `monthly_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `trial_bookings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workshop_bookings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `workshops` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `bookingId` on table `payments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "monthly_enrollments" DROP CONSTRAINT "monthly_enrollments_studentId_fkey";

-- DropForeignKey
ALTER TABLE "monthly_enrollments" DROP CONSTRAINT "monthly_enrollments_subClassId_fkey";

-- DropForeignKey
ALTER TABLE "monthly_enrollments" DROP CONSTRAINT "monthly_enrollments_teacherProfileId_fkey";

-- DropForeignKey
ALTER TABLE "monthly_payments" DROP CONSTRAINT "monthly_payments_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_trialBookingId_fkey";

-- DropForeignKey
ALTER TABLE "trial_bookings" DROP CONSTRAINT "trial_bookings_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "trial_bookings" DROP CONSTRAINT "trial_bookings_studentId_fkey";

-- DropForeignKey
ALTER TABLE "trial_bookings" DROP CONSTRAINT "trial_bookings_subClassId_fkey";

-- DropForeignKey
ALTER TABLE "workshop_bookings" DROP CONSTRAINT "workshop_bookings_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "workshop_bookings" DROP CONSTRAINT "workshop_bookings_studentId_fkey";

-- DropForeignKey
ALTER TABLE "workshop_bookings" DROP CONSTRAINT "workshop_bookings_workshopId_fkey";

-- DropForeignKey
ALTER TABLE "workshops" DROP CONSTRAINT "workshops_roomId_fkey";

-- DropForeignKey
ALTER TABLE "workshops" DROP CONSTRAINT "workshops_teacherId_fkey";

-- DropIndex
DROP INDEX "payments_trialBookingId_key";

-- AlterTable
ALTER TABLE "class_schedules" DROP COLUMN "isPublic";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "trialBookingId",
ALTER COLUMN "bookingId" SET NOT NULL;

-- AlterTable
ALTER TABLE "sub_classes" DROP COLUMN "isTrialAvailable",
DROP COLUMN "oncePriceMonthly",
DROP COLUMN "sessionType",
DROP COLUMN "trialPrice",
DROP COLUMN "twicePriceMonthly";

-- DropTable
DROP TABLE "monthly_enrollments";

-- DropTable
DROP TABLE "monthly_payments";

-- DropTable
DROP TABLE "trial_bookings";

-- DropTable
DROP TABLE "workshop_bookings";

-- DropTable
DROP TABLE "workshops";

-- DropEnum
DROP TYPE "BookingType";

-- DropEnum
DROP TYPE "FrequencyType";

-- DropEnum
DROP TYPE "SessionType";

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
