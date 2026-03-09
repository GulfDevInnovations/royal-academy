"use client";

import { useState, useTransition } from "react";
import {
  X,
  Printer,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  refundEnrollmentPayment,
  refundPayment,
  getOrCreateInvoiceForEnrollment,
} from "@/lib/actions/admin/payments.actions";
import { printInvoice } from "./InvoicePrinter";
import type {
  SerializedEnrollmentPayment,
  SerializedOtherPayment,
} from "../page";
import { AdminButton, AdminBadge, adminColors } from "@/components/admin/ui";

type AnyPayment =
  | { kind: "enrollment"; data: SerializedEnrollmentPayment }
  | { kind: "other"; data: SerializedOtherPayment };

interface Props {
  payment: AnyPayment;
  onClose: () => void;
  onRefresh: () => void;
}

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

const STATUS_BADGE: Record<
  string,
  "success" | "warning" | "error" | "info" | "default"
> = {
  PAID: "success",
  PENDING: "warning",
  FAILED: "error",
  REFUNDED: "info",
};

const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
};

export default function PaymentDetailModal({
  payment,
  onClose,
  onRefresh,
}: Props) {
  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isPrinting, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived fields ──
  const isEnrollment = payment.kind === "enrollment";
  const p = payment.data;

  const student = isEnrollment
    ? (payment.data as SerializedEnrollmentPayment).enrollment.student
    : getStudentFromOther(payment.data as SerializedOtherPayment);

  const description = isEnrollment
    ? getEnrollmentDescription(payment.data as SerializedEnrollmentPayment)
    : getOtherDescription(payment.data as SerializedOtherPayment);

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  // ── Refund ──
  const handleRefund = () => {
    setError(null);
    startTransition(async () => {
      const result = isEnrollment
        ? await refundEnrollmentPayment(p.id, refundReason)
        : await refundPayment(p.id, refundReason);
      if (result.error) setError(result.error);
      else {
        onRefresh();
        onClose();
      }
    });
  };

  // ── Print invoice ──
  const handlePrint = async () => {
    setPrinting(true);
    setError(null);
    try {
      let invoiceNo: string;
      let issuedAt: string;
      let paidAt: string | null;

      if (isEnrollment) {
        const ep = payment.data as SerializedEnrollmentPayment;
        const result = await getOrCreateInvoiceForEnrollment(ep.id);
        if ("error" in result) {
          setError(result.error ?? "Failed to generate invoice.");
          return;
        }
        invoiceNo = result.invoice!.invoiceNo;
        issuedAt = result.invoice!.issuedAt?.toISOString() ?? ep.createdAt;
        paidAt = ep.paidAt;
      } else {
        const op = payment.data as SerializedOtherPayment;
        invoiceNo =
          op.invoice?.invoiceNo ?? `RCP-${op.id.slice(-8).toUpperCase()}`;
        issuedAt = op.createdAt;
        paidAt = op.paidAt;
      }

      printInvoice({
        invoiceNo,
        issuedAt,
        paidAt,
        student: {
          firstName: student?.firstName ?? "—",
          lastName: student?.lastName ?? "",
          email: student?.user?.email ?? null,
          phone: student?.user?.phone ?? null,
        },
        lineItems: [
          {
            description: description.title,
            detail: description.detail,
            amount: Number(p.amount),
            currency: p.currency,
          },
        ],
        total: Number(p.amount),
        currency: p.currency,
        status: p.status,
        method: p.method ?? null,
      });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] shadow-2xl z-10 max-h-[90vh] flex flex-col"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              Payment Details
            </h2>
            <p
              className="text-xs mt-0.5 font-mono"
              style={{ color: adminColors.textMuted }}
            >
              {p.id.slice(0, 16)}…
            </p>
          </div>
          <div className="flex items-center gap-2">
            {p.status === "PAID" && (
              <AdminButton
                variant="ghost"
                onClick={handlePrint}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Printer size={13} />
                )}
                Print
              </AdminButton>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* ── Amount & status ── */}
          <div
            className="flex items-center justify-between px-4 py-4 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div>
              <p
                className="text-3xl font-bold"
                style={{ color: adminColors.textPrimary }}
              >
                {Number(p.amount).toFixed(3)}
              </p>
              <p
                className="text-sm mt-0.5"
                style={{ color: adminColors.textMuted }}
              >
                {p.currency}
              </p>
            </div>
            <AdminBadge variant={STATUS_BADGE[p.status] ?? "default"}>
              {p.status}
            </AdminBadge>
          </div>

          {/* ── Student ── */}
          {student && (
            <Row label="Student">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
                  style={{
                    background: "rgba(245,158,11,0.12)",
                    color: "#f59e0b",
                  }}
                >
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: adminColors.textPrimary }}
                  >
                    {student.firstName} {student.lastName}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: adminColors.textMuted }}
                  >
                    {student.user?.phone ?? student.user?.email ?? "—"}
                  </p>
                </div>
              </div>
            </Row>
          )}

          {/* ── Description ── */}
          <Row label="For">
            <p
              className="text-sm font-medium"
              style={{ color: adminColors.textPrimary }}
            >
              {description.title}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              {description.detail}
            </p>
          </Row>

          {/* ── Payment info ── */}
          <div className="space-y-2">
            <DetailLine
              label="Method"
              value={p.method ? (METHOD_LABEL[p.method] ?? p.method) : "—"}
            />
            <DetailLine label="Paid at" value={fmtDate(p.paidAt ?? null)} />
            <DetailLine label="Created" value={fmtDate(p.createdAt)} />
            {p.status === "REFUNDED" && (
              <>
                <DetailLine
                  label="Refunded at"
                  value={fmtDate(
                    (p as SerializedOtherPayment).refundedAt ?? null,
                  )}
                />
                {(p as SerializedOtherPayment).refundReason && (
                  <DetailLine
                    label="Refund reason"
                    value={(p as SerializedOtherPayment).refundReason ?? "—"}
                  />
                )}
              </>
            )}
          </div>

          {/* ── Refund section ── */}
          {p.status === "PAID" && (
            <div
              className="border-t pt-4"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              {!showRefund ? (
                <button
                  onClick={() => setShowRefund(true)}
                  className="flex items-center gap-2 text-xs transition-colors"
                  style={{ color: "rgba(248,113,113,0.7)" }}
                >
                  <RotateCcw size={12} />
                  Issue refund
                </button>
              ) : (
                <div className="space-y-3">
                  <p
                    className="text-xs font-semibold"
                    style={{ color: "#f87171" }}
                  >
                    Confirm Refund
                  </p>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Reason for refund (required)…"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-xs border bg-white/[0.03] text-white/70 placeholder-white/20 focus:outline-none resize-none"
                    style={{ borderColor: "rgba(248,113,113,0.25)" }}
                  />
                  <div className="flex items-center gap-2">
                    <AdminButton
                      variant="danger"
                      onClick={handleRefund}
                      disabled={isPending || !refundReason.trim()}
                    >
                      {isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <RotateCcw size={12} />
                      )}
                      Confirm Refund
                    </AdminButton>
                    <button
                      onClick={() => {
                        setShowRefund(false);
                        setRefundReason("");
                      }}
                      className="text-xs"
                      style={{ color: adminColors.textMuted }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle
                size={13}
                className="flex-shrink-0 mt-0.5 text-red-400"
              />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper components ──

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="text-[10px] font-semibold tracking-widest uppercase mb-1.5"
        style={{ color: "rgba(245,158,11,0.6)" }}
      >
        {label}
      </p>
      {children}
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between py-1.5 border-b"
      style={{ borderColor: "rgba(255,255,255,0.04)" }}
    >
      <span className="text-xs" style={{ color: adminColors.textMuted }}>
        {label}
      </span>
      <span
        className="text-xs font-medium"
        style={{ color: adminColors.textSecondary }}
      >
        {value}
      </span>
    </div>
  );
}

// ── Data extractors ──

function getStudentFromOther(p: SerializedOtherPayment) {
  if (p.booking) return p.booking.student;
  if (p.trialBooking) return p.trialBooking.student;
  if (p.workshopBooking) return p.workshopBooking.student;
  return null;
}

function getEnrollmentDescription(p: SerializedEnrollmentPayment) {
  const e = p.enrollment;
  const month = [
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
  ][e.month - 1];
  return {
    title: `${e.subClass.name} — Monthly Enrollment`,
    detail: `${e.subClass.class.name} · ${month} ${e.year} · ${e.frequency === "TWICE_PER_WEEK" ? "2×/week" : "1×/week"}`,
  };
}

function getOtherDescription(p: SerializedOtherPayment) {
  if (p.booking) {
    const sub = p.booking.session.schedule.subClass;
    return {
      title: `${sub.name} — Session Booking`,
      detail: sub.class.name,
    };
  }
  if (p.trialBooking) {
    return {
      title: `${p.trialBooking.subClass.name} — Trial Class`,
      detail: p.trialBooking.subClass.class.name,
    };
  }
  if (p.workshopBooking) {
    return {
      title: `${p.workshopBooking.workshop.title} — Workshop`,
      detail: "Workshop booking",
    };
  }
  return { title: "Payment", detail: "—" };
}
