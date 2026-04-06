/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `workshops` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "workshops" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "workshops_slug_key" ON "workshops"("slug");
