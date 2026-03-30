"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { uploadMedia, deleteMediaByKey } from "@/lib/media/service";
import { ContentStatus, DiscountType } from "@prisma/client";

// ─────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────

function revalidateAll() {
  revalidatePath("/[locale]/admin/upcoming", "page");
  revalidatePath("/[locale]/admin/news", "page");
  revalidatePath("/[locale]/admin/offers", "page");
}

async function uploadMediaUrls(
  files: File[],
  userId: string,
  folder: string
): Promise<{ url: string; key: string }[]> {
  const results = await Promise.all(
    files.map((f) => uploadMedia({ file: f, userId, folder }))
  );
  return results.map((r) => ({ url: r.url, key: r.key }));
}

// ─────────────────────────────────────────────
// UPCOMING
// ─────────────────────────────────────────────

export async function createUpcoming(
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const user = await requireUser();

    const mediaFiles = formData.getAll("mediaFiles") as File[];
    const videoFiles = formData.getAll("videoFiles") as File[];
    const thumbnailFile = formData.get("thumbnailFile") as File | null;

    const uploadedMedia =
      mediaFiles.filter((f) => f.size > 0).length > 0
        ? await uploadMediaUrls(
            mediaFiles.filter((f) => f.size > 0),
            user.id,
            "content/upcoming/images"
          )
        : [];

    const uploadedVideos =
      videoFiles.filter((f) => f.size > 0).length > 0
        ? await uploadMediaUrls(
            videoFiles.filter((f) => f.size > 0),
            user.id,
            "content/upcoming/videos"
          )
        : [];

    let thumbnailUrl: string | null = null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const r = await uploadMedia({
        file: thumbnailFile,
        userId: user.id,
        folder: "content/upcoming/thumbnails",
      });
      thumbnailUrl = r.url;
    }

    const publishAtRaw = formData.get("publishAt") as string | null;
    const expireAtRaw = formData.get("expireAt") as string | null;
    const eventDateRaw = formData.get("eventDate") as string | null;

    await prisma.upcoming.create({
      data: {
        title: formData.get("title") as string,
        subtitle: (formData.get("subtitle") as string) || null,
        description: (formData.get("description") as string) || null,
        mediaUrls: uploadedMedia.map((m) => m.url),
        videoUrls: uploadedVideos.map((v) => v.url),
        thumbnailUrl,
        linkUrl: (formData.get("linkUrl") as string) || null,
        linkLabel: (formData.get("linkLabel") as string) || null,
        isExternal: formData.get("isExternal") === "true",
        eventDate: eventDateRaw ? new Date(eventDateRaw) : null,
        publishAt: publishAtRaw ? new Date(publishAtRaw) : null,
        expireAt: expireAtRaw ? new Date(expireAtRaw) : null,
        status: (formData.get("status") as ContentStatus) ?? "DRAFT",
        isActive: formData.get("isActive") === "true",
        sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
        badgeLabel: (formData.get("badgeLabel") as string) || null,
        createdBy: user.id,
      },
    });

    revalidatePath("/[locale]/admin/upcoming", "page");
    return {};
  } catch (e) {
    console.error("[createUpcoming]", e);
    return { error: "Failed to create upcoming item" };
  }
}

export async function updateUpcoming(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    await requireUser();

    const publishAtRaw = formData.get("publishAt") as string | null;
    const expireAtRaw = formData.get("expireAt") as string | null;
    const eventDateRaw = formData.get("eventDate") as string | null;

    // Keep existing URLs unless new files uploaded
    const existingMediaUrls = formData.getAll("existingMediaUrls") as string[];
    const existingVideoUrls = formData.getAll("existingVideoUrls") as string[];

    const mediaFiles = (formData.getAll("mediaFiles") as File[]).filter(
      (f) => f.size > 0
    );
    const videoFiles = (formData.getAll("videoFiles") as File[]).filter(
      (f) => f.size > 0
    );

    const user = await requireUser();

    const newMedia =
      mediaFiles.length > 0
        ? await uploadMediaUrls(mediaFiles, user.id, "content/upcoming/images")
        : [];
    const newVideos =
      videoFiles.length > 0
        ? await uploadMediaUrls(
            videoFiles,
            user.id,
            "content/upcoming/videos"
          )
        : [];

    const thumbnailFile = formData.get("thumbnailFile") as File | null;
    let thumbnailUrl = (formData.get("existingThumbnailUrl") as string) || null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const r = await uploadMedia({
        file: thumbnailFile,
        userId: user.id,
        folder: "content/upcoming/thumbnails",
      });
      thumbnailUrl = r.url;
    }

    await prisma.upcoming.update({
      where: { id },
      data: {
        title: formData.get("title") as string,
        subtitle: (formData.get("subtitle") as string) || null,
        description: (formData.get("description") as string) || null,
        mediaUrls: [...existingMediaUrls, ...newMedia.map((m) => m.url)],
        videoUrls: [...existingVideoUrls, ...newVideos.map((v) => v.url)],
        thumbnailUrl,
        linkUrl: (formData.get("linkUrl") as string) || null,
        linkLabel: (formData.get("linkLabel") as string) || null,
        isExternal: formData.get("isExternal") === "true",
        eventDate: eventDateRaw ? new Date(eventDateRaw) : null,
        publishAt: publishAtRaw ? new Date(publishAtRaw) : null,
        expireAt: expireAtRaw ? new Date(expireAtRaw) : null,
        status: (formData.get("status") as ContentStatus) ?? "DRAFT",
        isActive: formData.get("isActive") === "true",
        sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
        badgeLabel: (formData.get("badgeLabel") as string) || null,
      },
    });

    revalidatePath("/[locale]/admin/upcoming", "page");
    return {};
  } catch (e) {
    console.error("[updateUpcoming]", e);
    return { error: "Failed to update upcoming item" };
  }
}

export async function deleteUpcoming(
  id: string
): Promise<{ error?: string }> {
  try {
    await requireUser();
    await prisma.upcoming.delete({ where: { id } });
    revalidatePath("/[locale]/admin/upcoming", "page");
    return {};
  } catch (e) {
    console.error("[deleteUpcoming]", e);
    return { error: "Failed to delete upcoming item" };
  }
}

export async function toggleUpcomingActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  try {
    await requireUser();
    await prisma.upcoming.update({ where: { id }, data: { isActive } });
    revalidatePath("/[locale]/admin/upcoming", "page");
    return {};
  } catch (e) {
    return { error: "Failed to update" };
  }
}

// ─────────────────────────────────────────────
// NEWS
// ─────────────────────────────────────────────

export async function createNews(
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const user = await requireUser();

    const mediaFiles = (formData.getAll("mediaFiles") as File[]).filter(
      (f) => f.size > 0
    );
    const videoFiles = (formData.getAll("videoFiles") as File[]).filter(
      (f) => f.size > 0
    );
    const thumbnailFile = formData.get("thumbnailFile") as File | null;

    const uploadedMedia =
      mediaFiles.length > 0
        ? await uploadMediaUrls(mediaFiles, user.id, "content/news/images")
        : [];
    const uploadedVideos =
      videoFiles.length > 0
        ? await uploadMediaUrls(videoFiles, user.id, "content/news/videos")
        : [];

    let thumbnailUrl: string | null = null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const r = await uploadMedia({
        file: thumbnailFile,
        userId: user.id,
        folder: "content/news/thumbnails",
      });
      thumbnailUrl = r.url;
    }

    const publishAtRaw = formData.get("publishAt") as string | null;
    const expireAtRaw = formData.get("expireAt") as string | null;
    const slug = formData.get("slug") as string;

    await prisma.news.create({
      data: {
        title: formData.get("title") as string,
        subtitle: (formData.get("subtitle") as string) || null,
        description: (formData.get("description") as string) || null,
        slug,
        mediaUrls: uploadedMedia.map((m) => m.url),
        videoUrls: uploadedVideos.map((v) => v.url),
        thumbnailUrl,
        linkUrl: (formData.get("linkUrl") as string) || null,
        linkLabel: (formData.get("linkLabel") as string) || null,
        isExternal: formData.get("isExternal") === "true",
        publishAt: publishAtRaw ? new Date(publishAtRaw) : null,
        expireAt: expireAtRaw ? new Date(expireAtRaw) : null,
        status: (formData.get("status") as ContentStatus) ?? "DRAFT",
        isActive: formData.get("isActive") === "true",
        sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
        badgeLabel: (formData.get("badgeLabel") as string) || null,
        createdBy: user.id,
      },
    });

    revalidatePath("/[locale]/admin/news", "page");
    return {};
  } catch (e) {
    console.error("[createNews]", e);
    // Likely a unique slug conflict
    if ((e as any)?.code === "P2002") return { error: "Slug already exists" };
    return { error: "Failed to create news item" };
  }
}

export async function updateNews(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const user = await requireUser();

    const existingMediaUrls = formData.getAll("existingMediaUrls") as string[];
    const existingVideoUrls = formData.getAll("existingVideoUrls") as string[];

    const mediaFiles = (formData.getAll("mediaFiles") as File[]).filter(
      (f) => f.size > 0
    );
    const videoFiles = (formData.getAll("videoFiles") as File[]).filter(
      (f) => f.size > 0
    );

    const newMedia =
      mediaFiles.length > 0
        ? await uploadMediaUrls(mediaFiles, user.id, "content/news/images")
        : [];
    const newVideos =
      videoFiles.length > 0
        ? await uploadMediaUrls(videoFiles, user.id, "content/news/videos")
        : [];

    const thumbnailFile = formData.get("thumbnailFile") as File | null;
    let thumbnailUrl = (formData.get("existingThumbnailUrl") as string) || null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const r = await uploadMedia({
        file: thumbnailFile,
        userId: user.id,
        folder: "content/news/thumbnails",
      });
      thumbnailUrl = r.url;
    }

    const publishAtRaw = formData.get("publishAt") as string | null;
    const expireAtRaw = formData.get("expireAt") as string | null;

    await prisma.news.update({
      where: { id },
      data: {
        title: formData.get("title") as string,
        subtitle: (formData.get("subtitle") as string) || null,
        description: (formData.get("description") as string) || null,
        slug: formData.get("slug") as string,
        mediaUrls: [...existingMediaUrls, ...newMedia.map((m) => m.url)],
        videoUrls: [...existingVideoUrls, ...newVideos.map((v) => v.url)],
        thumbnailUrl,
        linkUrl: (formData.get("linkUrl") as string) || null,
        linkLabel: (formData.get("linkLabel") as string) || null,
        isExternal: formData.get("isExternal") === "true",
        publishAt: publishAtRaw ? new Date(publishAtRaw) : null,
        expireAt: expireAtRaw ? new Date(expireAtRaw) : null,
        status: (formData.get("status") as ContentStatus) ?? "DRAFT",
        isActive: formData.get("isActive") === "true",
        sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
        badgeLabel: (formData.get("badgeLabel") as string) || null,
      },
    });

    revalidatePath("/[locale]/admin/news", "page");
    return {};
  } catch (e) {
    console.error("[updateNews]", e);
    if ((e as any)?.code === "P2002") return { error: "Slug already exists" };
    return { error: "Failed to update news item" };
  }
}

export async function deleteNews(id: string): Promise<{ error?: string }> {
  try {
    await requireUser();
    await prisma.news.delete({ where: { id } });
    revalidatePath("/[locale]/admin/news", "page");
    return {};
  } catch (e) {
    console.error("[deleteNews]", e);
    return { error: "Failed to delete news item" };
  }
}

export async function toggleNewsActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  try {
    await requireUser();
    await prisma.news.update({ where: { id }, data: { isActive } });
    revalidatePath("/[locale]/admin/news", "page");
    return {};
  } catch (e) {
    return { error: "Failed to update" };
  }
}

// ─────────────────────────────────────────────
// OFFERS
// ─────────────────────────────────────────────

export async function createOffer(
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const user = await requireUser();

    const mediaFiles = (formData.getAll("mediaFiles") as File[]).filter(
      (f) => f.size > 0
    );
    const videoFiles = (formData.getAll("videoFiles") as File[]).filter(
      (f) => f.size > 0
    );
    const thumbnailFile = formData.get("thumbnailFile") as File | null;

    const uploadedMedia =
      mediaFiles.length > 0
        ? await uploadMediaUrls(mediaFiles, user.id, "content/offers/images")
        : [];
    const uploadedVideos =
      videoFiles.length > 0
        ? await uploadMediaUrls(videoFiles, user.id, "content/offers/videos")
        : [];

    let thumbnailUrl: string | null = null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const r = await uploadMedia({
        file: thumbnailFile,
        userId: user.id,
        folder: "content/offers/thumbnails",
      });
      thumbnailUrl = r.url;
    }

    const publishAtRaw = formData.get("publishAt") as string | null;
    const expireAtRaw = formData.get("expireAt") as string | null;
    const discountValueRaw = formData.get("discountValue") as string | null;
    const discountTypeRaw = formData.get("discountType") as string | null;
    const classIds = formData.getAll("classIds") as string[];
const subClassIds = formData.getAll("subClassIds") as string[];

    await prisma.offer.create({
      data: {
        title: formData.get("title") as string,
        subtitle: (formData.get("subtitle") as string) || null,
        description: (formData.get("description") as string) || null,
        mediaUrls: uploadedMedia.map((m) => m.url),
        videoUrls: uploadedVideos.map((v) => v.url),
        thumbnailUrl,
        linkUrl: (formData.get("linkUrl") as string) || null,
        linkLabel: (formData.get("linkLabel") as string) || null,
        isExternal: formData.get("isExternal") === "true",
        discountType: discountTypeRaw
          ? (discountTypeRaw as DiscountType)
          : null,
        discountValue: discountValueRaw ? parseFloat(discountValueRaw) : null,
        promoCode: (formData.get("promoCode") as string) || null,
        classIds,
subClassIds,
        publishAt: publishAtRaw ? new Date(publishAtRaw) : null,
        expireAt: expireAtRaw ? new Date(expireAtRaw) : null,
        status: (formData.get("status") as ContentStatus) ?? "DRAFT",
        isActive: formData.get("isActive") === "true",
        sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
        badgeLabel: (formData.get("badgeLabel") as string) || null,
        createdBy: user.id,
      },
    });

    revalidatePath("/[locale]/admin/offers", "page");
    return {};
  } catch (e) {
    console.error("[createOffer]", e);
    if ((e as any)?.code === "P2002") return { error: "Promo code already exists" };
    return { error: "Failed to create offer" };
  }
}

export async function updateOffer(
  id: string,
  formData: FormData
): Promise<{ error?: string }> {
  try {
    const user = await requireUser();

    const existingMediaUrls = formData.getAll("existingMediaUrls") as string[];
    const existingVideoUrls = formData.getAll("existingVideoUrls") as string[];

    const mediaFiles = (formData.getAll("mediaFiles") as File[]).filter(
      (f) => f.size > 0
    );
    const videoFiles = (formData.getAll("videoFiles") as File[]).filter(
      (f) => f.size > 0
    );

    const newMedia =
      mediaFiles.length > 0
        ? await uploadMediaUrls(mediaFiles, user.id, "content/offers/images")
        : [];
    const newVideos =
      videoFiles.length > 0
        ? await uploadMediaUrls(videoFiles, user.id, "content/offers/videos")
        : [];

    const thumbnailFile = formData.get("thumbnailFile") as File | null;
    let thumbnailUrl = (formData.get("existingThumbnailUrl") as string) || null;
    if (thumbnailFile && thumbnailFile.size > 0) {
      const r = await uploadMedia({
        file: thumbnailFile,
        userId: user.id,
        folder: "content/offers/thumbnails",
      });
      thumbnailUrl = r.url;
    }

    const publishAtRaw = formData.get("publishAt") as string | null;
    const expireAtRaw = formData.get("expireAt") as string | null;
    const discountValueRaw = formData.get("discountValue") as string | null;
    const discountTypeRaw = formData.get("discountType") as string | null;
    const classIds = formData.getAll("classIds") as string[];
const subClassIds = formData.getAll("subClassIds") as string[];

    await prisma.offer.update({
      where: { id },
      data: {
        title: formData.get("title") as string,
        subtitle: (formData.get("subtitle") as string) || null,
        description: (formData.get("description") as string) || null,
        mediaUrls: [...existingMediaUrls, ...newMedia.map((m) => m.url)],
        videoUrls: [...existingVideoUrls, ...newVideos.map((v) => v.url)],
        thumbnailUrl,
        linkUrl: (formData.get("linkUrl") as string) || null,
        linkLabel: (formData.get("linkLabel") as string) || null,
        isExternal: formData.get("isExternal") === "true",
        discountType: discountTypeRaw
          ? (discountTypeRaw as DiscountType)
          : null,
        discountValue: discountValueRaw ? parseFloat(discountValueRaw) : null,
        promoCode: (formData.get("promoCode") as string) || null,
        classIds,
subClassIds,
        publishAt: publishAtRaw ? new Date(publishAtRaw) : null,
        expireAt: expireAtRaw ? new Date(expireAtRaw) : null,
        status: (formData.get("status") as ContentStatus) ?? "DRAFT",
        isActive: formData.get("isActive") === "true",
        sortOrder: parseInt(formData.get("sortOrder") as string) || 0,
        badgeLabel: (formData.get("badgeLabel") as string) || null,
      },
    });

    revalidatePath("/[locale]/admin/offers", "page");
    return {};
  } catch (e) {
    console.error("[updateOffer]", e);
    if ((e as any)?.code === "P2002") return { error: "Promo code already exists" };
    return { error: "Failed to update offer" };
  }
}

export async function deleteOffer(id: string): Promise<{ error?: string }> {
  try {
    await requireUser();
    await prisma.offer.delete({ where: { id } });
    revalidatePath("/[locale]/admin/offers", "page");
    return {};
  } catch (e) {
    console.error("[deleteOffer]", e);
    return { error: "Failed to delete offer" };
  }
}

export async function toggleOfferActive(
  id: string,
  isActive: boolean
): Promise<{ error?: string }> {
  try {
    await requireUser();
    await prisma.offer.update({ where: { id }, data: { isActive } });
    revalidatePath("/[locale]/admin/offers", "page");
    return {};
  } catch (e) {
    return { error: "Failed to update" };
  }
}