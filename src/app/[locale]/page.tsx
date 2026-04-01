import { prisma } from "@/lib/prisma";
import type { News, Offer, Upcoming } from "@prisma/client";
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

  let upcoming: Upcoming[] = [];
  let news: News[] = [];
  let offers: Offer[] = [];

  try {
    [upcoming, news, offers] = await Promise.all([
      prisma.upcoming.findMany({ where, orderBy: { sortOrder: "asc" } }),
      prisma.news.findMany({ where, orderBy: { sortOrder: "asc" } }),
      prisma.offer.findMany({ where, orderBy: { sortOrder: "asc" } }),
    ]);
  } catch (error) {
    // Dev convenience: allow the homepage to render even if Postgres isn't up locally.
    // In production we still want to fail fast so we notice DB outages.
    if (process.env.NODE_ENV === "production") throw error;
    console.error("[home] Failed to load content from DB; rendering empty lists.", error);
  }

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
      logoUrl="/images/logo/Logo-Color.png"
      backgroundImageUrl="/images/rooms/initial-room4.png"
    />
  );
}
