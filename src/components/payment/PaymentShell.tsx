"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  User,
} from "lucide-react";

const CLASS_ACCENT: Record<string, string> = {
  Music: "#C9A84C",
  "Dance & Wellness": "#A855F7",
  Art: "#F97316",
  Ballet: "#EC4899",
  Workshops: "#10B981",
  default: "#C9A84C",
};

export type PaymentLineItem = {
  label: string;
  value: string;
};

export type PaymentShellProps = {
  className: string; // e.g. "Music"
  subClassName: string; // e.g. "Piano — Beginner"
  badge: string; // e.g. "Monthly · Twice a Week" or "Trial Session"
  teacher: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  } | null;
  studentName: string;
  studentEmail: string;
  lineItems: PaymentLineItem[];
  total: string;
  currency: string;
  alreadyPaid: boolean;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
  successRedirect: string;
};

export function PaymentShell({
  className,
  subClassName,
  badge,
  teacher,
  studentName,
  studentEmail,
  lineItems,
  total,
  currency,
  alreadyPaid: initiallyPaid,
  onConfirm,
  successRedirect,
}: PaymentShellProps) {
  const router = useRouter();
  const accent = CLASS_ACCENT[className] ?? CLASS_ACCENT.default;

  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(initiallyPaid);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsPaying(true);
    setError(null);
    try {
      const result = await onConfirm();
      if (result.success) {
        setPaid(true);
        setTimeout(() => router.push(successRedirect), 1800);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-royal-cream/40 hover:text-royal-cream text-sm mb-10 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Ornamental */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px w-8" style={{ background: accent }} />
            <p
              className="text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: accent }}
            >
              {className}
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-royal-cream font-goudy leading-none">
            Complete Payment
          </h1>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl overflow-hidden border"
          style={{
            background: "linear-gradient(145deg, #1a1610, #100e0c)",
            borderColor: `${accent}25`,
          }}
        >
          {/* Accent top bar */}
          <div
            className="h-0.5"
            style={{
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            }}
          />

          {/* Class summary */}
          <div className="p-6 sm:p-8 pb-0">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div
                  className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2"
                  style={{
                    background: `${accent}18`,
                    color: accent,
                    border: `1px solid ${accent}30`,
                  }}
                >
                  {badge}
                </div>
                <h2 className="text-xl font-bold text-royal-cream font-goudy leading-tight">
                  {subClassName}
                </h2>
              </div>
              <div className="text-right shrink-0">
                <div className="text-3xl font-bold text-royal-gold font-goudy leading-none">
                  {total}
                </div>
                <div className="text-xs text-royal-cream/40 mt-0.5">
                  {currency}
                </div>
              </div>
            </div>

            {/* Teacher row */}
            {teacher && (
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/5">
                {teacher.photoUrl ? (
                  <img
                    src={teacher.photoUrl}
                    alt={teacher.firstName}
                    className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-royal-dark flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
                    }}
                  >
                    {teacher.firstName[0]}
                    {teacher.lastName[0]}
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-royal-cream/35 uppercase tracking-wider leading-none mb-0.5">
                    Instructor
                  </p>
                  <p className="text-sm font-semibold text-royal-cream/80">
                    {teacher.firstName} {teacher.lastName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Details list */}
          <div className="px-6 sm:px-8 pb-6">
            <div className="space-y-3">
              {lineItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-4 p-3 rounded-xl border"
                  style={{
                    background: `${accent}06`,
                    borderColor: `${accent}12`,
                  }}
                >
                  <span className="text-xs text-royal-cream/40 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span className="text-sm text-royal-cream/80 text-right font-medium">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mx-6 sm:mx-8" />

          {/* Student info */}
          <div className="px-6 sm:px-8 py-5">
            <p className="text-xs text-royal-cream/35 uppercase tracking-widest mb-3">
              Booking For
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-royal-dark flex-shrink-0 font-goudy"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
                }}
              >
                {studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-royal-cream text-sm">
                  {studentName}
                </p>
                <p className="text-xs text-royal-cream/40">{studentEmail}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mx-6 sm:mx-8" />

          {/* Price breakdown */}
          <div className="px-6 sm:px-8 py-5">
            <p className="text-xs text-royal-cream/35 uppercase tracking-widest mb-4">
              Price Breakdown
            </p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-royal-cream/60">{subClassName}</span>
                <span className="text-royal-cream">
                  {total} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-royal-cream/35">Tax</span>
                <span className="text-royal-cream/35">0.000 {currency}</span>
              </div>
            </div>
            <div
              className="pt-4 border-t flex items-center justify-between"
              style={{ borderColor: `${accent}20` }}
            >
              <span className="font-bold text-royal-cream">Total</span>
              <div className="text-right">
                <span
                  className="text-2xl font-bold font-goudy"
                  style={{ color: accent }}
                >
                  {total}
                </span>
                <span className="text-sm text-royal-cream/40 ml-1.5">
                  {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mx-6 sm:mx-8" />

          {/* CTA */}
          <div className="px-6 sm:px-8 py-6">
            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {paid ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="font-bold text-royal-cream font-goudy text-xl">
                  Payment Confirmed!
                </p>
                <p className="text-royal-cream/40 text-sm">
                  Redirecting you back…
                </p>
              </motion.div>
            ) : (
              <>
                <button
                  onClick={handleConfirm}
                  disabled={isPaying}
                  className="w-full py-4 rounded-xl font-bold text-base tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                    color: "#100e0c",
                    boxShadow: `0 8px 32px ${accent}33`,
                  }}
                >
                  {isPaying ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    `Confirm & Pay ${total} ${currency}`
                  )}
                </button>

                {/* Trust note */}
                <div className="flex items-center justify-center gap-2 mt-4 text-royal-cream/25 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    Secure payment · You can cancel up to 24h before the class
                  </span>
                </div>

                {/* Ornamental */}
                <div className="flex items-center justify-center gap-3 mt-5 opacity-20">
                  <div className="h-px w-12" style={{ background: accent }} />
                  <div
                    className="w-1 h-1 rotate-45"
                    style={{ background: accent }}
                  />
                  <div className="h-px w-12" style={{ background: accent }} />
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
