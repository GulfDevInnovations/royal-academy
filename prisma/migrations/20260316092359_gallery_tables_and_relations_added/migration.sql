-- CreateEnum
CREATE TYPE "GalleryMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "GalleryVisibility" AS ENUM ('PUBLISHED', 'DRAFT', 'ARCHIVED');

-- CreateTable
CREATE TABLE "gallery_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_items" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "mediaType" "GalleryMediaType" NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "altText" TEXT,
    "visibility" "GalleryVisibility" NOT NULL DEFAULT 'DRAFT',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "takenAt" TIMESTAMP(3),
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_persons" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT,
    "photoUrl" TEXT,
    "teacherId" TEXT,

    CONSTRAINT "gallery_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_item_persons" (
    "galleryItemId" TEXT NOT NULL,
    "galleryPersonId" TEXT NOT NULL,

    CONSTRAINT "gallery_item_persons_pkey" PRIMARY KEY ("galleryItemId","galleryPersonId")
);

-- CreateIndex
CREATE UNIQUE INDEX "gallery_categories_slug_key" ON "gallery_categories"("slug");

-- CreateIndex
CREATE INDEX "gallery_items_visibility_sortOrder_idx" ON "gallery_items"("visibility", "sortOrder");

-- CreateIndex
CREATE INDEX "gallery_items_categoryId_idx" ON "gallery_items"("categoryId");

-- AddForeignKey
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "gallery_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_item_persons" ADD CONSTRAINT "gallery_item_persons_galleryItemId_fkey" FOREIGN KEY ("galleryItemId") REFERENCES "gallery_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_item_persons" ADD CONSTRAINT "gallery_item_persons_galleryPersonId_fkey" FOREIGN KEY ("galleryPersonId") REFERENCES "gallery_persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
