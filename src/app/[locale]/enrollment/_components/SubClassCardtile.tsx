'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { SubClassCard } from '@/lib/actions/classes';
import { Clock, ChevronRight } from 'lucide-react';

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

interface SubClassCardTileProps {
  subClass: SubClassCard;
}

export function SubClassCardTile({ subClass }: SubClassCardTileProps) {
  const t = useTranslations('enrollment');
  const accent = CLASS_ACCENT[subClass.class.name] ?? CLASS_ACCENT.default;

  const sessionTypeLabel: Record<string, string> = {
    PUBLIC: t('card.monthly'),
    MUSIC: t('card.monthly'),
    TRIAL: t('card.trial'),
    WORKSHOP: t('card.workshop'),
    PRIVATE: t('card.private'),
  };
  const glow = CLASS_GLOW[subClass.class.name] ?? CLASS_GLOW.default;
  const hasTeachers = subClass.teachers.length > 0;

  const lowestPrice =
    subClass.oncePriceMonthly ?? subClass.twicePriceMonthly ?? null;

  const hasProgram = !!subClass.programId;

  return (
    <Link
      href={
        hasProgram
          ? `/enrollment/${subClass.id}?program=${subClass.programId}`
          : `/enrollment/${subClass.id}`
      }
      className="block group h-full"
    >
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="relative rounded-3xl overflow-hidden border border-royal-cream/10 cursor-pointer h-full flex flex-col"
        style={{
          background: `linear-gradient(145deg, #1e1a14, #110f0c)`,
        }}
      >
        {/* Glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${glow}, transparent 70%)`,
          }}
        />

        {/* Gold shimmer border on hover */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1.5px ${accent}50` }}
        />

        {/* Cover image or video or gradient placeholder */}
        <div className="relative h-56 sm:h-60 lg:h-64 overflow-hidden shrink-0">
          {subClass.mediaUrl && subClass.mediaKind === 'video' ? (
            <video
              src={subClass.mediaUrl}
              className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
              style={{ background: '#0d0b08' }}
              autoPlay
              muted
              loop
              playsInline
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
              style={{
                background: `linear-gradient(135deg, ${accent}30, ${accent}08)`,
              }}
            >
              <div className="relative flex flex-col items-center justify-center gap-2">
                <div
                  className="text-3xl sm:text-4xl font-extrabold font-goudy text-center px-4 leading-tight tracking-wide drop-shadow"
                  style={{ color: accent, opacity: 0.9 }}
                >
                  {subClass.class.name}
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ color: accent }}
                >
                  <svg
                    width="100"
                    height="100"
                    viewBox="0 0 80 80"
                    fill="none"
                    opacity="0.1"
                  >
                    <circle
                      cx="40"
                      cy="40"
                      r="38"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                    <path
                      d="M40 2 L40 78 M2 40 L78 40"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                    <rect
                      x="28"
                      y="28"
                      width="24"
                      height="24"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      transform="rotate(45 40 40)"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Gradient fade to card */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1e1a14] to-transparent" />

          {/* Session type badge */}
          <div className="absolute top-4 left-4">
            <span
              className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
              style={{
                background: `${accent}25`,
                color: accent,
                border: `1px solid ${accent}50`,
              }}
            >
              {sessionTypeLabel[subClass.sessionType] ?? subClass.sessionType}
            </span>
          </div>

          {/* Trial badge */}
          {subClass.isTrialAvailable && (
            <div className="absolute top-4 right-4">
              <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-royal-gold/20 text-royal-gold border border-royal-gold/40">
                {t('card.trialBadge')}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 lg:p-7 flex flex-col flex-1">
          {/* ── LEVEL 1: Class name — biggest & boldest ── */}
          <p
            className="text-sm font-extrabold uppercase tracking-[0.18em] mb-2"
            style={{ color: accent }}
          >
            {subClass.class.name}
          </p>

          {/* ── LEVEL 2: SubClass name — bold, medium ── */}
          <h3 className="text-2xl lg:text-3xl font-bold text-royal-cream font-goudy leading-tight mb-1 group-hover:text-royal-gold transition-colors duration-300">
            {subClass.name}
          </h3>

          {/* ── LEVEL 3: Program name — prominent but below subClass ── */}
          {hasProgram && subClass.programName && (
            <p
              className="text-xl lg:text-2xl font-semibold mb-3 mt-1 leading-tight"
              style={{ color: `${accent}dd` }}
            >
              {subClass.programName}
            </p>
          )}

          {/* Teachers */}
          {hasTeachers && (
            <div className="flex items-center gap-2.5 mb-4 mt-2">
              <div className="flex -space-x-2">
                {subClass.teachers.slice(0, 3).map((t) =>
                  t.photoUrl ? (
                    <img
                      key={t.id}
                      src={t.photoUrl}
                      alt={t.firstName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-[#1e1a14]"
                    />
                  ) : (
                    <div
                      key={t.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-royal-dark ring-2 ring-[#1e1a14]"
                      style={{ background: accent }}
                    >
                      {t.firstName[0]}
                      {t.lastName[0]}
                    </div>
                  ),
                )}
              </div>
              <span className="text-sm text-royal-cream/60">
                {subClass.teachers.length === 1
                  ? `${subClass.teachers[0].firstName} ${subClass.teachers[0].lastName}`
                  : `${subClass.teachers.length} ${t('card.instructors')}`}
              </span>
            </div>
          )}

          {/* Pills row */}
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

          {/* Spacer to push price to bottom */}
          <div className="flex-1" />

          {/* Divider */}
          <div
            className="h-px mb-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(90deg, ${accent}50, transparent)`,
            }}
          />
          <div className="h-px mb-5 bg-white/6 group-hover:hidden" />

          {/* Price + CTA */}
          <div className="flex items-end justify-between">
            <div>
              {lowestPrice ? (
                <>
                  <p className="text-xs text-royal-cream/40 uppercase tracking-wider mb-0.5">
                    {t('card.from')}
                  </p>
                  <p
                    className="text-2xl lg:text-3xl font-bold font-goudy"
                    style={{ color: accent }}
                  >
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
                  <p
                    className="text-2xl lg:text-3xl font-bold font-goudy"
                    style={{ color: accent }}
                  >
                    {subClass.trialPrice}{' '}
                    <span className="text-sm font-normal text-royal-cream/40">
                      {subClass.currency}
                    </span>
                  </p>
                </>
              )}
            </div>

            <div
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                background: `${accent}25`,
                border: `1.5px solid ${accent}50`,
                color: accent,
              }}
            >
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Bottom accent bar — slides in on hover */}
        <div
          className="absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 rounded-b-3xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />
      </motion.div>
    </Link>
  );
}
