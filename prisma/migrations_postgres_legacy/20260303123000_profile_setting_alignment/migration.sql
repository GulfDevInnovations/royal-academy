-- CreateEnum
CREATE TYPE "ProfileTrack" AS ENUM ('DANCE', 'MUSIC', 'ART');

-- CreateEnum
CREATE TYPE "ProfileExperience" AS ENUM ('NO_EXPERIENCE', 'LESS_THAN_ONE_YEAR', 'MORE_THAN_ONE_YEAR');

-- AlterTable
ALTER TABLE "student_profiles"
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT,
ADD COLUMN "emergencyRelationship" TEXT,
ADD COLUMN "preferredTrack" "ProfileTrack",
ADD COLUMN "experience" "ProfileExperience";

-- Backfill split emergency contact fields from legacy combined field when possible
UPDATE "student_profiles"
SET
  "emergencyContactName" = COALESCE("emergencyContactName", NULLIF(BTRIM(split_part("emergencyContact", '|', 1)), '')),
  "emergencyContactPhone" = COALESCE("emergencyContactPhone", NULLIF(BTRIM(split_part("emergencyContact", '|', 2)), '')),
  "emergencyRelationship" = COALESCE("emergencyRelationship", NULLIF(BTRIM(split_part("emergencyContact", '|', 3)), ''))
WHERE "emergencyContact" IS NOT NULL
  AND (
    "emergencyContactName" IS NULL
    OR "emergencyContactPhone" IS NULL
    OR "emergencyRelationship" IS NULL
  );
