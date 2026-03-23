"use server";

import { prisma } from "@/lib/prisma";

export type PublicGalleryItem = {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  title: string | null;
  description: string | null;
  isFeatured: boolean;
  sortOrder: number;
  takenAt: string | null;
  category: { name: string; slug: string } | null;
  persons: { displayName: string; role: string | null }[];
};

export async function getPublishedGalleryItems(): Promise<PublicGalleryItem[]> {
  try {
    const items = await prisma.galleryItem.findMany({
      where: { visibility: "PUBLISHED" },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        mediaType: true,
        url: true,
        thumbnailUrl: true,
        altText: true,
        title: true,
        description: true,
        isFeatured: true,
        sortOrder: true,
        takenAt: true,
        category: { select: { name: true, slug: true } },
        persons: {
          select: {
            person: { select: { displayName: true, role: true } },
          },
        },
      },
    });

    return items.map((item) => ({
      ...item,
      takenAt: item.takenAt?.toISOString() ?? null,
      persons: item.persons.map((p) => ({
        displayName: p.person.displayName,
        role: p.person.role,
      })),
    }));
  } catch (error) {
    console.error("getPublishedGalleryItems failed", error);
    return [];
  }
}