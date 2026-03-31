-- AlterTable
ALTER TABLE "student_profiles"
ADD COLUMN "hasMedicalCondition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "agreePolicy" BOOLEAN NOT NULL DEFAULT false;
