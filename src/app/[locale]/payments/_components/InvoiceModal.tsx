// src/app/[locale]/payments/_components/InvoiceModal.tsx
'use client';

import { Printer, X, Crown } from 'lucide-react';
import type { StudentPaymentRecord } from '@/lib/actions/student-payments';

interface Props {
  payment: StudentPaymentRecord;
  onClose: () => void;
}

export default function InvoiceModal({ payment, onClose }: Props) {
  const handlePrint = () => window.print();

  const period = payment.month
    ? `${payment.month} ${payment.year}`
    : payment.eventDate
      ? new Date(payment.eventDate).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;

  const rows: Array<[string, string | undefined | null]> = [
    ['Class', payment.className],
    ['Sub-class', payment.subClassName],
    ['Instructor', payment.teacherName],
    [
      'Schedule',
      `${payment.dayOfWeek}, ${payment.startTime}–${payment.endTime}`,
    ],
    ['Frequency', payment.frequency],
    ['Period', period],
    ['Level', payment.level],
    ['Age Group', payment.ageGroup],
    ['Location', 'Royal Academy · Muscat, Sultanate of Oman'],
    ['Payment Method', payment.method],
  ].filter(([, v]) => Boolean(v)) as Array<[string, string]>;

  const issuedDate = payment.paidAt
    ? new Date(payment.paidAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Awaiting Payment';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop — hidden during print */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm print:hidden"
        onClick={onClose}
      />

      {/* Invoice sheet */}
      <div
        id="invoice-print"
        className="relative z-10 bg-white text-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-4 print:shadow-none print:rounded-none print:my-0 print:max-w-full"
        style={{ fontFamily: 'var(--font-text)' }}
      >
        {/* ── Header ── */}
        <div className="px-8 py-7 text-white" style={{ background: '#111111' }}>
          <div className="flex justify-between items-start">
            {/* Logo — swap Crown for <img src="/logo-color.png" /> when ready */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                {/* <img src="/logo-color.png" alt="Royal Academy" className="w-9 h-9 object-contain" /> */}
                <Crown size={26} style={{ color: '#ff751f' }} />
              </div>
              <div>
                <div
                  className="font-bold text-lg tracking-[0.12em]" style={{ color: '#ff751f' }}
                  style={{ fontFamily: "'Palatino Linotype', Palatino, serif" }}
                >
                  ROYAL ACADEMY
                </div>
                <div className="text-white/50 text-[10px] tracking-[0.18em] uppercase">
                  Arts & Performance · Muscat
                </div>
              </div>
            </div>

            {/* Invoice meta */}
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: '#ff751f' }}>
                Invoice
              </div>
              <div className="text-white font-bold text-base">
                {payment.invoiceNo}
              </div>
              <div className="text-white/50 text-xs mt-1">{issuedDate}</div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-8 py-6 space-y-5">
          {/* Status pill */}
          <div className="flex justify-end">
            <span
              className={`... ${
                payment.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-700'
                  : payment.status === 'REFUNDED' ||
                      payment.status === 'PARTIALLY_REFUNDED'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700' // FAILED
              }`}
            >
              {payment.status}
            </span>
          </div>

          {/* Detail table */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-5 py-2.5 border-b border-gray-100">
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-bold">
                Class Details
              </span>
            </div>
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="flex border-b border-gray-50 last:border-0 px-5 py-2.5"
              >
                <span className="text-gray-400 text-sm w-36 shrink-0">
                  {label}
                </span>
                <span className="text-gray-800 text-sm font-medium">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Amount block */}
          <div className="rounded-xl px-6 py-5 flex justify-between items-center text-white" style={{ background: '#111111' }}>
            <div>
              <div className="text-white/50 text-[10px] uppercase tracking-widest mb-1">
                Total Amount
              </div>
              <div className="text-3xl font-bold" style={{ color: '#ff751f' }}>
                {payment.amount}{' '}
                <span className="text-base font-normal text-white/60">
                  {payment.currency}
                </span>
              </div>
            </div>
            {payment.method && (
              <div className="text-right">
                <div className="text-white/50 text-[10px] uppercase tracking-widest mb-1">
                  Method
                </div>
                <div className="text-sm font-medium">{payment.method}</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-gray-400 text-[11px] space-y-0.5 pt-4 border-t border-gray-100">
            <p>Royal Academy · Muscat, Sultanate of Oman</p>
            <p>info@radma.om · +968 XXXX XXXX · www.radma.om</p>
            <p className="text-gray-300 italic pt-1">
              &quot;Thank you for choosing Royal Academy — where excellence
              meets art.&quot;
            </p>
          </div>
        </div>

        {/* ── Actions (hidden on print) ── */}
        <div className="px-8 pb-7 flex gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
            style={{
              background: '#ff751f',
              color: '#fff',
            }}
          >
            <Printer size={15} />
            Print Invoice
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
