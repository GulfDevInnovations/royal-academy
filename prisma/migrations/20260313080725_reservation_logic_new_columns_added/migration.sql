/*
  Warnings:

  - The values [INAPP] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `imageUrl` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `linkUrl` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the `support_tickets` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ticket_replies` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('EMAIL', 'SMS', 'BOTH');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_userId_fkey";

-- DropForeignKey
ALTER TABLE "ticket_replies" DROP CONSTRAINT "ticket_replies_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "ticket_replies" DROP CONSTRAINT "ticket_replies_userId_fkey";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "imageUrl",
DROP COLUMN "linkUrl",
DROP COLUMN "readAt";

-- DropTable
DROP TABLE "support_tickets";

-- DropTable
DROP TABLE "ticket_replies";

-- DropEnum
DROP TYPE "TicketPriority";

-- DropEnum
DROP TYPE "TicketStatus";
