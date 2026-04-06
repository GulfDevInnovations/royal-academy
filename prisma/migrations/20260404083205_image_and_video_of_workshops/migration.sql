-- AlterTable
ALTER TABLE "workshops" ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
