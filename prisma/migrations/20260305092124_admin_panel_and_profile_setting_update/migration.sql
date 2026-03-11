/*
  Warnings:

  - You are about to drop the column `needsSupport` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `receiveEmail` on the `student_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `receiveWhatsapp` on the `student_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "student_profiles" DROP COLUMN "needsSupport",
DROP COLUMN "receiveEmail",
DROP COLUMN "receiveWhatsapp";
