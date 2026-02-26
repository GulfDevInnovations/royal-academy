"use client";

import { SessionForCalendar } from "@/lib/actions/reservation";
import { Clock, Users, MapPin, Wifi, ChevronRight } from "lucide-react";

interface ClassCardProps {
  session: SessionForCalendar;
  onClick: (session: SessionForCalendar) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  Intermediate: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Advanced: "text-red-400 bg-red-400/10 border-red-400/20",
};

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

export function ClassCard({ session, onClick }: ClassCardProps) {
  const accent =
    CLASS_ACCENT[session.subClass.class.name] ?? CLASS_ACCENT.default;
  const spotsPercent = Math.max(
    0,
    (session.spotsLeft / session.subClass.capacity) * 100,
  );
  const isFull = session.spotsLeft <= 0;

  return (
    <button
      onClick={() => onClick(session)}
      disabled={isFull}
      className={`
        group w-full text-left rounded-xl border transition-all duration-300
        overflow-hidden relative
        ${
          isFull
            ? "border-royal-cream/10 opacity-50 cursor-not-allowed"
            : "border-royal-cream/10 hover:border-royal-gold/40 hover:shadow-lg hover:shadow-black/30 cursor-pointer"
        }
        bg-gradient-to-br from-white/[0.03] to-white/[0.01]
      `}
      style={
        {
          "--accent": accent,
        } as React.CSSProperties
      }
    >
      {/* Accent bar on left */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300 group-hover:w-1.5"
        style={{ backgroundColor: accent }}
      />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Class category label */}
            <div
              className="text-[10px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: accent }}
            >
              {session.subClass.class.name}
            </div>

            {/* Class name */}
            <h3 className="text-base font-bold text-royal-cream leading-tight truncate font-goudy">
              {session.subClass.name}
            </h3>

            {/* Teacher */}
            <p className="text-sm text-royal-cream/60 mt-0.5">
              with {session.teacher.firstName} {session.teacher.lastName}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            {/* Price */}
            <div className="text-base font-bold text-royal-gold">
              {session.subClass.price}{" "}
              <span className="text-xs font-normal">
                {session.subClass.currency}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-royal-cream/30 group-hover:text-royal-gold transition-colors" />
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
          <div className="flex items-center gap-1.5 text-royal-cream/60 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {session.startTime} – {session.endTime}
            </span>
            <span className="text-royal-cream/30">
              · {session.subClass.durationMinutes}min
            </span>
          </div>

          {session.room ? (
            <div className="flex items-center gap-1.5 text-royal-cream/60 text-xs">
              {session.room.location.isOnline ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <MapPin className="w-3.5 h-3.5" />
              )}
              <span>
                {session.room.location.isOnline
                  ? "Online"
                  : `${session.room.name} · ${session.room.location.name}`}
              </span>
            </div>
          ) : null}
        </div>

        {/* Bottom row: level badge + spots */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {session.subClass.level && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  LEVEL_COLORS[session.subClass.level] ??
                  "text-royal-cream/50 bg-royal-cream/5 border-royal-cream/10"
                }`}
              >
                {session.subClass.level}
              </span>
            )}
            {session.subClass.ageGroup && (
              <span className="text-[10px] text-royal-cream/40 bg-royal-cream/5 border border-royal-cream/10 px-2 py-0.5 rounded-full">
                {session.subClass.ageGroup}
              </span>
            )}
          </div>

          {/* Spots bar */}
          <div className="flex items-center gap-2">
            <div className="w-16 h-1 rounded-full bg-royal-cream/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
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
            <div className="flex items-center gap-1 text-xs text-royal-cream/50">
              <Users className="w-3 h-3" />
              {isFull ? (
                <span className="text-red-400 font-semibold">Full</span>
              ) : (
                <span>{session.spotsLeft} left</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
