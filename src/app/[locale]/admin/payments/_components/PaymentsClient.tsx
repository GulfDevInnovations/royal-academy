"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  getEnrollmentPayments,
  getOtherPayments,
  getPaymentStats,
} from "@/lib/actions/admin/payments.actions";
import type {
  SerializedEnrollmentPayment,
  SerializedOtherPayment,
  PaymentStats,
} from "../page";
import { PaymentTab } from "@/lib/actions/admin/payments.actions";
import { ToastContainer } from "@/components/admin/Toast";
import { useToast } from "../../hooks/useToast";
import {
  AdminCard,
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  AdminTable,
  AdminThead,
  AdminTh,
  AdminTbody,
  AdminTr,
  AdminTd,
  AdminEmptyState,
  adminColors,
} from "@/components/admin/ui";
import PaymentDetailModal from "./PaymentDetailModal";
import { useTranslations } from "next-intl";

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

const TABS: { key: PaymentTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ENROLLMENT", label: "Enrollments" },
  { key: "BOOKING", label: "Bookings" },
  { key: "TRIAL", label: "Trials" },
  { key: "WORKSHOP", label: "Workshops" },
];

const STATUS_BADGE: Record<string, "success" | "danger" | "info" | "default"> =
  {
    PAID: "success",
    FAILED: "danger",
    REFUNDED: "info",
  };

const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT_CARD: "Credit Card",
  DEBIT_CARD: "Debit Card",
};

const TYPE_COLORS: Record<PaymentTab, { bg: string; text: string }> = {
  ALL: { bg: "rgba(255,255,255,0.08)", text: adminColors.textSecondary },
  ENROLLMENT: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
  BOOKING: { bg: "rgba(96,165,250,0.12)", text: "#60a5fa" },
  TRIAL: { bg: "rgba(52,211,153,0.12)", text: "#34d399" },
  WORKSHOP: { bg: "rgba(167,139,250,0.12)", text: "#a78bfa" },
};

// ─────────────────────────────────────────────
// Normalised row type for the table
// ─────────────────────────────────────────────

interface NormalisedPayment {
  id: string;
  type: PaymentTab;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  paidAt: string | null;
  createdAt: string;
  studentName: string;
  studentContact: string;
  description: string;
  detail: string;
  raw: SerializedEnrollmentPayment | SerializedOtherPayment;
  rawKind: "enrollment" | "other";
}

function normaliseEnrollment(
  p: SerializedEnrollmentPayment,
): NormalisedPayment {
  const e = p.enrollment;
  const month = MONTHS_SHORT[e.month - 1];
  return {
    id: p.id,
    type: "ENROLLMENT",
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method ?? null,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    studentName: `${e.student.firstName} ${e.student.lastName}`,
    studentContact: e.student.user.phone ?? e.student.user.email ?? "—",
    description: `${e.subClass.name}`,
    detail: `${e.subClass.class.name} · ${month} ${e.year} · ${e.frequency === "TWICE_PER_WEEK" ? "2×/wk" : "1×/wk"}`,
    raw: p,
    rawKind: "enrollment",
  };
}

function normaliseOther(p: SerializedOtherPayment): NormalisedPayment {
  let type: PaymentTab = "BOOKING";
  let studentName = "—";
  let studentContact = "—";
  let description = "Payment";
  let detail = "";

  if (p.booking) {
    type = "BOOKING";
    const s = p.booking.student;
    studentName = `${s.firstName} ${s.lastName}`;
    studentContact = s.user.phone ?? s.user.email ?? "—";
    const sub = p.booking.session.schedule.subClass;
    description = sub.name;
    detail = sub.class.name;
  } else if (p.trialBooking) {
    type = "TRIAL";
    const s = p.trialBooking.student;
    studentName = `${s.firstName} ${s.lastName}`;
    studentContact = s.user.phone ?? s.user.email ?? "—";
    description = `${p.trialBooking.subClass.name} — Trial`;
    detail = p.trialBooking.subClass.class.name;
  } else if (p.workshopBooking) {
    type = "WORKSHOP";
    const s = p.workshopBooking.student;
    studentName = `${s.firstName} ${s.lastName}`;
    studentContact = s.user.phone ?? s.user.email ?? "—";
    description = p.workshopBooking.workshop.title;
    detail = "Workshop";
  }

  return {
    id: p.id,
    type,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method ?? null,
    paidAt: p.paidAt,
    createdAt: p.createdAt,
    studentName,
    studentContact,
    description,
    detail,
    raw: p,
    rawKind: "other",
  };
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface Props {
  initialEnrollmentPayments: SerializedEnrollmentPayment[];
  initialOtherPayments: SerializedOtherPayment[];
  initialStats: PaymentStats;
  defaultMonth: number;
  defaultYear: number;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function PaymentsClient({
  initialEnrollmentPayments,
  initialOtherPayments,
  initialStats,
  defaultMonth,
  defaultYear,
}: Props) {
  const { toasts, toast, remove } = useToast();
  const [, startRefresh] = useTransition();

  const [tab, setTab] = useState<PaymentTab>("ALL");
  const [filterStatus, setFilterStatus] = useState("");
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [selectedPayment, setSelectedPayment] =
    useState<NormalisedPayment | null>(null);

  const t = useTranslations("admin");

  const [enrollmentPayments, setEnrollmentPayments] = useState(
    initialEnrollmentPayments,
  );
  const [otherPayments, setOtherPayments] = useState(initialOtherPayments);
  const [stats, setStats] = useState(initialStats);

  // ── Refresh ──
  const refreshData = useCallback(async () => {
    const [ep, op, s] = await Promise.all([
      getEnrollmentPayments({ month, year }),
      getOtherPayments(),
      getPaymentStats(month, year),
    ]);
    setEnrollmentPayments(
      ep.map((p) => ({
        ...p,
        amount: Number(p.amount),
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        enrollment: {
          ...p.enrollment,
          totalAmount: Number(p.enrollment.totalAmount),
          bookedAt: p.enrollment.bookedAt.toISOString(),
          createdAt: p.enrollment.createdAt.toISOString(),
          updatedAt: p.enrollment.updatedAt.toISOString(),
        },
      })) as any,
    );
    setOtherPayments(
      op.map((p) => ({
        ...p,
        amount: Number(p.amount),
        refundedAmount: p.refundedAmount ? Number(p.refundedAmount) : null,
        paidAt: p.paidAt?.toISOString() ?? null,
        failedAt: p.failedAt?.toISOString() ?? null,
        refundedAt: p.refundedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })) as any,
    );
    setStats(s);
  }, [month, year]);

  // Re-fetch when month/year changes
  const [prevMonth, setPrevMonth] = useState(month);
  const [prevYear, setPrevYear] = useState(year);
  if (month !== prevMonth || year !== prevYear) {
    setPrevMonth(month);
    setPrevYear(year);
    refreshData();
  }

  const navigateMonth = (dir: -1 | 1) => {
    let m = month + dir,
      y = year;
    if (m < 1) {
      m = 12;
      y--;
    }
    if (m > 12) {
      m = 1;
      y++;
    }
    setMonth(m);
    setYear(y);
  };

  // ── Normalise + filter ──
  const allNormalised = useMemo<NormalisedPayment[]>(
    () =>
      [
        ...enrollmentPayments.map(normaliseEnrollment),
        ...otherPayments.map(normaliseOther),
      ].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [enrollmentPayments, otherPayments],
  );

  const displayed = useMemo(() => {
    let list = allNormalised;
    if (tab !== "ALL") list = list.filter((p) => p.type === tab);
    if (filterStatus) list = list.filter((p) => p.status === filterStatus);
    return list;
  }, [allNormalised, tab, filterStatus]);

  // ── Export ──
  const handleExport = () => {
    const rows = displayed.map((p) => ({
      Date: p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-GB") : "",
      Type: p.type,
      Student: p.studentName,
      Contact: p.studentContact,
      Description: p.description,
      Detail: p.detail,
      Amount: p.amount,
      Currency: p.currency,
      Status: p.status,
      Method: p.method ? (METHOD_LABEL[p.method] ?? p.method) : "",
      Created: new Date(p.createdAt).toLocaleDateString("en-GB"),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto column widths
    const cols = Object.keys(rows[0] ?? {});
    ws["!cols"] = cols.map((key) => ({
      wch: Math.max(
        key.length,
        ...rows.map((r) => String((r as any)[key] ?? "").length),
        10,
      ),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `payments-${date}.xlsx`);
    toast("Exported to Excel.", "success");
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="space-y-4 max-w-8xl mx-auto">
      <AdminPageHeader
        title="Payments"
        subtitle={`${MONTHS[month - 1]} ${year}`}
        action={
          <AdminButton variant="ghost" onClick={handleExport}>
            <Download size={18} /> Export Excel
          </AdminButton>
        }
      />

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Collected",
            value: `${stats.paid.amount.toFixed(3)} OMR`,
            count: stats.paid.count,
            color: "#34d399",
            icon: <TrendingUp size={18} />,
          },
          {
            label: "Refunded",
            value: `${stats.refunded.amount.toFixed(3)} OMR`,
            count: stats.refunded.count,
            color: "#60a5fa",
            icon: <RotateCcw size={18} />,
          },
          {
            label: "Failed",
            value: `${stats.failed.amount.toFixed(3)} OMR`,
            count: stats.failed.count,
            color: "#f87171",
            icon: <AlertCircle size={18} />,
          },
        ].map(({ label, value, count, color, icon }) => (
          <div
            key={label}
            className="rounded-xl border px-4 py-3 flex items-start gap-3"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: "#1a1d27",
            }}
          >
            <div
              className="mt-0.5 p-2 rounded-lg"
              style={{ background: `${color}12`, color }}
            >
              {icon}
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color }}>
                {value}
              </p>
              <p className="text-l" style={{ color: adminColors.textMuted }}>
                {label} · {count} payment{count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Tabs */}
        <div
          className="flex items-center rounded-lg border overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {TABS.map(({ key, label }) => {
            const count =
              key === "ALL"
                ? allNormalised.length
                : allNormalised.filter((p) => p.type === key).length;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex items-center gap-1.5 px-3 py-2 text-l font-medium transition-colors"
                style={{
                  background:
                    tab === key
                      ? `${TYPE_COLORS[key].bg}`
                      : "rgba(255,255,255,0.02)",
                  color:
                    tab === key ? TYPE_COLORS[key].text : adminColors.textMuted,
                  borderRight: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {label}
                {count > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[15px] font-semibold"
                    style={{
                      background:
                        tab === key
                          ? `${TYPE_COLORS[key].text}20`
                          : "rgba(255,255,255,0.06)",
                      color:
                        tab === key
                          ? TYPE_COLORS[key].text
                          : adminColors.textMuted,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Month navigator */}
        <div
          className="flex items-center gap-1 rounded-lg border px-1"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 rounded-md transition-colors text-white/40 hover:text-white/80"
          >
            <ChevronLeft size={18} />
          </button>
          <span
            className="text-xl px-2 font-medium"
            style={{ color: adminColors.textSecondary }}
          >
            {MONTHS_SHORT[month - 1]} {year}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 rounded-md transition-colors text-white/40 hover:text-white/80"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg text-xl border bg-white/4 text-white/70 focus:outline-none"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <option className="text-black" value="">
            {t("allStatuses")}
          </option>
          <option className="text-black" value="PAID">
            Paid
          </option>
          <option className="text-black" value="FAILED">
            Failed
          </option>
          <option className="text-black" value="REFUNDED">
            Refunded
          </option>
        </select>

        <span
          className="text-l ml-auto"
          style={{ color: adminColors.textMuted }}
        >
          {displayed.length} payment{displayed.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table ── */}
      <AdminCard noPadding>
        {displayed.length === 0 ? (
          <AdminEmptyState
            title="No payments found"
            description="Payments will appear here once students enroll and pay."
          />
        ) : (
          <AdminTable>
            <AdminThead>
              <AdminTh>{t("student")}</AdminTh>
              <AdminTh>Description</AdminTh>
              <AdminTh>{t("type")}</AdminTh>
              <AdminTh>{t("amount")}</AdminTh>
              <AdminTh>{t("method")}</AdminTh>
              <AdminTh>{t("date")}</AdminTh>
              <AdminTh>{t("status")}</AdminTh>
              <AdminTh className="text-right">{t("actions")}</AdminTh>
            </AdminThead>
            <AdminTbody>
              {displayed.map((payment) => {
                const typeColor = TYPE_COLORS[payment.type];
                return (
                  <AdminTr key={payment.id}>
                    <AdminTd>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[15px] font-semibold"
                          style={{
                            background: "rgba(245,158,11,0.1)",
                            color: "#f59e0b",
                          }}
                        >
                          {payment.studentName
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <p
                            className="text-xl font-medium"
                            style={{ color: adminColors.textPrimary }}
                          >
                            {payment.studentName}
                          </p>
                          <p
                            className="text-l"
                            style={{ color: adminColors.textMuted }}
                          >
                            {payment.studentContact}
                          </p>
                        </div>
                      </div>
                    </AdminTd>

                    <AdminTd>
                      <p
                        className="text-xl"
                        style={{ color: adminColors.textSecondary }}
                      >
                        {payment.description}
                      </p>
                      <p
                        className="text-l"
                        style={{ color: adminColors.textMuted }}
                      >
                        {payment.detail}
                      </p>
                    </AdminTd>

                    <AdminTd>
                      <span
                        className="text-l font-medium px-2 py-1 rounded-lg"
                        style={{
                          background: typeColor.bg,
                          color: typeColor.text,
                        }}
                      >
                        {payment.type === "ENROLLMENT"
                          ? "Enrollment"
                          : payment.type === "BOOKING"
                            ? "Booking"
                            : payment.type === "TRIAL"
                              ? "Trial"
                              : payment.type === "WORKSHOP"
                                ? "Workshop"
                                : payment.type}
                      </span>
                    </AdminTd>

                    <AdminTd>
                      <p
                        className="text-xl font-semibold"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {payment.amount.toFixed(3)}
                      </p>
                      <p
                        className="text-l"
                        style={{ color: adminColors.textMuted }}
                      >
                        {payment.currency}
                      </p>
                    </AdminTd>

                    <AdminTd>
                      <span
                        className="text-l"
                        style={{ color: adminColors.textSecondary }}
                      >
                        {payment.method
                          ? (METHOD_LABEL[payment.method] ?? payment.method)
                          : "—"}
                      </span>
                    </AdminTd>

                    <AdminTd>
                      {payment.paidAt ? (
                        <p
                          className="text-l"
                          style={{ color: adminColors.textSecondary }}
                        >
                          {new Date(payment.paidAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      ) : (
                        <span
                          className="text-l"
                          style={{ color: adminColors.textMuted }}
                        >
                          —
                        </span>
                      )}
                    </AdminTd>

                    <AdminTd>
                      <AdminBadge
                        variant={STATUS_BADGE[payment.status] ?? "default"}
                      >
                        {payment.status}
                      </AdminBadge>
                    </AdminTd>

                    <AdminTd className="text-right">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-amber-400 hover:bg-amber-500/8"
                        title="View details"
                      >
                        <Eye size={16} />
                      </button>
                    </AdminTd>
                  </AdminTr>
                );
              })}
            </AdminTbody>
          </AdminTable>
        )}
      </AdminCard>

      {/* ── Detail modal ── */}
      {selectedPayment && (
        <PaymentDetailModal
          payment={
            selectedPayment.rawKind === "enrollment"
              ? {
                  kind: "enrollment",
                  data: selectedPayment.raw as SerializedEnrollmentPayment,
                }
              : {
                  kind: "other",
                  data: selectedPayment.raw as SerializedOtherPayment,
                }
          }
          onClose={() => setSelectedPayment(null)}
          onRefresh={() => {
            setSelectedPayment(null);
            refreshData();
            toast("Payment updated.", "success");
          }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
