"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SubClassDetail, SubClassTeacherInfo } from "@/lib/actions/classes";
import {
  TeacherAvailabilityPicker,
  slotKey,
  type AvailableSlot,
  type SlotKey,
} from "./TeacherAvailibilityPicker";
import {
  createMonthlyEnrollment,
  createMultiMonthStudentEnrollment,
  createTrialEnrollment,
} from "@/lib/actions/enrollment";
import {
  ChevronLeft,
  Clock,
  Award,
  Users,
  Crown,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { format, addMonths, startOfMonth } from "date-fns";

const CLASS_ACCENT: Record<string, string> = {
  Music: "#C9A84C",
  "Dance & Wellness": "#A855F7",
  Art: "#F97316",
  Ballet: "#EC4899",
  Workshops: "#10B981",
  default: "#C9A84C",
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

/** Find a teacher schedule matching a daySlotKey ("DAY|startTime|endTime"). */
function scheduleForKey(
  schedules: Array<{ dayOfWeek: string; startTime: string; endTime: string; endDate: string | null }>,
  key: string,
) {
  const [day, startTime, endTime] = key.split("|");
  return schedules.find(
    (s) => s.dayOfWeek === day && s.startTime === startTime && s.endTime === endTime,
  );
}

/**
 * How many months can be booked starting from startMonth given a schedule endDate?
 * Returns the count of months in [startMonth … endDate-month] inclusive, capped at 12.
 * If endDate is null (indefinite) returns 12.
 * This correctly shrinks when startMonth is later (e.g. May → July = 3, April → July = 4).
 */
function computeMaxMonths(endDate: string | null, startMonth: Date): number {
  if (!endDate) return 12;
  const end = new Date(endDate);
  const diff =
    (end.getFullYear() - startMonth.getFullYear()) * 12 +
    (end.getMonth() - startMonth.getMonth()) +
    1;
  return Math.max(1, Math.min(diff, 12));
}

type Plan = "TRIAL" | "ONCE" | "TWICE";

export function SubClassDetailClient({
  subClass,
}: {
  subClass: SubClassDetail;
}) {
  const router = useRouter();
  const accent = CLASS_ACCENT[subClass.class.name] ?? CLASS_ACCENT.default;

  // ── State ──────────────────────────────────────────────────────
  const [selectedTeacher, setSelectedTeacher] =
    useState<SubClassTeacherInfo | null>(
      subClass.teachers.length === 1 ? subClass.teachers[0] : null,
    );
  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [totalMonths, setTotalMonths] = useState<number>(1);
  // Each selected slot is identified by a composite key "DAY|startTime|endTime"
  // so two Friday slots at different times are treated as distinct selections.
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<string[]>([]);
  // The specific date+time the student picked from the availability calendar
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedSlotPickerKey, setSelectedSlotPickerKey] =
    useState<SlotKey | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Candidate months window — 4 months ahead from today
  const candidateMonths = useMemo(() => {
    const now = new Date();
    return [0, 1, 2, 3].map((i) => addMonths(startOfMonth(now), i));
  }, []);

  // ONCE: only show months where at least one teacher slot is still active
  const availableMonthsForOnce = useMemo(() => {
    if (!selectedTeacher) return candidateMonths;
    return candidateMonths.filter((month) =>
      selectedTeacher.schedules.some(
        (s) => !s.endDate || new Date(s.endDate) >= month,
      ),
    );
  }, [candidateMonths, selectedTeacher]);

  // TWICE: only show months where BOTH selected slots are still active
  const availableMonthsForTwice = useMemo(() => {
    if (!selectedTeacher || selectedSlotKeys.length < 2) return candidateMonths;
    return candidateMonths.filter((month) =>
      selectedSlotKeys.every((key) => {
        const s = scheduleForKey(selectedTeacher.schedules, key);
        return !s?.endDate || new Date(s.endDate) >= month;
      }),
    );
  }, [candidateMonths, selectedTeacher, selectedSlotKeys]);

  // Max months for ONCE — slot's own endDate relative to chosen start month
  const onceMaxMonths = useMemo(() => {
    if (!selectedMonth || selectedSlotKeys.length < 1 || !selectedTeacher) return 12;
    const s = scheduleForKey(selectedTeacher.schedules, selectedSlotKeys[0]);
    return computeMaxMonths(s?.endDate ?? null, selectedMonth);
  }, [selectedMonth, selectedSlotKeys, selectedTeacher]);

  // Max months for TWICE — min endDate across both selected slots + chosen start month
  const twiceMaxMonths = useMemo(() => {
    if (!selectedMonth || selectedSlotKeys.length < 2 || !selectedTeacher) return 12;
    const minEndDate = selectedSlotKeys.reduce<string | null>((min, key) => {
      const s = scheduleForKey(selectedTeacher.schedules, key);
      if (!s?.endDate) return min;
      return min === null || s.endDate < min ? s.endDate : min;
    }, null);
    return computeMaxMonths(minEndDate, selectedMonth);
  }, [selectedMonth, selectedSlotKeys, selectedTeacher]);

  const maxMonths =
    plan === "ONCE" ? onceMaxMonths : plan === "TWICE" ? twiceMaxMonths : 12;

  // Cap totalMonths whenever the effective limit shrinks
  useEffect(() => {
    if (totalMonths > maxMonths) setTotalMonths(maxMonths);
  }, [maxMonths, totalMonths]);

  // All schedule slots sorted by day then startTime
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

  // Derive preferredDays (day names) from selected slot keys for the server action
  const preferredDays = useMemo(
    () =>
      selectedSlotKeys
        .map((key) => key.split("|")[0])
        .filter(Boolean) as import("@prisma/client").DayOfWeek[],
    [selectedSlotKeys],
  );

  // Derive the actual ClassSchedule IDs for the selected slots
  // These are stored on the enrollment so capacity checks and slot display are exact
  const preferredSlotIds = useMemo(() => {
    if (!selectedTeacher) return [];
    return selectedSlotKeys
      .map((key) => {
        const [day, startTime, endTime] = key.split("|");
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

  const requiredDays = plan === "ONCE" ? 1 : plan === "TWICE" ? 2 : 0;

  const toggleSlot = (key: string) => {
    setSelectedSlotKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= requiredDays) return [...prev.slice(1), key];
      return [...prev, key];
    });
  };

  const monthlyPrice = useMemo(() => {
    if (plan === "TRIAL") return subClass.trialPrice;
    if (plan === "ONCE") return subClass.oncePriceMonthly ?? null;
    if (plan === "TWICE") return subClass.twicePriceMonthly ?? null;
    return null;
  }, [plan, subClass]);

  // Total price across all months
  const totalPrice = useMemo(() => {
    if (!monthlyPrice) return null;
    if (plan === "TRIAL") return monthlyPrice;
    return (parseFloat(monthlyPrice) * totalMonths).toFixed(3);
  }, [monthlyPrice, totalMonths, plan]);

  const isMultiMonth = plan !== "TRIAL" && totalMonths > 1;

  const canProceed = useMemo(() => {
    if (!selectedTeacher || !plan) return false;
    if (plan === "TRIAL") return !!selectedSlot;
    if (plan === "ONCE") return !!selectedMonth && selectedSlotKeys.length === 1;
    if (plan === "TWICE") return selectedSlotKeys.length === 2 && !!selectedMonth;
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
      const authRes = await fetch("/api/auth/check");
      const { authenticated, studentId } = await authRes.json();

      if (!authenticated) {
        router.push(
          `/login?redirect=${encodeURIComponent(`/reservation/${subClass.id}`)}`,
        );
        return;
      }

      let result;

      // Derive start month from the calendar-picked slot date when no
      // explicit month was chosen (single-month path defaults to slot's month)
      const slotDate = selectedSlot
        ? (() => {
            const [y, m, d] = selectedSlot.date.split("-").map(Number);
            return new Date(y, m - 1, d);
          })()
        : null;
      const effectiveMonth = selectedMonth ?? slotDate;
      // For non-trial paths, effectiveMonth must be set (canProceed guards this)
      const safeMonth = effectiveMonth ?? new Date();

      if (plan === "TRIAL") {
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
          frequency: plan === "ONCE" ? "ONCE_PER_WEEK" : "TWICE_PER_WEEK",
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
          frequency: plan === "ONCE" ? "ONCE_PER_WEEK" : "TWICE_PER_WEEK",
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
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const ctaLabel = useMemo(() => {
    if (!selectedTeacher) return "Select an Instructor";
    if (!plan) return "Select a Plan";
    if (plan === "TRIAL")
      return selectedSlot ? "Book Trial Session" : "Pick a Session Date";
    if (plan === "ONCE") {
      if (!selectedMonth) return "Select Starting Month";
      if (selectedSlotKeys.length < 1) return "Choose Your Preferred Day";
      return isMultiMonth ? `Enroll for ${totalMonths} Months` : "Proceed to Payment";
    }
    if (plan === "TWICE") {
      if (selectedSlotKeys.length < 2)
        return `Choose ${2 - selectedSlotKeys.length} More Slot${2 - selectedSlotKeys.length > 1 ? "s" : ""}`;
      if (!selectedMonth) return "Select Starting Month";
      return isMultiMonth ? `Enroll for ${totalMonths} Months` : "Proceed to Payment";
    }
    return "Proceed to Payment";
  }, [selectedTeacher, plan, selectedSlot, selectedMonth, selectedSlotKeys, isMultiMonth, totalMonths]);

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-royal-cream/40 hover:text-royal-cream text-sm mb-10 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          All Classes
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
          {/* ── LEFT ── */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Category + name */}
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8" style={{ background: accent }} />
              <p
                className="text-xs font-bold uppercase tracking-[0.25em]"
                style={{ color: accent }}
              >
                {subClass.class.name}
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-royal-cream font-goudy leading-none mb-6">
              {subClass.name}
            </h1>

            {/* Cover */}
            {subClass.coverUrl ? (
              <div className="rounded-2xl overflow-hidden h-56 mb-8">
                <img
                  src={subClass.coverUrl}
                  alt={subClass.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="rounded-2xl h-56 mb-8 flex items-center justify-center relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${accent}18, ${accent}06)`,
                  border: `1px solid ${accent}20`,
                }}
              >
                <svg
                  className="absolute inset-0 w-full h-full opacity-5"
                  viewBox="0 0 400 200"
                >
                  <defs>
                    <pattern
                      id="grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                      />
                    </pattern>
                  </defs>
                  <rect
                    width="400"
                    height="200"
                    fill="url(#grid)"
                    style={{ color: accent }}
                  />
                </svg>
                <span
                  className="text-8xl font-goudy font-bold opacity-10"
                  style={{ color: accent }}
                >
                  {subClass.name[0]}
                </span>
              </div>
            )}

            {subClass.description && (
              <p className="text-royal-cream/65 leading-relaxed text-base mb-8">
                {subClass.description}
              </p>
            )}

            {/* Detail chips */}
            <div className="grid grid-cols-2 gap-3 mb-10">
              <Chip
                icon={<Clock className="w-4 h-4" />}
                label="Duration"
                value={`${subClass.durationMinutes} minutes`}
                accent={accent}
              />
              {subClass.level && (
                <Chip
                  icon={<Award className="w-4 h-4" />}
                  label="Level"
                  value={subClass.level}
                  accent={accent}
                />
              )}
              {subClass.ageGroup && (
                <Chip
                  icon={<Users className="w-4 h-4" />}
                  label="Age Group"
                  value={subClass.ageGroup}
                  accent={accent}
                />
              )}
            </div>

            {/* Teachers */}
            {subClass.teachers.length > 0 && (
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <p
                    className="text-xs font-bold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: accent }}
                  >
                    {subClass.teachers.length === 1
                      ? "Instructor"
                      : "Choose Your Instructor"}
                  </p>
                  <div
                    className="h-px flex-1"
                    style={{
                      background: `linear-gradient(90deg, ${accent}40, transparent)`,
                    }}
                  />
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
                            ? { background: `${accent}12`, borderColor: accent }
                            : {
                                background: "rgba(255,255,255,0.02)",
                                borderColor: "rgba(255,255,255,0.08)",
                              }
                        }
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          {teacher.photoUrl ? (
                            <img
                              src={teacher.photoUrl}
                              alt={teacher.firstName}
                              className="w-14 h-14 rounded-2xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-royal-dark flex-shrink-0 font-goudy"
                              style={{
                                background: isSelected
                                  ? `linear-gradient(135deg, ${accent}, ${accent}88)`
                                  : "rgba(255,255,255,0.06)",
                                color: isSelected ? "#100e0c" : accent,
                              }}
                            >
                              {teacher.firstName[0]}
                              {teacher.lastName[0]}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-base font-bold font-goudy transition-colors"
                              style={{
                                color: isSelected
                                  ? "white"
                                  : "rgba(255,255,255,0.75)",
                              }}
                            >
                              {teacher.firstName} {teacher.lastName}
                            </h3>

                            {/* All schedule slots — one pill per slot, not per day */}
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
                                              background: `${accent}25`,
                                              border: `1px solid ${accent}40`,
                                            }
                                          : {
                                              background:
                                                "rgba(255,255,255,0.04)",
                                              border:
                                                "1px solid rgba(255,255,255,0.08)",
                                            }
                                      }
                                    >
                                      <span
                                        className="text-[10px] font-bold uppercase tracking-wider"
                                        style={{
                                          color: isSelected
                                            ? accent
                                            : "rgba(255,255,255,0.4)",
                                        }}
                                      >
                                        {DAY_LABELS[slot.dayOfWeek]}
                                      </span>
                                      <span
                                        className="text-[9px] mt-0.5"
                                        style={{
                                          color: isSelected
                                            ? `${accent}99`
                                            : "rgba(255,255,255,0.25)",
                                        }}
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
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/[0.06] text-royal-cream/40"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}

                            {teacher.bio && (
                              <p className="text-royal-cream/45 text-xs mt-2 leading-relaxed line-clamp-2">
                                {teacher.bio}
                              </p>
                            )}

                            {/* Schedule end warning */}
                            {teacher.maxBookableMonths != null &&
                              teacher.maxBookableMonths <= 3 && (
                                <p
                                  className="text-[10px] mt-2"
                                  style={{ color: "#f59e0b" }}
                                >
                                  Schedule available for{" "}
                                  {teacher.maxBookableMonths} more month
                                  {teacher.maxBookableMonths !== 1 ? "s" : ""}
                                </p>
                              )}
                          </div>

                          <div className="flex-shrink-0 self-center">
                            {isSelected ? (
                              <CheckCircle2
                                className="w-5 h-5"
                                style={{ color: accent }}
                              />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-royal-cream/20" />
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
              className="rounded-2xl overflow-hidden border"
              style={{
                background: "linear-gradient(145deg, #1a1610, #100e0c)",
                borderColor: `${accent}25`,
              }}
            >
              <div
                className="h-0.5"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                }}
              />

              <div className="p-6">
                <h2 className="text-xl font-bold text-royal-cream font-goudy mb-1">
                  Book This Class
                </h2>
                <p className="text-xs text-royal-cream/40 mb-6">
                  {!selectedTeacher
                    ? "Start by choosing an instructor"
                    : "Choose how you'd like to join"}
                </p>

                {/* Selected teacher reminder */}
                <AnimatePresence>
                  {selectedTeacher && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-5"
                    >
                      <div
                        className="flex items-center gap-3 p-3 rounded-xl border"
                        style={{
                          background: `${accent}10`,
                          borderColor: `${accent}30`,
                        }}
                      >
                        {selectedTeacher.photoUrl ? (
                          <img
                            src={selectedTeacher.photoUrl}
                            alt={selectedTeacher.firstName}
                            className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-royal-dark flex-shrink-0"
                            style={{ background: accent }}
                          >
                            {selectedTeacher.firstName[0]}
                            {selectedTeacher.lastName[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-royal-cream/40 leading-none mb-0.5">
                            Instructor
                          </p>
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: accent }}
                          >
                            {selectedTeacher.firstName}{" "}
                            {selectedTeacher.lastName}
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
                            className="text-[10px] text-royal-cream/30 hover:text-royal-cream/60 transition-colors flex-shrink-0"
                          >
                            Change
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── STEP 1: Plan selection ── */}
                <AnimatePresence>
                  {selectedTeacher && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-royal-cream/50 whitespace-nowrap">
                          Choose Plan
                        </p>
                        <div className="h-px flex-1 bg-white/[0.06]" />
                      </div>
                      <div className="space-y-3 mb-6">
                        {subClass.isTrialAvailable && (
                          <PlanOption
                            selected={plan === "TRIAL"}
                            onClick={() => {
                              setPlan("TRIAL");
                              setSelectedSlotKeys([]);
                              setSelectedMonth(null);
                              setTotalMonths(1);
                              setSelectedSlot(null);
                              setSelectedSlotPickerKey(null);
                            }}
                            accent={accent}
                            icon={<Sparkles className="w-4 h-4" />}
                            title="Trial Session"
                            subtitle="One-time taster class"
                            price={`${subClass.trialPrice} ${subClass.currency}`}
                            badge="One-time"
                          />
                        )}
                        {subClass.oncePriceMonthly && (
                          <PlanOption
                            selected={plan === "ONCE"}
                            onClick={() => {
                              setPlan("ONCE");
                              setSelectedSlotKeys([]);
                              setSelectedMonth(null);
                              setSelectedSlot(null);
                              setSelectedSlotPickerKey(null);
                            }}
                            accent={accent}
                            icon={<Calendar className="w-4 h-4" />}
                            title="Once a Week"
                            subtitle="4 sessions per month"
                            price={`${subClass.oncePriceMonthly} ${subClass.currency}/mo`}
                          />
                        )}
                        {subClass.twicePriceMonthly && (
                          <PlanOption
                            selected={plan === "TWICE"}
                            onClick={() => {
                              setPlan("TWICE");
                              setSelectedSlotKeys([]);
                              setSelectedMonth(null);
                              setTotalMonths(1);
                              setSelectedSlot(null);
                              setSelectedSlotPickerKey(null);
                            }}
                            accent={accent}
                            icon={<Crown className="w-4 h-4" />}
                            title="Twice a Week"
                            subtitle="8 sessions per month"
                            price={`${subClass.twicePriceMonthly} ${subClass.currency}/mo`}
                            badge="Best value"
                          />
                        )}
                      </div>

                      {/* ── STEP 2: Plan-specific selections ── */}
                      <AnimatePresence mode="wait">
                        {/* TRIAL — calendar picker */}
                        {plan === "TRIAL" && (
                          <motion.div
                            key="trial"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-5"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <p className="text-xs font-bold uppercase tracking-widest text-royal-cream/50 whitespace-nowrap">
                                Pick Your Session
                              </p>
                              <div className="h-px flex-1 bg-white/[0.06]" />
                            </div>
                            <TeacherAvailabilityPicker
                              teacher={selectedTeacher}
                              accent={accent}
                              selected={selectedSlotPickerKey}
                              onSelect={(slot) => {
                                setSelectedSlot(slot);
                                setSelectedSlotPickerKey(slotKey(slot));
                              }}
                            />
                          </motion.div>
                        )}

                        {/* ONCE — start month → filtered slot → duration */}
                        {plan === "ONCE" && (
                          <motion.div
                            key="once"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-5"
                          >
                            {/* Step 1: Starting month */}
                            <p className="text-xs font-bold uppercase tracking-widest text-royal-cream/50 mb-3">
                              Starting Month
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
                                        ? { background: `${accent}20`, borderColor: accent, color: accent }
                                        : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }
                                    }
                                  >
                                    {format(month, "MMM yyyy")}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Step 2: Slot picker (only slots active in selected month) */}
                            <AnimatePresence>
                              {selectedMonth && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <p className="text-xs font-bold uppercase tracking-widest text-royal-cream/50 whitespace-nowrap">
                                      Preferred Day &amp; Time
                                    </p>
                                    <div className="h-px flex-1 bg-white/[0.06]" />
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
                                                ? { background: `${accent}20`, borderColor: accent }
                                                : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }
                                            }
                                          >
                                            <span
                                              className="text-xs font-bold uppercase tracking-wider"
                                              style={{ color: isSel ? accent : "rgba(255,255,255,0.4)" }}
                                            >
                                              {DAY_LABELS[slot.dayOfWeek]}
                                            </span>
                                            <span
                                              className="text-[9px] mt-0.5"
                                              style={{ color: isSel ? `${accent}99` : "rgba(255,255,255,0.25)" }}
                                            >
                                              {slot.startTime}–{slot.endTime}
                                            </span>
                                          </button>
                                        );
                                      })}
                                  </div>

                                  {/* Step 3: Duration (revealed once slot picked) */}
                                  <AnimatePresence>
                                    {selectedSlotKeys.length === 1 && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <DurationPicker
                                          totalMonths={totalMonths}
                                          maxMonths={onceMaxMonths}
                                          accent={accent}
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

                        {/* TWICE — pick 2 slots, then starting month, then duration */}
                        {plan === "TWICE" && (
                          <motion.div
                            key="twice"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-5"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <p className="text-xs font-bold uppercase tracking-widest text-royal-cream/50 whitespace-nowrap">
                                Choose Two Sessions
                              </p>
                              <div className="h-px flex-1 bg-white/[0.06]" />
                            </div>
                            <p className="text-[11px] text-royal-cream/35 mb-3">
                              Select two weekly slots from all available times.
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
                                            background: `${accent}20`,
                                            borderColor: accent,
                                          }
                                        : {
                                            background: "rgba(255,255,255,0.02)",
                                            borderColor: "rgba(255,255,255,0.08)",
                                          }
                                    }
                                  >
                                    <span
                                      className="text-xs font-bold uppercase tracking-wider"
                                      style={{
                                        color: isSel
                                          ? accent
                                          : "rgba(255,255,255,0.4)",
                                      }}
                                    >
                                      {DAY_LABELS[slot.dayOfWeek]}
                                    </span>
                                    <span
                                      className="text-[9px] mt-0.5"
                                      style={{
                                        color: isSel
                                          ? `${accent}99`
                                          : "rgba(255,255,255,0.25)",
                                      }}
                                    >
                                      {slot.startTime}–{slot.endTime}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Starting month — revealed once 2 slots picked */}
                            <AnimatePresence>
                              {selectedSlotKeys.length === 2 && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <p className="text-xs font-bold uppercase tracking-widest text-royal-cream/50 mb-3">
                                    Starting Month
                                  </p>
                                  <div className="grid grid-cols-2 gap-2 mb-5">
                                    {availableMonthsForTwice.map((month) => {
                                      const isSel =
                                        selectedMonth?.getTime() ===
                                        month.getTime();
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
                                                  background: `${accent}20`,
                                                  borderColor: accent,
                                                  color: accent,
                                                }
                                              : {
                                                  background:
                                                    "rgba(255,255,255,0.02)",
                                                  borderColor:
                                                    "rgba(255,255,255,0.08)",
                                                  color: "rgba(255,255,255,0.5)",
                                                }
                                          }
                                        >
                                          {format(month, "MMM yyyy")}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Duration — revealed once month picked */}
                                  <AnimatePresence>
                                    {selectedMonth && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                      >
                                        <DurationPicker
                                          totalMonths={totalMonths}
                                          maxMonths={twiceMaxMonths}
                                          accent={accent}
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
                          style={{
                            background: `${accent}08`,
                            borderColor: `${accent}20`,
                          }}
                        >
                          {isMultiMonth ? (
                            <>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-royal-cream/60">
                                  Total ({totalMonths} months)
                                </span>
                                <span
                                  className="text-2xl font-bold font-goudy"
                                  style={{ color: accent }}
                                >
                                  {totalPrice}{" "}
                                  <span className="text-sm font-normal text-royal-cream/40">
                                    {subClass.currency}
                                  </span>
                                </span>
                              </div>
                              <p className="text-xs text-royal-cream/30">
                                {monthlyPrice} {subClass.currency}/mo
                                {selectedSlotKeys.length > 0 &&
                                  ` · ${selectedSlotKeys
                                    .map((k) => {
                                      const [day, st, et] = k.split("|");
                                      return `${DAY_LABELS[day] ?? day} ${st}–${et}`;
                                    })
                                    .join(" & ")}`}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-royal-cream/60">
                                  Total
                                </span>
                                <span
                                  className="text-2xl font-bold font-goudy"
                                  style={{ color: accent }}
                                >
                                  {totalPrice}{" "}
                                  <span className="text-sm font-normal text-royal-cream/40">
                                    {subClass.currency}
                                  </span>
                                </span>
                              </div>
                              {plan !== "TRIAL" && selectedMonth && (
                                <p className="text-xs text-royal-cream/30 mt-1">
                                  for {format(selectedMonth, "MMMM yyyy")}
                                  {selectedSlotKeys.length > 0 &&
                                    ` · ${selectedSlotKeys
                                      .map((k) => {
                                        const [day, st, et] = k.split("|");
                                        return `${DAY_LABELS[day] ?? day} ${st}–${et}`;
                                      })
                                      .join(" & ")}`}
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
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA */}
                <button
                  onClick={handleProceed}
                  disabled={!canProceed || isLoading}
                  className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={
                    canProceed
                      ? {
                          background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
                          color: "#100e0c",
                          boxShadow: `0 8px 24px ${accent}33`,
                        }
                      : {
                          background: "rgba(255,255,255,0.05)",
                          color: "rgba(255,255,255,0.3)",
                        }
                  }
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    ctaLabel
                  )}
                </button>

                <div className="flex items-center justify-center gap-3 mt-5 opacity-30">
                  <div className="h-px w-12" style={{ background: accent }} />
                  <div
                    className="w-1 h-1 rotate-45"
                    style={{ background: accent }}
                  />
                  <div className="h-px w-12" style={{ background: accent }} />
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

function Chip({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border"
      style={{ background: `${accent}06`, borderColor: `${accent}18` }}
    >
      <div className="mt-0.5 flex-shrink-0" style={{ color: accent }}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] text-royal-cream/35 uppercase tracking-wider leading-none mb-1">
          {label}
        </p>
        <p className="text-sm text-royal-cream/80 font-medium">{value}</p>
      </div>
    </div>
  );
}

function PlanOption({
  selected,
  onClick,
  accent,
  icon,
  title,
  subtitle,
  price,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  accent: string;
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
          ? { background: `${accent}14`, borderColor: accent }
          : {
              background: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.08)",
            }
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: selected ? `${accent}25` : "rgba(255,255,255,0.04)",
              color: selected ? accent : "rgba(255,255,255,0.3)",
            }}
          >
            {icon}
          </div>
          <div>
            <p
              className={`text-sm font-bold transition-colors ${selected ? "text-royal-cream" : "text-royal-cream/60"}`}
            >
              {title}
            </p>
            <p className="text-[10px] text-royal-cream/35">{subtitle}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p
            className="text-sm font-bold font-goudy"
            style={{ color: selected ? accent : "rgba(255,255,255,0.4)" }}
          >
            {price}
          </p>
          {badge && (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
              style={{ background: `${accent}20`, color: accent }}
            >
              {badge}
            </span>
          )}
        </div>
      </div>
      {selected && (
        <div className="absolute right-3 top-3">
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
      )}
    </button>
  );
}

function DurationPicker({
  totalMonths,
  maxMonths,
  accent,
  selectedMonth,
  onChange,
}: {
  totalMonths: number;
  maxMonths: number;
  accent: string;
  selectedMonth: Date | null;
  onChange: (n: number) => void;
}) {
  if (maxMonths <= 1) return null;
  const lastMonth = selectedMonth ? addMonths(selectedMonth, maxMonths - 1) : null;
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-royal-cream/50">
            Duration
          </p>
          <p className="text-[10px] text-royal-cream/30 mt-0.5">
            Up to {maxMonths} month{maxMonths !== 1 ? "s" : ""}
            {lastMonth ? ` · ends ${format(lastMonth, "MMM yyyy")}` : ""}
          </p>
        </div>
        <div
          className="flex items-center gap-1 px-1 rounded-xl border"
          style={{
            borderColor: "rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={() => onChange(Math.max(1, totalMonths - 1))}
            disabled={totalMonths <= 1}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-royal-cream/40 hover:text-royal-cream disabled:opacity-20 transition-colors"
          >
            −
          </button>
          <span
            className="w-8 text-center text-sm font-bold"
            style={{ color: accent }}
          >
            {totalMonths}
          </span>
          <button
            onClick={() => onChange(Math.min(maxMonths, totalMonths + 1))}
            disabled={totalMonths >= maxMonths}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-royal-cream/40 hover:text-royal-cream disabled:opacity-20 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {totalMonths > 1 && selectedMonth && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-2"
          style={{ background: `${accent}08`, borderColor: `${accent}20` }}
        >
          <p className="text-xs" style={{ color: accent }}>
            {format(selectedMonth, "MMM yyyy")}
            {" → "}
            {format(addMonths(selectedMonth, totalMonths - 1), "MMM yyyy")}
            <span className="text-royal-cream/40 ml-1">· {totalMonths} months</span>
          </p>
        </div>
      )}
    </div>
  );
}
