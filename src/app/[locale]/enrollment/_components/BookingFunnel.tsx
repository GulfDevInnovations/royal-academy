'use client';

import { SubClassCard, SubClassTeacherInfo, ProgramInfo } from '@/lib/actions/classes';
import {
  createMonthlyEnrollment,
  createMultiMonthStudentEnrollment,
  createTrialEnrollment,
} from '@/lib/actions/enrollment';
import { addMonths, format, startOfMonth } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Crown,
  Loader2,
  Sparkles,
  X,
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

export interface BookingFunnelProps {
  subClass: SubClassCard;
  program?: ProgramInfo;
  /** When true, renders without the outer white card wrapper (for use inside a modal). */
  compact?: boolean;
  /** Optional close handler — shows an X button in the header when provided. */
  onClose?: () => void;
}

export function BookingFunnel({
  subClass,
  program,
  compact = false,
  onClose,
}: BookingFunnelProps) {
  const t = useTranslations('enrollment');
  const router = useRouter();
  const locale = useLocale();

  const displayTrialPrice = program?.trialPrice ?? subClass.trialPrice;
  const displayOncePriceMonthly = program?.oncePriceMonthly ?? subClass.oncePriceMonthly;
  const displayTwicePriceMonthly = program?.twicePriceMonthly ?? subClass.twicePriceMonthly;
  const displayIsTrialAvailable = program?.isTrialAvailable ?? subClass.isTrialAvailable;
  const displayCurrency = program?.currency ?? subClass.currency;

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
  }, [plan, displayTrialPrice, displayOncePriceMonthly, displayTwicePriceMonthly]);

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

  const inner = (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-xl font-bold text-gray-900 font-goudy">
          {t('detail.bookTitle')}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors flex-shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-6">
        {!selectedTeacher
          ? t('detail.bookSubtitleStart')
          : t('detail.bookSubtitleChoose')}
      </p>

      {/* ── STEP 0: Package selection ── */}
      {subClass.teachers.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
              {subClass.teachers.length === 1
                ? t('detail.instructor')
                : t('detail.chooseInstructor')}
            </p>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="space-y-2">
            {subClass.teachers.map((teacher, index) => {
              const isSelected = selectedTeacher?.id === teacher.id;
              return (
                <motion.button
                  key={teacher.id}
                  onClick={() => handleSelectTeacher(teacher)}
                  whileHover={{ x: 2 }}
                  className="w-full text-left rounded-xl p-4 border transition-all duration-200"
                  style={
                    isSelected
                      ? { background: `${BRAND}0D`, borderColor: BRAND }
                      : { background: '#F8F8F8', borderColor: '#E0E0E0' }
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 font-goudy"
                      style={
                        isSelected
                          ? { background: BRAND, color: '#fff' }
                          : { background: '#E8E8E8', color: '#666' }
                      }
                    >
                      P{index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold font-goudy"
                        style={{ color: isSelected ? BRAND : '#111' }}
                      >
                        {t('detail.package')} {index + 1}
                      </p>
                      {teacher.schedules.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
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
                              <span
                                key={i}
                                className="text-[10px] px-2 py-1 rounded-lg font-medium"
                                style={
                                  isSelected
                                    ? {
                                        background: `${BRAND}18`,
                                        color: BRAND,
                                        border: `1px solid ${BRAND}35`,
                                      }
                                    : {
                                        background: '#EBEBEB',
                                        color: '#666',
                                        border: '1px solid #DDD',
                                      }
                                }
                              >
                                {DAY_LABELS[slot.dayOfWeek]}{' '}
                                {slot.startTime}–{slot.endTime}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle2
                          className="w-5 h-5"
                          style={{ color: BRAND }}
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 1: Plan selection ── */}
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

            {/* ── STEP 2: Plan-specific selections ── */}
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
                      const isSel =
                        selectedMonth?.getTime() === month.getTime();
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
                              ? {
                                  background: `${BRAND}15`,
                                  borderColor: BRAND,
                                  color: BRAND,
                                }
                              : {
                                  background: '#F5F5F5',
                                  borderColor: '#E0E0E0',
                                  color: '#666',
                                }
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
                                  onClick={() =>
                                    setSelectedSlotKeys(isSel ? [] : [key])
                                  }
                                  className="flex flex-col items-center px-3.5 py-2 rounded-xl transition-all duration-200 border"
                                  style={
                                    isSel
                                      ? {
                                          background: `${BRAND}15`,
                                          borderColor: BRAND,
                                        }
                                      : {
                                          background: '#F5F5F5',
                                          borderColor: '#E0E0E0',
                                        }
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
                                    style={{
                                      color: isSel ? `${BRAND}99` : '#999',
                                    }}
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
                              ? {
                                  background: `${BRAND}15`,
                                  borderColor: BRAND,
                                }
                              : {
                                  background: '#F5F5F5',
                                  borderColor: '#E0E0E0',
                                }
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
                            const isSel =
                              selectedMonth?.getTime() === month.getTime();
                            return (
                              <button
                                key={month.toISOString()}
                                onClick={() => {
                                  setSelectedMonth(month);
                                  setTotalMonths(1);
                                }}
                                className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 border"
                                style={
                                  isSel
                                    ? {
                                        background: `${BRAND}15`,
                                        borderColor: BRAND,
                                        color: BRAND,
                                      }
                                    : {
                                        background: '#F5F5F5',
                                        borderColor: '#E0E0E0',
                                        color: '#666',
                                      }
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
                      <span
                        className="text-2xl font-bold font-goudy"
                        style={{ color: BRAND }}
                      >
                        {totalPrice}{' '}
                        <span className="text-sm font-normal text-gray-400">
                          {displayCurrency}
                        </span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {monthlyPrice} {displayCurrency}/mo
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
                      <span
                        className="text-2xl font-bold font-goudy"
                        style={{ color: BRAND }}
                      >
                        {totalPrice}{' '}
                        <span className="text-sm font-normal text-gray-400">
                          {displayCurrency}
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
        disabled={!canProceed || isLoading}
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
  );

  if (compact) return inner;

  return (
    <div
      className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
      style={{ background: '#fff' }}
    >
      <div
        className="h-1"
        style={{
          background: `linear-gradient(90deg, transparent, ${BRAND}, transparent)`,
        }}
      />
      {inner}
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────

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
            <p
              className={`text-sm font-bold ${selected ? 'text-gray-900' : 'text-gray-500'}`}
            >
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
  const lastMonth = selectedMonth
    ? addMonths(selectedMonth, maxMonths - 1)
    : null;
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
            {lastMonth
              ? ` · ${t('detail.ends')} ${format(lastMonth, 'MMM yyyy')}`
              : ''}
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
          <span
            className="w-8 text-center text-sm font-bold"
            style={{ color: BRAND }}
          >
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
              · {totalMonths}{' '}
              {totalMonths === 1
                ? t('detail.monthSingular')
                : t('detail.monthPlural')}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
