-- AlterEnum
ALTER TYPE "SessionType" ADD VALUE 'MUSIC';

-- DropForeignKey
ALTER TABLE "monthly_enrollments" DROP CONSTRAINT "monthly_enrollments_multiMonthEnrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "multi_month_payments" DROP CONSTRAINT "multi_month_payments_multiMonthEnrollmentId_fkey";

-- AlterTable
ALTER TABLE "class_schedules" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "monthly_enrollments" ADD CONSTRAINT "monthly_enrollments_multiMonthEnrollmentId_fkey" FOREIGN KEY ("multiMonthEnrollmentId") REFERENCES "multi_month_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_month_payments" ADD CONSTRAINT "multi_month_payments_multiMonthEnrollmentId_fkey" FOREIGN KEY ("multiMonthEnrollmentId") REFERENCES "multi_month_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
