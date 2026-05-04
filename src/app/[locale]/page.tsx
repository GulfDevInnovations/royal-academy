import { prisma } from '@/lib/prisma';
import type { News, Offer, Upcoming } from '@prisma/client';
import { parseJsonArray } from '@/utils/parseJson';
import HeroSection from '@/app/[locale]/newhome/_components/HeroSection';
import AboutSection from '@/components/AboutSection';

export const dynamic = 'force-dynamic';

const SIDEBAR_W = 150;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === 'ar';

  const where = { status: 'ACTIVE' as const, isActive: true };

  let upcoming: Upcoming[] = [];
  let news: News[] = [];
  let offers: Offer[] = [];

  try {
    [upcoming, news, offers] = await Promise.all([
      prisma.upcoming.findMany({ where, orderBy: { createdAt: 'desc' }, take: 3 }),
      prisma.news.findMany({ where, orderBy: { createdAt: 'desc' }, take: 3 }),
      prisma.offer.findMany({ where, orderBy: { createdAt: 'desc' }, take: 3 }),
    ]);
  } catch (e) {
    if (process.env.NODE_ENV === 'production') throw e;
    console.error('[home] Failed to load content from DB; rendering empty.', e);
  }

  const serializeBase = <
    T extends {
      createdAt: Date;
      updatedAt: Date;
      eventDate?: Date | null;
      publishAt?: Date | null;
      expireAt?: Date | null;
      mediaUrls: unknown;
      videoUrls: unknown;
    },
  >(
    i: T,
  ) => ({
    ...i,
    mediaUrls: parseJsonArray<string>(i.mediaUrls),
    videoUrls: parseJsonArray<string>(i.videoUrls),
    eventDate: i.eventDate?.toISOString() ?? null,
    publishAt: i.publishAt?.toISOString() ?? null,
    expireAt: i.expireAt?.toISOString() ?? null,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  });

  return (
    <>
      <HeroSection
        upcoming={upcoming.map(serializeBase)}
        news={news.map(serializeBase)}
        offers={offers.map((i) => ({
          ...serializeBase(i),
          discountValue: i.discountValue?.toString() ?? null,
        }))}
      />
      <div style={{ [isAr ? 'marginRight' : 'marginLeft']: SIDEBAR_W }}>
        <AboutSection active locale={locale} scrollable />
      </div>
    </>
  );
}
