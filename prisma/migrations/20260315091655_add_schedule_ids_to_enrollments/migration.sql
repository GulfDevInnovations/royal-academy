-- AlterTable
ALTER TABLE "monthly_enrollments" ADD COLUMN     "scheduleIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "multi_month_enrollments" ADD COLUMN     "scheduleIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
