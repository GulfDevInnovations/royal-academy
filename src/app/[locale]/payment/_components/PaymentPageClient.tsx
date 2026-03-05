"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Wifi,
  User,
  Award,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { confirmPayment } from "@/lib/actions/payment";
import { SuccessToast } from "./SuccessToast";

type PaymentData = {
  bookingId: string;
  status: string;
  studentName: string;
  studentEmail: string;
  session: {
    date: string;
    startTime: string;
    endTime: string;
  };
  subClass: {
    name: string;
    level: string | null;
    durationMinutes: number;
    className: string;
  };
  teacher: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  };
  payment: {
    id: string | null;
    amount: string;
    currency: string;
    status: string;
  };
};

const CLASS_ACCENT: Record<string, string> = {
  Piano: "#C9A84C",
  Dance: "#A855F7",
  Ballet: "#EC4899",
  Violin: "#3B82F6",
  Guitar: "#10B981",
  Painting: "#F97316",
  Singing: "#EF4444",
  default: "#C9A84C",
};

export function PaymentPageClient({ data }: { data: PaymentData }) {
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(data.payment.status === "PAID");

  const accent = CLASS_ACCENT[data.subClass.className] ?? CLASS_ACCENT.default;

  const sessionDate = parseISO(data.session.date);

  const handleConfirm = async () => {
    setIsPaying(true);
    try {
      const result = await confirmPayment(data.bookingId, data.payment.id);
      if (result.success) {
        setPaid(true);
        // Wait briefly so user sees the success state, then redirect
        setTimeout(() => {
          router.push("/reservation?success=1");
        }, 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-royal-cream/40 hover:text-royal-cream text-sm mb-8 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to reservation
        </button>

        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: accent }}
          >
            {data.subClass.className}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-royal-cream font-goudy">
            Confirm Your Booking
          </h1>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl border border-royal-cream/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] overflow-hidden"
        >
          {/* Accent top bar */}
          <div
            className="h-1"
            style={{
              background: `linear-gradient(90deg, ${accent}88, ${accent})`,
            }}
          />

          {/* Class summary */}
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-royal-cream font-goudy">
                  {data.subClass.name}
                </h2>
                {data.subClass.level && (
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-royal-cream/50">
                    {data.subClass.level}
                  </span>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-royal-gold font-goudy">
                  {data.payment.amount}
                </div>
                <div className="text-xs text-royal-cream/40">
                  {data.payment.currency}
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DetailRow
                icon={<Calendar className="w-4 h-4" />}
                label="Date"
                value={format(sessionDate, "EEEE, MMMM d, yyyy")}
              />
              <DetailRow
                icon={<Clock className="w-4 h-4" />}
                label="Time"
                value={`${data.session.startTime} – ${data.session.endTime} (${data.subClass.durationMinutes}min)`}
              />
              <DetailRow
                icon={<User className="w-4 h-4" />}
                label="Instructor"
                value={`${data.teacher.firstName} ${data.teacher.lastName}`}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mx-6 sm:mx-8" />

          {/* Student info */}
          <div className="px-6 sm:px-8 py-5">
            <p className="text-xs text-royal-cream/40 uppercase tracking-widest mb-3">
              Booking for
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-royal-dark flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
                }}
              >
                {data.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-royal-cream text-sm">
                  {data.studentName}
                </p>
                <p className="text-xs text-royal-cream/50">
                  {data.studentEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mx-6 sm:mx-8" />

          {/* Price breakdown */}
          <div className="px-6 sm:px-8 py-5">
            <p className="text-xs text-royal-cream/40 uppercase tracking-widest mb-4">
              Price Breakdown
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-royal-cream/70">
                  {data.subClass.name}
                </span>
                <span className="text-royal-cream">
                  {data.payment.amount} {data.payment.currency}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-royal-cream/40">Tax</span>
                <span className="text-royal-cream/40">
                  0.000 {data.payment.currency}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="font-bold text-royal-cream">Total</span>
              <span className="text-xl font-bold text-royal-gold font-goudy">
                {data.payment.amount}{" "}
                <span className="text-sm font-normal text-royal-cream/50">
                  {data.payment.currency}
                </span>
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/5 mx-6 sm:mx-8" />

          {/* CTA */}
          <div className="px-6 sm:px-8 py-6">
            {paid ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="font-bold text-royal-cream font-goudy text-lg">
                  Booking Confirmed!
                </p>
                <p className="text-royal-cream/50 text-sm">
                  Redirecting you back…
                </p>
              </motion.div>
            ) : (
              <>
                <button
                  onClick={handleConfirm}
                  disabled={isPaying}
                  className="
                    w-full py-4 rounded-xl font-bold text-royal-dark
                    text-base tracking-wide transition-all duration-300
                    hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]
                    disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100
                  "
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                    boxShadow: `0 8px 32px ${accent}44`,
                  }}
                >
                  {isPaying ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing…
                    </span>
                  ) : (
                    `Confirm & Pay ${data.payment.amount} ${data.payment.currency}`
                  )}
                </button>

                {/* Trust note */}
                <div className="flex items-center justify-center gap-2 mt-4 text-royal-cream/30 text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    Secure payment · You can cancel up to 24h before the class
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
      <SuccessToast />
    </main>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="text-royal-cream/30 mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <p className="text-[10px] text-royal-cream/40 uppercase tracking-wider leading-none mb-1">
          {label}
        </p>
        <p className="text-sm text-royal-cream/80">{value}</p>
      </div>
    </div>
  );
}
