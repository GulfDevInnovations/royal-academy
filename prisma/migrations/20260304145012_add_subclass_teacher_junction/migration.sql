/*
  Warnings:

  - You are about to drop the column `teacherId` on the `sub_classes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "sub_classes" DROP CONSTRAINT "sub_classes_teacherId_fkey";

-- AlterTable
ALTER TABLE "sub_classes" DROP COLUMN "teacherId";

-- CreateTable
CREATE TABLE "subclass_teachers" (
    "teacherId" TEXT NOT NULL,
    "subClassId" TEXT NOT NULL,

    CONSTRAINT "subclass_teachers_pkey" PRIMARY KEY ("teacherId","subClassId")
);

-- AddForeignKey
ALTER TABLE "subclass_teachers" ADD CONSTRAINT "subclass_teachers_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subclass_teachers" ADD CONSTRAINT "subclass_teachers_subClassId_fkey" FOREIGN KEY ("subClassId") REFERENCES "sub_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
