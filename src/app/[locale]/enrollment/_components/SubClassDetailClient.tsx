'use client';

import { SubClassDetail, SubClassTeacherInfo, ProgramInfo } from '@/lib/actions/classes';
import {
  createMonthlyEnrollment,
  createMultiMonthStudentEnrollment,
  createTrialEnrollment,
} from '@/lib/actions/enrollment';
import { addMonths, format, startOfMonth } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  Award,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Loader2,
  Sparkles,
  Users,
  Layers,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  TeacherAvailabilityPicker,
  slotKey,
  type AvailableSlot,
  type SlotKey,
} from './TeacherAvailibilityPicker';

const BRAND = '#ff751f';

const CLASS_ACCENT: Record<string, string> = {
  Music: '#C9A84C',
  'Yoga & Wellness': '#10B981',
  Art: '#F97316',
  Dance: '#A855F7',
  Ballet: '#EC4899',
  default: '#C9A84C',
};

const DAY_ORDER = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

function scheduleForKey(
  schedules: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    endDate: string | null;
  }>,
  key: string,
) {
  const [day, startTime, endTime] = key.split('|');
  return schedules.find(
    (s) =>
      s.dayOfWeek === day && s.startTime === startTime && s.endTime === endTime,
  );
}

function computeMaxMonths(endDate: string | null, startMonth: Date): number {
  if (!endDate) return 12;
  const end = new Date(endDate);
  const diff =
    (end.getFullYear() - startMonth.getFullYear()) * 12 +
    (end.getMonth() - startMonth.getMonth()) +
    1;
  return Math.max(1, Math.min(diff, 12));
}

type Plan = 'TRIAL' | 'ONCE' | 'TWICE';

export function SubClassDetailClient({
  subClass,
  program,
}: {
  subClass: SubClassDetail;
  program?: ProgramInfo;
}) {
  const t = useTranslations('enrollment');
  const router = useRouter();
  const classAccent = CLASS_ACCENT[subClass.class.name] ?? CLASS_ACCENT.default;

  const displayName            = program?.name              ?? subClass.name;
  const displayDescription     = program?.description       ?? subClass.description;
  const displayTrialPrice      = program?.trialPrice        ?? subClass.trialPrice;
  const displayOncePriceMonthly  = program?.oncePriceMonthly  ?? subClass.oncePriceMonthly;
  const displayTwicePriceMonthly = program?.twicePriceMonthly ?? subClass.twicePriceMonthly;
  const displayIsTrialAvailable  = program?.isTrialAvailable  ?? subClass.isTrialAvailable;
  const displayCurrency        = program?.currency          ?? subClass.currency;

  const DAY_LABELS: Record<string, string> = {
    MONDAY: t('cal.mon'),
    TUESDAY: t('cal.tue'),
    WEDNESDAY: t('cal.wed'),
    THURSDAY: t('cal.thu'),
    FRIDAY: t('cal.fri'),
    SATURDAY: t('cal.sat'),
    SUNDAY: t('cal.sun'),
  };

  const [selectedTeacher, setSelectedTeacher] =
    useState<SubClassTeacherInfo | null>(
      subClass.teachers.length === 1 ? subClass.teachers[0] : null,
    );
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [totalMonths, setTotalMonths] = useState<number>(1);
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedSlotPickerKey, setSelectedSlotPickerKey] =
    useState<SlotKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidateMonths = useMemo(() => {
    const now = new Date();
    return [0, 1, 2, 3].map((i) => addMonths(startOfMonth(now), i));
  }, []);

  const availableMonthsForOnce = useMemo(() => {
    if (!selectedTeacher) return candidateMonths;
    return candidateMonths.filter((month) =>
      selectedTeacher.schedules.some(
        (s) => !s.endDate || new Date(s.endDate) >= month,
      ),
    );
  }, [candidateMonths, selectedTeacher]);

  const availableMonthsForTwice = useMemo(() => {
    if (!selectedTeacher || selectedSlotKeys.length < 2) return candidateMonths;
    return candidateMonths.filter((month) =>
      selectedSlotKeys.every((key) => {
        const s = scheduleForKey(selectedTeacher.schedules, key);
        return !s?.endDate || new Date(s.endDate) >= month;
      }),
    );
  }, [candidateMonths, selectedTeacher, selectedSlotKeys]);

  const onceMaxMonths = useMemo(() => {
    if (!selectedMonth || selectedSlotKeys.length < 1 || !selectedTeacher)
      return 12;
    const s = scheduleForKey(selectedTeacher.schedules, selectedSlotKeys[0]);
    return computeMaxMonths(s?.endDate ?? null, selectedMonth);
  }, [selectedMonth, selectedSlotKeys, selectedTeacher]);

  const twiceMaxMonths = useMemo(() => {
    if (!selectedMonth || selectedSlotKeys.length < 2 || !selectedTeacher)
      return 12;
    const minEndDate = selectedSlotKeys.reduce<string | null>((min, key) => {
      const s = scheduleForKey(selectedTeacher.schedules, key);
      if (!s?.endDate) return min;
      return min === null || s.endDate < min ? s.endDate : min;
    }, null);
    return computeMaxMonths(minEndDate, selectedMonth);
  }, [selectedMonth, selectedSlotKeys, selectedTeacher]);

  const maxMonths =
    plan === 'ONCE' ? onceMaxMonths : plan === 'TWICE' ? twiceMaxMonths : 12;

  useEffect(() => {
    if (totalMonths > maxMonths) setTotalMonths(maxMonths);
  }, [maxMonths, totalMonths]);

  const availableSlots = useMemo(() => {
    if (!selectedTeacher) return [];
    return [...selectedTeacher.schedules].sort((a, b) => {
      const dayDiff =
        DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [selectedTeacher]);

  const daySlotKey = (s: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }) => `${s.dayOfWeek}|${s.startTime}|${s.endTime}`;

  const preferredDays = useMemo(
    () =>
      selectedSlotKeys
        .map((key) => key.split('|')[0])
        .filter(Boolean) as import('@prisma/client').DayOfWeek[],
    [selectedSlotKeys],
  );

  const preferredSlotIds = useMemo(() => {
    if (!selectedTeacher) return [];
    return selectedSlotKeys
      .map((key) => {
        const [day, startTime, endTime] = key.split('|');
        const match = selectedTeacher.schedules.find(
          (s) =>
            s.dayOfWeek === day &&
            s.startTime === startTime &&
            s.endTime === endTime,
        );
        return match?.id ?? null;
      })
      .filter(Boolean) as string[];
  }, [selectedSlotKeys, selectedTeacher]);

  const requiredDays = plan === 'ONCE' ? 1 : plan === 'TWICE' ? 2 : 0;

  const toggleSlot = (key: string) => {
    setSelectedSlotKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= requiredDays) return [...prev.slice(1), key];
      return [...prev, key];
    });
  };

  const monthlyPrice = useMemo(() => {
    if (plan === 'TRIAL') return displayTrialPrice;
    if (plan === 'ONCE') return displayOncePriceMonthly ?? null;
    if (plan === 'TWICE') return displayTwicePriceMonthly ?? null;
    return null;
  }, [plan, subClass]);

  const totalPrice = useMemo(() => {
    if (!monthlyPrice) return null;
    if (plan === 'TRIAL') return monthlyPrice;
    return (parseFloat(monthlyPrice) * totalMonths).toFixed(3);
  }, [monthlyPrice, totalMonths, plan]);

  const isMultiMonth = plan !== 'TRIAL' && totalMonths > 1;

  const canProceed = useMemo(() => {
    if (!selectedTeacher || !plan) return false;
    if (plan === 'TRIAL') return !!selectedSlot;
    if (plan === 'ONCE')
      return !!selectedMonth && selectedSlotKeys.length === 1;
    if (plan === 'TWICE')
      return selectedSlotKeys.length === 2 && !!selectedMonth;
    return false;
  }, [selectedTeacher, plan, selectedSlot, selectedSlotKeys, selectedMonth]);

  const handleSelectTeacher = (teacher: SubClassTeacherInfo) => {
    setSelectedTeacher(teacher);
    setPlan(null);
    setSelectedMonth(null);
    setTotalMonths(1);
    setSelectedSlotKeys([]);
    setSelectedSlot(null);
    setSelectedSlotPickerKey(null);
    setError(null);
  };

  const handleProceed = async () => {
    if (!canProceed || !plan || !selectedTeacher) return;
    setIsLoading(true);
    setError(null);

    try {
      const authRes = await fetch('/api/auth/check');
      const { authenticated, studentId } = await authRes.json();

      if (!authenticated) {
        router.push(
          `/login?redirect=${encodeURIComponent(`/enrollment/${subClass.id}`)}`,
        );
        return;
      }

      let result;

      const slotDate = selectedSlot
        ? (() => {
            const [y, m, d] = selectedSlot.date.split('-').map(Number);
            return new Date(y, m - 1, d);
          })()
        : null;
      const effectiveMonth = selectedMonth ?? slotDate;
      const safeMonth = effectiveMonth ?? new Date();

      if (plan === 'TRIAL') {
        result = await createTrialEnrollment({
          studentId,
          subClassId: subClass.id,
          teacherId: selectedTeacher.id,
          sessionDate: selectedSlot?.date,
        });
      } else if (isMultiMonth) {
        result = await createMultiMonthStudentEnrollment({
          studentId,
          subClassId: subClass.id,
          teacherId: selectedTeacher.id,
          startMonth: safeMonth.getMonth() + 1,
          startYear: safeMonth.getFullYear(),
          totalMonths,
          frequency: plan === 'ONCE' ? 'ONCE_PER_WEEK' : 'TWICE_PER_WEEK',
          preferredDays,
          preferredSlotIds,
        });
      } else {
        result = await createMonthlyEnrollment({
          studentId,
          subClassId: subClass.id,
          teacherId: selectedTeacher.id,
          month: safeMonth.getMonth() + 1,
          year: safeMonth.getFullYear(),
          frequency: plan === 'ONCE' ? 'ONCE_PER_WEEK' : 'TWICE_PER_WEEK',
          preferredDays,
          preferredSlotIds,
        });
      }

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(result.redirectTo);
    } catch {
      setError(t('detail.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const ctaLabel = useMemo(() => {
    if (!selectedTeacher) return t('detail.ctaSelectInstructor');
    if (!plan) return t('detail.ctaSelectPlan');
    if (plan === 'TRIAL')
      return selectedSlot ? t('detail.ctaBookTrial') : t('detail.ctaPickSession');
    if (plan === 'ONCE') {
      if (!selectedMonth) return t('detail.ctaSelectMonth');
      if (selectedSlotKeys.length < 1) return t('detail.ctaChooseDay');
      return isMultiMonth
        ? t('detail.ctaEnrollFor', { count: totalMonths })
        : t('detail.ctaProceed');
    }
    if (plan === 'TWICE') {
      if (selectedSlotKeys.length < 2) {
        const remaining = 2 - selectedSlotKeys.length;
        return remaining === 1
          ? t('detail.ctaMoreSlot', { count: remaining })
          : t('detail.ctaMoreSlots', { count: remaining });
      }
      if (!selectedMonth) return t('detail.ctaSelectMonth');
      return isMultiMonth
        ? t('detail.ctaEnrollFor', { count: totalMonths })
        : t('detail.ctaProceed');
    }
    return t('detail.ctaProceed');
  }, [
    selectedTeacher,
    plan,
    selectedSlot,
    selectedMonth,
    selectedSlotKeys,
    isMultiMonth,
    totalMonths,
    t,
  ]);

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
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm mb-10 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t('detail.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
          {/* ── LEFT ── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Category label */}
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8" style={{ background: classAccent }} />
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: classAccent }}
              >
                {subClass.class.name}
              </p>
            </div>

            {/* Name */}
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 font-goudy leading-none mb-2">
              {displayName}
            </h1>
            {program && (
              <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: classAccent }}>
                {subClass.name}
              </p>
            )}

            {/* Cover */}
            {subClass.coverUrl ? (
              <div className="rounded-2xl overflow-hidden h-56 mb-8 mt-6">
                <img
                  src={subClass.coverUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="rounded-2xl h-56 mb-8 mt-6 flex items-center justify-center relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${classAccent}18, ${classAccent}06)`,
                  border: `1px solid ${classAccent}25`,
                }}
              >
                <span
                  className="text-8xl font-goudy font-extrabold opacity-15"
                  style={{ color: classAccent }}
                >
                  {subClass.class.name}
                </span>
              </div>
            )}

            {/* Description */}
            {displayDescription && (
              <p className="text-gray-600 leading-relaxed text-base mb-8">
                {displayDescription}
              </p>
            )}

            {/* ── Class Info Panel ── */}
            <div className="rounded-2xl overflow-hidden mb-10" style={{ background: '#fff', border: '1px solid #E0E0E0' }}>
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-1 h-5 rounded-full" style={{ background: BRAND }} />
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
                  value={sessionTypeLabel[subClass.sessionType] ?? subClass.sessionType}
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
              {(displayTrialPrice || displayOncePriceMonthly || displayTwicePriceMonthly) && (
                <>
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                    <div className="w-1 h-5 rounded-full" style={{ background: BRAND }} />
                    <h2 className="text-sm font-extrabold uppercase tracking-[0.2em] text-gray-400">
                      Pricing
                    </h2>
                  </div>

                  <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    {displayOncePriceMonthly && (
                      <PriceCard
                        icon={<Calendar className="w-5 h-5" />}
                        title={t('detail.onceTitle')}
                        subtitle={t('detail.onceSubtitle')}
                        price={displayOncePriceMonthly}
                        currency={displayCurrency}
                        suffix="/mo"
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

            {/* ── Teachers ── */}
            {subClass.teachers.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <p className="text-xs font-extrabold uppercase tracking-widest whitespace-nowrap text-gray-400">
                    {subClass.teachers.length === 1
                      ? t('detail.instructor')
                      : t('detail.chooseInstructor')}
                  </p>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <div className="space-y-3">
                  {subClass.teachers.map((teacher) => {
                    const isSelected = selectedTeacher?.id === teacher.id;
                    return (
                      <motion.button
                        key={teacher.id}
                        onClick={() => handleSelectTeacher(teacher)}
                        whileHover={{ x: 2 }}
                        className="w-full text-left rounded-2xl p-5 border transition-all duration-200 relative overflow-hidden"
                        style={
                          isSelected
                            ? {
                                background: `${BRAND}0D`,
                                borderColor: BRAND,
                              }
                            : {
                                background: '#fff',
                                borderColor: '#E0E0E0',
                              }
                        }
                      >
                        <div className="flex items-start gap-4">
                          {teacher.photoUrl ? (
                            <img
                              src={teacher.photoUrl}
                              alt={teacher.firstName}
                              className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 font-goudy"
                              style={
                                isSelected
                                  ? { background: BRAND, color: '#fff' }
                                  : { background: '#F0F0F0', color: '#555' }
                              }
                            >
                              {teacher.firstName[0]}
                              {teacher.lastName[0]}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-base font-bold font-goudy transition-colors"
                              style={{ color: isSelected ? BRAND : '#111' }}
                            >
                              {teacher.firstName} {teacher.lastName}
                            </h3>

                            {teacher.schedules.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {[...teacher.schedules]
                                  .sort((a, b) => {
                                    const dd =
                                      DAY_ORDER.indexOf(a.dayOfWeek) -
                                      DAY_ORDER.indexOf(b.dayOfWeek);
                                    return dd !== 0
                                      ? dd
                                      : a.startTime.localeCompare(b.startTime);
                                  })
                                  .map((slot, i) => (
                                    <div
                                      key={i}
                                      className="flex flex-col items-center px-2.5 py-1.5 rounded-xl"
                                      style={
                                        isSelected
                                          ? {
                                              background: `${BRAND}15`,
                                              border: `1px solid ${BRAND}40`,
                                            }
                                          : {
                                              background: '#F5F5F5',
                                              border: '1px solid #E0E0E0',
                                            }
                                      }
                                    >
                                      <span
                                        className="text-[10px] font-bold uppercase tracking-wider"
                                        style={{ color: isSelected ? BRAND : '#555' }}
                                      >
                                        {DAY_LABELS[slot.dayOfWeek]}
                                      </span>
                                      <span
                                        className="text-[9px] mt-0.5"
                                        style={{ color: isSelected ? `${BRAND}99` : '#999' }}
                                      >
                                        {slot.startTime}–{slot.endTime}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            )}

                            {teacher.specialties.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {teacher.specialties.slice(0, 3).map((s) => (
                                  <span
                                    key={s}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-500"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}

                            {teacher.bio && (
                              <p className="text-gray-400 text-xs mt-2 leading-relaxed line-clamp-2">
                                {teacher.bio}
                              </p>
                            )}

                            {teacher.maxBookableMonths != null &&
                              teacher.maxBookableMonths <= 3 && (
                                <p className="text-[10px] mt-2 text-amber-500">
                                  {t('detail.scheduleFor')}{' '}
                                  {teacher.maxBookableMonths}{' '}
                                  {teacher.maxBookableMonths !== 1
                                    ? t('detail.moreMonths')
                                    : t('detail.moreMonth')}
                                </p>
                              )}
                          </div>

                          <div className="flex-shrink-0 self-center">
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5" style={{ color: BRAND }} />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                            )}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* ── RIGHT: booking funnel ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="lg:sticky lg:top-28 self-start"
          >
            <div
              className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
              style={{ background: '#fff' }}
            >
              {/* Orange top bar */}
              <div className="h-1" style={{ background: `linear-gradient(90deg, transparent, ${BRAND}, transparent)` }} />

              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 font-goudy mb-1">
                  {t('detail.bookTitle')}
                </h2>
                <p className="text-xs text-gray-400 mb-6">
                  {!selectedTeacher
                    ? t('detail.bookSubtitleStart')
                    : t('detail.bookSubtitleChoose')}
                </p>

                {/* Selected teacher reminder */}
                <AnimatePresence>
                  {selectedTeacher && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-5"
                    >
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl border"
                        style={{ background: `${BRAND}0D`, borderColor: `${BRAND}40` }}
                      >
                        {selectedTeacher.photoUrl ? (
                          <img
                            src={selectedTeacher.photoUrl}
                            alt={selectedTeacher.firstName}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: BRAND }}
                          >
                            {selectedTeacher.firstName[0]}
                            {selectedTeacher.lastName[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-400 leading-none mb-0.5">
                            {t('detail.instructor')}
                          </p>
                          <p className="text-sm font-semibold truncate" style={{ color: BRAND }}>
                            {selectedTeacher.firstName}{' '}{selectedTeacher.lastName}
                          </p>
                        </div>
                        {subClass.teachers.length > 1 && (
                          <button
                            onClick={() => {
                              setSelectedTeacher(null);
                              setPlan(null);
                              setSelectedMonth(null);
                              setTotalMonths(1);
                              setSelectedSlotKeys([]);
                              setSelectedSlot(null);
                              setSelectedSlotPickerKey(null);
                            }}
                            className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          >
                            {t('detail.change')}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* STEP 1: Plan selection */}
                <AnimatePresence>
                  {selectedTeacher && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                          {t('detail.choosePlan')}
                        </p>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                      <div className="space-y-3 mb-6">
                        {displayIsTrialAvailable && (
                          <PlanOption
                            selected={plan === 'TRIAL'}
                            onClick={() => {
                              setPlan('TRIAL');
                              setSelectedSlotKeys([]);
                              setSelectedMonth(null);
                              setTotalMonths(1);
                              setSelectedSlot(null);
                              setSelectedSlotPickerKey(null);
                            }}
                            icon={<Sparkles className="w-4 h-4" />}
                            title={t('detail.trialTitle')}
                            subtitle={t('detail.trialSubtitle')}
                            price={`${displayTrialPrice} ${displayCurrency}`}
                            badge={t('detail.trialBadge')}
                          />
                        )}
                        {displayOncePriceMonthly && (
                          <PlanOption
                            selected={plan === 'ONCE'}
                            onClick={() => {
                              setPlan('ONCE');
                              setSelectedSlotKeys([]);
                              setSelectedMonth(null);
                              setSelectedSlot(null);
                              setSelectedSlotPickerKey(null);
                            }}
                            icon={<Calendar className="w-4 h-4" />}
                            title={t('detail.onceTitle')}
                            subtitle={t('detail.onceSubtitle')}
                            price={`${displayOncePriceMonthly} ${displayCurrency}/mo`}
                          />
                        )}
                        {displayTwicePriceMonthly && (
                          <PlanOption
                            selected={plan === 'TWICE'}
                            onClick={() => {
                              setPlan('TWICE');
                              setSelectedSlotKeys([]);
                              setSelectedMonth(null);
                              setTotalMonths(1);
                              setSelectedSlot(null);
                              setSelectedSlotPickerKey(null);
                            }}
                            icon={<Crown className="w-4 h-4" />}
                            title={t('detail.twiceTitle')}
                            subtitle={t('detail.twiceSubtitle')}
                            price={`${displayTwicePriceMonthly} ${displayCurrency}/mo`}
                            badge={t('detail.twiceBadge')}
                          />
                        )}
                      </div>

                      {/* STEP 2: Plan-specific selections */}
                      <AnimatePresence mode="wait">
                        {plan === 'TRIAL' && (
                          <motion.div
                            key="trial"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-5"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                                {t('detail.pickSession')}
                              </p>
                              <div className="h-px flex-1 bg-gray-200" />
                            </div>
                            <TeacherAvailabilityPicker
                              teacher={selectedTeacher}
                              accent={BRAND}
                              selected={selectedSlotPickerKey}
                              onSelect={(slot) => {
                                setSelectedSlot(slot);
                                setSelectedSlotPickerKey(slotKey(slot));
                              }}
                            />
                          </motion.div>
                        )}

                        {plan === 'ONCE' && (
                          <motion.div
                            key="once"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-5"
                          >
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                              {t('detail.startingMonth')}
                            </p>
                            <div className="grid grid-cols-2 gap-2 mb-5">
                              {availableMonthsForOnce.map((month) => {
                                const isSel = selectedMonth?.getTime() === month.getTime();
                                return (
                                  <button
                                    key={month.toISOString()}
                                    onClick={() => {
                                      setSelectedMonth(month);
                                      setSelectedSlotKeys([]);
                                      setTotalMonths(1);
                                    }}
                                    className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 border"
                                    style={
                                      isSel
                                        ? { background: `${BRAND}15`, borderColor: BRAND, color: BRAND }
                                        : { background: '#F5F5F5', borderColor: '#E0E0E0', color: '#666' }
                                    }
                                  >
                                    {format(month, 'MMM yyyy')}
                                  </button>
                                );
                              })}
                            </div>

                            <AnimatePresence>
                              {selectedMonth && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                                      {t('detail.preferredDay')}
                                    </p>
                                    <div className="h-px flex-1 bg-gray-200" />
                                  </div>
                                  <div className="flex flex-wrap gap-2 mb-5">
                                    {availableSlots
                                      .filter(
                                        (slot) =>
                                          !slot.endDate ||
                                          new Date(slot.endDate) >= selectedMonth,
                                      )
                                      .map((slot) => {
                                        const key = daySlotKey(slot);
                                        const isSel = selectedSlotKeys.includes(key);
                                        return (
                                          <button
                                            key={key}
                                            onClick={() => setSelectedSlotKeys(isSel ? [] : [key])}
                                            className="flex flex-col items-center px-3.5 py-2 rounded-xl transition-all duration-200 border"
                                            style={
                                              isSel
                                                ? { background: `${BRAND}15`, borderColor: BRAND }
                                                : { background: '#F5F5F5', borderColor: '#E0E0E0' }
                                            }
                                          >
                                            <span
                                              className="text-xs font-bold uppercase tracking-wider"
                                              style={{ color: isSel ? BRAND : '#555' }}
                                            >
                                              {DAY_LABELS[slot.dayOfWeek]}
                                            </span>
                                            <span
                                              className="text-[9px] mt-0.5"
                                              style={{ color: isSel ? `${BRAND}99` : '#999' }}
                                            >
                                              {slot.startTime}–{slot.endTime}
                                            </span>
                                          </button>
                                        );
                                      })}
                                  </div>

                                  <AnimatePresence>
                                    {selectedSlotKeys.length === 1 && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <DurationPicker
                                          totalMonths={totalMonths}
                                          maxMonths={onceMaxMonths}
                                          selectedMonth={selectedMonth}
                                          onChange={setTotalMonths}
                                        />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}

                        {plan === 'TWICE' && (
                          <motion.div
                            key="twice"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-5"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                                {t('detail.chooseTwoSessions')}
                              </p>
                              <div className="h-px flex-1 bg-gray-200" />
                            </div>
                            <p className="text-[11px] text-gray-400 mb-3">
                              {t('detail.selectTwoSlots')}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-5">
                              {availableSlots.map((slot) => {
                                const key = daySlotKey(slot);
                                const isSel = selectedSlotKeys.includes(key);
                                return (
                                  <button
                                    key={key}
                                    onClick={() => toggleSlot(key)}
                                    className="flex flex-col items-center px-3.5 py-2 rounded-xl transition-all duration-200 border"
                                    style={
                                      isSel
                                        ? { background: `${BRAND}15`, borderColor: BRAND }
                                        : { background: '#F5F5F5', borderColor: '#E0E0E0' }
                                    }
                                  >
                                    <span
                                      className="text-xs font-bold uppercase tracking-wider"
                                      style={{ color: isSel ? BRAND : '#555' }}
                                    >
                                      {DAY_LABELS[slot.dayOfWeek]}
                                    </span>
                                    <span
                                      className="text-[9px] mt-0.5"
                                      style={{ color: isSel ? `${BRAND}99` : '#999' }}
                                    >
                                      {slot.startTime}–{slot.endTime}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            <AnimatePresence>
                              {selectedSlotKeys.length === 2 && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                                    {t('detail.startingMonth')}
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 mb-5">
                                    {availableMonthsForTwice.map((month) => {
                                      const isSel = selectedMonth?.getTime() === month.getTime();
                                      return (
                                        <button
                                          key={month.toISOString()}
                                          onClick={() => { setSelectedMonth(month); setTotalMonths(1); }}
                                          className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 border"
                                          style={
                                            isSel
                                              ? { background: `${BRAND}15`, borderColor: BRAND, color: BRAND }
                                              : { background: '#F5F5F5', borderColor: '#E0E0E0', color: '#666' }
                                          }
                                        >
                                          {format(month, 'MMM yyyy')}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <AnimatePresence>
                                    {selectedMonth && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <DurationPicker
                                          totalMonths={totalMonths}
                                          maxMonths={twiceMaxMonths}
                                          selectedMonth={selectedMonth}
                                          onChange={setTotalMonths}
                                        />
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Price summary */}
                      {plan && totalPrice && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="rounded-xl p-4 mb-5 border"
                          style={{ background: `${BRAND}08`, borderColor: `${BRAND}30` }}
                        >
                          {isMultiMonth ? (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-500">
                                  {t('detail.totalMonths', { count: totalMonths })}
                                </span>
                                <span className="text-2xl font-bold font-goudy" style={{ color: BRAND }}>
                                  {totalPrice}{' '}
                                  <span className="text-sm font-normal text-gray-400">
                                    {subClass.currency}
                                  </span>
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">
                                {monthlyPrice} {subClass.currency}/mo
                                {selectedSlotKeys.length > 0 &&
                                  ` · ${selectedSlotKeys
                                    .map((k) => {
                                      const [day, st, et] = k.split('|');
                                      return `${DAY_LABELS[day] ?? day} ${st}–${et}`;
                                    })
                                    .join(' & ')}`}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                  {t('detail.total')}
                                </span>
                                <span className="text-2xl font-bold font-goudy" style={{ color: BRAND }}>
                                  {totalPrice}{' '}
                                  <span className="text-sm font-normal text-gray-400">
                                    {subClass.currency}
                                  </span>
                                </span>
                              </div>
                              {plan !== 'TRIAL' && selectedMonth && (
                                <p className="text-xs text-gray-400 mt-1">
                                  for {format(selectedMonth, 'MMMM yyyy')}
                                  {selectedSlotKeys.length > 0 &&
                                    ` · ${selectedSlotKeys
                                      .map((k) => {
                                        const [day, st, et] = k.split('|');
                                        return `${DAY_LABELS[day] ?? day} ${st}–${et}`;
                                      })
                                      .join(' & ')}`}
                                </p>
                              )}
                            </>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200 mb-4"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-600">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA */}
                <button
                  onClick={handleProceed}
                  disabled={true}
                  className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={
                    canProceed
                      ? {
                          background: BRAND,
                          color: '#fff',
                          boxShadow: `0 8px 24px ${BRAND}40`,
                        }
                      : {
                          background: '#F0F0F0',
                          color: '#AAA',
                        }
                  }
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('detail.processing')}
                    </span>
                  ) : (
                    ctaLabel
                  )}
                </button>

                <div className="flex items-center justify-center gap-3 mt-5 opacity-20">
                  <div className="h-px w-12" style={{ background: BRAND }} />
                  <div className="w-1 h-1 rotate-45" style={{ background: BRAND }} />
                  <div className="h-px w-12" style={{ background: BRAND }} />
                </div>
              </div>
            </div>
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
        style={{ background: featured ? `${BRAND}20` : '#EBEBEB', color: featured ? BRAND : '#888' }}
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
          {currency}{suffix}
        </span>
      </div>
    </div>
  );
}

function PlanOption({
  selected,
  onClick,
  icon,
  title,
  subtitle,
  price,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  price: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border transition-all duration-200 relative"
      style={
        selected
          ? { background: `${BRAND}0D`, borderColor: BRAND }
          : { background: '#F8F8F8', borderColor: '#E0E0E0' }
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: selected ? `${BRAND}20` : '#EBEBEB',
              color: selected ? BRAND : '#AAA',
            }}
          >
            {icon}
          </div>
          <div>
            <p className={`text-sm font-bold ${selected ? 'text-gray-900' : 'text-gray-500'}`}>
              {title}
            </p>
            <p className="text-[10px] text-gray-400">{subtitle}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p
            className="text-sm font-bold font-goudy"
            style={{ color: selected ? BRAND : '#999' }}
          >
            {price}
          </p>
          {badge && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{ background: `${BRAND}15`, color: BRAND }}
            >
              {badge}
            </span>
          )}
        </div>
      </div>
      {selected && (
        <div className="absolute right-3 top-3">
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: BRAND }} />
        </div>
      )}
    </button>
  );
}

function DurationPicker({
  totalMonths,
  maxMonths,
  selectedMonth,
  onChange,
}: {
  totalMonths: number;
  maxMonths: number;
  selectedMonth: Date | null;
  onChange: (n: number) => void;
}) {
  const t = useTranslations('enrollment');
  if (maxMonths <= 1) return null;
  const lastMonth = selectedMonth ? addMonths(selectedMonth, maxMonths - 1) : null;
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
            {t('detail.durationLabel')}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {maxMonths === 1
              ? t('detail.upToMonth', { count: maxMonths })
              : t('detail.upToMonths', { count: maxMonths })}
            {lastMonth ? ` · ${t('detail.ends')} ${format(lastMonth, 'MMM yyyy')}` : ''}
          </p>
        </div>
        <div
          className="flex items-center gap-1 px-1 rounded-xl border"
          style={{ borderColor: '#E0E0E0', background: '#F5F5F5' }}
        >
          <button
            onClick={() => onChange(Math.max(1, totalMonths - 1))}
            disabled={totalMonths <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-bold" style={{ color: BRAND }}>
            {totalMonths}
          </span>
          <button
            onClick={() => onChange(Math.min(maxMonths, totalMonths + 1))}
            disabled={totalMonths >= maxMonths}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 disabled:opacity-20 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {totalMonths > 1 && selectedMonth && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-2"
          style={{ background: `${BRAND}08`, borderColor: `${BRAND}25` }}
        >
          <p className="text-xs" style={{ color: BRAND }}>
            {format(selectedMonth, 'MMM yyyy')}
            {' → '}
            {format(addMonths(selectedMonth, totalMonths - 1), 'MMM yyyy')}
            <span className="text-gray-400 ml-1">
              · {totalMonths} {totalMonths === 1 ? t('detail.monthSingular') : t('detail.monthPlural')}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
