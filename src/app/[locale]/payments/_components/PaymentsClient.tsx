// src/app/[locale]/payments/_components/PaymentsClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Crown,
  Share2,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Star,
  Shield,
  Calendar,
  MapPin,
  User,
  CreditCard,
  FileText,
  Sparkles,
  Tag,
} from "lucide-react";
import type {
  StudentPaymentRecord,
  PaymentStatus,
} from "@/lib/actions/student-payments";
import InvoiceModal from "./InvoiceModal";
import ShareModal from "./ShareModal";

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<
    PaymentStatus,
    { icon: React.ReactNode; label: string; cls: string }
  > = {
    PAID: {
      icon: <CheckCircle2 size={11} />,
      label: "Paid",
      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    PENDING: {
      icon: <Clock size={11} />,
      label: "Pending",
      cls: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    FAILED: {
      icon: <XCircle size={11} />,
      label: "Failed",
      cls: "bg-red-500/15 text-red-300 border-red-500/30",
    },
    REFUNDED: {
      icon: <RefreshCw size={11} />,
      label: "Refunded",
      cls: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    },
    PARTIALLY_REFUNDED: {
      icon: <RefreshCw size={11} />,
      label: "Partial Refund",
      cls: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    },
  };
  const { icon, label, cls } = map[status] ?? map.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}
    >
      {icon} {label}
    </span>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: StudentPaymentRecord["type"] }) {
  const map = {
    MONTHLY: {
      label: "Monthly",
      cls: "text-royal-gold/70 border-royal-gold/20",
    },
    TRIAL: { label: "Trial", cls: "text-violet-300/70 border-violet-500/20" },
    WORKSHOP: { label: "Workshop", cls: "text-sky-300/70 border-sky-500/20" },
    BOOKING: {
      label: "Session",
      cls: "text-royal-cream/50 border-royal-cream/15",
    },
  };
  const { label, cls } = map[type];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium tracking-wide ${cls}`}
    >
      <Tag size={9} />
      {label}
    </span>
  );
}

// ─── Individual payment card ──────────────────────────────────────────────────

function PaymentCard({
  payment,
  onViewInvoice,
  onShare,
}: {
  payment: StudentPaymentRecord;
  onViewInvoice: (p: StudentPaymentRecord) => void;
  onShare: (p: StudentPaymentRecord) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const continueHref =
    payment.type === "WORKSHOP"
      ? `/workshops/${payment.subClassId}`
      : `/reservation/${payment.subClassId}`;

  const detailRows = [
    {
      icon: <User size={10} />,
      label: "Instructor",
      value: payment.teacherName,
    },
    { icon: <Calendar size={10} />, label: "Days", value: payment.dayOfWeek },
    {
      icon: <Clock size={10} />,
      label: "Time",
      value: `${payment.startTime} – ${payment.endTime}`,
    },
    ...(payment.frequency
      ? [
          {
            icon: <RefreshCw size={10} />,
            label: "Frequency",
            value: payment.frequency,
          },
        ]
      : []),
    ...(payment.level
      ? [{ icon: <Star size={10} />, label: "Level", value: payment.level }]
      : []),
    {
      icon: <MapPin size={10} />,
      label: "Location",
      value: "Royal Academy, Muscat",
    },
    ...(payment.method
      ? [
          {
            icon: <CreditCard size={10} />,
            label: "Method",
            value: payment.method,
          },
        ]
      : []),
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.3)]"
      style={{
        background:
          "linear-gradient(135deg,rgba(255,255,255,0.08) 0%,rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(196,168,130,0.14)",
      }}
    >
      {/* Summary row */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{
            background: "rgba(196,168,130,0.1)",
            border: "1px solid rgba(196,168,130,0.22)",
          }}
        >
          <CreditCard size={17} className="text-royal-gold" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-royal-cream font-semibold text-sm">
              {payment.subClassName}
            </span>
            <StatusBadge status={payment.status} />
            <TypeBadge type={payment.type} />
          </div>
          <div className="flex flex-wrap gap-x-3 text-royal-cream/40 text-xs">
            <span>{payment.className}</span>
            {payment.month && (
              <span>
                {payment.month} {payment.year}
              </span>
            )}
            <span className="font-mono text-royal-gold/45">
              {payment.invoiceNo}
            </span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-royal-gold font-bold text-xl">
            {payment.amount}
            <span className="text-xs font-normal text-royal-cream/35 ml-1">
              {payment.currency}
            </span>
          </div>
          {payment.paidAt && (
            <div className="text-royal-cream/30 text-xs">
              {new Date(payment.paidAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-royal-cream/30 hover:text-royal-cream/60 transition-colors"
        >
          {expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="border-t px-5 py-4 space-y-4"
          style={{ borderColor: "rgba(196,168,130,0.1)" }}
        >
          <div className="grid grid-cols-2 gap-3 text-xs">
            {detailRows.map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-1.5">
                <span className="text-royal-gold mt-0.5 flex-shrink-0">
                  {icon}
                </span>
                <div>
                  <div className="text-royal-cream/35 mb-0.5">{label}</div>
                  <div className="text-royal-cream/75">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => onViewInvoice(payment)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(196,168,130,0.1)",
                border: "1px solid rgba(196,168,130,0.22)",
                color: "#c4a882",
              }}
            >
              <FileText size={12} /> View Invoice
            </button>

            <button
              onClick={() => onShare(payment)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(222,194,171,0.7)",
              }}
            >
              <Share2 size={12} /> Share
            </button>

            {payment.type !== "BOOKING" && (
              <Link
                href={continueHref}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-[1.02] ml-auto"
                style={{
                  background:
                    "linear-gradient(135deg,rgba(196,168,130,0.28),rgba(196,168,130,0.08))",
                  border: "1px solid rgba(196,168,130,0.38)",
                  color: "#d4b896",
                }}
              >
                Continue Class <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trust badges ─────────────────────────────────────────────────────────────

function TrustBadges() {
  const items = [
    {
      icon: <Shield size={15} />,
      title: "Secure Payments",
      desc: "256-bit SSL on every transaction",
    },
    {
      icon: <Star size={15} />,
      title: "Satisfaction Promise",
      desc: "Trial refund if not satisfied",
    },
    {
      icon: <RefreshCw size={15} />,
      title: "Flexible Scheduling",
      desc: "Reschedule up to 24 hrs prior",
    },
    {
      icon: <Sparkles size={15} />,
      title: "Certified Instructors",
      desc: "Professionally trained & vetted",
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((i) => (
        <div
          key={i.title}
          className="rounded-xl p-4 text-center"
          style={{
            background: "rgba(196,168,130,0.05)",
            border: "1px solid rgba(196,168,130,0.1)",
          }}
        >
          <div className="text-royal-gold mb-2 flex justify-center">
            {i.icon}
          </div>
          <div className="text-royal-cream text-xs font-semibold mb-1">
            {i.title}
          </div>
          <div className="text-royal-cream/35 text-[10px] leading-relaxed">
            {i.desc}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Summary stats ────────────────────────────────────────────────────────────

function PaymentStats({ payments }: { payments: StudentPaymentRecord[] }) {
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + p.amount, 0);
  const paidCount = payments.filter((p) => p.status === "PAID").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const currency = payments[0]?.currency ?? "OMR";

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        {
          label: "Total Paid",
          value: `${totalPaid} ${currency}`,
          sub: `${paidCount} transactions`,
        },
        {
          label: "Pending",
          value: String(pendingCount),
          sub: "awaiting payment",
        },
        {
          label: "Classes",
          value: String(new Set(payments.map((p) => p.subClassId)).size),
          sub: "unique classes",
        },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-xl p-4 text-center"
          style={{
            background: "rgba(196,168,130,0.07)",
            border: "1px solid rgba(196,168,130,0.15)",
          }}
        >
          <div className="text-royal-gold font-bold text-lg">{s.value}</div>
          <div className="text-royal-cream/35 text-[10px] mt-0.5">
            {s.label}
          </div>
          <div className="text-royal-cream/25 text-[9px]">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

type FilterStatus = PaymentStatus | "ALL";
type FilterType = StudentPaymentRecord["type"] | "ALL";

export default function PaymentsClient({
  payments,
}: {
  payments: StudentPaymentRecord[];
}) {
  const [invoicePayment, setInvoicePayment] =
    useState<StudentPaymentRecord | null>(null);
  const [sharePayment, setSharePayment] = useState<StudentPaymentRecord | null>(
    null,
  );
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  const filtered = payments.filter((p) => {
    const statusOk = filterStatus === "ALL" || p.status === filterStatus;
    const typeOk = filterType === "ALL" || p.type === filterType;
    return statusOk && typeOk;
  });

  const statusTabs: FilterStatus[] = [
    "ALL",
    "PAID",
    "PENDING",
    "FAILED",
    "REFUNDED",
  ];
  const typeTabs: Array<{ key: FilterType; label: string }> = [
    { key: "ALL", label: "All Types" },
    { key: "MONTHLY", label: "Monthly" },
    { key: "TRIAL", label: "Trial" },
    { key: "WORKSHOP", label: "Workshop" },
    { key: "BOOKING", label: "Session" },
  ];

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: "var(--royal-purple)" }}
    >
      <div className="max-w-3xl mx-auto space-y-7">
        {/* Header */}
        <div>
          <div className="flex items-center gap-1.5 text-royal-gold/55 text-[10px] uppercase tracking-[0.2em] mb-2">
            <Crown size={10} /> Royal Academy
          </div>
          <h1
            className="text-3xl font-bold text-royal-cream"
            style={{ fontFamily: "'Palatino Linotype', Palatino, serif" }}
          >
            My Payments
          </h1>
          <p className="text-royal-cream/40 text-sm mt-1">
            Transaction history & class invoices
          </p>
        </div>

        {/* Stats */}
        {payments.length > 0 && <PaymentStats payments={payments} />}

        {/* Status filter */}
        <div className="flex gap-2 flex-wrap">
          {statusTabs.map((t) => (
            <button
              key={t}
              onClick={() => setFilterStatus(t)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === t
                  ? "bg-royal-gold text-royal-dark shadow-md"
                  : "text-royal-cream/45 hover:text-royal-cream border border-royal-cream/10 hover:border-royal-cream/20"
              }`}
            >
              {t === "ALL" ? "All" : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2 flex-wrap -mt-4">
          {typeTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                filterType === key
                  ? "bg-royal-mauve/60 text-royal-cream border border-royal-mauve"
                  : "text-royal-cream/35 hover:text-royal-cream/60 border border-royal-cream/8"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Payment list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl py-16 text-center"
              style={{ border: "1px dashed rgba(196,168,130,0.15)" }}
            >
              <Crown size={28} className="text-royal-gold/20 mx-auto mb-3" />
              <p className="text-royal-cream/25 text-sm">No payments found.</p>
            </div>
          ) : (
            filtered.map((p) => (
              <PaymentCard
                key={p.id}
                payment={p}
                onViewInvoice={setInvoicePayment}
                onShare={setSharePayment}
              />
            ))
          )}
        </div>

        {/* Trust */}
        {payments.length > 0 && (
          <div className="space-y-3">
            <p className="text-royal-cream/30 text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <Shield size={10} /> Our Commitment to You
            </p>
            <TrustBadges />
          </div>
        )}

        {/* Support CTA */}
        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{
            background:
              "linear-gradient(135deg,rgba(196,168,130,0.09),rgba(196,168,130,0.03))",
            border: "1px solid rgba(196,168,130,0.16)",
          }}
        >
          <div>
            <div className="text-royal-cream font-semibold mb-1 text-sm">
              Need help with a payment?
            </div>
            <div className="text-royal-cream/40 text-xs">
              Our team is here to assist with any billing questions.
            </div>
          </div>
          <Link
            href="/support"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg,#c4a882,#d4b896)",
              color: "#0a0f2c",
            }}
          >
            Contact Support <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Modals */}
      {invoicePayment && (
        <InvoiceModal
          payment={invoicePayment}
          onClose={() => setInvoicePayment(null)}
        />
      )}
      {sharePayment && (
        <ShareModal
          payment={sharePayment}
          onClose={() => setSharePayment(null)}
        />
      )}
    </div>
  );
}
