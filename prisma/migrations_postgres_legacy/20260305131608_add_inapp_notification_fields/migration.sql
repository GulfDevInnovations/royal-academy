-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'INAPP';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "linkUrl" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3);
