"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SessionForCalendar } from "@/lib/actions/reservation";
import {
  X,
  Clock,
  MapPin,
  Users,
  Wifi,
  Star,
  Calendar,
  BookOpen,
  Award,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface ClassModalProps {
  session: SessionForCalendar | null;
  onClose: () => void;
  onBook: (session: SessionForCalendar) => void;
  isBooking: boolean;
}

const CLASS_ACCENT: Record<string, string> = {
  Piano: "#C9A84C",
  Dance: "#A855F7",
  Ballet: "#EC4899",
  Violin: "#3B82F6",
  Guitar: "#10B981",
  Painting: "#F97316",
  Singing: "#EF4444",
  default: "#94A3B8",
};

export function ClassModal({
  session,
  onClose,
  onBook,
  isBooking,
}: ClassModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [session, onClose]);

  const accent = session
    ? (CLASS_ACCENT[session.subClass.class.name] ?? CLASS_ACCENT.default)
    : "#C9A84C";

  const isFull = session ? session.spotsLeft <= 0 : false;
  const spotsPercent = session
    ? Math.max(0, (session.spotsLeft / session.subClass.capacity) * 100)
    : 0;

  return (
    <AnimatePresence>
      {session && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="
              fixed z-50 inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2
              sm:-translate-x-1/2 sm:-translate-y-1/2
              w-auto sm:w-full sm:max-w-lg
              max-h-[90vh] overflow-y-auto
              rounded-t-3xl sm:rounded-2xl
              bg-[#141414] border border-white/10
              shadow-2xl shadow-black/60
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Accent gradient top */}
            <div
              className="h-1 w-full rounded-t-2xl"
              style={{
                background: `linear-gradient(90deg, ${accent}99, ${accent})`,
              }}
            />

            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-royal-cream/60 hover:text-royal-cream transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Category + name */}
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: accent }}
              >
                {session.subClass.class.name}
              </div>
              <h2 className="text-2xl font-bold text-royal-cream font-goudy leading-tight pr-8">
                {session.subClass.name}
              </h2>

              {/* Date & time */}
              <div className="flex items-center gap-2 mt-2 text-royal-cream/60 text-sm">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(parseISO(session.sessionDate), "EEEE, MMMM d")}
                </span>
                <span className="text-royal-cream/30">·</span>
                <Clock className="w-4 h-4" />
                <span>
                  {session.startTime} – {session.endTime}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 mx-6" />

            {/* Teacher section */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-bold text-royal-dark"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
                  }}
                >
                  {session.teacher.photoUrl ? (
                    <img
                      src={session.teacher.photoUrl}
                      alt={session.teacher.firstName}
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    `${session.teacher.firstName[0]}${session.teacher.lastName[0]}`
                  )}
                </div>

                <div>
                  <div className="text-xs text-royal-cream/40 uppercase tracking-wider mb-0.5">
                    Instructor
                  </div>
                  <div className="font-bold text-royal-cream font-goudy">
                    {session.teacher.firstName} {session.teacher.lastName}
                  </div>
                  {session.teacher.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {session.teacher.specialties.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-royal-cream/50 border border-white/5"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {session.teacher.bio && (
                <p className="mt-3 text-sm text-royal-cream/60 leading-relaxed line-clamp-3">
                  {session.teacher.bio}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 mx-6" />

            {/* Details grid */}
            <div className="p-6 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <DetailChip
                  icon={<Clock className="w-3.5 h-3.5" />}
                  label="Duration"
                  value={`${session.subClass.durationMinutes} minutes`}
                />

                {session.subClass.level && (
                  <DetailChip
                    icon={<Award className="w-3.5 h-3.5" />}
                    label="Level"
                    value={session.subClass.level}
                  />
                )}

                {session.subClass.ageGroup && (
                  <DetailChip
                    icon={<Users className="w-3.5 h-3.5" />}
                    label="Age Group"
                    value={session.subClass.ageGroup}
                  />
                )}

                {session.room && (
                  <DetailChip
                    icon={
                      session.room.location.isOnline ? (
                        <Wifi className="w-3.5 h-3.5" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )
                    }
                    label={
                      session.room.location.isOnline ? "Format" : "Location"
                    }
                    value={
                      session.room.location.isOnline
                        ? "Online"
                        : `${session.room.name}, ${session.room.location.name}`
                    }
                  />
                )}
              </div>

              {session.subClass.description && (
                <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex items-center gap-2 text-xs text-royal-cream/40 uppercase tracking-wider mb-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    About this class
                  </div>
                  <p className="text-sm text-royal-cream/70 leading-relaxed">
                    {session.subClass.description}
                  </p>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5 mx-6" />

            {/* Footer: spots + price + CTA */}
            <div className="p-6">
              {/* Spots bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 text-royal-cream/50">
                    <Users className="w-3.5 h-3.5" />
                    <span>Availability</span>
                  </div>
                  <span
                    className={`font-semibold ${
                      isFull
                        ? "text-red-400"
                        : spotsPercent > 50
                          ? "text-emerald-400"
                          : "text-amber-400"
                    }`}
                  >
                    {isFull
                      ? "Class Full"
                      : `${session.spotsLeft} of ${session.subClass.capacity} spots left`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${spotsPercent}%`,
                      backgroundColor:
                        spotsPercent > 50
                          ? "#10B981"
                          : spotsPercent > 20
                            ? "#F59E0B"
                            : "#EF4444",
                    }}
                  />
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs text-royal-cream/40 uppercase tracking-wider">
                    Price
                  </div>
                  <div className="text-2xl font-bold text-royal-gold font-goudy">
                    {session.subClass.price}{" "}
                    <span className="text-sm font-normal text-royal-cream/60">
                      {session.subClass.currency}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onBook(session)}
                  disabled={isFull || isBooking}
                  className={`
                    flex-1 py-3.5 rounded-xl font-bold text-sm tracking-wide
                    transition-all duration-300 relative overflow-hidden
                    ${
                      isFull
                        ? "bg-white/5 text-royal-cream/30 cursor-not-allowed"
                        : "text-royal-dark shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    }
                  `}
                  style={
                    isFull
                      ? {}
                      : {
                          background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                          boxShadow: `0 8px 24px ${accent}44`,
                        }
                  }
                >
                  {isBooking ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Booking…
                    </span>
                  ) : isFull ? (
                    "Class Full"
                  ) : (
                    "Book This Class"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DetailChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="text-royal-cream/40 mt-0.5 flex-shrink-0">{icon}</div>
      <div>
        <div className="text-[10px] text-royal-cream/40 uppercase tracking-wider leading-none mb-1">
          {label}
        </div>
        <div className="text-sm text-royal-cream/80 font-medium">{value}</div>
      </div>
    </div>
  );
}
