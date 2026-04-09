-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "name_ar" TEXT;

-- AlterTable
ALTER TABLE "gallery_items" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "title_ar" TEXT;

-- AlterTable
ALTER TABLE "news" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "subtitle_ar" TEXT,
ADD COLUMN     "title_ar" TEXT;

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "subtitle_ar" TEXT,
ADD COLUMN     "title_ar" TEXT;

-- AlterTable
ALTER TABLE "sub_classes" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "name_ar" TEXT;

-- AlterTable
ALTER TABLE "teacher_profiles" ADD COLUMN     "bio_ar" TEXT;

-- AlterTable
ALTER TABLE "upcomings" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "subtitle_ar" TEXT,
ADD COLUMN     "title_ar" TEXT;

-- AlterTable
ALTER TABLE "workshops" ADD COLUMN     "description_ar" TEXT,
ADD COLUMN     "title_ar" TEXT;
