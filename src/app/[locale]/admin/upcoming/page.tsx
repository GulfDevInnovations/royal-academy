import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/utils/parseJson";
import UpcomingClient from "./_components/UpcomingClient";

export const dynamic = "force-dynamic";

export default async function UpcomingAdminPage() {
  const [items, classes] = await Promise.all([
    prisma.upcoming.findMany({
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
    workshopId: item.workshopId ?? null,
    eventDate: item.eventDate?.toISOString() ?? null,
    publishAt: item.publishAt?.toISOString() ?? null,
    expireAt: item.expireAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return <UpcomingClient initialItems={serialized} classes={classes} />;
}
