-- AlterTable
ALTER TABLE "workshops" ADD COLUMN     "enrolledCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onlineLink" TEXT,
ADD COLUMN     "reservedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "roomId" TEXT;

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "capacity" INTEGER NOT NULL,
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
