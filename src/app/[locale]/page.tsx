import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
import HomeWrapper from "@/components/layout-toggle/HomeWrapper"; // adjust path if needed

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const where = {
    status: "ACTIVE" as const,
    isActive: true,
  };

  const [upcoming, news, offers] = await Promise.all([
    prisma.upcoming.findMany({ where, orderBy: { sortOrder: "asc" } }),
    prisma.news.findMany({ where, orderBy: { sortOrder: "asc" } }),
    prisma.offer.findMany({ where, orderBy: { sortOrder: "asc" } }),
  ]);

  type WithBaseDates = {
    createdAt: Date;
    updatedAt: Date;
    eventDate?: Date | null;
    publishAt?: Date | null;
    expireAt?: Date | null;
  };

  const serializeBase = <T extends WithBaseDates>(i: T) => ({
    ...i,
    eventDate: i.eventDate?.toISOString() ?? null,
    publishAt: i.publishAt?.toISOString() ?? null,
    expireAt: i.expireAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  });

  return (
    <HomeWrapper
      key={locale}
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
