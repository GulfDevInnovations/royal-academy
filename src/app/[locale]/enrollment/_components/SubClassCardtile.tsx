'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { SubClassCard } from '@/lib/actions/classes';
import { Clock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { BookingFunnel } from './BookingFunnel';

const CLASS_ACCENT: Record<string, string> = {
  Music: '#FFE499',
  'Yoga & Wellness': '#86EFCB',
  Art: '#FDB98A',
  Dance: '#E4C1FF',
  Ballet: '#FBCFE8',
  default: '#E2E8F0',
};

const CLASS_GLOW: Record<string, string> = {
  Music: 'rgba(255,228,153,0.22)',
  'Yoga & Wellness': 'rgba(134,239,203,0.22)',
  Art: 'rgba(253,185,138,0.22)',
  Dance: 'rgba(228,193,255,0.22)',
  Ballet: 'rgba(251,207,232,0.22)',
  default: 'rgba(226,232,240,0.22)',
};

const DAY_ORDER = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
];

interface SubClassCardTileProps {
  subClass: SubClassCard;
}

export function SubClassCardTile({ subClass }: SubClassCardTileProps) {
  const t = useTranslations('enrollment');
  const accent = CLASS_ACCENT[subClass.class.name] ?? CLASS_ACCENT.default;
  const glow = CLASS_GLOW[subClass.class.name] ?? CLASS_GLOW.default;
  const hasTeachers = subClass.teachers.length > 0;
  const [enrollOpen, setEnrollOpen] = useState(false);

  const lowestPrice = subClass.oncePriceMonthly ?? subClass.twicePriceMonthly ?? null;
  const hasProgram = !!subClass.programId;
  const detailHref = hasProgram
    ? `/enrollment/${subClass.id}?program=${subClass.programId}`
    : `/enrollment/${subClass.id}`;

  const DAY_LABELS: Record<string, string> = {
    MONDAY: t('cal.mon'),
    TUESDAY: t('cal.tue'),
    WEDNESDAY: t('cal.wed'),
    THURSDAY: t('cal.thu'),
    FRIDAY: t('cal.fri'),
    SATURDAY: t('cal.sat'),
    SUNDAY: t('cal.sun'),
  };

  // CSS variables set on the card let group-hover Tailwind classes reference
  // the dynamic accent color without React state re-renders.
  const cardStyle = {
    background: 'linear-gradient(145deg, #1e1a14, #110f0c)',
    '--ca': accent,       // full accent
    '--ca-bg': `${accent}22`, // subtle tint for button resting state
    '--ca-bd': `${accent}55`, // border at rest
  } as React.CSSProperties;

  // Shared button base classes — both buttons start identical.
  // group-hover variants diverge: Enroll Now → brand orange, Open Class → full accent.
  const btnBase =
    'px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border-[1.5px] border-solid transition-colors duration-300';
  const btnRest =
    'bg-[var(--ca-bg)] text-[var(--ca)] [border-color:var(--ca-bd)]';
  const btnEnrollHover =
    'group-hover:bg-[#ff751f] group-hover:text-white group-hover:[border-color:#ff751f]';
  const btnOpenHover =
    'group-hover:bg-[var(--ca)] group-hover:text-[#110f0c] group-hover:[border-color:var(--ca)]';

  return (
    <>
      {/* ── Card ── */}
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative rounded-3xl overflow-hidden border border-royal-cream/10 h-full flex flex-col group"
        style={cardStyle}
      >
        {/* Glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${glow}, transparent 70%)` }}
        />

        {/* Shimmer border on hover */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1.5px ${accent}50` }}
        />

        {/* Cover image / video / placeholder */}
        <Link href={detailHref} className="block relative h-56 sm:h-60 lg:h-64 overflow-hidden shrink-0">
          {subClass.mediaUrl && subClass.mediaKind === 'video' ? (
            <video
              src={subClass.mediaUrl}
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              style={{ background: '#0d0b08' }}
              autoPlay muted loop playsInline
            />
          ) : subClass.mediaUrl ?? subClass.coverUrl ? (
            <img
              src={(subClass.mediaUrl ?? subClass.coverUrl)!}
              alt={subClass.name}
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              style={{ background: '#0d0b08' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accent}30, ${accent}08)` }}
            >
              <div className="relative flex flex-col items-center justify-center gap-2">
                <div
                  className="text-3xl sm:text-4xl font-extrabold font-goudy text-center px-4 leading-tight tracking-wide drop-shadow"
                  style={{ color: accent, opacity: 0.9 }}
                >
                  {subClass.class.name}
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ color: accent }}>
                  <svg width="100" height="100" viewBox="0 0 80 80" fill="none" opacity="0.1">
                    <circle cx="40" cy="40" r="38" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="0.5" />
                    <path d="M40 2 L40 78 M2 40 L78 40" stroke="currentColor" strokeWidth="0.5" />
                    <rect x="28" y="28" width="24" height="24" stroke="currentColor" strokeWidth="0.5" transform="rotate(45 40 40)" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-[#1e1a14] to-transparent" />
        </Link>

        {/* ── Content ── */}
        <div className="p-6 lg:p-7 flex flex-col flex-1">

          {/* Class category */}
          <p
            className="text-sm font-extrabold uppercase tracking-[0.18em] mb-2"
            style={{ color: accent }}
          >
            {subClass.class.name}
          </p>

          {/* Title row: name + "Open Class" button */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <Link href={detailHref} className="flex-1 min-w-0">
              <h3 className="text-2xl lg:text-3xl font-bold text-royal-cream font-goudy leading-tight group-hover:text-royal-gold transition-colors duration-300">
                {subClass.name}
              </h3>
            </Link>

            {/* Open Class — lives here in the details area */}
            <Link
              href={detailHref}
              className={`${btnBase} ${btnRest} ${btnOpenHover} shrink-0 self-start mt-1`}
            >
              {t('card.openClass')}
            </Link>
          </div>

          {/* Program name */}
          {hasProgram && subClass.programName && (
            <p
              className="text-xl lg:text-2xl font-semibold mb-3 mt-1 leading-tight"
              style={{ color: `${accent}dd` }}
            >
              {subClass.programName}
            </p>
          )}

          {/* ── Packages with schedule slots ── */}
          {hasTeachers && (
            <div className="mt-3 mb-4 space-y-2">
              {subClass.teachers.slice(0, 3).map((teacher, i) => {
                const sortedSlots = [...teacher.schedules].sort((a, b) => {
                  const dd = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
                  return dd !== 0 ? dd : a.startTime.localeCompare(b.startTime);
                });
                return (
                  <div key={teacher.id} className="flex items-start gap-2">
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 mt-0.5"
                      style={{
                        background: `${accent}20`,
                        color: accent,
                        border: `1px solid ${accent}40`,
                      }}
                    >
                      P{i + 1}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {sortedSlots.length > 0 ? (
                        sortedSlots.map((slot, j) => (
                          <span
                            key={j}
                            className="text-[10px] px-2 py-1 rounded-lg"
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              color: 'rgba(255,255,255,0.55)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            {DAY_LABELS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-royal-cream/30 italic">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {subClass.teachers.length > 3 && (
                <p className="text-xs text-royal-cream/30 pl-1">
                  +{subClass.teachers.length - 3} {t('card.instructors')}
                </p>
              )}
            </div>
          )}

          {/* Attribute pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            {subClass.level && (
              <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-royal-cream/60">
                {subClass.level}
              </span>
            )}
            {subClass.ageGroup && (
              <span className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-royal-cream/60">
                {subClass.ageGroup}
              </span>
            )}
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-royal-cream/60">
              <Clock className="w-3 h-3" />
              {subClass.durationMinutes}min
            </span>
          </div>

          <div className="flex-1" />

          {/* Divider */}
          <div
            className="h-px mb-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `linear-gradient(90deg, ${accent}50, transparent)` }}
          />
          <div className="h-px mb-5 bg-white/6 group-hover:hidden" />

          {/* Price + Enroll Now */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              {lowestPrice ? (
                <>
                  <p className="text-xs text-royal-cream/40 uppercase tracking-wider mb-0.5">
                    {t('card.from')}
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold font-goudy" style={{ color: accent }}>
                    {lowestPrice}{' '}
                    <span className="text-sm font-normal text-royal-cream/40">
                      {subClass.currency}{t('card.perMonth')}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-royal-cream/40 uppercase tracking-wider mb-0.5">
                    {t('card.trial')}
                  </p>
                  <p className="text-2xl lg:text-3xl font-bold font-goudy" style={{ color: accent }}>
                    {subClass.trialPrice}{' '}
                    <span className="text-sm font-normal text-royal-cream/40">
                      {subClass.currency}
                    </span>
                  </p>
                </>
              )}
            </div>

            {/* Enroll Now — turns brand orange on card hover */}
            <button
              onClick={() => setEnrollOpen(true)}
              className={`${btnBase} ${btnRest} ${btnEnrollHover} shrink-0 active:scale-95`}
            >
              {t('card.enrollNow')}
            </button>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 rounded-b-3xl"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />
      </motion.div>

      {/* ── Booking funnel modal ── */}
      <AnimatePresence>
        {enrollOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setEnrollOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed z-50 inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </div>
              <BookingFunnel
                subClass={subClass}
                compact
                onClose={() => setEnrollOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
