"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import {
  createEnrollment,
  createMultiMonthEnrollment,
} from "@/lib/actions/admin/Enrollments.actions";
import type { SerializedFormOptions } from "../page";
import {
  AdminInput,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
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
const DAYS_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};
const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
];

type EnrollmentType = "single" | "multi";

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  formOptions: SerializedFormOptions;
  defaultMonth: number;
  defaultYear: number;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function EnrollmentFormModal({
  onClose,
  onSuccess,
  formOptions,
  defaultMonth,
  defaultYear,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Type toggle ──
  const [enrollType, setEnrollType] = useState<EnrollmentType>("single");

  // ── Shared state ──
  const [selectedSubClassId, setSelectedSubClassId] = useState("");
  const [frequency, setFrequency] = useState<
    "ONCE_PER_WEEK" | "TWICE_PER_WEEK"
  >("ONCE_PER_WEEK");
  const [payNow, setPayNow] = useState(false);
  // Stores selected schedule IDs — tracks by slot, not day name,
  // because a sub-class can have two slots on the same day.
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  // ── Single-month state ──
  const [singleMonth, setSingleMonth] = useState(defaultMonth);
  const [singleYear, setSingleYear] = useState(defaultYear);

  // ── Multi-month state ──
  const [startMonth, setStartMonth] = useState(defaultMonth);
  const [startYear, setStartYear] = useState(defaultYear);
  const [totalMonths, setTotalMonths] = useState(3);

  const selectedSubClass = formOptions.subClasses.find(
    (s) => s.id === selectedSubClassId,
  );

  // All schedule slots for the selected sub-class, already ordered
  // by dayOfWeek + startTime from the action query.
  const availableSlots = selectedSubClass?.classSchedules ?? [];

  // Compute maxBookableMonths from the selected slots' endDates and the
  // chosen start month. This is slot-specific and start-month-aware:
  // - Only the endDates of the currently selected slots matter
  // - "5 months from July" ends in November, regardless of today
  // Falls back to 12 if no slots selected or all endDates are null.
  const maxBookableMonths = (() => {
    const selectedSlots = selectedSlotIds
      .map((id) => availableSlots.find((s) => s.id === id))
      .filter(Boolean) as typeof availableSlots;

    if (selectedSlots.length === 0) return 12;

    const finiteEnds = selectedSlots
      .map((s) => (s.endDate ? new Date(s.endDate) : null))
      .filter(Boolean) as Date[];

    if (finiteEnds.length === 0) return 12; // all slots run indefinitely

    // Use the earliest endDate among the selected slots as the hard cap
    const earliest = new Date(Math.min(...finiteEnds.map((d) => d.getTime())));

    // How many full months from startMonth/startYear to earliest?
    const diffMonths =
      (earliest.getFullYear() - startYear) * 12 +
      (earliest.getMonth() + 1 - startMonth) +
      1; // +1 because the end month is inclusive

    return Math.max(1, Math.min(12, diffMonths));
  })();

  const monthlyPrice =
    frequency === "TWICE_PER_WEEK"
      ? selectedSubClass?.twicePriceMonthly
      : selectedSubClass?.oncePriceMonthly;

  // Clamp totalMonths whenever the cap changes (slots or start month changed)
  useEffect(() => {
    setTotalMonths((prev) => Math.min(prev, Math.max(2, maxBookableMonths)));
  }, [maxBookableMonths]);

  const totalPrice =
    enrollType === "multi" && monthlyPrice != null
      ? monthlyPrice * totalMonths
      : monthlyPrice;

  // ── Month range preview for multi ──
  const monthRange = (() => {
    if (enrollType !== "multi") return [];
    const result: { month: number; year: number }[] = [];
    for (let i = 0; i < totalMonths; i++) {
      const d = new Date(startYear, startMonth - 1 + i, 1);
      result.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }
    return result;
  })();
  const endPeriod = monthRange[monthRange.length - 1];

  const handleSubClassChange = (id: string) => {
    setSelectedSubClassId(id);
    setSelectedSlotIds([]);
    // Reset totalMonths when subClass changes — slots change so the cap changes
    setTotalMonths(3);
  };

  const toggleSlot = (slotId: string) => {
    if (frequency === "ONCE_PER_WEEK") {
      setSelectedSlotIds([slotId]);
    } else {
      setSelectedSlotIds((prev) =>
        prev.includes(slotId)
          ? prev.filter((id) => id !== slotId)
          : [...prev, slotId],
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSubClassId) {
      setError("Please select a sub-class.");
      return;
    }
    if (selectedSlotIds.length === 0) {
      setError("Please select at least one preferred slot.");
      return;
    }
    if (frequency === "TWICE_PER_WEEK" && selectedSlotIds.length < 2) {
      setError("Please select two slots for twice-per-week enrollment.");
      return;
    }
    if (enrollType === "multi" && totalMonths < 2) {
      setError("Multi-month enrollment requires at least 2 months.");
      return;
    }

    const fd = new FormData(formRef.current!);
    fd.set("subClassId", selectedSubClassId);
    fd.set("frequency", frequency);
    // Derive day names from the selected slot IDs for the server action
    const selectedDayNames = selectedSlotIds
      .map(
        (id) =>
          selectedSubClass?.classSchedules.find((s) => s.id === id)?.dayOfWeek,
      )
      .filter(Boolean)
      .join(",");
    fd.set("preferredDays", selectedDayNames);
    // Also send slot IDs so the action can resolve exact teacher+time per slot
    fd.set("preferredSlotIds", selectedSlotIds.join(","));
    fd.set("payNow", payNow ? "true" : "false");

    if (enrollType === "single") {
      fd.set("month", String(singleMonth));
      fd.set("year", String(singleYear));
      startTransition(async () => {
        const result = await createEnrollment(fd);
        if (result.error) setError(result.error);
        else onSuccess();
      });
    } else {
      fd.set("startMonth", String(startMonth));
      fd.set("startYear", String(startYear));
      fd.set("totalMonths", String(totalMonths));
      startTransition(async () => {
        const result = await createMultiMonthEnrollment(fd);
        if (result.error) setError(result.error);
        else onSuccess();
      });
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] shadow-2xl z-10 max-h-[92vh] flex flex-col"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              New Enrollment
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              Enroll a student on their behalf
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="px-6 py-5 space-y-5"
          >
            {/* ── Enrollment type toggle ── */}
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    value: "single",
                    label: "Single Month",
                    desc: "One month enrollment",
                  },
                  {
                    value: "multi",
                    label: "Multi-Month",
                    desc: "2–12 months, one payment",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEnrollType(opt.value)}
                  className="flex flex-col items-start px-4 py-3 rounded-xl border transition-all"
                  style={{
                    borderColor:
                      enrollType === opt.value
                        ? "rgba(245,158,11,0.5)"
                        : "rgba(255,255,255,0.07)",
                    background:
                      enrollType === opt.value
                        ? "rgba(245,158,11,0.08)"
                        : "rgba(255,255,255,0.02)",
                  }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color:
                        enrollType === opt.value
                          ? "#f59e0b"
                          : adminColors.textSecondary,
                    }}
                  >
                    {opt.label}
                  </span>
                  <span
                    className="text-[10px] mt-0.5"
                    style={{ color: adminColors.textMuted }}
                  >
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* ── Student ── */}
            <Section title="Student">
              <AdminSelect
                label="Student *"
                name="studentId"
                required
                defaultValue=""
              >
                <option className="text-black" value="">
                  Search and select a student…
                </option>
                {formOptions.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                    {s.user.phone ? ` — ${s.user.phone}` : ""}
                  </option>
                ))}
              </AdminSelect>
            </Section>

            {/* ── Class & Period ── */}
            <Section title="Class & Period">
              <AdminSelect
                label="Sub-class *"
                name="subClassId"
                value={selectedSubClassId}
                onChange={(e) => handleSubClassChange(e.target.value)}
                required
              >
                <option className="text-black" value="">
                  Select a sub-class…
                </option>
                {formOptions.subClasses.map((s) => (
                  <option className="text-black" key={s.id} value={s.id}>
                    {s.class.name} → {s.name}
                  </option>
                ))}
              </AdminSelect>

              {/* Single month pickers */}
              {enrollType === "single" && (
                <div className="grid grid-cols-2 gap-3">
                  <AdminSelect
                    label="Month *"
                    name="month"
                    value={String(singleMonth)}
                    onChange={(e) => setSingleMonth(Number(e.target.value))}
                    required
                  >
                    {MONTHS.map((m, i) => (
                      <option
                        className="text-black"
                        key={i + 1}
                        value={String(i + 1)}
                      >
                        {m}
                      </option>
                    ))}
                  </AdminSelect>
                  <AdminSelect
                    label="Year *"
                    name="year"
                    value={String(singleYear)}
                    onChange={(e) => setSingleYear(Number(e.target.value))}
                    required
                  >
                    {yearOptions.map((y) => (
                      <option className="text-black" key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
              )}

              {/* Multi-month pickers */}
              {enrollType === "multi" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <AdminSelect
                      label="Start Month *"
                      name="startMonth"
                      value={String(startMonth)}
                      onChange={(e) => setStartMonth(Number(e.target.value))}
                      required
                    >
                      {MONTHS.map((m, i) => (
                        <option
                          className="text-black"
                          key={i + 1}
                          value={String(i + 1)}
                        >
                          {m}
                        </option>
                      ))}
                    </AdminSelect>
                    <AdminSelect
                      label="Start Year *"
                      name="startYear"
                      value={String(startYear)}
                      onChange={(e) => setStartYear(Number(e.target.value))}
                      required
                    >
                      {yearOptions.map((y) => (
                        <option
                          className="text-black"
                          key={y}
                          value={String(y)}
                        >
                          {y}
                        </option>
                      ))}
                    </AdminSelect>
                    <div className="space-y-1">
                      <label
                        className="text-xs font-medium"
                        style={{ color: adminColors.textSecondary }}
                      >
                        Months *
                        {maxBookableMonths < 12 && (
                          <span
                            className="ml-1.5 text-[10px]"
                            style={{ color: "#f59e0b" }}
                          >
                            max {maxBookableMonths}
                          </span>
                        )}
                      </label>
                      <div
                        className="flex items-center gap-1 px-1 rounded-xl border h-10"
                        style={{
                          borderColor: "rgba(255,255,255,0.1)",
                          background: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setTotalMonths((n) => Math.max(2, n - 1))
                          }
                          disabled={totalMonths <= 2}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-20"
                          style={{ color: adminColors.textMuted }}
                        >
                          −
                        </button>
                        <span
                          className="flex-1 text-center text-sm font-bold"
                          style={{ color: "#f59e0b" }}
                        >
                          {totalMonths}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setTotalMonths((n) =>
                              Math.min(maxBookableMonths, n + 1),
                            )
                          }
                          disabled={totalMonths >= maxBookableMonths}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-20"
                          style={{ color: adminColors.textMuted }}
                        >
                          +
                        </button>
                      </div>
                      {/* Hidden input so FormData still gets the value */}
                      <input
                        type="hidden"
                        name="totalMonths"
                        value={String(totalMonths)}
                      />
                    </div>
                  </div>

                  {/* Month range preview */}
                  {monthRange.length > 0 && (
                    <div
                      className="px-3 py-2.5 rounded-xl border"
                      style={{
                        background: "rgba(96,165,250,0.05)",
                        borderColor: "rgba(96,165,250,0.15)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CalendarDays size={12} style={{ color: "#60a5fa" }} />
                        <span
                          className="text-[10px] font-semibold"
                          style={{ color: "#60a5fa" }}
                        >
                          {MONTHS_SHORT[startMonth - 1]} {startYear}
                          {" → "}
                          {endPeriod &&
                            `${MONTHS_SHORT[endPeriod.month - 1]} ${endPeriod.year}`}
                          {" · "}
                          {totalMonths} months
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {monthRange.map(({ month, year }, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(96,165,250,0.1)",
                              color: "#60a5fa",
                            }}
                          >
                            {MONTHS_SHORT[month - 1]} {year}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedule limit warning — show when cap is reached */}
                  {maxBookableMonths < 12 &&
                    totalMonths >= maxBookableMonths &&
                    (() => {
                      // Compute the actual end month label for the warning
                      const endD = new Date(
                        startYear,
                        startMonth - 1 + maxBookableMonths - 1,
                        1,
                      );
                      const endLabel = endD.toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      });
                      return (
                        <div
                          className="flex items-center gap-2 px-3 py-2 rounded-lg"
                          style={{
                            background: "rgba(245,158,11,0.06)",
                            border: "1px solid rgba(245,158,11,0.2)",
                          }}
                        >
                          <AlertTriangle
                            size={12}
                            style={{ color: "#f59e0b" }}
                          />
                          <p className="text-xs" style={{ color: "#f59e0b" }}>
                            Schedule ends in {endLabel}. Enrollment cannot go
                            beyond this month.
                          </p>
                        </div>
                      );
                    })()}
                </div>
              )}
            </Section>

            {/* ── Schedule preference ── */}
            {selectedSubClassId && (
              <Section title="Schedule Preference">
                {/* Frequency */}
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: adminColors.textSecondary }}
                  >
                    Frequency *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        {
                          value: "ONCE_PER_WEEK",
                          label: "Once / week",
                          price: selectedSubClass?.oncePriceMonthly,
                        },
                        {
                          value: "TWICE_PER_WEEK",
                          label: "Twice / week",
                          price: selectedSubClass?.twicePriceMonthly,
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFrequency(opt.value);
                          setSelectedSlotIds([]);
                        }}
                        className="flex flex-col items-start px-4 py-3 rounded-xl border transition-all"
                        style={{
                          borderColor:
                            frequency === opt.value
                              ? "rgba(245,158,11,0.5)"
                              : "rgba(255,255,255,0.07)",
                          background:
                            frequency === opt.value
                              ? "rgba(245,158,11,0.08)"
                              : "rgba(255,255,255,0.02)",
                        }}
                      >
                        <span
                          className="text-xs font-semibold"
                          style={{
                            color:
                              frequency === opt.value
                                ? "#f59e0b"
                                : adminColors.textSecondary,
                          }}
                        >
                          {opt.label}
                        </span>
                        {opt.price != null ? (
                          <span
                            className="text-xs mt-0.5"
                            style={{ color: adminColors.textMuted }}
                          >
                            {opt.price} OMR/month
                          </span>
                        ) : (
                          <span
                            className="text-xs mt-0.5"
                            style={{ color: "rgba(248,113,113,0.6)" }}
                          >
                            No price set
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred slots */}
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: adminColors.textSecondary }}
                  >
                    Preferred Slot
                    {frequency === "TWICE_PER_WEEK"
                      ? "s (pick 2)"
                      : " (pick 1)"}{" "}
                    *
                  </label>
                  {availableSlots.length === 0 ? (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{
                        background: "rgba(248,113,113,0.06)",
                        border: "1px solid rgba(248,113,113,0.15)",
                      }}
                    >
                      <AlertTriangle size={12} style={{ color: "#f87171" }} />
                      <p className="text-xs" style={{ color: "#f87171" }}>
                        This sub-class has no active schedules. Add schedules
                        first.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedSlotIds.includes(slot.id);
                        const teacherName = slot.teacher
                          ? `${slot.teacher.firstName} ${slot.teacher.lastName}`
                          : null;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => toggleSlot(slot.id)}
                            className="flex flex-col items-start px-3 py-2 rounded-xl border transition-all"
                            style={{
                              borderColor: isSelected
                                ? "rgba(245,158,11,0.5)"
                                : "rgba(255,255,255,0.07)",
                              background: isSelected
                                ? "rgba(245,158,11,0.1)"
                                : "rgba(255,255,255,0.02)",
                            }}
                          >
                            <span
                              className="text-xs font-semibold"
                              style={{
                                color: isSelected
                                  ? "#f59e0b"
                                  : adminColors.textSecondary,
                              }}
                            >
                              {DAY_SHORT[slot.dayOfWeek]}
                            </span>
                            <span
                              className="text-[10px] mt-0.5"
                              style={{ color: adminColors.textMuted }}
                            >
                              {slot.startTime}–{slot.endTime}
                            </span>
                            {teacherName && (
                              <span
                                className="text-[10px]"
                                style={{
                                  color: isSelected
                                    ? "rgba(245,158,11,0.7)"
                                    : adminColors.textMuted,
                                }}
                              >
                                {teacherName}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Price summary */}
                {monthlyPrice != null && selectedSlotIds.length > 0 && (
                  <div
                    className="px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(52,211,153,0.06)",
                      border: "1px solid rgba(52,211,153,0.15)",
                    }}
                  >
                    {enrollType === "single" ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: "#34d399" }}
                          >
                            Total for this month
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: adminColors.textMuted }}
                          >
                            {frequency === "TWICE_PER_WEEK"
                              ? "Twice / week"
                              : "Once / week"}
                            {" · "}
                            {selectedSlotIds
                              .map((id) => {
                                const s = availableSlots.find(
                                  (sl) => sl.id === id,
                                );
                                return s ? DAY_SHORT[s.dayOfWeek] : "";
                              })
                              .join(" + ")}
                          </p>
                        </div>
                        <p
                          className="text-lg font-bold"
                          style={{ color: "#34d399" }}
                        >
                          {monthlyPrice}{" "}
                          <span className="text-sm font-normal">OMR</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p
                            className="text-xs font-medium"
                            style={{ color: "#34d399" }}
                          >
                            Total for {totalMonths} months
                          </p>
                          <p
                            className="text-lg font-bold"
                            style={{ color: "#34d399" }}
                          >
                            {(totalPrice ?? 0).toFixed(3)}{" "}
                            <span className="text-sm font-normal">OMR</span>
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p
                            className="text-xs"
                            style={{ color: adminColors.textMuted }}
                          >
                            {monthlyPrice} OMR/month × {totalMonths} months
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: adminColors.textMuted }}
                          >
                            {frequency === "TWICE_PER_WEEK"
                              ? "Twice / week"
                              : "Once / week"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Section>
            )}

            {/* ── Payment ── */}
            <Section title="Payment">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setPayNow((v) => !v)}
                  className="w-9 h-5 rounded-full relative transition-colors flex-shrink-0"
                  style={{
                    background: payNow ? "#f59e0b" : "rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: payNow ? "calc(100% - 18px)" : "2px" }}
                  />
                </div>
                <span
                  className="text-sm"
                  style={{ color: adminColors.textSecondary }}
                >
                  Record payment now
                </span>
              </label>

              {payNow && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <AdminInput
                      label="Amount (OMR) *"
                      name="payAmount"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder={
                        totalPrice != null ? totalPrice.toFixed(3) : "0.000"
                      }
                      defaultValue={
                        totalPrice != null ? String(totalPrice) : ""
                      }
                      required={payNow}
                    />
                    <AdminSelect
                      label="Method *"
                      name="payMethod"
                      required={payNow}
                      defaultValue=""
                    >
                      <option className="text-black" value="">
                        Select…
                      </option>
                      {PAYMENT_METHODS.map((m) => (
                        <option
                          className="text-black"
                          key={m.value}
                          value={m.value}
                        >
                          {m.label}
                        </option>
                      ))}
                    </AdminSelect>
                  </div>
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(52,211,153,0.06)",
                      border: "1px solid rgba(52,211,153,0.12)",
                    }}
                  >
                    <CheckCircle2 size={12} style={{ color: "#34d399" }} />
                    <p className="text-xs" style={{ color: "#34d399" }}>
                      Enrollment will be auto-confirmed when payment is
                      recorded.
                    </p>
                  </div>
                </div>
              )}

              {!payNow && (
                <p className="text-xs" style={{ color: adminColors.textMuted }}>
                  Enrollment will be saved as{" "}
                  <strong style={{ color: "#f59e0b" }}>Pending</strong> until
                  payment is recorded.
                </p>
              )}
            </Section>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle
                  size={13}
                  className="flex-shrink-0 mt-0.5 text-red-400"
                />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <AdminButton type="button" variant="ghost" onClick={onClose}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" variant="primary" disabled={isPending}>
                {isPending && <Loader2 size={13} className="animate-spin" />}
                {enrollType === "multi"
                  ? `Enroll for ${totalMonths} Months`
                  : "Create Enrollment"}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p
        className="text-[10px] font-semibold tracking-widest uppercase"
        style={{ color: "rgba(245,158,11,0.6)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
