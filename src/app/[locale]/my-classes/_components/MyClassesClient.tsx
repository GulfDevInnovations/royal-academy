'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  Users,
  Award,
  RefreshCw,
  History,
} from 'lucide-react';
import RescheduleModal from './RescheduleModal';

// ─────────────────────────────────────────────
// Exported types (imported by page.tsx for serialization)
// ─────────────────────────────────────────────

export type RescheduledSession = {
  logId: string;
  requestedAt: string;
  wasLost: boolean;
  lostReason: string | null;
  oldSessionDate: string | null;
  oldStartTime: string | null;
  oldEndTime: string | null;
  oldDayOfWeek: string | null;
  newSessionDate: string | null;
  newStartTime: string | null;
  newEndTime: string | null;
  newDayOfWeek: string | null;
};

export type EnrolledClass = {
  enrollmentId: string;
  enrollmentType: 'SINGLE' | 'MULTI' | 'WORKSHOP';
  status: string;
  frequency: string;
  preferredDays: string[];
  month: number | null;
  year: number | null;
  startMonth: number | null;
  startYear: number | null;
  endMonth: number | null;
  endYear: number | null;
  totalMonths: number | null;
  totalAmount: number;
  currency: string;
  paymentStatus: string | null;
  paidAt: string | null;
  resolvedSlots: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    teacher: { firstName: string; lastName: string } | null;
  }[];
  rescheduledSessions: RescheduledSession[];
  // Workshop-specific (only set when enrollmentType === "WORKSHOP")
  workshopSlug?: string;
  workshopEventDate?: string;
  workshopStartTime?: string;
  workshopEndTime?: string;
  workshopTeacherName?: string | null;
  subClass: {
    id: string;
    name: string;
    description: string | null;
    coverUrl: string | null;
    durationMinutes: number;
    level: string | null;
    ageGroup: string | null;
    isReschedulable: boolean;
    oncePriceMonthly: number | null;
    twicePriceMonthly: number | null;
    class: { id: string; name: string; iconUrl: string | null };
  };
};

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const CLASS_ACCENT: Record<string, string> = {
  Music: '#C9A84C',
  'Dance & Wellness': '#A855F7',
  Art: '#F97316',
  Ballet: '#EC4899',
  Workshops: '#10B981',
  default: '#C9A84C',
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

function accent(className: string) {
  return CLASS_ACCENT[className] ?? CLASS_ACCENT.default;
}

function statusColor(status: string, payStatus: string | null) {
  if (status === 'CANCELLED') return { dot: '#6b7280', text: 'Cancelled' };
  if (payStatus === 'PAID' && status === 'CONFIRMED')
    return { dot: '#34d399', text: 'Active' };
  return { dot: '#60a5fa', text: status };
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface Props {
  enrollments: EnrolledClass[];
  studentName: string;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function MyClassesClient({ enrollments, studentName }: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] =
    useState<EnrolledClass | null>(null);

  const hasEnrollments = enrollments.length > 0;

  return (
    <>
      <main className="min-h-screen pt-24 pb-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* ── Page header ── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-royal-gold" />
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-royal-gold">
                Your Journey
              </p>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-royal-cream font-goudy leading-none">
              My Classes
            </h1>
            <p className="text-royal-cream/40 text-sm mt-3">
              {studentName} · {enrollments.length} active enrollment
              {enrollments.length !== 1 ? 's' : ''}
            </p>
          </motion.div>

          {/* ── Enrollments ── */}
          {!hasEnrollments ? (
            <EmptyState onBrowse={() => router.push('/enrollment')} />
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment, i) =>
                enrollment.enrollmentType === 'WORKSHOP' ? (
                  <WorkshopCard
                    key={enrollment.enrollmentId}
                    enrollment={enrollment}
                    index={i}
                    isExpanded={expandedId === enrollment.enrollmentId}
                    onToggle={() =>
                      setExpandedId(
                        expandedId === enrollment.enrollmentId
                          ? null
                          : enrollment.enrollmentId,
                      )
                    }
                    onView={() =>
                      router.push(`/workshops/${enrollment.workshopSlug}`)
                    }
                  />
                ) : (
                  <EnrollmentCard
                    key={enrollment.enrollmentId}
                    enrollment={enrollment}
                    index={i}
                    isExpanded={expandedId === enrollment.enrollmentId}
                    onToggle={() =>
                      setExpandedId(
                        expandedId === enrollment.enrollmentId
                          ? null
                          : enrollment.enrollmentId,
                      )
                    }
                    onContinue={() =>
                      router.push(`/enrollment/${enrollment.subClass.id}`)
                    }
                    onViewClass={() =>
                      router.push(`/classes/${enrollment.subClass.id}`)
                    }
                    onReschedule={() => setRescheduleTarget(enrollment)}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Reschedule modal ── */}
      <AnimatePresence>
        {rescheduleTarget && (
          <RescheduleModal
            enrollment={rescheduleTarget}
            accentColor={accent(rescheduleTarget.subClass.class.name)}
            onClose={() => setRescheduleTarget(null)}
            onSuccess={() => {
              setRescheduleTarget(null);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────
// EnrollmentCard
// ─────────────────────────────────────────────

function EnrollmentCard({
  enrollment,
  index,
  isExpanded,
  onToggle,
  onContinue,
  onViewClass,
  onReschedule,
}: {
  enrollment: EnrolledClass;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onContinue: () => void;
  onViewClass: () => void;
  onReschedule: () => void;
}) {
  const ac = accent(enrollment.subClass.class.name);
  const status = statusColor(enrollment.status, enrollment.paymentStatus);
  const isMulti = enrollment.enrollmentType === 'MULTI';

  const periodLabel = isMulti
    ? `${MONTHS_SHORT[(enrollment.startMonth ?? 1) - 1]} ${enrollment.startYear} → ${MONTHS_SHORT[(enrollment.endMonth ?? 1) - 1]} ${enrollment.endYear}`
    : `${MONTHS[(enrollment.month ?? 1) - 1]} ${enrollment.year}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #1a1610, #100e0c)',
        borderColor: `${ac}22`,
      }}
    >
      {/* Accent top bar */}
      <div
        className="h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${ac}, transparent)`,
        }}
      />

      {/* ── Header row (always visible) ── */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4"
      >
        {/* Cover / class icon */}
        {enrollment.subClass.coverUrl ? (
          <img
            src={enrollment.subClass.coverUrl}
            alt={enrollment.subClass.name}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl font-bold font-goudy"
            style={{ background: `${ac}18`, color: ac }}
          >
            {enrollment.subClass.name[0]}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Class category */}
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: `${ac}99` }}
          >
            {enrollment.subClass.class.name}
          </p>

          {/* Sub-class name */}
          <p className="text-base font-bold text-royal-cream font-goudy leading-tight truncate">
            {enrollment.subClass.name}
          </p>

          {/* Period + type badge */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-royal-cream/40 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {periodLabel}
            </span>
            {isMulti && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5"
                style={{
                  background: 'rgba(96,165,250,0.12)',
                  color: '#60a5fa',
                }}
              >
                <Layers className="w-2.5 h-2.5" />
                {enrollment.totalMonths}mo plan
              </span>
            )}
            {/* Reschedulable badge */}
            {enrollment.subClass.isReschedulable && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5"
                style={{
                  background: 'rgba(52,211,153,0.10)',
                  color: '#34d399',
                }}
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Flexible
              </span>
            )}
          </div>
        </div>

        {/* Status dot + chevron */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: status.dot }}
              />
              <span className="text-xs" style={{ color: status.dot }}>
                {status.text}
              </span>
            </div>
          </div>
          <ChevronRight
            className="w-4 h-4 text-royal-cream/20 transition-transform"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* ── Expanded detail ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 pb-5 pt-1 space-y-4 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              {/* Schedule slots */}
              {enrollment.resolvedSlots.length > 0 && (
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2.5"
                    style={{ color: `${ac}80` }}
                  >
                    Your Schedule
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {enrollment.resolvedSlots.map((slot, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                        style={{
                          background: `${ac}10`,
                          border: `1px solid ${ac}25`,
                        }}
                      >
                        <div>
                          <p
                            className="text-xs font-bold"
                            style={{ color: ac }}
                          >
                            {DAY_LABELS[slot.dayOfWeek] ?? slot.dayOfWeek}
                          </p>
                          <p className="text-[10px] text-royal-cream/40">
                            {slot.startTime}–{slot.endTime}
                          </p>
                        </div>
                        {slot.teacher && (
                          <>
                            <div className="w-px h-6 bg-white/[0.06]" />
                            <p className="text-xs text-royal-cream/50">
                              {slot.teacher.firstName} {slot.teacher.lastName}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reschedule history */}
              {enrollment.rescheduledSessions.length > 0 && (
                <RescheduleHistory
                  logs={enrollment.rescheduledSessions}
                  ac={ac}
                />
              )}

              {/* Details row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <DetailChip
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Duration"
                  value={`${enrollment.subClass.durationMinutes} min`}
                  ac={ac}
                />
                <DetailChip
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  label="Frequency"
                  value={
                    enrollment.frequency === 'TWICE_PER_WEEK'
                      ? '2× / week'
                      : '1× / week'
                  }
                  ac={ac}
                />
                {enrollment.subClass.level && (
                  <DetailChip
                    icon={<Award className="w-3.5 h-3.5" />}
                    label="Level"
                    value={enrollment.subClass.level}
                    ac={ac}
                  />
                )}
                {enrollment.subClass.ageGroup && (
                  <DetailChip
                    icon={<Users className="w-3.5 h-3.5" />}
                    label="Age Group"
                    value={enrollment.subClass.ageGroup}
                    ac={ac}
                  />
                )}
              </div>

              {/* Payment info */}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2">
                  {enrollment.paymentStatus === 'PAID' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="text-xs text-royal-cream/50">
                    {enrollment.paidAt
                      ? `Paid · ${new Date(enrollment.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : 'Paid'}
                  </span>
                </div>
                <span
                  className="text-sm font-bold font-goudy"
                  style={{ color: ac }}
                >
                  {enrollment.totalAmount.toFixed(3)}{' '}
                  <span className="text-xs font-normal text-royal-cream/30">
                    {enrollment.currency}
                  </span>
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-1 flex-wrap">
                <button
                  onClick={onViewClass}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border text-royal-cream/50 hover:text-royal-cream/80 hover:border-white/15"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.07)',
                    minWidth: '80px',
                  }}
                >
                  Class Info
                </button>

                {/* Reschedule button — only for reschedulable classes */}
                {enrollment.subClass.isReschedulable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReschedule();
                    }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border flex items-center justify-center gap-1.5 hover:opacity-90"
                    style={{
                      background: 'rgba(52,211,153,0.08)',
                      borderColor: 'rgba(52,211,153,0.20)',
                      color: '#34d399',
                      minWidth: '80px',
                    }}
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reschedule
                  </button>
                )}

                <button
                  onClick={onContinue}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${ac}, ${ac}bb)`,
                    color: '#100e0c',
                    minWidth: '80px',
                  }}
                >
                  Continue This Class
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// WorkshopCard
// ─────────────────────────────────────────────

const WORKSHOP_ACCENT = '#10B981';

function WorkshopCard({
  enrollment,
  index,
  isExpanded,
  onToggle,
  onView,
}: {
  enrollment: EnrolledClass;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onView: () => void;
}) {
  const ac = WORKSHOP_ACCENT;
  const status = statusColor(enrollment.status, enrollment.paymentStatus);

  const eventLabel = enrollment.workshopEventDate
    ? new Date(enrollment.workshopEventDate).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #1a1610, #100e0c)',
        borderColor: `${ac}22`,
      }}
    >
      {/* Accent top bar */}
      <div
        className="h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${ac}, transparent)`,
        }}
      />

      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4"
      >
        {enrollment.subClass.coverUrl ? (
          <img
            src={enrollment.subClass.coverUrl}
            alt={enrollment.subClass.name}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-2xl font-bold font-goudy"
            style={{ background: `${ac}18`, color: ac }}
          >
            {enrollment.subClass.name[0]}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: `${ac}99` }}
          >
            Workshop
          </p>
          <p className="text-base font-bold text-royal-cream font-goudy leading-tight truncate">
            {enrollment.subClass.name}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {eventLabel && (
              <span className="text-xs text-royal-cream/40 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {eventLabel}
              </span>
            )}
            {enrollment.workshopStartTime && (
              <span className="text-xs text-royal-cream/40 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {enrollment.workshopStartTime}–{enrollment.workshopEndTime}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: status.dot }}
              />
              <span className="text-xs" style={{ color: status.dot }}>
                {status.text}
              </span>
            </div>
          </div>
          <ChevronRight
            className="w-4 h-4 text-royal-cream/20 transition-transform"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 pb-5 pt-1 space-y-4 border-t"
              style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            >
              {/* Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {enrollment.workshopTeacherName && (
                  <DetailChip
                    icon={<Users className="w-3.5 h-3.5" />}
                    label="Instructor"
                    value={enrollment.workshopTeacherName}
                    ac={ac}
                  />
                )}
                {enrollment.workshopStartTime && (
                  <DetailChip
                    icon={<Clock className="w-3.5 h-3.5" />}
                    label="Time"
                    value={`${enrollment.workshopStartTime}–${enrollment.workshopEndTime}`}
                    ac={ac}
                  />
                )}
                {eventLabel && (
                  <DetailChip
                    icon={<Calendar className="w-3.5 h-3.5" />}
                    label="Date"
                    value={eventLabel}
                    ac={ac}
                  />
                )}
              </div>

              {/* Payment info */}
              <div
                className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-2">
                  {enrollment.paymentStatus === 'PAID' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="text-xs text-royal-cream/50">
                    {enrollment.paidAt
                      ? `Paid · ${new Date(enrollment.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                      : 'Awaiting Payment'}
                  </span>
                </div>
                <span
                  className="text-sm font-bold font-goudy"
                  style={{ color: ac }}
                >
                  {enrollment.totalAmount.toFixed(3)}{' '}
                  <span className="text-xs font-normal text-royal-cream/30">
                    {enrollment.currency}
                  </span>
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onView}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${ac}, ${ac}bb)`,
                    color: '#100e0c',
                  }}
                >
                  View Workshop
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: 'rgba(201,168,76,0.08)',
          border: '1px solid rgba(201,168,76,0.15)',
        }}
      >
        <BookOpen className="w-8 h-8 text-royal-gold/50" />
      </div>
      <h2 className="text-2xl font-bold text-royal-cream font-goudy mb-2">
        No classes yet
      </h2>
      <p className="text-royal-cream/40 text-sm max-w-xs mb-8 leading-relaxed">
        You haven&apos;t enrolled in any classes. Browse our offerings and start
        your journey.
      </p>
      <button
        onClick={onBrowse}
        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #C9A84C, #C9A84Cbb)',
          color: '#100e0c',
        }}
      >
        Browse Classes
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// RescheduleHistory
// ─────────────────────────────────────────────

const MONTHS_SHORT_MAP = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function fmtShort(dateStr: string | null) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS_SHORT_MAP[d.getMonth()]}`;
}

function RescheduleHistory({
  logs,
  ac,
}: {
  logs: RescheduledSession[];
  ac: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? logs : logs.slice(0, 2);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 mb-2.5 group"
      >
        <History className="w-3 h-3" style={{ color: `${ac}70` }} />
        <p
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: `${ac}70` }}
        >
          Reschedule History
        </p>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
          style={{ background: `${ac}15`, color: `${ac}80` }}
        >
          {logs.length}
        </span>
      </button>

      <div className="space-y-1.5">
        {visible.map((log) => (
          <div
            key={log.logId}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{
              background: log.wasLost
                ? 'rgba(239,68,68,0.05)'
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${log.wasLost ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            {/* Old → New */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Old session */}
                <span className="text-xs text-royal-cream/40 line-through">
                  {fmtShort(log.oldSessionDate)}
                  {log.oldStartTime ? ` · ${log.oldStartTime}` : ''}
                </span>

                <ArrowRight
                  className="w-3 h-3 flex-shrink-0"
                  style={{ color: `${ac}50` }}
                />

                {/* New session */}
                {log.wasLost ? (
                  <span className="text-xs text-red-400/70">
                    {log.lostReason ?? 'No slot found'}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-royal-cream/70">
                    {fmtShort(log.newSessionDate)}
                    {log.newStartTime ? ` · ${log.newStartTime}` : ''}
                  </span>
                )}
              </div>

              {/* Date of request */}
              <p className="text-[10px] text-royal-cream/25 mt-0.5">
                Requested {fmtShort(log.requestedAt)}
              </p>
            </div>

            {/* Status badge */}
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex-shrink-0"
              style={{
                background: log.wasLost
                  ? 'rgba(239,68,68,0.10)'
                  : 'rgba(52,211,153,0.10)',
                color: log.wasLost ? '#f87171' : '#34d399',
              }}
            >
              {log.wasLost ? 'Lost' : 'Done'}
            </span>
          </div>
        ))}
      </div>

      {logs.length > 2 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[10px] font-semibold transition-colors"
          style={{ color: `${ac}60` }}
        >
          {expanded ? 'Show less' : `+${logs.length - 2} more`}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// DetailChip
// ─────────────────────────────────────────────

function DetailChip({
  icon,
  label,
  value,
  ac,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ac: string;
}) {
  return (
    <div
      className="flex items-start gap-2 px-3 py-2 rounded-xl"
      style={{ background: `${ac}08`, border: `1px solid ${ac}15` }}
    >
      <div className="mt-0.5 flex-shrink-0" style={{ color: `${ac}80` }}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] text-royal-cream/30 uppercase tracking-wider leading-none mb-0.5">
          {label}
        </p>
        <p className="text-xs font-medium text-royal-cream/70">{value}</p>
      </div>
    </div>
  );
}
