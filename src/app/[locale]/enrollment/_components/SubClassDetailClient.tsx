'use client';

import { SubClassDetail, ProgramInfo } from '@/lib/actions/classes';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Award,
  Calendar,
  ChevronLeft,
  Clock,
  Crown,
  Layers,
  Sparkles,
  Users,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { BookingFunnel } from './BookingFunnel';

const BRAND = '#ff751f';

export function SubClassDetailClient({
  subClass,
  program,
}: {
  subClass: SubClassDetail;
  program?: ProgramInfo;
}) {
  const t = useTranslations('enrollment');
  const router = useRouter();
  const locale = useLocale();

  const displayName = program?.name ?? subClass.name;
  const displayDescription = program?.description ?? subClass.description;
  const displayPrice = program?.price ?? subClass.price;
  const displayTrialPrice = program?.trialPrice ?? subClass.trialPrice;
  const displayOncePriceMonthly = program?.oncePriceMonthly ?? subClass.oncePriceMonthly;
  const displayTwicePriceMonthly = program?.twicePriceMonthly ?? subClass.twicePriceMonthly;
  const displayIsTrialAvailable = program?.isTrialAvailable ?? subClass.isTrialAvailable;
  const displayCurrency = program?.currency ?? subClass.currency;

  const sessionTypeLabel: Record<string, string> = {
    PUBLIC: t('card.monthly'),
    MUSIC: t('card.monthly'),
    TRIAL: t('card.trial'),
    WORKSHOP: t('card.workshop'),
    PRIVATE: t('card.private'),
  };

  return (
    <main
      className="min-h-screen pt-24 pb-20"
      style={{ background: '#EBEBEB' }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          onClick={() => router.push(`/${locale}/enrollment`)}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm mb-10 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t('detail.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
          {/* ── LEFT: class info ── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Category label */}
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8" style={{ background: BRAND }} />
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: BRAND }}
              >
                {subClass.class.name}
              </p>
            </div>

            {/* Name */}
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 font-goudy leading-none mb-2">
              {displayName}
            </h1>
            {program && (
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-4"
                style={{ color: BRAND }}
              >
                {subClass.name}
              </p>
            )}

            {/* Cover */}
            {(() => {
              const mediaUrl = program?.mediaUrl ?? subClass.mediaUrl ?? null;
              const mediaKind = program?.mediaKind ?? subClass.mediaKind ?? null;
              const imgUrl = mediaUrl ?? subClass.coverUrl;
              if (mediaUrl && mediaKind === 'video') {
                return (
                  <div
                    className="rounded-2xl overflow-hidden aspect-square w-full mb-8 mt-6 flex items-center justify-center"
                    style={{ background: '#111' }}
                  >
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-contain"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  </div>
                );
              }
              if (imgUrl) {
                return (
                  <div
                    className="rounded-2xl overflow-hidden aspect-square w-full mb-8 mt-6 flex items-center justify-center"
                    style={{ background: '#f3f4f6' }}
                  >
                    <img
                      src={imgUrl}
                      alt={displayName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                );
              }
              return (
                <div
                  className="rounded-2xl aspect-square w-full mb-8 mt-6 flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND}18, ${BRAND}06)`,
                    border: `1px solid ${BRAND}25`,
                  }}
                >
                  <span
                    className="text-8xl font-goudy font-extrabold opacity-15"
                    style={{ color: BRAND }}
                  >
                    {subClass.class.name}
                  </span>
                </div>
              );
            })()}

            {/* Description */}
            {displayDescription && (
              <p className="text-gray-600 leading-relaxed text-base mb-8">
                {displayDescription}
              </p>
            )}

            {/* ── Class Info Panel ── */}
            <div
              className="rounded-2xl overflow-hidden mb-10"
              style={{ background: '#fff', border: '1px solid #E0E0E0' }}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{ background: BRAND }}
                />
                <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] text-gray-400">
                  {t('detail.classDetails') ?? 'Class Details'}
                </h2>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-gray-100">
                <StatCell
                  icon={<Clock className="w-5 h-5" />}
                  label={t('detail.duration')}
                  value={`${subClass.durationMinutes} ${t('detail.minutes')}`}
                />
                {subClass.level && (
                  <StatCell
                    icon={<Award className="w-5 h-5" />}
                    label={t('detail.level')}
                    value={subClass.level}
                  />
                )}
                {subClass.ageGroup && (
                  <StatCell
                    icon={<Users className="w-5 h-5" />}
                    label={t('detail.ageGroup')}
                    value={subClass.ageGroup}
                  />
                )}
                <StatCell
                  icon={<Layers className="w-5 h-5" />}
                  label="Type"
                  value={
                    sessionTypeLabel[subClass.sessionType] ??
                    subClass.sessionType
                  }
                />
                {displayIsTrialAvailable && (
                  <StatCell
                    icon={<Sparkles className="w-5 h-5" />}
                    label="Trial"
                    value="Available"
                    highlight
                  />
                )}
              </div>

              {/* Pricing section */}
              {(displayTrialPrice ||
                displayPrice ||
                displayOncePriceMonthly ||
                displayTwicePriceMonthly) && (
                <>
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                    <div
                      className="w-1 h-5 rounded-full"
                      style={{ background: BRAND }}
                    />
                    <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] text-gray-400">
                      Pricing
                    </h2>
                  </div>

                  <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {displayIsTrialAvailable && displayTrialPrice && (
                      <PriceCard
                        icon={<Sparkles className="w-5 h-5" />}
                        title={t('detail.trialTitle')}
                        subtitle={t('detail.trialSubtitle')}
                        price={displayTrialPrice}
                        currency={displayCurrency}
                        suffix=""
                        badge={t('detail.trialBadge')}
                      />
                    )}
                    {displayPrice && (
                      <PriceCard
                        icon={<Calendar className="w-5 h-5" />}
                        title={t('detail.perSessionTitle')}
                        subtitle={t('detail.perSessionSubtitle')}
                        price={displayPrice}
                        currency={displayCurrency}
                        suffix=""
                      />
                    )}
                    {displayOncePriceMonthly && (
                      <PriceCard
                        icon={<Calendar className="w-5 h-5" />}
                        title={t('detail.onceTitle')}
                        subtitle={t('detail.onceSubtitle')}
                        price={displayOncePriceMonthly}
                        currency={displayCurrency}
                        suffix="/mo"
                        badge={t('detail.onceBadge')}
                      />
                    )}
                    {displayTwicePriceMonthly && (
                      <PriceCard
                        icon={<Crown className="w-5 h-5" />}
                        title={t('detail.twiceTitle')}
                        subtitle={t('detail.twiceSubtitle')}
                        price={displayTwicePriceMonthly}
                        currency={displayCurrency}
                        suffix="/mo"
                        badge={t('detail.twiceBadge')}
                        featured
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* ── RIGHT: booking funnel ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:sticky lg:top-28 self-start"
          >
            <BookingFunnel subClass={subClass} program={program} />
          </motion.div>
        </div>
      </div>
    </main>
  );
}

// ── Helper components ─────────────────────────────────────────────

function StatCell({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-5">
      <div
        className="mt-0.5 flex-shrink-0"
        style={{ color: highlight ? BRAND : '#AAAAAA' }}
      >
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-gray-400 uppercase tracking-wider leading-none mb-1.5 font-semibold">
          {label}
        </p>
        <p
          className="text-sm font-bold"
          style={{ color: highlight ? BRAND : '#111' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function PriceCard({
  icon,
  title,
  subtitle,
  price,
  currency,
  suffix,
  badge,
  featured,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  price: string;
  currency: string;
  suffix: string;
  badge?: string;
  featured?: boolean;
}) {
  return (
    <div
      className="relative rounded-2xl p-5 flex flex-col gap-3"
      style={
        featured
          ? { background: `${BRAND}0D`, border: `1.5px solid ${BRAND}50` }
          : { background: '#F8F8F8', border: '1px solid #E8E8E8' }
      }
    >
      {badge && (
        <span
          className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: `${BRAND}20`, color: BRAND }}
        >
          {badge}
        </span>
      )}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: featured ? `${BRAND}20` : '#EBEBEB',
          color: featured ? BRAND : '#888',
        }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="mt-auto">
        <span
          className="text-2xl font-extrabold font-goudy"
          style={{ color: BRAND }}
        >
          {price}
        </span>
        <span className="text-xs text-gray-400 ml-1">
          {currency}
          {suffix}
        </span>
      </div>
    </div>
  );
}
