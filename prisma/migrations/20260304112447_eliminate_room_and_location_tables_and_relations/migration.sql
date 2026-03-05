/*
  Warnings:

  - You are about to drop the column `roomId` on the `class_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `workshops` table. All the data in the column will be lost.
  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rooms` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "class_schedules" DROP CONSTRAINT "class_schedules_roomId_fkey";

-- DropForeignKey
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_locationId_fkey";

-- DropForeignKey
ALTER TABLE "workshops" DROP CONSTRAINT "workshops_roomId_fkey";

-- AlterTable
ALTER TABLE "class_schedules" DROP COLUMN "roomId";

-- AlterTable
ALTER TABLE "workshops" DROP COLUMN "roomId";

-- DropTable
DROP TABLE "locations";

-- DropTable
DROP TABLE "rooms";
