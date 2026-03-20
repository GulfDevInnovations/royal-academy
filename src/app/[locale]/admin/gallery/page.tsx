import { prisma } from "@/lib/prisma";
import GalleryClient from "./_components/GalleryClient";

export const dynamic = "force-dynamic";

export default async function GalleryAdminPage() {
  const [itemsResult, categoriesResult, personsResult, teachers] =
    await Promise.all([
      prisma.galleryItem.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        include: {
          category: { select: { id: true, name: true, slug: true } },
          persons: {
            include: {
              person: {
                select: {
                  id: true,
                  displayName: true,
                  role: true,
                  photoUrl: true,
                  teacherId: true,
                },
              },
            },
          },
        },
      }),
      prisma.galleryCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { items: true } } },
      }),
      prisma.galleryPerson.findMany({ orderBy: { displayName: "asc" } }),
      prisma.teacherProfile.findMany({
        where: { isActive: true },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: "asc" },
      }),
    ]);

  const serializedItems = itemsResult.map((item) => ({
    ...item,
    takenAt: item.takenAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const serializedCategories = categoriesResult.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <GalleryClient
      initialItems={serializedItems}
      initialCategories={serializedCategories}
      initialPersons={personsResult}
      teachers={teachers}
    />
  );
}
