"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  Clock,
  Users,
  Wifi,
  Calendar,
} from "lucide-react";

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
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function isoDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─────────────────────────────────────────────
// Media strip
// ─────────────────────────────────────────────

function MediaStrip({ workshop }: { workshop: Workshop }) {
  const [idx, setIdx] = useState(0);
  const media = [
    ...workshop.imageUrls.map((url) => ({ type: "image" as const, url })),
    ...workshop.videoUrls.map((url) => ({ type: "video" as const, url })),
    ...(workshop.coverUrl && !workshop.imageUrls.includes(workshop.coverUrl)
      ? [{ type: "image" as const, url: workshop.coverUrl }]
      : []),
  ];

  if (media.length === 0) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.04)" }}
      >
        <Calendar size={32} style={{ color: "rgba(0,0,0,0.15)" }} />
      </div>
    );
  }

  const current = media[idx];
  return (
    <div className="relative w-full h-full overflow-hidden border-l border-white/12">
      {current.type === "image" ? (
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
      {/* Thumbnails — no gradient, just thumbnails */}
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
                    ? "2px solid rgba(0,0,0,0.6)"
                    : "2px solid rgba(0,0,0,0.2)",
                opacity: i === idx ? 1 : 0.55,
              }}
            >
              {m.type === "image" ? (
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
// Always shows day name above the big number.
// Workshop cards: gold day name. Empty cards: muted.
// ─────────────────────────────────────────────

function DayBadge({
  day,
  dayOfWeek,
  hasWorkshop,
}: {
  day: number;
  dayOfWeek: string;
  hasWorkshop: boolean;
}) {
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center justify-center gap-0.5"
      style={{
        width: 80,
        borderRight: hasWorkshop
          ? "1px solid rgba(255,255,255,0.15)"
          : "1px solid rgba(0,0,0,0.1)",
        alignSelf: "stretch",
      }}
    >
      <span
        className="text-[10px] font-semibold tracking-widest uppercase"
        style={{
          fontFamily: "'Arial', sans-serif",
          color: hasWorkshop ? "rgba(196,168,120,0.85)" : "rgba(0,0,0,0.35)",
        }}
      >
        {dayOfWeek}
      </span>
      <span
        className="text-4xl font-bold leading-none"
        style={{
          fontFamily: "var(--font-text, Georgia, serif)",
          color: hasWorkshop ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.25)",
        }}
      >
        {day}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Empty day card
// ─────────────────────────────────────────────

function EmptyDayCard({ day, dayOfWeek }: { day: number; dayOfWeek: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="liquid-glass-green backdrop-blur-3xl w-full cursor-pointer"
      style={{
        height: expanded ? 140 : 60,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.12)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        transition: "height 0.4s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <DayBadge day={day} dayOfWeek={dayOfWeek} hasWorkshop={false} />

      <div
        className="flex-1 px-6"
        style={{
          opacity: expanded ? 1 : 0,
          transform: expanded ? "translateY(0)" : "translateY(5px)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        <p
          className="text-sm"
          style={{ color: "rgba(0,0,0,0.3)", fontStyle: "italic" }}
        >
          No workshop scheduled
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Pill perimeter point — used for particle gather
// ─────────────────────────────────────────────

// pillPoint — t is 0..1 fraction around the pill perimeter
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

  if (d < straight)
    return { x: cx - straight / 2 + d, y: cy - r };
  d -= straight;
  if (d < arc) {
    const a = -Math.PI / 2 + (d / arc) * Math.PI;
    return { x: cx + straight / 2 + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }
  d -= arc;
  if (d < straight)
    return { x: cx + straight / 2 - d, y: cy + r };
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
}: {
  day: number;
  dayOfWeek: string;
  workshop: Workshop;
}) {
  const seatsLeft = workshop.capacity - workshop.enrolledCount;
  const isFull = seatsLeft <= 0;

  // refs — avoid state updates in hot paths
  const cardRef        = useRef<HTMLDivElement>(null);
  const btnRef         = useRef<HTMLDivElement>(null);
  const spotlightRef   = useRef<HTMLDivElement>(null);
  const particleRefs   = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef         = useRef<number>(0);
  const orbitRef       = useRef(0);
  const hoveredRef     = useRef(false);
  const orbitReadyRef  = useRef(false);
  const gatherTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const btnRectCache   = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Stable particles seeded by workshop id
  const particles = useMemo(() => {
    let seed = workshop.id
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
    return Array.from({ length: 14 }, (_, i) => ({
      id: i,
      rx: rand() * 620 + 20,
      ry: rand() * 420 + 20,
      color: i % 3 === 0 ? "rgba(196,168,120,0.85)" : "rgba(255,255,255,0.55)",
      size: 1.5 + rand() * 2,
    }));
  }, [workshop.id]);

  // RAF loop — drives orbit after gather and spotlight
  useEffect(() => {
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (!orbitReadyRef.current || !hoveredRef.current || !btnRectCache.current) return;
      orbitRef.current += 0.00055; // very slow orbit
      particles.forEach((p, i) => {
        const el = particleRefs.current[i];
        if (!el) return;
        const pt = pillPoint(btnRectCache.current!, i / particles.length + orbitRef.current);
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
      y: bR.top  - cR.top,
      w: bR.width,
      h: bR.height,
    };
    hoveredRef.current    = true;
    orbitReadyRef.current = false;

    // Phase 1 — CSS transition gather
    const n = particles.length;
    particles.forEach((p, i) => {
      const el = particleRefs.current[i];
      if (!el) return;
      const pt = pillPoint(btnRectCache.current!, i / n);
      el.style.transition = `transform 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 20}ms, opacity 0.35s ease, box-shadow 0.35s ease`;
      el.style.transform  = `translate(${pt.x - p.size / 2}px, ${pt.y - p.size / 2}px)`;
      el.style.opacity    = "0.95";
      el.style.boxShadow  = `0 0 5px ${p.color}`;
    });

    // Phase 2 — hand off to RAF after last particle lands
    const lastDelay = 55 + particles.length * 20 + 180;
    gatherTimer.current = setTimeout(() => {
      if (!hoveredRef.current) return;
      particles.forEach((_, i) => {
        const el = particleRefs.current[i];
        if (el) el.style.transition = "none"; // RAF takes over
      });
      orbitReadyRef.current = true;
    }, lastDelay);
  }, [particles]);

  const handleMouseLeave = useCallback(() => {
    hoveredRef.current    = false;
    orbitReadyRef.current = false;
    clearTimeout(gatherTimer.current);

    // Fly back to rest with CSS transition
    particles.forEach((p, i) => {
      const el = particleRefs.current[i];
      if (!el) return;
      el.style.transition = `transform 0.7s cubic-bezier(0.4,0,0.2,1) ${i * 15}ms, opacity 0.4s ease, box-shadow 0.4s ease`;
      el.style.transform  = `translate(${p.rx}px, ${p.ry}px)`;
      el.style.opacity    = "0.5";
      el.style.boxShadow  = "none";
    });

    // Fade spotlight
    if (spotlightRef.current) {
      spotlightRef.current.style.background = "transparent";
    }
  }, [particles]);

  // Spotlight — update via direct DOM, zero re-renders
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlightRef.current || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spotlightRef.current.style.background =
      `radial-gradient(circle 70px at ${x}px ${y}px, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 55%, transparent 100%)`;
  }, []);

  return (
    <Link
      href={`/workshops/${workshop.slug}`}
      className="block"
      style={{ cursor: "default" }}
    >
      <div
        ref={cardRef}
        className="liquid-glass-green backdrop-blur-3xl w-full"
        style={{
          height: 460,
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
          flexDirection: "row",
          cursor: "default",
          position: "relative",
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {/* ── Spotlight overlay ── */}
        <div
          ref={spotlightRef}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 22,
            transition: "background 0.08s linear",
          }}
        />

        {/* ── Particles ── */}
        {particles.map((p, i) => (
          <div
            key={p.id}
            ref={(el) => { particleRefs.current[i] = el; }}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: p.color,
              pointerEvents: "none",
              zIndex: 21,
              left: 0,
              top: 0,
              transform: `translate(${p.rx}px, ${p.ry}px)`,
              opacity: 0.5,
            }}
          />
        ))}

        {/* Left: day badge */}
        <DayBadge day={day} dayOfWeek={dayOfWeek} hasWorkshop={true} />

        {/* Center: info */}
        <div
          className="flex flex-col justify-between py-6 px-7"
          style={{ width: 340, flexShrink: 0, overflow: "hidden", paddingBottom: 28 }}
        >
          <div>
            <h3
              className="text-xl font-bold leading-snug mb-2"
              style={{ fontFamily: "var(--font-text, Georgia, serif)", color: "rgba(255,255,255,0.95)" }}
            >
              {workshop.title}
            </h3>
            {workshop.description && (
              <p className="text-sm leading-relaxed line-clamp-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                {workshop.description}
              </p>
            )}
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
              <Clock size={12} />
              <span>{fmtTime(workshop.startTime)} – {fmtTime(workshop.endTime)}</span>
            </div>

            {workshop.isOnline ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                <Wifi size={12} /><span>Online</span>
              </div>
            ) : workshop.room ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                <MapPin size={12} />
                <span>{workshop.room.name}{workshop.room.location && ` · ${workshop.room.location}`}</span>
              </div>
            ) : null}

            <div className="flex items-center gap-2 text-xs" style={{ color: isFull ? "#f87171" : "rgba(255,255,255,0.6)" }}>
              <Users size={12} />
              <span>{isFull ? "Fully booked" : `${seatsLeft} seat${seatsLeft !== 1 ? "s" : ""} left`}</span>
            </div>

            {workshop.teacher && (
              <div className="flex items-center gap-2 mt-1">
                {workshop.teacher.photoUrl ? (
                  <img src={workshop.teacher.photoUrl} alt="" className="w-6 h-6 rounded-full object-cover"
                    style={{ border: "1.5px solid rgba(255,255,255,0.2)" }} />
                ) : (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)" }}>
                    {workshop.teacher.firstName[0]}{workshop.teacher.lastName[0]}
                  </div>
                )}
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {workshop.teacher.firstName} {workshop.teacher.lastName}
                </span>
              </div>
            )}
          </div>

          {/* Price + CTA */}
          <div className="flex items-center justify-between mt-5 pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <span className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-text, Georgia, serif)", color: "rgba(196,168,120,0.95)" }}>
              {workshop.currency} {workshop.price.toFixed(3)}
            </span>

            <div
              ref={btnRef}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
              style={{
                background: isFull ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                color: isFull ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.9)",
                cursor: isFull ? "default" : "pointer",
                position: "relative",
                zIndex: 30,
              }}
            >
              {isFull ? "Fully Booked" : "Register"}
              {!isFull && <ChevronRight size={12} />}
            </div>
          </div>
        </div>

        {/* Right: media */}
        <div className="flex-1 relative overflow-hidden">
          <MediaStrip workshop={workshop} />
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// Month selector — single liquid-glass pill
// containing all four month buttons
// ─────────────────────────────────────────────

function MonthSelector({
  options,
  activeYear,
  activeMonth,
  onChange,
}: {
  options: { year: number; month: number; hasWorkshops: boolean }[];
  activeYear: number;
  activeMonth: number;
  onChange: (year: number, month: number) => void;
}) {
  return (
    <div
      className="liquid-glass backdrop-blur-xl inline-flex rounded-2xl p-1.5 gap-1"
      style={{
        border: "1.5px solid rgba(255,255,255,0.12)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {options.map(({ year, month, hasWorkshops }) => {
        const isActive = year === activeYear && month === activeMonth;
        return (
          <button
            key={`${year}-${month}`}
            onClick={() => onChange(year, month)}
            disabled={!hasWorkshops && !isActive}
            className="px-5 py-2 rounded-xl text-sm font-medium tracking-wide transition-all"
            style={{
              background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
              boxShadow: isActive
                ? "inset 0 1px 3px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.1)"
                : "none",
              color: isActive
                ? "rgba(255,255,255,0.95)"
                : hasWorkshops
                  ? "rgba(255,255,255,0.75)"
                  : "rgba(255,255,255,0.3)",
              fontFamily: "var(--font-text, Georgia, serif)",
              cursor: !hasWorkshops && !isActive ? "default" : "pointer",
              transform: isActive ? "translateY(0.5px)" : "translateY(0)",
            }}
          >
            {MONTH_NAMES[month]}
            {hasWorkshops && (
              <span
                className="ml-1.5 text-[9px]"
                style={{
                  color: isActive ? "rgba(196,168,120,0.8)" : "rgba(196,168,120,0.4)",
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
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const workshopByDate = useMemo(() => {
    const map = new Map<string, Workshop>();
    for (const w of workshops) {
      const d = new Date(w.eventDate);
      const key = isoDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      map.set(key, w);
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
        workshopByDate.has(isoDateStr(y, m, j + 1)),
      ).some(Boolean);
      opts.push({ year: y, month: m, hasWorkshops });
    }
    return opts;
  }, [workshopByDate]);

  const days = useMemo(() => {
    const count = getDaysInMonth(viewYear, viewMonth);
    return Array.from({ length: count }, (_, i) => {
      const day = i + 1;
      const key = isoDateStr(viewYear, viewMonth, day);
      const dow = new Date(viewYear, viewMonth, day).getDay();
      return {
        day,
        dayOfWeek: DAY_NAMES[dow],
        workshop: workshopByDate.get(key) ?? null,
      };
    });
  }, [viewYear, viewMonth, workshopByDate]);

  const workshopCount = days.filter((d) => d.workshop).length;

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: "#041703" }}>
      <div className="max-w-4xl mx-auto">
        {/* Month selector + label — single row */}
        <div className="flex items-baseline gap-6 mb-6 justify-between pt-25">
          <div className="flex items-baseline gap-2">
            <h2
              className="text-2xl font-semibold"
              style={{
                fontFamily: "var(--font-text, Georgia, serif)",
                color: "rgba(222,194,158,0.85)",
              }}
            >
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <span
              className="text-sm"
              style={{
                color: "rgba(196,168,120,0.4)",
                fontFamily: "'Arial', sans-serif",
              }}
            >
              {workshopCount === 0
                ? "No workshops this month"
                : `${workshopCount} workshop${workshopCount !== 1 ? "s" : ""}`}
            </span>
          </div>
          <MonthSelector
            options={monthOptions}
            activeYear={viewYear}
            activeMonth={viewMonth}
            onChange={(y, m) => {
              setViewYear(y);
              setViewMonth(m);
            }}
          />
        </div>

        {/* Stacked day cards */}
        <div className="flex flex-col">
          {days.map(({ day, dayOfWeek, workshop }, idx) => {
            const zIndex = idx + 1;

            // The card BELOW a workshop card must not overlap its price row.
            // Workshop cards are 460px tall.
            // Empty cards are 60px collapsed.
            // We pull empty cards up by 42px (peek effect).
            // The card AFTER a workshop card gets 0 negative margin so it
            // sits cleanly below — no overlap on price/register.
            const prevHasWorkshop = idx > 0 && days[idx - 1].workshop !== null;
            const marginTop =
              idx === 0
                ? 0
                : prevHasWorkshop
                  ? -8 // small gap after a workshop card — completely clear
                  : workshop
                    ? -8 // workshop card pulls up slightly behind the one above
                    : -42; // empty cards peek tightly

            return (
              <div
                key={day}
                style={{
                  position: "relative",
                  zIndex,
                  marginTop,
                  transition: "margin 0.3s ease",
                }}
              >
                {workshop ? (
                  <WorkshopDayCard
                    day={day}
                    dayOfWeek={dayOfWeek}
                    workshop={workshop}
                  />
                ) : (
                  <EmptyDayCard day={day} dayOfWeek={dayOfWeek} />
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
