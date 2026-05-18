// src/app/[locale]/payments/_components/PaymentsClient.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import type {
  StudentPaymentRecord,
  PaymentStatus,
} from '@/lib/actions/student-payments';
import InvoiceModal from './InvoiceModal';
import ShareModal from './ShareModal';

const ORANGE = '#ff751f';

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PaymentStatus }) {
  const map: Record<
    PaymentStatus,
    { icon: React.ReactNode; label: string; cls: string }
  > = {
    PAID: {
      icon: <CheckCircle2 size={13} />,
      label: 'Paid',
      cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    FAILED: {
      icon: <XCircle size={13} />,
      label: 'Failed',
      cls: 'bg-red-500/15 text-red-300 border-red-500/30',
    },
    REFUNDED: {
      icon: <RefreshCw size={13} />,
      label: 'Refunded',
      cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    },
    PARTIALLY_REFUNDED: {
      icon: <RefreshCw size={13} />,
      label: 'Partial Refund',
      cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    },
  };

  const config = map[status] ?? map.FAILED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.cls}`}
    >
      {config.icon} {config.label}
    </span>
  );
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: StudentPaymentRecord['type'] }) {
  const map: Record<
    StudentPaymentRecord['type'],
    { label: string; color: string; border: string }
  > = {
    MONTHLY: {
      label: 'Monthly',
      color: `rgba(255,117,31,0.65)`,
      border: `rgba(255,117,31,0.2)`,
    },
    MULTI_MONTHLY: {
      label: 'Multi-Month',
      color: 'rgba(251,191,36,0.65)',
      border: 'rgba(251,191,36,0.2)',
    },
    TRIAL: {
      label: 'Trial',
      color: 'rgba(167,139,250,0.65)',
      border: 'rgba(167,139,250,0.2)',
    },
    WORKSHOP: {
      label: 'Workshop',
      color: 'rgba(125,211,252,0.65)',
      border: 'rgba(125,211,252,0.2)',
    },
    BOOKING: {
      label: 'Session',
      color: 'rgba(255,255,255,0.4)',
      border: 'rgba(255,255,255,0.12)',
    },
  };
  const { label, color, border } = map[type];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium tracking-wide"
      style={{ color, border: `1px solid ${border}` }}
    >
      <Tag size={11} />
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
    payment.type === 'WORKSHOP'
      ? `/workshops/${payment.workshopSlug ?? payment.subClassId}`
      : `/enrollment/${payment.subClassId}`;

  const detailRows = [
    { icon: <User size={13} />, label: 'Instructor', value: payment.teacherName },
    { icon: <Calendar size={13} />, label: 'Days', value: payment.dayOfWeek },
    {
      icon: <Clock size={13} />,
      label: 'Time',
      value: payment.timeString ?? `${payment.startTime} – ${payment.endTime}`,
    },
    ...(payment.frequency
      ? [{ icon: <RefreshCw size={13} />, label: 'Frequency', value: payment.frequency }]
      : []),
    ...(payment.level
      ? [{ icon: <Star size={13} />, label: 'Level', value: payment.level }]
      : []),
    { icon: <MapPin size={13} />, label: 'Location', value: 'Royal Academy, Muscat' },
    ...(payment.method
      ? [{ icon: <CreditCard size={13} />, label: 'Method', value: payment.method }]
      : []),
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden transition-shadow duration-300"
      style={{
        background: '#141414',
        border: '1px solid #222',
      }}
    >
      {/* Summary row */}
      <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-5">
        <div
          className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
          style={{
            background: `rgba(255,117,31,0.1)`,
            border: `1px solid rgba(255,117,31,0.18)`,
          }}
        >
          <CreditCard size={24} style={{ color: ORANGE }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
            <span className="font-semibold text-base" style={{ color: '#f0f0f0' }}>
              {payment.subClassName}
            </span>
            <StatusBadge status={payment.status} />
            <TypeBadge type={payment.type} />
          </div>
          <div className="flex flex-wrap gap-x-4 text-sm" style={{ color: '#666' }}>
            <span>{payment.className}</span>
            {payment.month && (
              <span>
                {payment.month} {payment.year}
              </span>
            )}
            <span className="font-mono" style={{ color: `rgba(255,117,31,0.45)` }}>
              {payment.invoiceNo}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="font-bold text-2xl" style={{ color: ORANGE }}>
            {payment.amount}
            <span className="text-sm font-normal ml-1.5" style={{ color: '#555' }}>
              {payment.currency}
            </span>
          </div>
          {payment.paidAt && (
            <div className="text-sm mt-0.5" style={{ color: '#555' }}>
              {new Date(payment.paidAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="transition-colors"
          style={{ color: '#555' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#999')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
        >
          {expanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="border-t px-6 sm:px-7 py-6 space-y-5"
          style={{ borderColor: '#222' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-sm">
            {detailRows.map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0" style={{ color: ORANGE }}>
                  {icon}
                </span>
                <div>
                  <div className="mb-0.5 text-xs" style={{ color: '#555' }}>{label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.75)' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={() => onViewInvoice(payment)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                color: '#888',
              }}
            >
              <FileText size={15} /> View Invoice
            </button>

            <button
              onClick={() => onShare(payment)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                color: '#888',
              }}
            >
              <Share2 size={15} /> Share
            </button>

            {payment.type !== 'BOOKING' && (
              <Link
                href={continueHref}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 ml-auto"
                style={{
                  background: ORANGE,
                  color: '#fff',
                }}
              >
                {payment.type === 'WORKSHOP' ? 'View Workshop' : 'Continue Class'}{' '}
                <ArrowRight size={15} />
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
      icon: <Shield size={22} />,
      title: 'Secure Payments',
      desc: '256-bit SSL on every transaction',
    },
    {
      icon: <Star size={22} />,
      title: 'Satisfaction Promise',
      desc: 'Trial refund if not satisfied',
    },
    {
      icon: <RefreshCw size={22} />,
      title: 'Flexible Scheduling',
      desc: 'Reschedule up to 24 hrs prior',
    },
    {
      icon: <Sparkles size={22} />,
      title: 'Certified Instructors',
      desc: 'Professionally trained & vetted',
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((i) => (
        <div
          key={i.title}
          className="rounded-xl p-6 text-center"
          style={{
            background: '#1a1a1a',
            border: '1px solid #222',
          }}
        >
          <div className="mb-3 flex justify-center" style={{ color: ORANGE }}>
            {i.icon}
          </div>
          <div className="text-sm font-semibold mb-1.5" style={{ color: '#f0f0f0' }}>
            {i.title}
          </div>
          <div className="text-xs leading-relaxed" style={{ color: '#555' }}>
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
    .filter((p) => p.status === 'PAID')
    .reduce((s, p) => s + p.amount, 0);
  const paidCount = payments.filter((p) => p.status === 'PAID').length;
  const currency = payments[0]?.currency ?? 'OMR';

  return (
    <div className="grid grid-cols-2 gap-4">
      {[
        {
          label: 'Total Paid',
          value: `${totalPaid} ${currency}`,
          sub: `${paidCount} transactions`,
        },
        {
          label: 'Classes Enrolled',
          value: String(new Set(payments.map((p) => p.subClassId)).size),
          sub: 'unique classes',
        },
      ].map((s) => (
        <div
          key={s.label}
          className="rounded-xl p-6 text-center"
          style={{
            background: '#1a1a1a',
            border: '1px solid #222',
          }}
        >
          <div className="font-bold text-2xl" style={{ color: ORANGE }}>
            {s.value}
          </div>
          <div className="text-sm mt-1" style={{ color: '#666' }}>
            {s.label}
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#444' }}>
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

type FilterStatus = PaymentStatus | 'ALL';
type FilterType = StudentPaymentRecord['type'] | 'ALL';

export default function PaymentsClient({
  payments,
}: {
  payments: StudentPaymentRecord[];
}) {
  const [invoicePayment, setInvoicePayment] =
    useState<StudentPaymentRecord | null>(null);
  const [sharePayment, setSharePayment] = useState<StudentPaymentRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [filterType, setFilterType] = useState<FilterType>('ALL');

  const filtered = payments.filter((p) => {
    const statusOk = filterStatus === 'ALL' || p.status === filterStatus;
    const typeOk = filterType === 'ALL' || p.type === filterType;
    return statusOk && typeOk;
  });

  const statusTabs: FilterStatus[] = ['ALL', 'PAID', 'FAILED', 'REFUNDED'];
  const typeTabs: Array<{ key: FilterType; label: string }> = [
    { key: 'ALL', label: 'All Types' },
    { key: 'MONTHLY', label: 'Monthly' },
    { key: 'MULTI_MONTHLY', label: 'Multi-Month' },
    { key: 'TRIAL', label: 'Trial' },
    { key: 'WORKSHOP', label: 'Workshop' },
    { key: 'BOOKING', label: 'Session' },
  ];

  return (
    <div className="min-h-screen py-10 px-6" style={{ backgroundColor: '#0d0d0d' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div
            className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: `rgba(255,117,31,0.55)` }}
          >
            <Crown size={12} /> Royal Academy
          </div>
          <h1 className="text-4xl font-bold" style={{ color: '#f0f0f0' }}>
            My Payments
          </h1>
          <p className="text-base mt-2" style={{ color: '#666' }}>
            Transaction history & class invoices
          </p>
        </div>

        {/* Stats */}
        {payments.length > 0 && <PaymentStats payments={payments} />}

        {/* Status filter */}
        <div className="flex gap-2.5 flex-wrap">
          {statusTabs.map((t) => (
            <button
              key={t}
              onClick={() => setFilterStatus(t)}
              className="px-5 py-2 rounded-full text-sm font-medium transition-all"
              style={
                filterStatus === t
                  ? { background: ORANGE, color: '#fff' }
                  : {
                      background: 'transparent',
                      color: '#666',
                      border: '1px solid #2a2a2a',
                    }
              }
            >
              {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-2.5 flex-wrap -mt-3">
          {typeTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
              style={
                filterType === key
                  ? {
                      background: `rgba(255,117,31,0.1)`,
                      color: ORANGE,
                      border: `1px solid rgba(255,117,31,0.25)`,
                    }
                  : {
                      background: 'transparent',
                      color: '#555',
                      border: '1px solid #222',
                    }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Payment list */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div
              className="rounded-2xl py-24 text-center"
              style={{ border: `1px dashed rgba(255,117,31,0.12)` }}
            >
              <Crown
                size={36}
                className="mx-auto mb-4"
                style={{ color: `rgba(255,117,31,0.18)` }}
              />
              <p className="text-base" style={{ color: '#444' }}>
                No payments found.
              </p>
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
          <div className="space-y-4">
            <p
              className="text-xs uppercase tracking-widest flex items-center gap-2"
              style={{ color: '#444' }}
            >
              <Shield size={12} /> Our Commitment to You
            </p>
            <TrustBadges />
          </div>
        )}

        {/* Support CTA */}
        <div
          className="rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{
            background: '#141414',
            border: '1px solid #222',
          }}
        >
          <div>
            <div className="font-semibold mb-1.5 text-base" style={{ color: '#f0f0f0' }}>
              Need help with a payment?
            </div>
            <div className="text-sm" style={{ color: '#666' }}>
              Our team is here to assist with any billing questions.
            </div>
          </div>
          <Link
            href="/support"
            className="shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-base transition-all hover:opacity-90"
            style={{
              background: ORANGE,
              color: '#fff',
            }}
          >
            Contact Support <ArrowRight size={16} />
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
