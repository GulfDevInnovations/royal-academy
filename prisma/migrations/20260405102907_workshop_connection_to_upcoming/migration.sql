/*
  Warnings:

  - A unique constraint covering the columns `[workshopId]` on the table `upcomings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "upcomings" ADD COLUMN     "workshopId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "upcomings_workshopId_key" ON "upcomings"("workshopId");

-- AddForeignKey
ALTER TABLE "upcomings" ADD CONSTRAINT "upcomings_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "workshops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
