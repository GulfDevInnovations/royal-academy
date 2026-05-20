'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaItem =
  | { type: 'video'; src: string }
  | { type: 'image'; src: string; alt?: string };

interface ContentItem {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  mediaUrls: string[];
  videoUrls: string[];
  thumbnailUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  isExternal: boolean;
  badgeLabel?: string | null;
  eventDate?: string | null;
}

export interface ScheduleSlot {
  id: string;
  subClassName: string;
  subClassName_ar?: string | null;
  teacherFirstName: string;
  teacherLastName: string;
  dayOfWeek: string;
  startTime: string;
}

interface HeroProps {
  upcoming?: ContentItem[];
  news?: ContentItem[];
  offers?: ContentItem[];
  scheduleSlots?: ScheduleSlot[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MEDIA_ITEMS: MediaItem[] = [
  { type: 'video', src: '/videos/RoyalAcademywebsiteBallet.mp4' },
  { type: 'video', src: '/videos/RoyalAcademywebsiteKids.mp4' },
  { type: 'video', src: '/videos/RoyalAcademywebsiteArt.mp4' },
  { type: 'video', src: '/videos/RoyalAcademywebsitemusic.mp4' },
  { type: 'video', src: '/videos/RoyalAcademywebsiteWellness.mp4' },
];

const SIDEBAR_W = 150;

const DAY_SHORT: Record<string, { en: string; ar: string }> = {
  MONDAY: { en: 'Mon', ar: 'الإثنين' },
  TUESDAY: { en: 'Tue', ar: 'الثلاثاء' },
  WEDNESDAY: { en: 'Wed', ar: 'الأربعاء' },
  THURSDAY: { en: 'Thu', ar: 'الخميس' },
  FRIDAY: { en: 'Fri', ar: 'الجمعة' },
  SATURDAY: { en: 'Sat', ar: 'السبت' },
  SUNDAY: { en: 'Sun', ar: 'الأحد' },
};

// ─── useIsMobile ──────────────────────────────────────────────────────────────
// Returns null until after first client render to prevent hydration mismatches.

function useIsMobile(breakpoint = 768): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── Root Component ───────────────────────────────────────────────────────────

export default function HeroSection({
  upcoming = [],
  news = [],
  offers = [],
  scheduleSlots = [],
}: HeroProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const isAr = locale === 'ar';

  // null = SSR/unmounted → treated as desktop (false) to match server HTML
  const isMobileVal = useIsMobile(768);
  const isMobile = isMobileVal === true;
  const t = useTranslations('heroSection');

  // ── Video slider ──────────────────────────────────────────────────────────
  const [current, setCurrent] = useState(0);
  // All 5 videos are queued for preload immediately — they total ~13 MB which
  // is acceptable for a hero, and ensures zero buffering on any transition.
  const [preloadSet] = useState<Set<number>>(
    () => new Set(MEDIA_ITEMS.map((_, i) => i)),
  );
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const currentRef = useRef(0);
  const transRef = useRef(false);

  // After first render, explicitly call .load() on every video so mobile
  // browsers (especially Safari) actually start downloading and don't just
  // honor the preload="auto" attribute lazily.
  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (v) v.load();
    });
  }, []);

  const goTo = useCallback((idx: number) => {
    if (transRef.current) return;
    transRef.current = true;
    const n =
      ((idx % MEDIA_ITEMS.length) + MEDIA_ITEMS.length) % MEDIA_ITEMS.length;
    currentRef.current = n;
    setCurrent(n);
    transRef.current = false;
  }, []);

  const nextSlide = useCallback(() => goTo(currentRef.current + 1), [goTo]);

  useEffect(() => {
    if (MEDIA_ITEMS[current].type !== 'video') return;

    // Pause every video that is not the current one
    videoRefs.current.forEach((v, i) => {
      if (v && i !== current) v.pause();
    });

    const cur = videoRefs.current[current];
    if (cur) {
      cur.currentTime = 0;
      cur.play().catch(() => {});
    }
  }, [current]);

  const hasContent =
    upcoming.length > 0 || news.length > 0 || offers.length > 0;
  const fontFamily = isAr
    ? "'Layla','Noto Naskh Arabic',serif"
    : "'Goudy Old Style','GoudyOlSt-BT',Georgia,serif";

  // Desktop only: offset by fixed sidebar width
  const sideOffset: React.CSSProperties = isMobile
    ? {}
    : { [isAr ? 'marginRight' : 'marginLeft']: SIDEBAR_W };

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <section
        style={{
          position: 'relative',
          width: '100vw',
          maxWidth: '100vw',
          fontFamily,
          direction: isAr ? 'rtl' : 'ltr',
          overflowX: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <style>{`.ra-gold-pip { width: 28px; height: 2px; background: #ff751f; margin-bottom: 10px; }`}</style>

        {/* Video — natural 16:9 landscape, full width, no 100vh crop */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            background: '#0e0d0b',
            lineHeight: 0,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%',
            }}
          >
            {MEDIA_ITEMS.map((item, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: i === current ? 1 : 0,
                  transition: 'opacity .7s ease',
                }}
              >
                {item.type === 'video' ? (
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    preload={preloadSet.has(i) ? 'auto' : 'none'}
                    muted
                    playsInline
                    onEnded={nextSlide}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  >
                    <source src={item.src} type="video/mp4" />
                  </video>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt={(item as { alt?: string }).alt ?? ''}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Schedule slots — list below video on dark background */}
        {scheduleSlots.length > 0 && (
          <MobileScheduleList
            slots={scheduleSlots}
            isAr={isAr}
            locale={locale}
            t={t}
          />
        )}

        {/* Content cards — fixed height, swipeable */}
        {hasContent && (
          <div
            style={{
              background: '#ffffff',
              padding: '32px 16px 56px',
              display: 'flex',
              flexDirection: 'column',
              gap: 40,
              width: '100%',
              boxSizing: 'border-box',
              overflowX: 'hidden',
            }}
          >
            {upcoming.length > 0 && (
              <PaperCard rotation={0}>
                <MobileCardSection
                  title={t('upcoming')}
                  items={upcoming}
                  isAr={isAr}
                  autoInterval={6000}
                  t={t}
                />
              </PaperCard>
            )}
            {news.length > 0 && (
              <PaperCard rotation={0}>
                <MobileCardSection
                  title={t('news')}
                  items={news}
                  isAr={isAr}
                  autoInterval={8500}
                  t={t}
                />
              </PaperCard>
            )}
            {offers.length > 0 && (
              <PaperCard rotation={0}>
                <MobileCardSection
                  title={t('offers')}
                  items={offers}
                  isAr={isAr}
                  autoInterval={11000}
                  t={t}
                />
              </PaperCard>
            )}
          </div>
        )}
      </section>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  return (
    <section
      style={{
        position: 'relative',
        width: '100vw',
        fontFamily,
        direction: isAr ? 'rtl' : 'ltr',
      }}
    >
      {/* Video hero — full viewport height */}
      <div
        style={{
          position: 'relative',
          height: '100vh',
          overflow: 'hidden',
          background: '#0e0d0b',
          ...sideOffset,
        }}
      >
        {MEDIA_ITEMS.map((item, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              opacity: i === current ? 1 : 0,
              transition: 'opacity .7s ease',
            }}
          >
            {item.type === 'video' ? (
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                preload={preloadSet.has(i) ? 'auto' : 'none'}
                muted
                playsInline
                onEnded={nextSlide}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              >
                <source src={item.src} type="video/mp4" />
              </video>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.src}
                alt={(item as { alt?: string }).alt ?? ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
        ))}
        {scheduleSlots.length > 0 && (
          <DesktopScheduleTicker
            slots={scheduleSlots}
            isAr={isAr}
            locale={locale}
            t={t}
          />
        )}
      </div>

      {/* Content sections */}
      {hasContent && (
        <div
          style={{
            ...sideOffset,
            background: '#ffffff',
            padding: '80px 60px 100px',
            display: 'flex',
            flexDirection: 'column',
            gap: 100,
          }}
        >
          <style>{`.ra-gold-pip { width: 28px; height: 2px; background: #ff751f; margin-bottom: 18px; }`}</style>

          {upcoming.length > 0 && (
            <PaperCard rotation={-0.7}>
              {upcoming.length > 1 ? (
                <DesktopContentSection
                  title={t('upcoming')}
                  items={upcoming}
                  isAr={isAr}
                  autoInterval={6000}
                  layout="text-left"
                  t={t}
                />
              ) : (
                <DesktopSingleRow
                  item={upcoming[0]}
                  isAr={isAr}
                  layout="text-left"
                />
              )}
            </PaperCard>
          )}
          {news.length > 0 && (
            <PaperCard rotation={0.45}>
              {news.length > 1 ? (
                <DesktopContentSection
                  title={t('news')}
                  items={news}
                  isAr={isAr}
                  autoInterval={8500}
                  layout="text-right"
                  t={t}
                />
              ) : (
                <DesktopSingleRow
                  item={news[0]}
                  isAr={isAr}
                  layout="text-right"
                />
              )}
            </PaperCard>
          )}
          {offers.length > 0 && (
            <PaperCard rotation={-0.3}>
              {offers.length > 1 ? (
                <DesktopContentSection
                  title={t('offers')}
                  items={offers}
                  isAr={isAr}
                  autoInterval={11000}
                  layout="text-left"
                  t={t}
                />
              ) : (
                <DesktopSingleRow
                  item={offers[0]}
                  isAr={isAr}
                  layout="text-left"
                />
              )}
            </PaperCard>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Mobile: schedule list below video ───────────────────────────────────────

function MobileScheduleList({
  slots,
  isAr,
  locale,
  t,
}: {
  slots: ScheduleSlot[];
  isAr: boolean;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div
      style={{
        background: 'rgba(14,13,11,0.97)',
        padding: '4px 0 0',
        direction: isAr ? 'rtl' : 'ltr',
      }}
    >
      {slots.map((slot, i) => (
        <div
          key={slot.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 18px',
            gap: 10,
            borderBottom:
              i < slots.length - 1
                ? '1px solid rgba(255,255,255,0.06)'
                : 'none',
          }}
        >
          <span
            style={{
              fontSize: '0.58rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#ff751f',
              fontWeight: 500,
              flexShrink: 0,
              minWidth: 56,
            }}
          >
            {DAY_SHORT[slot.dayOfWeek]?.[isAr ? 'ar' : 'en'] ?? slot.dayOfWeek}
            {' · '}
            {slot.startTime.slice(0, 5)}
          </span>
          <span
            style={{
              fontSize: '0.78rem',
              color: '#ffffff',
              flex: 1,
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isAr && slot.subClassName_ar
              ? slot.subClassName_ar
              : slot.subClassName}
          </span>
          <span
            style={{
              fontSize: '0.58rem',
              color: 'rgba(255,255,255,0.38)',
              flexShrink: 0,
              letterSpacing: '0.04em',
              textAlign: isAr ? 'left' : 'right',
              minWidth: 56,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {slot.teacherFirstName} {slot.teacherLastName}
          </span>
        </div>
      ))}
      <a
        href={`/${locale}/enrollment`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          padding: '10px 18px 12px',
          textDecoration: 'none',
          color: '#ff751f',
          fontSize: '0.58rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ff751f"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {t('viewAllClasses')}
      </a>
    </div>
  );
}

// ─── Mobile: fixed-height card with swipe + scrollable text ──────────────────

const CARD_HEIGHT = 420;

function MobileCardSection({
  title,
  items,
  isAr,
  autoInterval,
  t,
}: {
  title: string;
  items: ContentItem[];
  isAr: boolean;
  autoInterval: number;
  t: ReturnType<typeof useTranslations>;
}) {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback(
    (idx: number) => {
      const n = ((idx % items.length) + items.length) % items.length;
      activeRef.current = n;
      setActive(n);
    },
    [items.length],
  );

  const resetAuto = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(
      () => goTo(activeRef.current + 1),
      autoInterval,
    );
  }, [autoInterval, goTo]);

  useEffect(() => {
    resetAuto();
    return () => {
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
  }, [resetAuto]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    resetAuto();
    // swipe left → next, swipe right → prev (same for both LTR and RTL)
    goTo(dx < 0 ? activeRef.current + 1 : activeRef.current - 1);
  };

  const item = items[active];
  const videoSrc = item.videoUrls[0] ?? null;
  const imageSrc = item.mediaUrls[0] ?? item.thumbnailUrl ?? null;
  const hasMedia = !!(videoSrc || imageSrc);

  return (
    <div
      style={{
        height: CARD_HEIGHT,
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden', // clips text AND media — nothing can escape
        userSelect: 'none',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header — gray band, visually distinct category label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '11px 18px 11px',
          flexShrink: 0,
          background: 'linear-gradient(135deg, #e8e6e1 0%, #dedad3 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Orange accent bar */}
          <div
            style={{
              width: 3,
              height: 22,
              background: '#ff751f',
              borderRadius: 2,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: '#3a3530',
            }}
          >
            {title}
          </span>
        </div>
        {items.length > 1 && (
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  goTo(i);
                  resetAuto();
                }}
                style={{
                  width: i === active ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === active ? '#ff751f' : 'rgba(0,0,0,0.22)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'width .3s ease',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Media — always fixed 178px height to keep text area stable across slides */}
      <div
        style={{
          flexShrink: 0,
          margin: '14px 20px 0',
          height: 178,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: hasMedia ? '0 4px 20px rgba(0,0,0,0.12)' : 'none',
          background: 'transparent',
        }}
      >
        {hasMedia &&
          (videoSrc ? (
            <video
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc!}
              alt={item.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ))}
      </div>

      {/* Text — scrollable vertically, nothing escapes horizontally */}
      <div
        style={{
          flex: 1,
          minHeight: 0, // essential: lets flex child actually scroll
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '12px 20px 16px',
          boxSizing: 'border-box',
          direction: isAr ? 'rtl' : 'ltr',
          textAlign: isAr ? 'right' : 'left',
          wordBreak: 'break-word', // long words wrap instead of overflowing
          overflowWrap: 'break-word',
        }}
      >
        {item.badgeLabel && (
          <span
            style={{
              display: 'inline-block',
              fontSize: 9,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: '#fff',
              background: '#ff751f',
              padding: '3px 8px',
              borderRadius: 1,
              marginBottom: 8,
            }}
          >
            {item.badgeLabel}
          </span>
        )}
        <h3
          style={{
            margin: '0 0 6px',
            fontSize: 19,
            fontWeight: 400,
            color: '#1a1a1a',
            lineHeight: 1.25,
            maxWidth: '100%',
          }}
        >
          {item.title}
        </h3>
        {item.subtitle && (
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 12,
              color: '#555',
              fontStyle: 'italic',
              lineHeight: 1.5,
            }}
          >
            {item.subtitle}
          </p>
        )}
        {item.description && (
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 12,
              color: '#777',
              lineHeight: 1.7,
            }}
          >
            {item.description}
          </p>
        )}
        {item.eventDate && (
          <time
            style={{
              fontSize: 10,
              color: '#aaa',
              letterSpacing: '.1em',
              display: 'block',
              marginBottom: 6,
            }}
          >
            {new Date(item.eventDate).toLocaleDateString(
              isAr ? 'ar-SA' : 'en-GB',
              { day: 'numeric', month: 'long', year: 'numeric' },
            )}
          </time>
        )}
        {item.linkUrl && (
          <a
            href={item.linkUrl}
            target={item.isExternal ? '_blank' : undefined}
            rel={item.isExternal ? 'noopener noreferrer' : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 10,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              color: '#1a1a1a',
              borderBottom: '1px solid rgba(0,0,0,.25)',
              paddingBottom: 2,
            }}
          >
            {item.linkLabel ?? t('learnMore')}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Desktop: schedule ticker overlay ────────────────────────────────────────

function DesktopScheduleTicker({
  slots,
  isAr,
  locale,
  t,
}: {
  slots: ScheduleSlot[];
  isAr: boolean;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '13vh',
        background: 'rgba(0,0,0,0.68)',
        backdropFilter: 'blur(3px)',
        zIndex: 2,
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.4s ease',
        display: 'flex',
        alignItems: 'center',
        direction: isAr ? 'rtl' : 'ltr',
      }}
    >
      {slots.map((slot) => (
        <div
          key={slot.id}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            padding: '0 16px',
            borderRight: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <span
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#ff751f',
              fontWeight: 500,
            }}
          >
            {DAY_SHORT[slot.dayOfWeek]?.[isAr ? 'ar' : 'en'] ?? slot.dayOfWeek}
            {' · '}
            {slot.startTime.slice(0, 5)}
          </span>
          <span
            style={{
              fontSize: '0.88rem',
              color: '#ffffff',
              fontWeight: 400,
              textAlign: 'center',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '100%',
            }}
          >
            {isAr && slot.subClassName_ar
              ? slot.subClassName_ar
              : slot.subClassName}
          </span>
          <span
            style={{
              fontSize: '0.62rem',
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            {slot.teacherFirstName} {slot.teacherLastName}
          </span>
        </div>
      ))}
      <a
        href={`/${locale}/enrollment`}
        style={{
          flexShrink: 0,
          width: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '0 20px',
          textDecoration: 'none',
          color: '#ff751f',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ff751f"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <line x1="8" y1="14" x2="8" y2="14" strokeWidth="2" />
          <line x1="12" y1="14" x2="12" y2="14" strokeWidth="2" />
          <line x1="16" y1="14" x2="16" y2="14" strokeWidth="2" />
        </svg>
        <span
          style={{
            fontSize: '0.55rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {t('viewAllClasses')}
        </span>
      </a>
    </div>
  );
}

// ─── Desktop: content slider ──────────────────────────────────────────────────

function DesktopContentSection({
  title,
  items,
  isAr,
  autoInterval,
  layout,
  t,
}: {
  title: string;
  items: ContentItem[];
  isAr: boolean;
  autoInterval: number;
  layout: 'text-left' | 'text-right';
  t: ReturnType<typeof useTranslations>;
}) {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [fading, setFading] = useState(false);
  const activeRef = useRef(0);
  const hoveredRef = useRef(false);

  useEffect(() => {
    hoveredRef.current = hovered;
  }, [hovered]);

  const goTo = useCallback(
    (idx: number) => {
      const n = ((idx % items.length) + items.length) % items.length;
      setFading(true);
      setTimeout(() => {
        activeRef.current = n;
        setActive(n);
        setFading(false);
      }, 280);
    },
    [items.length],
  );

  const goPrev = useCallback(() => goTo(activeRef.current - 1), [goTo]);
  const goNext = useCallback(() => goTo(activeRef.current + 1), [goTo]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!hoveredRef.current) goTo(activeRef.current + 1);
    }, autoInterval);
    return () => clearInterval(id);
  }, [autoInterval, goTo]);

  const textFirst = layout === 'text-left';
  const item = items[active];
  const videoSrc = item.videoUrls[0] ?? null;
  const imageSrc = item.mediaUrls[0] ?? item.thumbnailUrl ?? null;
  const hasMedia = !!(videoSrc || imageSrc);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [lightboxOpen]);

  return (
    <div
      style={{ position: 'relative', padding: '100px 50px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          position: 'absolute',
          top: 36,
          [isAr ? 'right' : 'left']: 64,
          zIndex: 2,
        }}
      >
        <div className="ra-gold-pip" />
        <span
          style={{
            fontSize: 10,
            letterSpacing: '.26em',
            textTransform: 'uppercase',
            color: '#999',
            fontWeight: 400,
          }}
        >
          {title}
        </span>
      </div>

      {items.length > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            [isAr ? 'left' : 'right']: 64,
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === active ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === active ? '#ff751f' : 'rgba(0,0,0,0.18)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'width .35s ease, background .35s ease',
              }}
            />
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: textFirst ? 'row' : 'row-reverse',
          alignItems: 'stretch',
          gap: 0,
          height: 480,
          opacity: fading ? 0 : 1,
          transition: 'opacity .28s ease',
        }}
      >
        <div
          style={{
            flex: 1,
            padding: '40px 80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: textFirst
              ? isAr
                ? 'flex-start'
                : 'flex-end'
              : isAr
                ? 'flex-end'
                : 'flex-start',
            gap: 16,
            textAlign: textFirst
              ? isAr
                ? 'left'
                : 'right'
              : isAr
                ? 'right'
                : 'left',
          }}
        >
          {item.badgeLabel && (
            <span
              style={{
                display: 'inline-block',
                fontSize: 9,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                color: '#fff',
                background: '#ff751f',
                padding: '4px 10px',
                borderRadius: 1,
              }}
            >
              {item.badgeLabel}
            </span>
          )}
          <h3
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 400,
              color: '#1a1a1a',
              lineHeight: 1.2,
              letterSpacing: '.01em',
              maxWidth: 480,
            }}
          >
            {item.title}
          </h3>
          {item.subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: 15,
                color: '#555',
                fontStyle: 'italic',
                lineHeight: 1.6,
                maxWidth: 440,
              }}
            >
              {item.subtitle}
            </p>
          )}
          {item.description && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: '#777',
                lineHeight: 1.85,
                maxWidth: 440,
              }}
            >
              {item.description}
            </p>
          )}
          {item.eventDate && (
            <time
              style={{ fontSize: 11, color: '#aaa', letterSpacing: '.1em' }}
            >
              {new Date(item.eventDate).toLocaleDateString(
                isAr ? 'ar-SA' : 'en-GB',
                { day: 'numeric', month: 'long', year: 'numeric' },
              )}
            </time>
          )}
          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target={item.isExternal ? '_blank' : undefined}
              rel={item.isExternal ? 'noopener noreferrer' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
                fontSize: 11,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: '#1a1a1a',
                borderBottom: '1px solid rgba(0,0,0,.25)',
                paddingBottom: 2,
                transition: 'color .2s, border-color .2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#ff751f';
                (e.currentTarget as HTMLElement).style.borderColor = '#ff751f';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#1a1a1a';
                (e.currentTarget as HTMLElement).style.borderColor =
                  'rgba(0,0,0,.25)';
              }}
            >
              {item.linkLabel ?? t('learnMore')}
            </a>
          )}
        </div>

        {hasMedia && (
          <div style={{ flex: 1, padding: '32px', overflow: 'hidden' }}>
            <div
              onClick={() => setLightboxOpen(true)}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                background: 'transparent',
                boxShadow:
                  '0 2px 4px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.1)',
                borderRadius: 2,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'box-shadow .35s ease, transform .35s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 4px 8px rgba(0,0,0,0.08), 0 18px 48px rgba(0,0,0,0.15)';
                (e.currentTarget as HTMLElement).style.transform =
                  'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 2px 4px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.1)';
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
            >
              {videoSrc ? (
                <video
                  src={videoSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc!}
                  alt={item.title}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {items.length > 1 && (
        <>
          <DesktopChevronButton
            direction={isAr ? 'right' : 'left'}
            onClick={isAr ? goNext : goPrev}
            side="left"
            t={t}
          />
          <DesktopChevronButton
            direction={isAr ? 'left' : 'right'}
            onClick={isAr ? goPrev : goNext}
            side="right"
            t={t}
          />
        </>
      )}

      {lightboxOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              background: 'rgba(0,0,0,.88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
              style={{
                position: 'absolute',
                top: 24,
                right: 28,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,.7)',
                padding: 8,
                zIndex: 2001,
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '85vw',
                maxHeight: '85vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {videoSrc ? (
                <video
                  src={videoSrc}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '85vh',
                    borderRadius: 4,
                    display: 'block',
                  }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc!}
                  alt=""
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '85vh',
                    borderRadius: 4,
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// ─── Desktop: single item ─────────────────────────────────────────────────────

function DesktopSingleRow({
  item,
  isAr,
  layout,
}: {
  item: ContentItem;
  isAr: boolean;
  layout: 'text-left' | 'text-right';
}) {
  const textFirst = layout === 'text-left';
  const videoSrc = item.videoUrls[0] ?? null;
  const imageSrc = item.mediaUrls[0] ?? item.thumbnailUrl ?? null;
  const hasMedia = !!(videoSrc || imageSrc);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [lightboxOpen]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: textFirst ? 'row' : 'row-reverse',
        alignItems: 'stretch',
        height: 480,
      }}
    >
      <div
        style={{
          flex: 1,
          padding: '40px 80px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: textFirst
            ? isAr
              ? 'flex-start'
              : 'flex-end'
            : isAr
              ? 'flex-end'
              : 'flex-start',
          gap: 16,
          textAlign: textFirst
            ? isAr
              ? 'left'
              : 'right'
            : isAr
              ? 'right'
              : 'left',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 400,
            color: '#1a1a1a',
            lineHeight: 1.2,
          }}
        >
          {item.title}
        </h3>
        {item.subtitle && (
          <p
            style={{
              margin: 0,
              fontSize: 15,
              color: '#555',
              fontStyle: 'italic',
            }}
          >
            {item.subtitle}
          </p>
        )}
        {item.description && (
          <p
            style={{ margin: 0, fontSize: 13, color: '#777', lineHeight: 1.85 }}
          >
            {item.description}
          </p>
        )}
      </div>
      {hasMedia && (
        <div style={{ flex: 1, padding: '80px', overflow: 'hidden' }}>
          <div
            onClick={() => setLightboxOpen(true)}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow:
                '0 2px 4px rgba(0,0,0,0.06), 0 8px 28px rgba(0,0,0,0.1)',
            }}
          >
            {videoSrc ? (
              <video
                src={videoSrc}
                autoPlay
                muted
                loop
                playsInline
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc!}
                alt={item.title}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            )}
          </div>
        </div>
      )}
      {lightboxOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              background: 'rgba(0,0,0,.88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '85vw', maxHeight: '85vh' }}
            >
              {videoSrc ? (
                <video
                  src={videoSrc}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '85vh',
                    borderRadius: 4,
                    display: 'block',
                  }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc!}
                  alt=""
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '85vh',
                    borderRadius: 4,
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// ─── Shared: PaperCard ────────────────────────────────────────────────────────

function PaperCard({
  children,
  rotation = 0,
}: {
  children: React.ReactNode;
  rotation?: number;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'top center',
        // No overflow:hidden here — thumbtack sits at top:-20 outside the card
        // The inner content wrapper handles clipping instead
      }}
    >
      {/* Paper surface */}
      <div
        style={{
          background:
            'linear-gradient(160deg, #fefdf9 0%, #faf8f3 55%, #f6f3ec 100%)',
          boxShadow: [
            'inset 2px 2px 0 rgba(255,255,255,0.92)',
            'inset -1px -2px 0 rgba(0,0,0,0.07)',
            '0 2px 6px rgba(0,0,0,0.07)',
            '0 8px 24px rgba(0,0,0,0.09)',
            '0 24px 60px rgba(0,0,0,0.07)',
            '4px 6px 0 rgba(0,0,0,0.04)',
          ].join(', '),
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 2,
          marginTop: 14, // space for thumbtack pin head that overhangs
          overflow: 'hidden', // clips content but not the thumbtack above
        }}
      >
        {children}
      </div>
      {/* Thumbtack — sits above the paper, not clipped */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          filter: 'drop-shadow(0 3px 7px rgba(0,0,0,0.38))',
          pointerEvents: 'none',
        }}
      >
        <svg width="22" height="34" viewBox="0 0 22 34" fill="none">
          <circle cx="11" cy="9" r="9" fill="#ff751f" />
          <circle cx="11" cy="9" r="6.5" fill="#e05c0a" />
          <ellipse
            cx="8"
            cy="6"
            rx="2.8"
            ry="1.8"
            fill="rgba(255,255,255,0.38)"
          />
          <line
            x1="11"
            y1="17"
            x2="11"
            y2="34"
            stroke="#9ca3af"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Desktop: chevron button ──────────────────────────────────────────────────

function DesktopChevronButton({
  direction,
  onClick,
  side,
  t,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  side: 'left' | 'right';
  t: ReturnType<typeof useTranslations>;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label={direction === 'left' ? t('prevSlide') : t('nextSlide')}
      style={{
        position: 'absolute',
        [side]: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 5,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0 20px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hov ? '#1a1a1a' : 'rgba(0,0,0,0.25)',
        fontSize: 64,
        lineHeight: 1,
        transition: 'color .2s',
        userSelect: 'none',
      }}
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  );
}
