import HeroSection, {
  type ScheduleSlot,
} from '@/app/[locale]/newhome/_components/HeroSection';
import AboutSection from '@/components/AboutSection';
import { prisma } from '@/lib/prisma';
import { parseJsonArray } from '@/utils/parseJson';
import type { News, Offer, Upcoming } from '@prisma/client';

const DAY_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];
const JS_DAY_TO_IDX = [6, 0, 1, 2, 3, 4, 5];

function nextSixSlots(
  schedules: {
    id: string;
    dayOfWeek: string;
    startTime: string;
    subClass: { name: string; name_ar: string | null };
    teacher: { firstName: string; lastName: string };
  }[],
): ScheduleSlot[] {
  const now = new Date();
  const todayIdx = JS_DAY_TO_IDX[now.getDay()];
  const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return schedules
    .map((s) => {
      const dayIdx = DAY_ORDER.indexOf(s.dayOfWeek);
      let daysUntil = (dayIdx - todayIdx + 7) % 7;
      if (daysUntil === 0 && s.startTime.slice(0, 5) <= nowTime) daysUntil = 7;
      return { ...s, daysUntil };
    })
    .sort((a, b) =>
      a.daysUntil !== b.daysUntil
        ? a.daysUntil - b.daysUntil
        : a.startTime.localeCompare(b.startTime),
    )
    .slice(0, 6)
    .map((s) => ({
      id: s.id,
      subClassName: s.subClass.name,
      subClassName_ar: s.subClass.name_ar,
      teacherFirstName: s.teacher.firstName,
      teacherLastName: s.teacher.lastName,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
    }));
}

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

  try {
    const [upcomingRaw, newsRaw, offersRaw, schedulesRaw] = await Promise.all([
      prisma.upcoming.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        take: 20,
      }),
      prisma.news.findMany({ where, orderBy: { sortOrder: 'asc' }, take: 20 }),
      prisma.offer.findMany({ where, orderBy: { sortOrder: 'asc' }, take: 20 }),
      prisma.classSchedule.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          subClass: { select: { name: true, name_ar: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);
    upcoming = upcomingRaw;
    news = newsRaw;
    offers = offersRaw;
    scheduleSlots = nextSixSlots(schedulesRaw);
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
        upcoming={upcoming.map(serializeBase)}
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
