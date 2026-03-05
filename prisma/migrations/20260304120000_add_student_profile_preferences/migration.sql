-- AlterTable
ALTER TABLE "student_profiles"
ADD COLUMN "hasMedicalCondition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "agreePolicy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "needsSupport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "receiveEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "receiveWhatsapp" BOOLEAN NOT NULL DEFAULT false;
