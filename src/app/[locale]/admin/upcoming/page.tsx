import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/utils/parseJson";
import UpcomingClient from "./_components/UpcomingClient";

export const dynamic = "force-dynamic";

export default async function UpcomingAdminPage() {
  const items = await prisma.upcoming.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const serialized = items.map((item) => ({
    ...item,
    mediaUrls: parseJsonArray<string>(item.mediaUrls),
    videoUrls: parseJsonArray<string>(item.videoUrls),
    workshopId: item.workshopId ?? null, // ← include so client knows which rows are workshops
    eventDate: item.eventDate?.toISOString() ?? null,
    publishAt: item.publishAt?.toISOString() ?? null,
    expireAt: item.expireAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return <UpcomingClient initialItems={serialized} />;
}
