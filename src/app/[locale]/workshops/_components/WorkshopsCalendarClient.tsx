'use client';

import {
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Wifi,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Workshop {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  imageUrls: string[];
  videoUrls: string[];
  eventDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  enrolledCount: number;
  price: number;
  currency: string;
  isOnline: boolean;
  teacher: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  } | null;
  room: { name: string; location: string | null } | null;
}

interface Props {
  workshops: Workshop[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function fmtTime(t: string) {
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isoDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────
// Media strip
// ─────────────────────────────────────────────

function MediaStrip({ workshop }: { workshop: Workshop }) {
  const [idx, setIdx] = useState(0);
  const media = [
    ...workshop.imageUrls.map((url) => ({ type: 'image' as const, url })),
    ...workshop.videoUrls.map((url) => ({ type: 'video' as const, url })),
    ...(workshop.coverUrl && !workshop.imageUrls.includes(workshop.coverUrl)
      ? [{ type: 'image' as const, url: workshop.coverUrl }]
      : []),
  ];

  if (media.length === 0) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.04)' }}
      >
        <Calendar size={32} style={{ color: 'rgba(0,0,0,0.15)' }} />
      </div>
    );
  }

  const current = media[idx];
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ borderLeft: '1px solid rgba(0,0,0,0.08)' }}
    >
      {current.type === 'image' ? (
        <img
          src={current.url}
          alt={workshop.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          src={current.url}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      )}
      {media.length > 1 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {media.map((m, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                setIdx(i);
              }}
              className="rounded-md overflow-hidden transition-all"
              style={{
                width: 64,
                height: 48,
                border:
                  i === idx
                    ? '2px solid rgba(255,255,255,0.6)'
                    : '2px solid rgba(255,255,255,0.2)',
                opacity: i === idx ? 1 : 0.55,
              }}
            >
              {m.type === 'image' ? (
                <img
                  src={m.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <video src={m.url} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Day badge — left column inside each card
// ─────────────────────────────────────────────

function DayBadge({
  day,
  dayOfWeek,
  hasWorkshop,
  isToday,
}: {
  day: number;
  dayOfWeek: string;
  hasWorkshop: boolean;
  isToday: boolean;
}) {
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center justify-center gap-0.5"
      style={{
        width: 80,
        borderRight: hasWorkshop
          ? '1px solid rgba(0,0,0,0.1)'
          : '1px solid rgba(0,0,0,0.06)',
        alignSelf: 'stretch',
      }}
    >
      <span
        className="text-[10px] font-semibold tracking-widest uppercase"
        style={{
          fontFamily: "'Arial', sans-serif",
          color: hasWorkshop ? '#ff751f' : 'rgba(0,0,0,0.25)',
        }}
      >
        {dayOfWeek}
      </span>
      <span
        className="text-4xl font-bold leading-none"
        style={{
          fontFamily: 'var(--font-text, Georgia, serif)',
          color: hasWorkshop
            ? '#111111'
            : 'rgba(0,0,0,0.18)',
        }}
      >
        {day}
      </span>
      {isToday && (
        <span
          className="text-[8px] font-bold tracking-widest uppercase mt-1"
          style={{
            color: '#ff751f',
            background: 'rgba(255,117,31,0.15)',
            border: '1px solid rgba(255,117,31,0.35)',
            borderRadius: 4,
            padding: '1px 5px',
            lineHeight: 1.6,
          }}
        >
          Today
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Empty day card
// ─────────────────────────────────────────────

function EmptyDayCard({
  day,
  dayOfWeek,
  isToday,
}: {
  day: number;
  dayOfWeek: string;
  isToday: boolean;
}) {
  const [expanded, setExpanded] = useState(isToday);
  const t = useTranslations('workshops');

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="backdrop-blur-xl w-full cursor-pointer"
      style={{
        height: expanded ? 140 : 60,
        borderRadius: 16,
        overflow: 'hidden',
        background: '#ffffff',
        border: isToday
          ? '1px solid rgba(255,117,31,0.3)'
          : '1px solid rgba(0,0,0,0.08)',
        boxShadow: isToday
          ? '0 0 0 1px rgba(255,117,31,0.1)'
          : '0 1px 3px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <DayBadge day={day} dayOfWeek={dayOfWeek} hasWorkshop={false} isToday={isToday} />

      <div
        className="flex-1 px-6"
        style={{
          opacity: expanded ? 1 : 0,
          transform: expanded ? 'translateY(0)' : 'translateY(5px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        <p
          className="text-sm"
          style={{ color: 'rgba(0,0,0,0.3)', fontStyle: 'italic' }}
        >
          {t('noWorkshopScheduled')}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Pill perimeter point — used for particle gather
// ─────────────────────────────────────────────

function pillPoint(
  rect: { x: number; y: number; w: number; h: number },
  t: number,
): { x: number; y: number } {
  const { x, y, w, h } = rect;
  const r = h / 2;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const straight = Math.max(0, w - 2 * r);
  const arc = Math.PI * r;
  const perimeter = 2 * straight + 2 * arc;
  let d = (((t % 1) + 1) % 1) * perimeter;

  if (d < straight) return { x: cx - straight / 2 + d, y: cy - r };
  d -= straight;
  if (d < arc) {
    const a = -Math.PI / 2 + (d / arc) * Math.PI;
    return { x: cx + straight / 2 + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  d -= arc;
  if (d < straight) return { x: cx + straight / 2 - d, y: cy + r };
  d -= straight;
  const a = Math.PI / 2 + (d / arc) * Math.PI;
  return { x: cx - straight / 2 + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// ─────────────────────────────────────────────
// Workshop day card
// ─────────────────────────────────────────────

function WorkshopDayCard({
  day,
  dayOfWeek,
  workshop,
  isToday,
}: {
  day: number;
  dayOfWeek: string;
  workshop: Workshop;
  isToday: boolean;
}) {
  const t = useTranslations('workshops');
  const seatsLeft = workshop.capacity - workshop.enrolledCount;
  const isFull = seatsLeft <= 0;

  const cardRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const orbitRef = useRef(0);
  const hoveredRef = useRef(false);
  const orbitReadyRef = useRef(false);
  const gatherTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const btnRectCache = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const particles = useMemo(() => {
    let seed = workshop.id
      .split('')
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      rx: rand() * 620 + 20,
      ry: rand() * 420 + 20,
      color: i % 3 === 0 ? 'rgba(255,117,31,0.9)' : 'rgba(0,0,0,0.25)',
      size: 1.5 + rand() * 2,
    }));
  }, [workshop.id]);

  useEffect(() => {
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (
        !orbitReadyRef.current ||
        !hoveredRef.current ||
        !btnRectCache.current
      )
        return;
      orbitRef.current += 0.00055;
      particles.forEach((p, i) => {
        const el = particleRefs.current[i];
        if (!el) return;
        const pt = pillPoint(
          btnRectCache.current!,
          i / particles.length + orbitRef.current,
        );
        el.style.transform = `translate(${pt.x - p.size / 2}px, ${pt.y - p.size / 2}px)`;
      });
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [particles]);

  const handleMouseEnter = useCallback(() => {
    if (!cardRef.current || !btnRef.current) return;
    const cR = cardRef.current.getBoundingClientRect();
    const bR = btnRef.current.getBoundingClientRect();
    btnRectCache.current = {
      x: bR.left - cR.left,
      y: bR.top - cR.top,
      w: bR.width,
      h: bR.height,
    };
    hoveredRef.current = true;
    orbitReadyRef.current = false;

    const n = particles.length;
    particles.forEach((p, i) => {
      const el = particleRefs.current[i];
      if (!el) return;
      const pt = pillPoint(btnRectCache.current!, i / n);
      el.style.transition = `transform 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 20}ms, opacity 0.35s ease, box-shadow 0.35s ease`;
      el.style.transform = `translate(${pt.x - p.size / 2}px, ${pt.y - p.size / 2}px)`;
      el.style.opacity = '0.95';
      el.style.boxShadow = `0 0 5px ${p.color}`;
    });

    const lastDelay = 55 + particles.length * 20 + 180;
    gatherTimer.current = setTimeout(() => {
      if (!hoveredRef.current) return;
      particles.forEach((_, i) => {
        const el = particleRefs.current[i];
        if (el) el.style.transition = 'none';
      });
      orbitReadyRef.current = true;
    }, lastDelay);
  }, [particles]);

  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = false;
    orbitReadyRef.current = false;
    clearTimeout(gatherTimer.current);

    particles.forEach((p, i) => {
      const el = particleRefs.current[i];
      if (!el) return;
      el.style.transition = `transform 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 15}ms, opacity 0.4s ease, box-shadow 0.4s ease`;
      el.style.transform = `translate(${p.rx}px, ${p.ry}px)`;
      el.style.opacity = '0.5';
      el.style.boxShadow = 'none';
    });

    if (spotlightRef.current) {
      spotlightRef.current.style.background = 'transparent';
    }
  }, [particles]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlightRef.current || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spotlightRef.current.style.background = `radial-gradient(circle 70px at ${x}px ${y}px, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.01) 55%, transparent 100%)`;
  }, []);

  return (
    <Link
      href={`/workshops/${workshop.slug}`}
      className="block"
      style={{ cursor: 'default' }}
    >
      <div
        ref={cardRef}
        className="backdrop-blur-2xl w-full"
        style={{
          height: 460,
          borderRadius: 16,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          cursor: 'default',
          position: 'relative',
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.1)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {/* ── Spotlight overlay ── */}
        <div
          ref={spotlightRef}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 22,
            transition: 'background 0.08s linear',
          }}
        />

        {/* ── Particles ── */}
        {particles.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => {
              particleRefs.current[i] = el;
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              pointerEvents: 'none',
              zIndex: 21,
              left: 0,
              top: 0,
              transform: `translate(${p.rx}px, ${p.ry}px)`,
              opacity: 0.5,
            }}
          />
        ))}

        {/* Left: day badge */}
        <DayBadge day={day} dayOfWeek={dayOfWeek} hasWorkshop={true} isToday={isToday} />

        {/* Center: info */}
        <div
          className="flex flex-col justify-between py-6 px-4 sm:px-7"
          style={{
            width: 'min(340px, calc(100% - 80px))',
            flexShrink: 0,
            overflow: 'hidden',
            paddingBottom: 28,
          }}
        >
          <div>
            <h3
              className="text-xl font-bold leading-snug mb-2"
              style={{
                fontFamily: 'var(--font-text, Georgia, serif)',
                color: '#111111',
              }}
            >
              {workshop.title}
            </h3>
            {workshop.description && (
              <p
                className="text-sm leading-relaxed line-clamp-3"
                style={{ color: 'rgba(0,0,0,0.5)' }}
              >
                {workshop.description}
              </p>
            )}
          </div>

          <div className="space-y-2 mt-4">
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'rgba(0,0,0,0.5)' }}
            >
              <Clock size={12} />
              <span>
                {fmtTime(workshop.startTime)} – {fmtTime(workshop.endTime)}
              </span>
            </div>

            {workshop.isOnline ? (
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: 'rgba(0,0,0,0.5)' }}
              >
                <Wifi size={12} />
                <span>{t('online')}</span>
              </div>
            ) : workshop.room ? (
              <div
                className="flex items-center gap-2 text-xs"
                style={{ color: 'rgba(0,0,0,0.5)' }}
              >
                <MapPin size={12} />
                <span>
                  {workshop.room.name}
                  {workshop.room.location && ` · ${workshop.room.location}`}
                </span>
              </div>
            ) : null}

            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: isFull ? '#f87171' : 'rgba(0,0,0,0.5)' }}
            >
              <Users size={12} />
              <span>
                {isFull
                  ? t('fullyBooked')
                  : seatsLeft === 1
                    ? t('seatLeft')
                    : t('seatsLeft', { count: seatsLeft })}
              </span>
            </div>

          </div>

          {/* Price + CTA */}
          <div
            className="flex items-center justify-between mt-5 pt-4"
            style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}
          >
            <span
              className="text-2xl font-bold"
              style={{
                fontFamily: 'var(--font-text, Georgia, serif)',
                color: '#ff751f',
              }}
            >
              {workshop.currency} {workshop.price.toFixed(3)}
            </span>

            <div
              ref={btnRef}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
              style={{
                background: isFull
                  ? 'rgba(0,0,0,0.04)'
                  : 'rgba(255,117,31,0.12)',
                border: isFull
                  ? '1.5px solid rgba(0,0,0,0.1)'
                  : '1.5px solid rgba(255,117,31,0.35)',
                color: isFull ? 'rgba(0,0,0,0.3)' : '#ff751f',
                cursor: isFull ? 'default' : 'pointer',
                position: 'relative',
                zIndex: 30,
              }}
            >
              {isFull ? t('fullyBookedBtn') : t('register')}
              {!isFull && <ChevronRight size={12} />}
            </div>
          </div>
        </div>

        {/* Right: media — hidden on mobile */}
        <div className="hidden sm:block flex-1 relative overflow-hidden">
          <MediaStrip workshop={workshop} />
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Month selector
// ─────────────────────────────────────────────

function MonthSelector({
  options,
  activeYear,
  activeMonth,
  onChange,
  monthNames,
}: {
  options: { year: number; month: number; hasWorkshops: boolean }[];
  activeYear: number;
  activeMonth: number;
  onChange: (year: number, month: number) => void;
  monthNames: string[];
}) {
  return (
    <div
      className="backdrop-blur-xl inline-flex rounded-2xl p-1.5 gap-1"
      style={{
        background: '#ffffff',
        border: '1.5px solid rgba(0,0,0,0.1)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}
    >
      {options.map(({ year, month, hasWorkshops }) => {
        const isActive = year === activeYear && month === activeMonth;
        return (
          <button
            key={`${year}-${month}`}
            onClick={() => onChange(year, month)}
            disabled={!hasWorkshops && !isActive}
            className="px-3 sm:px-5 py-2 rounded-xl text-sm font-medium tracking-wide transition-all whitespace-nowrap"
            style={{
              background: isActive ? 'rgba(255,117,31,0.15)' : 'transparent',
              boxShadow: isActive
                ? 'inset 0 1px 3px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,117,31,0.2)'
                : 'none',
              color: isActive
                ? '#ff751f'
                : hasWorkshops
                  ? 'rgba(0,0,0,0.65)'
                  : 'rgba(0,0,0,0.25)',
              fontFamily: 'var(--font-text, Georgia, serif)',
              cursor: !hasWorkshops && !isActive ? 'default' : 'pointer',
              transform: isActive ? 'translateY(0.5px)' : 'translateY(0)',
            }}
          >
            {monthNames[month]}
            {hasWorkshops && (
              <span
                className="ml-1.5 text-[9px]"
                style={{
                  color: isActive
                    ? 'rgba(255,117,31,0.9)'
                    : 'rgba(255,117,31,0.4)',
                }}
              >
                ✦
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

export default function WorkshopsCalendarClient({ workshops }: Props) {
  const t = useTranslations('workshops');
  const locale = useLocale();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { month: 'long' }).format(
          new Date(2024, i, 1),
        ),
      ),
    [locale],
  );

  const dayNames = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(
          new Date(2024, 0, 7 + i),
        ),
      ),
    [locale],
  );

  const workshopsByDate = useMemo(() => {
    const map = new Map<string, Workshop[]>();
    for (const w of workshops) {
      const d = new Date(w.eventDate);
      const key = isoDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      const existing = map.get(key) ?? [];
      existing.push(w);
      map.set(key, existing);
    }
    for (const ws of map.values()) {
      ws.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [workshops]);

  const monthOptions = useMemo(() => {
    const opts = [];
    const base = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let i = 0; i < 4; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const cnt = getDaysInMonth(y, m);
      const hasWorkshops = Array.from({ length: cnt }, (_, j) =>
        workshopsByDate.has(isoDateStr(y, m, j + 1)),
      ).some(Boolean);
      opts.push({ year: y, month: m, hasWorkshops });
    }
    return opts;
  }, [workshopsByDate]);

  const todayStr = isoDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const days = useMemo(() => {
    const count = getDaysInMonth(viewYear, viewMonth);
    return Array.from({ length: count }, (_, i) => {
      const day = i + 1;
      const key = isoDateStr(viewYear, viewMonth, day);
      const dow = new Date(viewYear, viewMonth, day).getDay();
      return {
        day,
        dayOfWeek: dayNames[dow],
        workshops: workshopsByDate.get(key) ?? [],
        isToday: key === todayStr,
      };
    });
  }, [viewYear, viewMonth, workshopsByDate, dayNames, todayStr]);

  const workshopCount = days.reduce((sum, d) => sum + d.workshops.length, 0);

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-12 overflow-x-hidden"
      style={{ background: '#f3f4f6' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Month selector + label — centered */}
        <div className="flex flex-col items-center gap-3 mb-6 pt-0">
          <div className="flex items-baseline gap-2">
            <h2
              className="text-2xl font-semibold"
              style={{
                fontFamily: 'var(--font-text, Georgia, serif)',
                color: '#111111',
              }}
            >
              {monthNames[viewMonth]} {viewYear}
            </h2>
            <span
              className="text-sm"
              style={{
                color: '#ff751f',
                fontFamily: "'Arial', sans-serif",
              }}
            >
              {workshopCount === 0
                ? t('noWorkshopsThisMonth')
                : workshopCount === 1
                  ? t('workshop')
                  : t('workshops', { count: workshopCount })}
            </span>
          </div>
          <div className="overflow-x-auto pb-0.5">
            <MonthSelector
              options={monthOptions}
              activeYear={viewYear}
              activeMonth={viewMonth}
              onChange={(y, m) => {
                setViewYear(y);
                setViewMonth(m);
              }}
              monthNames={monthNames}
            />
          </div>
        </div>

        {/* Stacked day cards */}
        <div className="flex flex-col">
          {days.map(({ day, dayOfWeek, workshops, isToday }, idx) => {
            const zIndex = idx + 1;

            const prevHasWorkshop = idx > 0 && days[idx - 1].workshops.length > 0;
            const marginTop =
              idx === 0 ? 0 : prevHasWorkshop ? -8 : workshops.length > 0 ? -8 : -10;

            return (
              <div
                key={day}
                style={{
                  position: 'relative',
                  zIndex,
                  marginTop,
                  transition: 'margin 0.3s ease',
                }}
              >
                {workshops.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {workshops.map((workshop) => (
                      <WorkshopDayCard
                        key={workshop.id}
                        day={day}
                        dayOfWeek={dayOfWeek}
                        workshop={workshop}
                        isToday={isToday}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyDayCard day={day} dayOfWeek={dayOfWeek} isToday={isToday} />
                )}
              </div>
            );
          })}
        </div>

        <div className="h-24" />
      </div>
    </div>
  );
}
