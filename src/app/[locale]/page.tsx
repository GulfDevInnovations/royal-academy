import { prisma } from "@/lib/prisma";
import HomeClient from "@/components/royal-intro/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const now = new Date();

  const where = {
    status: "ACTIVE" as const,
    isActive: true,
    // publishAt: { lte: now },
    // OR: [{ expireAt: null }, { expireAt: { gte: now } }],
  };

  const [upcoming, news, offers] = await Promise.all([
    prisma.upcoming.findMany({ where, orderBy: { sortOrder: "asc" } }),
    prisma.news.findMany({ where, orderBy: { sortOrder: "asc" } }),
    prisma.offer.findMany({ where, orderBy: { sortOrder: "asc" } }),
  ]);

  const serializeBase = (i: any) => ({
    ...i,
    eventDate: i.eventDate?.toISOString() ?? null,
    publishAt: i.publishAt?.toISOString() ?? null,
    expireAt: i.expireAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  });

  return (
    <HomeClient
      worldData={{
        upcoming: upcoming.map(serializeBase),
        news: news.map(serializeBase),
        offers: offers.map((i) => ({
          ...serializeBase(i),
          discountValue: i.discountValue?.toString() ?? null,
        })),
      }}
      logoUrl="/images/logo/logo-color.png"
      backgroundImageUrl="/images/rooms/initial-room4.png"
    />
  );
}
