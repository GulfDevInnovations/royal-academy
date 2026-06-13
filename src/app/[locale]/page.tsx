import HeroSection, {
  type ScheduleSlot,
} from '@/app/[locale]/newhome/_components/HeroSection';
import AboutSection from '@/components/AboutSection';
import { prisma } from '@/lib/prisma';
import { parseJsonArray } from '@/utils/parseJson';
import type { News, Offer, Upcoming } from '@prisma/client';


export const dynamic = 'force-dynamic';

// NOTE: SIDEBAR_W is only applied on desktop — AboutSection is now
// a client component that detects isMobile and skips the margin itself.
// The desktop sidebar offset is kept here so the white "paper wall"
// section starts flush with the sidebar edge, exactly as before.
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
  let scheduleSlots: ScheduleSlot[] = [];
  let workshopMap = new Map<
    string,
    {
      slug: string | null;
      startTime: string;
      endTime: string;
      capacity: number;
      spotsLeft: number;
      isOnline: boolean;
      teacherName: string | null;
      location: string | null;
    }
  >();

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [upcomingRaw, newsRaw, offersRaw, upcomingWorkshops] = await Promise.all([
      prisma.upcoming.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        take: 20,
      }),
      prisma.news.findMany({ where, orderBy: { sortOrder: 'asc' }, take: 20 }),
      prisma.offer.findMany({ where, orderBy: { sortOrder: 'asc' }, take: 20 }),
      prisma.workshop.findMany({
        where: {
          isActive: true,
          eventDate: { gte: startOfToday },
        },
        orderBy: [{ eventDate: 'asc' }, { startTime: 'asc' }],
        select: {
          id: true,
          title: true,
          title_ar: true,
          eventDate: true,
          startTime: true,
          slug: true,
          teacher: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    // Fetch workshop details (teacher, times) for upcomings that link to a workshop
    const workshopIds = upcomingRaw
      .map((u) => u.workshopId)
      .filter((id): id is string => id !== null);
    if (workshopIds.length > 0) {
      const workshops = await prisma.workshop.findMany({
        where: { id: { in: workshopIds } },
        select: {
          id: true,
          slug: true,
          startTime: true,
          endTime: true,
          capacity: true,
          enrolledCount: true,
          reservedCount: true,
          isOnline: true,
          teacher: { select: { firstName: true, lastName: true } },
          room: { select: { name: true, location: true } },
        },
      });
      for (const w of workshops) {
        workshopMap.set(w.id, {
          slug: w.slug,
          startTime: w.startTime,
          endTime: w.endTime,
          capacity: w.capacity,
          spotsLeft: Math.max(0, w.capacity - w.enrolledCount - w.reservedCount),
          isOnline: w.isOnline,
          teacherName: w.teacher
            ? `${w.teacher.firstName} ${w.teacher.lastName}`
            : null,
          location: w.room
            ? [w.room.name, w.room.location].filter(Boolean).join(' · ')
            : null,
        });
      }
    }

    upcoming = upcomingRaw;
    news = newsRaw;
    offers = offersRaw;
    scheduleSlots = upcomingWorkshops.map((w) => ({
      id: w.id,
      title: w.title,
      title_ar: w.title_ar,
      teacherFirstName: w.teacher?.firstName ?? '',
      teacherLastName: w.teacher?.lastName ?? '',
      eventDate: w.eventDate.toISOString(),
      startTime: w.startTime,
      slug: w.slug,
    }));
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
      {/* HeroSection is now mobile-aware and handles its own sidebar offset */}
      <HeroSection
        upcoming={upcoming.map((u) => {
          const ws = u.workshopId ? workshopMap.get(u.workshopId) : undefined;
          return {
            ...serializeBase(u),
            teacherName: ws?.teacherName ?? null,
            workshopStartTime: ws?.startTime ?? null,
            workshopEndTime: ws?.endTime ?? null,
            workshopSlug: ws?.slug ?? null,
            workshopCapacity: ws?.capacity ?? null,
            workshopSpotsLeft: ws?.spotsLeft ?? null,
            workshopIsOnline: ws?.isOnline ?? null,
            workshopLocation: ws?.location ?? null,
          };
        })}
        news={news.map(serializeBase)}
        offers={offers.map((i) => ({
          ...serializeBase(i),
          discountValue: i.discountValue?.toString() ?? null,
        }))}
        scheduleSlots={scheduleSlots}
      />

      {/*
        AboutSection wrapper:
        - Desktop: marginLeft/Right = SIDEBAR_W so the dark section sits flush
          with the sidebar edge, matching the original design.
        - Mobile: AboutSection's own isMobile check removes internal offsets,
          and this wrapper has no margin — the section fills full width.
        We use a CSS custom property trick via a server-rendered style tag to
        apply the margin only on desktop without needing a client wrapper here.
      */}
      <style>{`
        @media (min-width: 768px) {
          .about-section-wrapper {
            ${isAr ? 'margin-right' : 'margin-left'}: ${SIDEBAR_W}px;
          }
        }
        @media (max-width: 767px) {
          .about-section-wrapper {
            margin-left: 0;
            margin-right: 0;
          }
        }
      `}</style>
      <div
        className="about-section-wrapper"
        style={{
          boxShadow: [
            'inset 2px 2px 0 rgba(255,255,255,0.92)',
            'inset -1px -2px 0 rgba(0,0,0,0.07)',
            '0 -2px 6px rgba(0,0,0,0.07)',
            '0 -8px 24px rgba(0,0,0,0.09)',
            '0 -24px 60px rgba(0,0,0,0.07)',
            '4px -6px 0 rgba(0,0,0,0.04)',
          ].join(', '),
        }}
      >
        <AboutSection active locale={locale} scrollable />
      </div>
    </>
  );
}
