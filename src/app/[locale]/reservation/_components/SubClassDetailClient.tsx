"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SubClassDetail } from "@/lib/actions/classes";
import {
  createMonthlyEnrollment,
  createTrialEnrollment,
} from "@/lib/actions/enrollment";
import {
  ChevronLeft,
  Clock,
  MapPin,
  Award,
  Users,
  Crown,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
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

type Plan = "TRIAL" | "ONCE" | "TWICE";

interface SubClassDetailClientProps {
  subClass: SubClassDetail;
}

export function SubClassDetailClient({ subClass }: SubClassDetailClientProps) {
  const router = useRouter();
  const accent = CLASS_ACCENT[subClass.class.name] ?? CLASS_ACCENT.default;

  const [plan, setPlan] = useState<Plan | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate next 4 months
  const availableMonths = useMemo(() => {
    const now = new Date();
    return [0, 1, 2, 3].map((i) => addMonths(startOfMonth(now), i));
  }, []);

  const sortedAvailableDays = useMemo(
    () => DAY_ORDER.filter((d) => subClass.availableDays.includes(d)),
    [subClass.availableDays],
  );

  const requiredDays = plan === "ONCE" ? 1 : plan === "TWICE" ? 2 : 0;

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      if (prev.length >= requiredDays) return [...prev.slice(1), day];
      return [...prev, day];
    });
  };

  const price = useMemo(() => {
    if (plan === "TRIAL") return subClass.trialPrice;
    if (plan === "ONCE") return subClass.oncePriceMonthly ?? null;
    if (plan === "TWICE") return subClass.twicePriceMonthly ?? null;
    return null;
  }, [plan, subClass]);

  const canProceed = useMemo(() => {
    if (!plan) return false;
    if (plan === "TRIAL") return true;
    if (!selectedMonth) return false;
    if (selectedDays.length !== requiredDays) return false;
    return true;
  }, [plan, selectedMonth, selectedDays, requiredDays]);

  const handleProceed = async () => {
    if (!canProceed || !plan) return;
    setIsLoading(true);
    setError(null);

    try {
      // Check auth
      const authRes = await fetch("/api/auth/check");
      const { authenticated, studentId } = await authRes.json();

      if (!authenticated) {
        const redirectUrl = `/reservation/${subClass.id}`;
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        return;
      }

      let result;

      if (plan === "TRIAL") {
        result = await createTrialEnrollment({
          studentId,
          subClassId: subClass.id,
        });
      } else {
        result = await createMonthlyEnrollment({
          studentId,
          subClassId: subClass.id,
          month: selectedMonth!.getMonth() + 1,
          year: selectedMonth!.getFullYear(),
          frequency: plan === "ONCE" ? "ONCE_PER_WEEK" : "TWICE_PER_WEEK",
          preferredDays: selectedDays,
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
          {/* ── LEFT: class info ── */}
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

            {/* Description */}
            {subClass.description && (
              <div className="mb-8">
                <p className="text-royal-cream/65 leading-relaxed text-base">
                  {subClass.description}
                </p>
              </div>
            )}

            {/* Details chips */}
            <div className="grid grid-cols-2 gap-3 mb-8">
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

            {/* Teacher */}
            {subClass.teacher && (
              <div
                className="rounded-2xl p-6 border"
                style={{
                  background: `${accent}08`,
                  borderColor: `${accent}20`,
                }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: accent }}
                >
                  Your Instructor
                </p>
                <div className="flex items-start gap-4">
                  {subClass.teacher.photoUrl ? (
                    <img
                      src={subClass.teacher.photoUrl}
                      alt={subClass.teacher.firstName}
                      className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-royal-dark flex-shrink-0 font-goudy"
                      style={{
                        background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
                      }}
                    >
                      {subClass.teacher.firstName[0]}
                      {subClass.teacher.lastName[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-royal-cream font-goudy">
                      {subClass.teacher.firstName} {subClass.teacher.lastName}
                    </h3>
                    {subClass.teacher.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {subClass.teacher.specialties.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-royal-cream/50"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {subClass.teacher.bio && (
                      <p className="text-royal-cream/55 text-sm mt-3 leading-relaxed">
                        {subClass.teacher.bio}
                      </p>
                    )}
                  </div>
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
              {/* Gold top bar */}
              <div
                className="h-0.5"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                }}
              />

              <div className="p-6">
                <h2 className="text-xl font-bold text-royal-cream font-goudy mb-1">
                  Choose Your Plan
                </h2>
                <p className="text-xs text-royal-cream/40 mb-6">
                  Select how you&apos;d like to join this class
                </p>

                {/* ── Plan selector ── */}
                <div className="space-y-3 mb-6">
                  {/* Trial */}
                  {subClass.isTrialAvailable && (
                    <PlanOption
                      selected={plan === "TRIAL"}
                      onClick={() => {
                        setPlan("TRIAL");
                        setSelectedMonth(null);
                        setSelectedDays([]);
                      }}
                      accent={accent}
                      icon={<Sparkles className="w-4 h-4" />}
                      title="Trial Session"
                      subtitle="One-time taster class"
                      price={`${subClass.trialPrice} ${subClass.currency}`}
                      badge="One-time"
                    />
                  )}

                  {/* Once a week */}
                  {subClass.oncePriceMonthly && (
                    <PlanOption
                      selected={plan === "ONCE"}
                      onClick={() => {
                        setPlan("ONCE");
                        setSelectedDays([]);
                      }}
                      accent={accent}
                      icon={<Calendar className="w-4 h-4" />}
                      title="Once a Week"
                      subtitle="4 sessions per month"
                      price={`${subClass.oncePriceMonthly} ${subClass.currency}/mo`}
                    />
                  )}

                  {/* Twice a week */}
                  {subClass.twicePriceMonthly && (
                    <PlanOption
                      selected={plan === "TWICE"}
                      onClick={() => {
                        setPlan("TWICE");
                        setSelectedDays([]);
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

                {/* ── Month picker (monthly plans) ── */}
                <AnimatePresence>
                  {plan && plan !== "TRIAL" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mb-6">
                        <p className="text-xs font-bold uppercase tracking-widest text-royal-cream/50 mb-3">
                          Select Month
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {availableMonths.map((month) => {
                            const isSelected =
                              selectedMonth?.getTime() === month.getTime();
                            return (
                              <button
                                key={month.toISOString()}
                                onClick={() => setSelectedMonth(month)}
                                className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 border"
                                style={
                                  isSelected
                                    ? {
                                        background: `${accent}20`,
                                        borderColor: accent,
                                        color: accent,
                                      }
                                    : {
                                        background: "rgba(255,255,255,0.02)",
                                        borderColor: "rgba(255,255,255,0.08)",
                                        color: "rgba(255,255,255,0.5)",
                                      }
                                }
                              >
                                {format(month, "MMM yyyy")}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* ── Day picker ── */}
                      {sortedAvailableDays.length > 0 && (
                        <div className="mb-6">
                          <p className="text-xs font-bold uppercase tracking-widest text-royal-cream/50 mb-1">
                            Preferred Day{requiredDays > 1 ? "s" : ""}
                          </p>
                          <p className="text-[10px] text-royal-cream/30 mb-3">
                            {requiredDays === 1
                              ? "Choose 1 day"
                              : "Choose 2 days"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sortedAvailableDays.map((day) => {
                              const isSelected = selectedDays.includes(day);
                              return (
                                <button
                                  key={day}
                                  onClick={() => toggleDay(day)}
                                  className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border"
                                  style={
                                    isSelected
                                      ? {
                                          background: `${accent}20`,
                                          borderColor: accent,
                                          color: accent,
                                        }
                                      : {
                                          background: "rgba(255,255,255,0.02)",
                                          borderColor: "rgba(255,255,255,0.08)",
                                          color: "rgba(255,255,255,0.4)",
                                        }
                                  }
                                >
                                  {DAY_LABELS[day]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Price summary ── */}
                {plan && price && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl p-4 mb-5 border"
                    style={{
                      background: `${accent}08`,
                      borderColor: `${accent}20`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-royal-cream/60">Total</span>
                      <span
                        className="text-2xl font-bold font-goudy"
                        style={{ color: accent }}
                      >
                        {price}{" "}
                        <span className="text-sm font-normal text-royal-cream/40">
                          {subClass.currency}
                        </span>
                      </span>
                    </div>
                    {plan !== "TRIAL" && selectedMonth && (
                      <p className="text-xs text-royal-cream/30 mt-1">
                        for {format(selectedMonth, "MMMM yyyy")}
                        {selectedDays.length > 0 &&
                          ` · ${selectedDays.map((d) => DAY_LABELS[d]).join(" & ")}`}
                      </p>
                    )}
                  </motion.div>
                )}

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
                  className="w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
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
                  ) : !plan ? (
                    "Select a Plan"
                  ) : plan === "TRIAL" ? (
                    "Book Trial Session"
                  ) : !selectedMonth ? (
                    "Select a Month"
                  ) : selectedDays.length < requiredDays ? (
                    `Choose ${requiredDays - selectedDays.length} More Day${requiredDays - selectedDays.length > 1 ? "s" : ""}`
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>

                {/* Ornamental divider */}
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

// ── Helper components ──────────────────────────────────────────────

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
      className="w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden"
      style={
        selected
          ? {
              background: `${accent}14`,
              borderColor: accent,
            }
          : {
              background: "rgba(255,255,255,0.02)",
              borderColor: "rgba(255,255,255,0.08)",
            }
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
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
