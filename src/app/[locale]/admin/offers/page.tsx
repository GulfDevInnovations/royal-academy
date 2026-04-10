import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/utils/parseJson";
import OffersClient from "./_components/OffersClient";

export const dynamic = "force-dynamic";

export default async function OffersAdminPage() {
  const [items, classes] = await Promise.all([
    prisma.offer.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.class.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        subClasses: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  const serialized = items.map((item) => ({
    ...item,
    mediaUrls: parseJsonArray<string>(item.mediaUrls),
    videoUrls: parseJsonArray<string>(item.videoUrls),
    classIds: parseJsonArray<string>(item.classIds),
    subClassIds: parseJsonArray<string>(item.subClassIds),
    eventDate: null,
    discountValue: item.discountValue ? item.discountValue.toString() : null,
    publishAt: item.publishAt?.toISOString() ?? null,
    expireAt: item.expireAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return <OffersClient initialItems={serialized} classes={classes} />;
}
