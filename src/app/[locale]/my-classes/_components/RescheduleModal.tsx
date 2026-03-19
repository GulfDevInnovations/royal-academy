"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  User,
  ChevronLeft,
} from "lucide-react";
import { performReschedule } from "@/lib/actions/reschedule";
import type { EnrolledClass } from "./MyClassesClient";

// ─────────────────────────────────────────────
// Types from API
// ─────────────────────────────────────────────

type SessionRow = {
  sessionId: string;
  sessionDate: string;
  sessionDatetime: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  teacher: { id: string; firstName: string; lastName: string } | null;
  bookingId: string | null;
  bookingStatus: string | null;
};

type SlotRow = {
  sessionId: string;
  sessionDate: string;
  sessionDatetime: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  currentEnrolled: number;
  capacity: number;
  teacher: { id: string; firstName: string; lastName: string } | null;
};

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};
const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${DAY_SHORT[getDayKey(d)] ?? d.toLocaleDateString("en-US", { weekday: "short" })}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getDayKey(d: Date) {
  const keys = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  return keys[d.getDay()];
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface Props {
  enrollment: EnrolledClass;
  accentColor: string;
  onClose: () => void;
  onSuccess: () => void;
}

// ─────────────────────────────────────────────
// Steps
// ─────────────────────────────────────────────
// 1 → pick session to reschedule
// 2 → pick new slot
// 3 → confirm summary
// 4 → result (success / error)

type Step = 1 | 2 | 3 | 4;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function RescheduleModal({
  enrollment,
  accentColor: ac,
  onClose,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>(1);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(
    null,
  );
  const [selectedSlot, setSelectedSlot] = useState<SlotRow | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null,
  );

  // ── Fetch step 1: remaining sessions ──────────────────────────────────────
  useEffect(() => {
    setLoadingSessions(true);
    fetch(
      `/api/reschedule/sessions?enrollmentId=${enrollment.enrollmentId}&enrollmentType=${enrollment.enrollmentType}`,
    )
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }, [enrollment.enrollmentId, enrollment.enrollmentType]);

  // ── Fetch step 2: available slots for the selected session ────────────────
  const fetchSlots = useCallback(
    async (session: SessionRow) => {
      setLoadingSlots(true);
      try {
        // Pass bookingId when available; fall back to sessionId for enrollments
        // that don't have pre-created Booking rows.
        const idParam = session.bookingId
          ? `bookingId=${session.bookingId}`
          : `sessionId=${session.sessionId}`;

        const r = await fetch(
          `/api/reschedule/available-slots?${idParam}&enrollmentId=${enrollment.enrollmentId}&enrollmentType=${enrollment.enrollmentType}`,
        );
        const data = await r.json();
        setSlots(data.slots ?? []);
      } catch {
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [enrollment.enrollmentId, enrollment.enrollmentType],
  );

  // ── Submit reschedule ──────────────────────────────────────────────────────
  async function submit() {
    if (!selectedSession || !selectedSlot) return;
    setSubmitting(true);
    // Pass bookingId if it exists; otherwise pass null + oldSessionId so the
    // server action can handle the "no pre-existing booking" case.
    const res = await performReschedule(
      selectedSession.bookingId ?? null,
      selectedSlot.sessionId,
      selectedSession.bookingId ? undefined : selectedSession.sessionId,
    );
    setSubmitting(false);
    if (res.success) {
      setResult({
        ok: true,
        message: "Your session has been successfully rescheduled.",
      });
    } else {
      setResult({ ok: false, message: res.error });
    }
    setStep(4);
  }

  // ── Backdrop close ────────────────────────────────────────────────────────
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
      >
        <motion.div
          className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #1c1812 0%, #100e0c 100%)",
            border: `1px solid ${ac}25`,
            maxHeight: "90dvh",
          }}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          {/* Accent bar */}
          <div
            className="h-0.5 w-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${ac}, transparent)`,
            }}
          />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-3">
              {step > 1 && step < 4 && (
                <button
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ color: `${ac}80` }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" style={{ color: ac }} />
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: `${ac}99` }}
                  >
                    Reschedule
                  </span>
                </div>
                <h2 className="text-lg font-bold text-royal-cream font-goudy leading-tight">
                  {enrollment.subClass.name}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-royal-cream/30 hover:text-royal-cream/60 hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step indicator */}
          {step < 4 && (
            <div className="px-5 pb-3">
              <StepBar step={step} ac={ac} />
            </div>
          )}

          {/* Content */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(90dvh - 130px)" }}
          >
            <AnimatePresence mode="wait">
              {step === 1 && (
                <StepOne
                  key="step1"
                  ac={ac}
                  sessions={sessions}
                  loading={loadingSessions}
                  onSelect={(s) => {
                    setSelectedSession(s);
                    fetchSlots(s);
                    setStep(2);
                  }}
                />
              )}
              {step === 2 && selectedSession && (
                <StepTwo
                  key="step2"
                  ac={ac}
                  oldSession={selectedSession}
                  slots={slots}
                  loading={loadingSlots}
                  onSelect={(sl) => {
                    setSelectedSlot(sl);
                    setStep(3);
                  }}
                />
              )}
              {step === 3 && selectedSession && selectedSlot && (
                <StepThree
                  key="step3"
                  ac={ac}
                  oldSession={selectedSession}
                  newSlot={selectedSlot}
                  submitting={submitting}
                  onConfirm={submit}
                />
              )}
              {step === 4 && result && (
                <StepFour
                  key="step4"
                  ac={ac}
                  result={result}
                  onClose={() => {
                    if (result.ok) onSuccess();
                    else onClose();
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// Step Bar
// ─────────────────────────────────────────────

function StepBar({ step, ac }: { step: Step; ac: string }) {
  const labels = ["Select Session", "New Slot", "Confirm"];
  return (
    <div className="flex items-center gap-1">
      {labels.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className="flex items-center gap-1.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all"
                style={{
                  background: done
                    ? ac
                    : active
                      ? `${ac}25`
                      : "rgba(255,255,255,0.05)",
                  color: done
                    ? "#100e0c"
                    : active
                      ? ac
                      : "rgba(255,255,255,0.3)",
                  border: active ? `1px solid ${ac}` : "1px solid transparent",
                }}
              >
                {done ? "✓" : idx}
              </div>
              <span
                className="text-[10px] hidden sm:block transition-colors"
                style={{
                  color: active
                    ? ac
                    : done
                      ? `${ac}80`
                      : "rgba(255,255,255,0.25)",
                }}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div
                className="flex-1 h-px mx-1"
                style={{
                  background: done ? `${ac}40` : "rgba(255,255,255,0.08)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Step 1: Pick session to reschedule
// ─────────────────────────────────────────────

function StepOne({
  ac,
  sessions,
  loading,
  onSelect,
}: {
  ac: string;
  sessions: SessionRow[];
  loading: boolean;
  onSelect: (s: SessionRow) => void;
}) {
  // Show all upcoming sessions: ones with a CONFIRMED booking AND ones with
  // no booking yet (null) — monthly enrollments may not pre-create Booking rows.
  const reschedulable = sessions.filter(
    (s) => s.bookingStatus === "CONFIRMED" || s.bookingStatus === null,
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-5 pb-6"
    >
      <p className="text-xs text-royal-cream/40 mb-4 leading-relaxed">
        Select the session you want to move to a different time.
      </p>

      {loading ? (
        <LoadingSpinner ac={ac} />
      ) : reschedulable.length === 0 ? (
        <EmptyNotice
          icon={<Calendar className="w-5 h-5" />}
          title="No sessions to reschedule"
          body="You have no upcoming confirmed sessions for this class."
          ac={ac}
        />
      ) : (
        <div className="space-y-2">
          {reschedulable.map((s) => (
            <button
              key={s.sessionId}
              onClick={() => onSelect(s)}
              className="w-full text-left group"
            >
              <div
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all border"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: "rgba(255,255,255,0.06)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    `${ac}40`;
                  (e.currentTarget as HTMLDivElement).style.background =
                    `${ac}08`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(255,255,255,0.06)";
                  (e.currentTarget as HTMLDivElement).style.background =
                    "rgba(255,255,255,0.02)";
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${ac}12` }}
                >
                  <Calendar className="w-4 h-4" style={{ color: ac }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-royal-cream truncate">
                    {fmtDate(s.sessionDate)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-royal-cream/40 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {s.startTime} – {s.endTime}
                    </span>
                    {s.teacher && (
                      <>
                        <span className="text-royal-cream/20">·</span>
                        <span className="text-xs text-royal-cream/40 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {s.teacher.firstName} {s.teacher.lastName}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-royal-cream/20 group-hover:text-royal-cream/50 transition-colors flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Step 2: Pick new slot
// ─────────────────────────────────────────────

function StepTwo({
  ac,
  oldSession,
  slots,
  loading,
  onSelect,
}: {
  ac: string;
  oldSession: SessionRow;
  slots: SlotRow[];
  loading: boolean;
  onSelect: (s: SlotRow) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-5 pb-6"
    >
      {/* Current session pill */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="text-xs text-royal-cream/30 flex-1">
          Moving from
          <span className="block text-royal-cream/60 font-semibold">
            {fmtDate(oldSession.sessionDate)} · {oldSession.startTime}–
            {oldSession.endTime}
          </span>
        </div>
        <ArrowRight className="w-4 h-4" style={{ color: `${ac}60` }} />
      </div>

      <p className="text-xs text-royal-cream/40 mb-4 leading-relaxed">
        Choose a new time slot with the same teacher within your enrolled
        period.
      </p>

      {loading ? (
        <LoadingSpinner ac={ac} />
      ) : slots.length === 0 ? (
        <EmptyNotice
          icon={<AlertTriangle className="w-5 h-5" />}
          title="No available slots"
          body="There are no other available sessions with your teacher during your enrolled period."
          ac={ac}
        />
      ) : (
        <div className="space-y-2">
          {slots.map((sl) => {
            const spotsLeft = sl.capacity - sl.currentEnrolled;
            return (
              <button
                key={sl.sessionId}
                onClick={() => onSelect(sl)}
                className="w-full text-left group"
              >
                <div
                  className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all border"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    borderColor: "rgba(255,255,255,0.06)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      `${ac}40`;
                    (e.currentTarget as HTMLDivElement).style.background =
                      `${ac}08`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor =
                      "rgba(255,255,255,0.06)";
                    (e.currentTarget as HTMLDivElement).style.background =
                      "rgba(255,255,255,0.02)";
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${ac}12` }}
                  >
                    <Clock className="w-4 h-4" style={{ color: ac }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-royal-cream truncate">
                      {fmtDate(sl.sessionDate)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-royal-cream/40 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {sl.startTime} – {sl.endTime}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{
                        background:
                          spotsLeft <= 2 ? "rgba(251,146,60,0.12)" : `${ac}12`,
                        color: spotsLeft <= 2 ? "#fb923c" : ac,
                      }}
                    >
                      {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                    </span>
                    <ChevronRight className="w-4 h-4 text-royal-cream/20 group-hover:text-royal-cream/50 transition-colors mt-1" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Step 3: Confirm
// ─────────────────────────────────────────────

function StepThree({
  ac,
  oldSession,
  newSlot,
  submitting,
  onConfirm,
}: {
  ac: string;
  oldSession: SessionRow;
  newSlot: SlotRow;
  submitting: boolean;
  onConfirm: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-5 pb-6"
    >
      <p className="text-xs text-royal-cream/40 mb-5 leading-relaxed">
        Review the change before confirming. This action cannot be undone.
      </p>

      {/* Comparison card */}
      <div
        className="rounded-2xl overflow-hidden mb-5"
        style={{ border: `1px solid ${ac}20` }}
      >
        {/* OLD */}
        <div
          className="px-4 py-4"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <p className="text-[9px] font-bold uppercase tracking-widest text-royal-cream/30 mb-2">
            Current Session
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <Calendar className="w-4 h-4 text-royal-cream/30" />
            </div>
            <div>
              <p className="text-sm font-semibold text-royal-cream/70">
                {fmtDate(oldSession.sessionDate)}
              </p>
              <p className="text-xs text-royal-cream/30">
                {oldSession.startTime} – {oldSession.endTime}
              </p>
            </div>
          </div>
        </div>

        {/* Arrow divider */}
        <div
          className="flex items-center justify-center py-2"
          style={{
            background: `${ac}08`,
            borderTop: `1px solid ${ac}15`,
            borderBottom: `1px solid ${ac}15`,
          }}
        >
          <div className="flex items-center gap-2">
            <div className="h-px w-8" style={{ background: `${ac}40` }} />
            <ArrowRight className="w-4 h-4" style={{ color: ac }} />
            <div className="h-px w-8" style={{ background: `${ac}40` }} />
          </div>
        </div>

        {/* NEW */}
        <div className="px-4 py-4" style={{ background: `${ac}05` }}>
          <p
            className="text-[9px] font-bold uppercase tracking-widest mb-2"
            style={{ color: `${ac}80` }}
          >
            New Session
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${ac}15` }}
            >
              <Calendar className="w-4 h-4" style={{ color: ac }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-royal-cream">
                {fmtDate(newSlot.sessionDate)}
              </p>
              <p className="text-xs text-royal-cream/50">
                {newSlot.startTime} – {newSlot.endTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teacher */}
      {newSlot.teacher && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: `${ac}12` }}
          >
            <User className="w-3.5 h-3.5" style={{ color: ac }} />
          </div>
          <div>
            <p className="text-[10px] text-royal-cream/30 uppercase tracking-wider">
              Teacher
            </p>
            <p className="text-sm text-royal-cream/70 font-medium">
              {newSlot.teacher.firstName} {newSlot.teacher.lastName}
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onConfirm}
        disabled={submitting}
        className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        style={{
          background: `linear-gradient(135deg, ${ac}, ${ac}bb)`,
          color: "#100e0c",
        }}
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            Confirm Reschedule
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Step 4: Result
// ─────────────────────────────────────────────

function StepFour({
  ac,
  result,
  onClose,
}: {
  ac: string;
  result: { ok: boolean; message: string };
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-5 pb-8 pt-4 flex flex-col items-center text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: result.ok ? `${ac}12` : "rgba(239,68,68,0.1)",
          border: `1px solid ${result.ok ? ac : "#ef4444"}30`,
        }}
      >
        {result.ok ? (
          <CheckCircle2 className="w-7 h-7" style={{ color: ac }} />
        ) : (
          <AlertTriangle className="w-7 h-7 text-red-400" />
        )}
      </div>
      <h3 className="text-xl font-bold text-royal-cream font-goudy mb-2">
        {result.ok ? "Session Rescheduled!" : "Something went wrong"}
      </h3>
      <p className="text-sm text-royal-cream/40 mb-8 leading-relaxed max-w-xs">
        {result.message}
      </p>
      <button
        onClick={onClose}
        className="px-8 py-3 rounded-2xl text-sm font-bold transition-all"
        style={{
          background: result.ok
            ? `linear-gradient(135deg, ${ac}, ${ac}bb)`
            : "rgba(255,255,255,0.08)",
          color: result.ok ? "#100e0c" : "rgba(255,255,255,0.6)",
        }}
      >
        {result.ok ? "Done" : "Close"}
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function LoadingSpinner({ ac }: { ac: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: `${ac}60` }} />
    </div>
  );
}

function EmptyNotice({
  icon,
  title,
  body,
  ac,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  ac: string;
}) {
  return (
    <div
      className="flex flex-col items-center text-center py-10 px-4 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${ac}10`, color: `${ac}60` }}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold text-royal-cream/60 mb-1">{title}</p>
      <p className="text-xs text-royal-cream/30 leading-relaxed max-w-xs">
        {body}
      </p>
    </div>
  );
}
