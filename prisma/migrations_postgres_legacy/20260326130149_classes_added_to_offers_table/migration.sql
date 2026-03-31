-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "classIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
