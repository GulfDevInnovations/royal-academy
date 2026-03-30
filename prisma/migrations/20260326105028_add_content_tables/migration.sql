-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_TRIAL');

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'PAID';

-- CreateTable
CREATE TABLE "upcomings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "linkUrl" TEXT,
    "linkLabel" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "eventDate" TIMESTAMP(3),
    "publishAt" TIMESTAMP(3),
    "expireAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "badgeLabel" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upcomings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "linkUrl" TEXT,
    "linkLabel" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "publishAt" TIMESTAMP(3),
    "expireAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "badgeLabel" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "linkUrl" TEXT,
    "linkLabel" TEXT,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "discountType" "DiscountType",
    "discountValue" DECIMAL(10,2),
    "promoCode" TEXT,
    "subClassIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publishAt" TIMESTAMP(3),
    "expireAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "badgeLabel" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "upcomings_status_isActive_sortOrder_idx" ON "upcomings"("status", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "upcomings_publishAt_expireAt_idx" ON "upcomings"("publishAt", "expireAt");

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_key" ON "news"("slug");

-- CreateIndex
CREATE INDEX "news_status_isActive_sortOrder_idx" ON "news"("status", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "news_publishAt_expireAt_idx" ON "news"("publishAt", "expireAt");

-- CreateIndex
CREATE UNIQUE INDEX "offers_promoCode_key" ON "offers"("promoCode");

-- CreateIndex
CREATE INDEX "offers_status_isActive_sortOrder_idx" ON "offers"("status", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "offers_publishAt_expireAt_idx" ON "offers"("publishAt", "expireAt");
