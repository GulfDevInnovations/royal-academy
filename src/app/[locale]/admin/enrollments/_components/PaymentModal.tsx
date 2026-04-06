"use client";

import { useRef, useState, useTransition } from "react";
import {
  X,
  Loader2,
  CreditCard,
  CheckCircle2,
  CalendarDays,
} from "lucide-react";
import {
  recordPayment,
  recordMultiMonthPayment,
} from "@/lib/actions/admin/Enrollments.actions";
import type {
  SerializedEnrollment,
  SerializedMultiMonthEnrollment,
} from "../page";
import {
  AdminInput,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";

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
const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
];

// ─────────────────────────────────────────────
// Props — discriminated union
// ─────────────────────────────────────────────

type Props =
  | {
      type: "single";
      enrollment: SerializedEnrollment;
      onClose: () => void;
      onSuccess: () => void;
    }
  | {
      type: "multi";
      enrollment: SerializedMultiMonthEnrollment;
      onClose: () => void;
      onSuccess: () => void;
    };

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function PaymentModal({
  type,
  enrollment,
  onClose,
  onSuccess,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(formRef.current!);

    startTransition(async () => {
      const result =
        type === "single"
          ? await recordPayment(enrollment.id, fd)
          : await recordMultiMonthPayment(enrollment.id, fd);
      if (result.error) setError(result.error);
      else onSuccess();
    });
  };

  // ── Derived display values ──
  const studentName = `${enrollment.student.firstName} ${enrollment.student.lastName}`;

  const subClassName =
    type === "single" ? enrollment.subClass.name : enrollment.subClass.name;

  const periodLabel =
    type === "single"
      ? `${MONTHS_SHORT[(enrollment as SerializedEnrollment).month - 1]} ${(enrollment as SerializedEnrollment).year}`
      : (() => {
          const m = enrollment as SerializedMultiMonthEnrollment;
          return `${MONTHS_SHORT[m.startMonth - 1]} ${m.startYear} → ${MONTHS_SHORT[m.endMonth - 1]} ${m.endYear}`;
        })();

  const expectedAmount =
    type === "single"
      ? (enrollment as SerializedEnrollment).totalAmount
      : (enrollment as SerializedMultiMonthEnrollment).totalAmount;

  const existingPayment =
    type === "single"
      ? (enrollment as SerializedEnrollment).payment
      : (enrollment as SerializedMultiMonthEnrollment).payment;

  const frequencyLabel =
    enrollment.frequency === "TWICE_PER_WEEK" ? "Twice / week" : "Once / week";
  const alreadyPaid = existingPayment?.status === "PAID";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/8 shadow-2xl z-10"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <CreditCard size={15} style={{ color: "#f59e0b" }} />
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: adminColors.textPrimary }}
              >
                {alreadyPaid ? "Update Payment" : "Record Payment"}
              </h2>
              {type === "multi" && (
                <p
                  className="text-[10px] mt-0.5"
                  style={{ color: adminColors.textMuted }}
                >
                  Multi-month enrollment
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Enrollment summary */}
          <div
            className="px-4 py-3 rounded-xl border space-y-1.5"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              {studentName}
            </p>
            <p className="text-xs" style={{ color: adminColors.textSecondary }}>
              {subClassName}
            </p>

            {/* Period — with calendar icon for multi */}
            <div className="flex items-center gap-1.5">
              {type === "multi" && (
                <CalendarDays size={11} style={{ color: "#60a5fa" }} />
              )}
              <p
                className="text-xs"
                style={{
                  color: type === "multi" ? "#60a5fa" : adminColors.textMuted,
                }}
              >
                {periodLabel}
                {type === "multi" &&
                  ` · ${(enrollment as SerializedMultiMonthEnrollment).totalMonths} months`}
              </p>
            </div>

            <p className="text-xs" style={{ color: adminColors.textMuted }}>
              {frequencyLabel}
              {" · "}Expected:{" "}
              <span style={{ color: adminColors.textSecondary }}>
                {Number(expectedAmount).toFixed(3)} OMR
              </span>
            </p>

            {/* Child months breakdown for multi */}
            {type === "multi" && (
              <div className="pt-1 border-t border-white/5">
                <p
                  className="text-[10px] mb-1.5"
                  style={{ color: adminColors.textMuted }}
                >
                  Covers:
                </p>
                <div className="flex flex-wrap gap-1">
                  {(
                    enrollment as SerializedMultiMonthEnrollment
                  ).monthlyEnrollments.map((me) => (
                    <span
                      key={me.id}
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background:
                          me.status === "CONFIRMED"
                            ? "rgba(52,211,153,0.1)"
                            : "rgba(245,158,11,0.1)",
                        color:
                          me.status === "CONFIRMED" ? "#34d399" : "#f59e0b",
                      }}
                    >
                      {MONTHS_SHORT[me.month - 1]} {me.year}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment form */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <AdminInput
                label="Amount (OMR) *"
                name="amount"
                type="number"
                step="0.001"
                min="0.001"
                defaultValue={String(
                  existingPayment?.amount ?? Number(expectedAmount),
                )}
                required
              />
              <AdminSelect
                label="Method *"
                name="method"
                defaultValue={(existingPayment as any)?.method ?? ""}
                required
              >
                <option className="text-black" value="">
                  Select…
                </option>
                {PAYMENT_METHODS.map((m) => (
                  <option className="text-black" key={m.value} value={m.value}>
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
                {type === "multi"
                  ? "All months will be confirmed on save."
                  : "Enrollment will be auto-confirmed on save."}
              </p>
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <AdminButton type="button" variant="ghost" onClick={onClose}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" variant="primary" disabled={isPending}>
                {isPending && <Loader2 size={13} className="animate-spin" />}
                Confirm Payment
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
