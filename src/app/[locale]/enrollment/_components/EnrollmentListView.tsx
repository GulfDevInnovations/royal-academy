'use client';

import { SubClassCard } from '@/lib/actions/classes';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BookingFunnel } from './BookingFunnel';

const CLASS_ACCENT: Record<string, string> = {
  Music: '#FFE499',
  'Yoga & Wellness': '#86EFCB',
  Art: '#FDB98A',
  Dance: '#E4C1FF',
  Ballet: '#FBCFE8',
  default: '#E2E8F0',
};

const CLASS_ICON: Record<string, string> = {
  Music: '🎵',
  'Yoga & Wellness': '🌿',
  Art: '🎨',
  Dance: '💃',
  Ballet: '🩰',
  default: '✦',
};

const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

// ─────────────────────────────────────────────
// Individual row
// ─────────────────────────────────────────────
function ListRow({ subClass }: { subClass: SubClassCard }) {
  const t = useTranslations('enrollment');
  const accent = CLASS_ACCENT[subClass.class.name] ?? CLASS_ACCENT.default;
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const hasProgram = !!subClass.programId;
  const detailHref = hasProgram
    ? `/enrollment/${subClass.id}?program=${subClass.programId}`
    : `/enrollment/${subClass.id}`;
  const lowestPrice = subClass.oncePriceMonthly ?? subClass.twicePriceMonthly ?? null;

  const DAY_LABELS: Record<string, string> = {
    MONDAY: t('cal.mon'),
    TUESDAY: t('cal.tue'),
    WEDNESDAY: t('cal.wed'),
    THURSDAY: t('cal.thu'),
    FRIDAY: t('cal.fri'),
    SATURDAY: t('cal.sat'),
    SUNDAY: t('cal.sun'),
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-6 px-5 lg:px-7 py-5 rounded-2xl border transition-all duration-300 overflow-hidden"
        style={{
          background: hovered
            ? `linear-gradient(135deg, ${accent}12, rgba(17,15,12,0.95))`
            : 'linear-gradient(135deg, rgba(30,26,20,0.7), rgba(17,15,12,0.85))',
          borderColor: hovered ? `${accent}55` : 'rgba(255,255,255,0.07)',
        }}
      >
        {/* Left accent bar */}
        <motion.div
          animate={{ opacity: hovered ? 1 : 0, scaleY: hovered ? 1 : 0.4 }}
          transition={{ duration: 0.25 }}
          className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full origin-center"
          style={{ background: `linear-gradient(180deg, transparent, ${accent}, transparent)` }}
        />

        {/* ── Info column ── */}
        <div className="flex-1 min-w-0 pl-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-block text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-0.5 rounded-full"
              style={{
                background: `${accent}18`,
                color: accent,
                border: `1px solid ${accent}30`,
              }}
            >
              {subClass.class.name}
            </span>
          </div>

          <h3
            className="text-xl lg:text-2xl font-bold font-goudy leading-tight transition-colors duration-300 truncate"
            style={{ color: hovered ? accent : 'rgba(255,255,255,0.92)' }}
          >
            {subClass.name}
          </h3>

          {hasProgram && subClass.programName && (
            <p
              className="text-sm font-semibold mt-0.5 leading-tight"
              style={{ color: `${accent}bb` }}
            >
              {subClass.programName}
            </p>
          )}

          {/* Attribute pills */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {subClass.level && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/55">
                {subClass.level}
              </span>
            )}
            {subClass.ageGroup && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/55">
                {subClass.ageGroup}
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/55">
              <Clock className="w-3 h-3" />
              {subClass.durationMinutes}min
            </span>
          </div>
        </div>

        {/* ── Schedules column ── */}
        {subClass.teachers.length > 0 && (
          <div className="shrink-0 space-y-2 lg:w-56 xl:w-64">
            {subClass.teachers.slice(0, 3).map((teacher, i) => {
              const sortedSlots = [...teacher.schedules].sort((a, b) => {
                const dd = DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
                return dd !== 0 ? dd : a.startTime.localeCompare(b.startTime);
              });
              return (
                <div key={teacher.id} className="flex items-start gap-2">
                  <span
                    className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
                    style={{
                      background: `${accent}18`,
                      color: accent,
                      border: `1px solid ${accent}35`,
                    }}
                  >
                    P{i + 1}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {sortedSlots.length > 0 ? (
                      sortedSlots.slice(0, 3).map((slot, j) => (
                        <span
                          key={j}
                          className="text-[10px] px-2 py-1 rounded-lg whitespace-nowrap"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.5)',
                            border: '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {DAY_LABELS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-white/25 italic">—</span>
                    )}
                  </div>
                </div>
              );
            })}
            {subClass.teachers.length > 3 && (
              <p className="text-xs text-white/30 pl-1">
                +{subClass.teachers.length - 3} {t('card.instructors')}
              </p>
            )}
          </div>
        )}

        {/* ── Price column ── */}
        <div className="shrink-0 lg:w-36 xl:w-40">
          {lowestPrice ? (
            <>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                {t('card.from')}
              </p>
              <p className="text-xl lg:text-2xl font-bold font-goudy leading-none" style={{ color: accent }}>
                {lowestPrice}
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">
                {subClass.currency}{t('card.perMonth')}
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">
                {t('card.trial')}
              </p>
              <p className="text-xl lg:text-2xl font-bold font-goudy leading-none" style={{ color: accent }}>
                {subClass.trialPrice}
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">
                {subClass.currency}
              </p>
            </>
          )}
        </div>

        {/* ── Action buttons ── */}
        <div className="shrink-0 flex flex-row lg:flex-col xl:flex-row gap-2.5">
          <Link
            href={detailHref}
            className="flex-1 lg:flex-none text-center px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border-[1.5px] transition-all duration-300 whitespace-nowrap"
            style={{
              background: hovered ? accent : `${accent}18`,
              color: hovered ? '#110f0c' : accent,
              borderColor: hovered ? accent : `${accent}45`,
            }}
          >
            {t('card.openClass')}
          </Link>
          <button
            onClick={() => setEnrollOpen(true)}
            className="flex-1 lg:flex-none px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider border-[1.5px] transition-all duration-300 whitespace-nowrap active:scale-95"
            style={{
              background: hovered ? '#ff751f' : 'rgba(255,117,31,0.15)',
              color: hovered ? '#fff' : '#ff751f',
              borderColor: hovered ? '#ff751f' : 'rgba(255,117,31,0.4)',
            }}
          >
            {t('card.enrollNow')}
          </button>
        </div>

        {/* Bottom shimmer on hover */}
        <motion.div
          animate={{ width: hovered ? '100%' : '0%' }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-0 left-0 h-[2px] rounded-b-2xl"
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

// ─────────────────────────────────────────────
// Collapsible class segment
// ─────────────────────────────────────────────
function ClassSegment({
  className,
  cards,
}: {
  className: string;
  cards: SubClassCard[];
}) {
  const accent = CLASS_ACCENT[className] ?? CLASS_ACCENT.default;
  const icon = CLASS_ICON[className] ?? CLASS_ICON.default;
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      {/* Segment header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl border mb-3 transition-all duration-300 group text-left"
        style={{
          background: `linear-gradient(135deg, ${accent}20, ${accent}06)`,
          borderColor: `${accent}40`,
        }}
      >
        {/* Accent bar */}
        <div
          className="w-[3px] h-9 rounded-full shrink-0"
          style={{ background: accent }}
        />

        {/* Icon + Name */}
        <span className="text-2xl select-none">{icon}</span>
        <h2
          className="text-3xl sm:text-4xl font-extrabold font-goudy tracking-tight flex-1 leading-none"
          style={{ color: accent }}
        >
          {className}
        </h2>

        {/* Count badge */}
        <span
          className="hidden sm:inline-block text-[11px] font-bold px-3 py-1.5 rounded-full"
          style={{
            background: `${accent}22`,
            color: accent,
            border: `1px solid ${accent}40`,
          }}
        >
          {cards.length}
        </span>

        {/* Toggle chevron */}
        <motion.div
          animate={{ rotate: expanded ? 0 : -90 }}
          transition={{ duration: 0.22 }}
          style={{ color: accent }}
        >
          <ChevronDown className="w-5 h-5 shrink-0" />
        </motion.div>
      </button>

      {/* Rows */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 pb-2">
              {cards.map((subClass, i) => (
                <motion.div
                  key={subClass.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.28 }}
                >
                  <ListRow subClass={subClass} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
interface EnrollmentListViewProps {
  grouped: Map<string, SubClassCard[]>;
}

export function EnrollmentListView({ grouped }: EnrollmentListViewProps) {
  return (
    <div className="space-y-5">
      {[...grouped.entries()].map(([className, cards], groupIdx) => (
        <motion.div
          key={className}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIdx * 0.07, duration: 0.38 }}
        >
          <ClassSegment className={className} cards={cards} />
        </motion.div>
      ))}
    </div>
  );
}
