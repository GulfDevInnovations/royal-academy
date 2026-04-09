"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  uploadMedia,
  deleteMediaByKey,
} from "@/lib/media/service";

// ─────────────────────────────────────────────
// GALLERY ITEMS
// ─────────────────────────────────────────────

export async function uploadGalleryItem(
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const user = await requireUser(); // redirects if not authenticated

    const file = formData.get("file") as File | null;
    const thumbnailFile = formData.get("thumbnail") as File | null;
    const title = (formData.get("title") as string) || null;
    const title_ar = (formData.get("title_ar") as string | null)?.trim() || null;
    const description = (formData.get("description") as string) || null;
    const description_ar = formData.get("description_ar") as string | null;
    const altText = (formData.get("altText") as string) || null;
    const categoryId = (formData.get("categoryId") as string) || null;
    const visibility = (formData.get("visibility") as string) || "DRAFT";
    const isFeatured = formData.get("isFeatured") === "true";
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const takenAtRaw = formData.get("takenAt") as string | null;
    const personIds = formData.getAll("personIds") as string[];

    if (!file || file.size === 0) return { error: "No file provided" };

    const isVideo = file.type.startsWith("video/");

    // Upload main file
    const result = await uploadMedia({
      file,
      userId: user.id,
      folder: isVideo ? "gallery/videos" : "gallery/images",
    });

    // Upload thumbnail (optional, only meaningful for videos)
    let thumbnailUrl: string | null = null;
    let thumbnailStorageKey: string | null = null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const thumbResult = await uploadMedia({
        file: thumbnailFile,
        userId: user.id,
        folder: "gallery/thumbnails",
      });
      thumbnailUrl = thumbResult.url;
      thumbnailStorageKey = thumbResult.key;
    }

    await prisma.galleryItem.create({
      data: {
        mediaType: result.kind === "video" ? "VIDEO" : "IMAGE",
        title,
        title_ar,
        description,
        description_ar,
        altText,
        url: result.url,
        storageKey: result.key,
        thumbnailUrl,
        thumbnailStorageKey,
        visibility: visibility as "PUBLISHED" | "DRAFT" | "ARCHIVED",
        isFeatured,
        sortOrder,
        categoryId: categoryId || null,
        takenAt: takenAtRaw ? new Date(takenAtRaw) : null,
        uploadedBy: user.id,
        persons:
          personIds.length > 0
            ? { create: personIds.map((pid) => ({ galleryPersonId: pid })) }
            : undefined,
      },
    });

    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e) {
    console.error("[uploadGalleryItem]", e);
    return { error: "Upload failed" };
  }
}

export async function updateGalleryItem(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await requireUser();

    const title = (formData.get("title") as string) || null;
    const title_ar = (formData.get("title_ar") as string | null)?.trim() || null;
    const description = (formData.get("description") as string) || null;
    const description_ar = formData.get("description_ar") as string | null;
    const altText = (formData.get("altText") as string) || null;
    const categoryId = (formData.get("categoryId") as string) || null;
    const visibility = formData.get("visibility") as string;
    const isFeatured = formData.get("isFeatured") === "true";
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const takenAtRaw = formData.get("takenAt") as string | null;
    const personIds = formData.getAll("personIds") as string[];

    await prisma.$transaction([
      // Wipe existing person tags, then re-create from the submitted list
      prisma.galleryItemPerson.deleteMany({ where: { galleryItemId: id } }),
      prisma.galleryItem.update({
        where: { id },
        data: {
          title,
          title_ar,
          description,
          description_ar, 
          altText,
          categoryId: categoryId || null,
          visibility: visibility as "PUBLISHED" | "DRAFT" | "ARCHIVED",
          isFeatured,
          sortOrder,
          takenAt: takenAtRaw ? new Date(takenAtRaw) : null,
          persons:
            personIds.length > 0
              ? { create: personIds.map((pid) => ({ galleryPersonId: pid })) }
              : undefined,
        },
      }),
    ]);

    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e) {
    console.error("[updateGalleryItem]", e);
    return { error: "Update failed" };
  }
}

export async function deleteGalleryItem(
  id: string
): Promise<{ error?: string }> {
  try {
    await requireUser();

    const item = await prisma.galleryItem.findUnique({ where: { id } });
    if (!item) return { error: "Item not found" };

    // Delete files from storage first (non-fatal if already gone)
    if (item.storageKey) {
      try {
        await deleteMediaByKey(item.storageKey);
      } catch (e) {
        console.warn("[deleteGalleryItem] main file removal failed:", e);
      }
    }
    if (item.thumbnailStorageKey) {
      try {
        await deleteMediaByKey(item.thumbnailStorageKey);
      } catch (e) {
        console.warn("[deleteGalleryItem] thumbnail removal failed:", e);
      }
    }

    await prisma.galleryItem.delete({ where: { id } });

    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e) {
    console.error("[deleteGalleryItem]", e);
    return { error: "Delete failed" };
  }
}

export async function toggleGalleryVisibility(
  id: string,
  visibility: "PUBLISHED" | "DRAFT" | "ARCHIVED"
): Promise<{ error?: string }> {
  try {
    await requireUser();
    await prisma.galleryItem.update({ where: { id }, data: { visibility } });
    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e) {
    console.error("[toggleGalleryVisibility]", e);
    return { error: "Update failed" };
  }
}

export async function toggleFeatured(
  id: string,
  isFeatured: boolean
): Promise<{ error?: string }> {
  try {
    await requireUser();
    await prisma.galleryItem.update({ where: { id }, data: { isFeatured } });
    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e) {
    console.error("[toggleFeatured]", e);
    return { error: "Update failed" };
  }
}

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────

export async function getGalleryCategories() {
  try {
    const categories = await prisma.galleryCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { items: true } } },
    });
    return { categories };
  } catch (e) {
    console.error("[getGalleryCategories]", e);
    return { categories: [], error: "Failed to load categories" };
  }
}

export async function createGalleryCategory(
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await requireUser();

    const name = (formData.get("name") as string).trim();
    const name_ar = (formData.get("name_ar") as string).trim();
    const slug = (formData.get("slug") as string)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

    if (!name || !slug) return { error: "Name and slug are required" };

    await prisma.galleryCategory.create({ data: { name, name_ar, slug, sortOrder } });

    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002")
      return { error: "A category with this slug already exists" };
    console.error("[createGalleryCategory]", e);
    return { error: "Failed to create category" };
  }
}

export async function updateGalleryCategory(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await requireUser();

    const name = (formData.get("name") as string).trim();
    const name_ar = (formData.get("name_ar") as string).trim();
    const slug = (formData.get("slug") as string)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;
    const isActive = formData.get("isActive") === "true";

    await prisma.galleryCategory.update({
      where: { id },
      data: { name, name_ar, slug, sortOrder, isActive },
    });

    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002")
      return { error: "A category with this slug already exists" };
    console.error("[updateGalleryCategory]", e);
    return { error: "Failed to update category" };
  }
}

export async function deleteGalleryCategory(
  id: string
): Promise<{ error?: string }> {
  try {
    await requireUser();

    const count = await prisma.galleryItem.count({ where: { categoryId: id } });
    if (count > 0)
      return { error: `Cannot delete: ${count} item(s) still use this category` };

    await prisma.galleryCategory.delete({ where: { id } });

    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e) {
    console.error("[deleteGalleryCategory]", e);
    return { error: "Failed to delete category" };
  }
}

// ─────────────────────────────────────────────
// PERSONS
// ─────────────────────────────────────────────

export async function getGalleryPersons() {
  try {
    const persons = await prisma.galleryPerson.findMany({
      orderBy: { displayName: "asc" },
    });
    return { persons };
  } catch (e) {
    console.error("[getGalleryPersons]", e);
    return { persons: [], error: "Failed to load persons" };
  }
}

export async function createGalleryPerson(
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await requireUser();

    const displayName = (formData.get("displayName") as string).trim();
    const role = (formData.get("role") as string) || null;
    const teacherId = (formData.get("teacherId") as string) || null;

    if (!displayName) return { error: "Display name is required" };

    await prisma.galleryPerson.create({
      data: { displayName, role, teacherId },
    });

    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e) {
    console.error("[createGalleryPerson]", e);
    return { error: "Failed to create person" };
  }
}

export async function updateGalleryPerson(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await requireUser();

    const displayName = (formData.get("displayName") as string).trim();
    const role = (formData.get("role") as string) || null;
    const teacherId = (formData.get("teacherId") as string) || null;

    await prisma.galleryPerson.update({
      where: { id },
      data: { displayName, role, teacherId },
    });

    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e) {
    console.error("[updateGalleryPerson]", e);
    return { error: "Failed to update person" };
  }
}

export async function deleteGalleryPerson(
  id: string
): Promise<{ error?: string }> {
  try {
    await requireUser();

    await prisma.galleryPerson.delete({ where: { id } });

    revalidatePath("/[locale]/admin/gallery", "page");
    return {};
  } catch (e) {
    console.error("[deleteGalleryPerson]", e);
    return { error: "Failed to delete person" };
  }
}