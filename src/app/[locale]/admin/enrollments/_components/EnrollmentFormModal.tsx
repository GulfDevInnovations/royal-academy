"use client";

import { useRef, useState, useTransition } from "react";
import {
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { createEnrollment } from "@/lib/actions/admin/Enrollments.actions";
import type { SerializedFormOptions } from "../page";
import {
  AdminInput,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";

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

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  formOptions: SerializedFormOptions;
  defaultMonth: number;
  defaultYear: number;
}

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

  const [selectedSubClassId, setSelectedSubClassId] = useState("");
  const [frequency, setFrequency] = useState<
    "ONCE_PER_WEEK" | "TWICE_PER_WEEK"
  >("ONCE_PER_WEEK");
  const [payNow, setPayNow] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const selectedSubClass = formOptions.subClasses.find(
    (s) => s.id === selectedSubClassId,
  );

  // Available days from schedules
  const availableDays = selectedSubClass
    ? [
        ...new Set(selectedSubClass.classSchedules.map((s) => s.dayOfWeek)),
      ].sort((a, b) => DAYS_ORDER.indexOf(a) - DAYS_ORDER.indexOf(b))
    : [];

  // Price based on frequency
  const price =
    frequency === "TWICE_PER_WEEK"
      ? selectedSubClass?.twicePriceMonthly
      : selectedSubClass?.oncePriceMonthly;

  // When subclass changes, reset days
  const handleSubClassChange = (id: string) => {
    setSelectedSubClassId(id);
    setSelectedDays([]);
  };

  // Toggle a preferred day
  const toggleDay = (day: string) => {
    if (frequency === "ONCE_PER_WEEK") {
      setSelectedDays([day]); // only one day for once/week
    } else {
      setSelectedDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
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
    if (selectedDays.length === 0) {
      setError("Please select at least one preferred day.");
      return;
    }
    if (frequency === "TWICE_PER_WEEK" && selectedDays.length < 2) {
      setError("Please select two days for twice-per-week enrollment.");
      return;
    }

    const fd = new FormData(formRef.current!);
    fd.set("subClassId", selectedSubClassId);
    fd.set("frequency", frequency);
    fd.set("preferredDays", selectedDays.join(","));
    fd.set("payNow", payNow ? "true" : "false");

    startTransition(async () => {
      const result = await createEnrollment(fd);
      if (result.error) setError(result.error);
      else onSuccess();
    });
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

            {/* ── Class & Month ── */}
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

              <div className="grid grid-cols-2 gap-3">
                <AdminSelect
                  label="Month *"
                  name="month"
                  defaultValue={String(defaultMonth)}
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
                  defaultValue={String(defaultYear)}
                  required
                >
                  {yearOptions.map((y) => (
                    <option className="text-black" key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </AdminSelect>
              </div>
            </Section>

            {/* ── Frequency & Days ── */}
            {selectedSubClassId && (
              <Section title="Schedule Preference">
                {/* Frequency toggle */}
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: adminColors.textSecondary }}
                  >
                    Frequency *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
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
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setFrequency(opt.value as any);
                          setSelectedDays([]); // reset days on frequency change
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

                {/* Preferred days */}
                <div className="space-y-1.5">
                  <label
                    className="text-xs font-medium"
                    style={{ color: adminColors.textSecondary }}
                  >
                    Preferred Day
                    {frequency === "TWICE_PER_WEEK"
                      ? "s (pick 2)"
                      : " (pick 1)"}{" "}
                    *
                  </label>
                  {availableDays.length === 0 ? (
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
                      {availableDays.map((day) => {
                        // Find schedule for this day to show time
                        const sched = selectedSubClass?.classSchedules.find(
                          (s) => s.dayOfWeek === day,
                        );
                        const isSelected = selectedDays.includes(day);
                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className="flex flex-col items-center px-3 py-2 rounded-xl border transition-all"
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
                              {DAY_SHORT[day]}
                            </span>
                            {sched && (
                              <span
                                className="text-[10px] mt-0.5"
                                style={{ color: adminColors.textMuted }}
                              >
                                {sched.startTime}–{sched.endTime}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Price summary */}
                {price != null && selectedDays.length > 0 && (
                  <div
                    className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{
                      background: "rgba(52,211,153,0.06)",
                      border: "1px solid rgba(52,211,153,0.15)",
                    }}
                  >
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
                        {selectedDays.map((d) => DAY_SHORT[d]).join(" + ")}
                      </p>
                    </div>
                    <p
                      className="text-lg font-bold"
                      style={{ color: "#34d399" }}
                    >
                      {price} <span className="text-sm font-normal">OMR</span>
                    </p>
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
                      step="0.01"
                      min="0"
                      placeholder={price != null ? String(price) : "0.00"}
                      defaultValue={price != null ? String(price) : ""}
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
                Create Enrollment
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
