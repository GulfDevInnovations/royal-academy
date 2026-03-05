"use client";

import { useRef, useState, useTransition } from "react";
import { X, Loader2, CreditCard, CheckCircle2 } from "lucide-react";
import { recordPayment } from "@/lib/actions/admin/Enrollments.actions";
import type { SerializedEnrollment } from "../page";
import {
  AdminInput,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";

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

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
];

interface Props {
  enrollment: SerializedEnrollment;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({
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
      const result = await recordPayment(enrollment.id, fd);
      if (result.error) setError(result.error);
      else onSuccess();
    });
  };

  const monthName = MONTHS[enrollment.month - 1];
  const alreadyPaid = enrollment.payment?.status === "PAID";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] shadow-2xl z-10"
        style={{ background: "#1a1d27" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <CreditCard size={15} style={{ color: "#f59e0b" }} />
            <h2
              className="text-sm font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              {alreadyPaid ? "Update Payment" : "Record Payment"}
            </h2>
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
            className="px-4 py-3 rounded-xl border space-y-1"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p
              className="text-xs font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              {enrollment.student.firstName} {enrollment.student.lastName}
            </p>
            <p className="text-xs" style={{ color: adminColors.textSecondary }}>
              {enrollment.subClass.name} · {monthName} {enrollment.year}
            </p>
            <p className="text-xs" style={{ color: adminColors.textMuted }}>
              {enrollment.frequency === "TWICE_PER_WEEK"
                ? "Twice / week"
                : "Once / week"}
              {" · "}Expected: {enrollment.totalAmount} OMR
            </p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <AdminInput
                label="Amount (OMR) *"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={String(
                  enrollment.payment?.amount ?? enrollment.totalAmount,
                )}
                required
              />
              <AdminSelect
                label="Method *"
                name="method"
                defaultValue={enrollment.payment?.method ?? ""}
                required
              >
                <option value="">Select…</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
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
                Enrollment will be auto-confirmed on save.
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
