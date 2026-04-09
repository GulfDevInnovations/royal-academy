"use client";

import { useState, useTransition } from "react";
import {
  X,
  RefreshCw,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import {
  cancelSession,
  regenerateSessions,
} from "@/lib/actions/admin/Schedules.actions";
import { AdminButton, adminColors } from "@/components/admin/ui";
import type { SerializedSchedule } from "../page";
import { useTranslations } from "next-intl";

export interface SessionRow {
  id: string;
  sessionDate: string; // ISO
  startTime: string;
  endTime: string;
  status: string;
  cancelledReason: string | null;
  notes: string | null;
}

interface Props {
  schedule: SerializedSchedule;
  sessions: SessionRow[];
  /** When opened from a monthly calendar cell, the human-readable date label
   *  e.g. "Wed, 14 Jan" — used to highlight and scroll to that specific date */
  dateLabel?: string;
  onClose: () => void;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "rgba(52,211,153,0.1)", text: "#34d399" },
  CANCELLED: { bg: "rgba(248,113,113,0.1)", text: "#f87171" },
  COMPLETED: { bg: "rgba(96,165,250,0.1)", text: "#60a5fa" },
  SUSPENDED: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" },
};

export default function SessionsDrawer({
  schedule,
  sessions,
  dateLabel,
  onClose,
  onRefresh,
}: Props) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isRegenerating, startRegen] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("admin");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // If we have a dateLabel filter, try to match sessions to just that date
  const focusDateStr = dateLabel
    ? sessions.find((s) => {
        const d = new Date(s.sessionDate);
        const label = d.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        });
        return label === dateLabel;
      })?.sessionDate
    : undefined;

  // In month-cell mode: show the focused date's session first, then all others
  const sortedSessions = focusDateStr
    ? [
        ...sessions.filter((s) => s.sessionDate === focusDateStr),
        ...sessions.filter((s) => s.sessionDate !== focusDateStr),
      ]
    : sessions;

  const upcoming = sortedSessions.filter(
    (s) => new Date(s.sessionDate) >= today,
  );
  const past = sortedSessions.filter((s) => new Date(s.sessionDate) < today);

  const handleCancel = (sessionId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await cancelSession(sessionId, cancelReason || undefined);
      if (result.success) {
        setCancellingId(null);
        setCancelReason("");
        onRefresh();
      }
    });
  };

  const handleRegenerate = () => {
    setError(null);
    startRegen(async () => {
      const result = await regenerateSessions(schedule.id);
      if ("error" in result) setError(result.error);
      else onRefresh();
    });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md h-full flex flex-col shadow-2xl z-10"
        style={{
          background: "#1a1d27",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              {t("sessions")}
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              {schedule.subClass.class.name} → {schedule.subClass.name}
              {" · "}
              {schedule.dayOfWeek.charAt(0) +
                schedule.dayOfWeek.slice(1).toLowerCase()}{" "}
              {schedule.startTime}–{schedule.endTime}
            </p>
            {/* Date context badge — shown when opened from a monthly calendar cell */}
            {dateLabel && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <CalendarDays size={11} style={{ color: "#f59e0b" }} />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: "#f59e0b" }}
                >
                  {t("openedFrom")} {dateLabel}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              title="Regenerate future sessions"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors"
              style={{
                borderColor: adminColors.border,
                color: adminColors.textSecondary,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {isRegenerating ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              {t("regenerate")}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={16} style={{ color: adminColors.pinkText }} />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="grid grid-cols-3 gap-px flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {[
            {
              label: "Total",
              value: sessions.length,
              color: adminColors.textPrimary,
            },
            {
              label: "Upcoming",
              value: upcoming.filter((s) => s.status !== "CANCELLED").length,
              color: "#34d399",
            },
            {
              label: "Cancelled",
              value: sessions.filter((s) => s.status === "CANCELLED").length,
              color: "#f87171",
            },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="flex flex-col items-center py-3"
              style={{ background: "#1a1d27" }}
            >
              <span className="text-lg font-bold" style={{ color }}>
                {value}
              </span>
              <span
                className="text-[10px]"
                style={{ color: adminColors.textMuted }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mx-5 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 flex-shrink-0">
            <AlertTriangle size={13} className="text-red-400" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-2">
              <p
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "rgba(245,158,11,0.6)" }}
              >
                Upcoming ({upcoming.length})
              </p>
              {upcoming.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  formatDate={formatDate}
                  highlighted={!!focusDateStr && s.sessionDate === focusDateStr}
                  cancellingId={cancellingId}
                  cancelReason={cancelReason}
                  setCancellingId={setCancellingId}
                  setCancelReason={setCancelReason}
                  onCancel={handleCancel}
                  isPending={isPending}
                />
              ))}
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="space-y-2">
              <p
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                Past ({past.length})
              </p>
              {past.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  formatDate={formatDate}
                  highlighted={!!focusDateStr && s.sessionDate === focusDateStr}
                  cancellingId={null}
                  cancelReason=""
                  setCancellingId={() => {}}
                  setCancelReason={() => {}}
                  onCancel={() => {}}
                  isPending={false}
                  readOnly
                />
              ))}
            </div>
          )}

          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <Clock size={24} style={{ color: adminColors.textMuted }} />
              <p className="text-sm" style={{ color: adminColors.textMuted }}>
                {t("noSessionsYet")}
              </p>
              <p
                className="text-xs text-center"
                style={{ color: adminColors.textMuted }}
              >
                {t("addEndDate")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Session card
// ─────────────────────────────────────────────

interface CardProps {
  session: SessionRow;
  formatDate: (iso: string) => string;
  highlighted: boolean;
  cancellingId: string | null;
  cancelReason: string;
  setCancellingId: (id: string | null) => void;
  setCancelReason: (r: string) => void;
  onCancel: (id: string) => void;
  isPending: boolean;
  readOnly?: boolean;
}

function SessionCard({
  session,
  formatDate,
  highlighted,
  cancellingId,
  cancelReason,
  setCancellingId,
  setCancelReason,
  onCancel,
  isPending,
  readOnly,
}: CardProps) {
  const t = useTranslations("admin");
  const colors = STATUS_COLORS[session.status] ?? STATUS_COLORS.ACTIVE;
  const isCancelling = cancellingId === session.id;

  return (
    <div
      className="rounded-xl border p-3 space-y-2 transition-colors"
      style={{
        borderColor: highlighted
          ? "rgba(245,158,11,0.35)"
          : isCancelling
            ? "rgba(248,113,113,0.3)"
            : "rgba(255,255,255,0.06)",
        background: highlighted
          ? "rgba(245,158,11,0.05)"
          : "rgba(255,255,255,0.02)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: colors.text }}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-medium truncate"
              style={{ color: adminColors.textPrimary }}
            >
              {formatDate(session.sessionDate)}
            </p>
            {highlighted && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{
                  background: "rgba(245,158,11,0.15)",
                  color: "#f59e0b",
                }}
              >
                {t("selected")}
              </span>
            )}
          </div>
          <p className="text-xs" style={{ color: adminColors.textMuted }}>
            {session.startTime}–{session.endTime}
          </p>
        </div>

        <span
          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
          style={{ background: colors.bg, color: colors.text }}
        >
          {session.status}
        </span>

        {!readOnly && session.status === "ACTIVE" && !isCancelling && (
          <button
            onClick={() => setCancellingId(session.id)}
            className="p-1 rounded-lg transition-colors text-white/20 hover:text-red-400 hover:bg-red-500/[0.08]"
            title="Cancel session"
          >
            <XCircle size={14} />
          </button>
        )}
      </div>

      {session.cancelledReason && (
        <p className="text-xs pl-4" style={{ color: "rgba(248,113,113,0.7)" }}>
          {t("reason")} {session.cancelledReason}
        </p>
      )}

      {/* Cancel confirm inline */}
      {isCancelling && (
        <div className="pt-1 space-y-2 border-t border-white/[0.06]">
          <input
            type="text"
            placeholder="Cancellation reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-xs border bg-white/[0.03] text-white/70 placeholder-white/20 focus:outline-none focus:border-red-500/40"
            style={{ borderColor: "rgba(248,113,113,0.2)" }}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => onCancel(session.id)}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: "rgba(248,113,113,0.15)",
                color: "#f87171",
                border: "1px solid rgba(248,113,113,0.2)",
              }}
            >
              {isPending ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <XCircle size={11} />
              )}
              {t("confirmCancel")}
            </button>
            <button
              onClick={() => {
                setCancellingId(null);
                setCancelReason("");
              }}
              className="text-xs transition-colors"
              style={{ color: adminColors.textMuted }}
            >
              Keep
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
