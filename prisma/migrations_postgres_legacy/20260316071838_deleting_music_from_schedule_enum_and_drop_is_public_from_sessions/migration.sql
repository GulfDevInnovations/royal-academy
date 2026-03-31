/*
  Warnings:

  - The values [MUSIC] on the enum `SessionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isPublic` on the `class_schedules` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SessionType_new" AS ENUM ('PUBLIC', 'TRIAL', 'WORKSHOP', 'PRIVATE');
ALTER TABLE "sub_classes" ALTER COLUMN "sessionType" DROP DEFAULT;
ALTER TABLE "sub_classes" ALTER COLUMN "sessionType" TYPE "SessionType_new" USING ("sessionType"::text::"SessionType_new");
ALTER TYPE "SessionType" RENAME TO "SessionType_old";
ALTER TYPE "SessionType_new" RENAME TO "SessionType";
DROP TYPE "SessionType_old";
ALTER TABLE "sub_classes" ALTER COLUMN "sessionType" SET DEFAULT 'PUBLIC';
COMMIT;

-- AlterTable
ALTER TABLE "class_schedules" DROP COLUMN "isPublic";
