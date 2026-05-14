"use client";

import { useState, useTransition } from "react";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { replyToTicket } from "@/lib/actions/notifications/notifications.client.actions";
import {
  updateTicketStatus,
  updateTicketPriority,
} from "@/lib/actions/admin/Notifications.actions";
import type { SerializedTicket, TicketStats } from "../page";
import {
  AdminBadge,
  AdminButton,
  AdminEmptyState,
  adminColors,
} from "@/components/admin/ui";
import { useTranslations } from "next-intl";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "default";
    icon: React.ReactNode;
    color: string;
  }
> = {
  OPEN: {
    label: "Open",
    variant: "warning",
    icon: <Clock size={15} />,
    color: "#f59e0b",
  },
  IN_PROGRESS: {
    label: "In Progress",
    variant: "info",
    icon: <Zap size={15} />,
    color: "#60a5fa",
  },
  RESOLVED: {
    label: "Resolved",
    variant: "success",
    icon: <CheckCircle2 size={15} />,
    color: "#34d399",
  },
  CLOSED: {
    label: "Closed",
    variant: "default",
    icon: <XCircle size={15} />,
    color: "#94a3b8",
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "#94a3b8" },
  NORMAL: { label: "Normal", color: "#60a5fa" },
  HIGH: { label: "High", color: "#f59e0b" },
  URGENT: { label: "Urgent", color: "#f87171" },
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface Props {
  tickets: SerializedTicket[];
  stats: TicketStats;
  adminUserId: string;
  onRefresh: () => void;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function TicketsTab({
  tickets,
  stats,
  adminUserId,
  onRefresh,
}: Props) {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SerializedTicket | null>(
    null,
  );
  const t = useTranslations("admin");

  const displayed = tickets.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const getUserName = (t: SerializedTicket) => {
    const u = t.user;
    if (u.studentProfile)
      return `${u.studentProfile.firstName} ${u.studentProfile.lastName}`;
    if (u.teacherProfile)
      return `${u.teacherProfile.firstName} ${u.teacherProfile.lastName}`;
    return u.email ?? "Unknown";
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex gap-4 h-[calc(100vh-280px)] min-h-125">
      {/* ── Ticket list ── */}
      <div className="flex flex-col w-1/2 shrink-0">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Open", value: stats.open, color: "#f59e0b" },
            { label: "Active", value: stats.inProgress, color: "#60a5fa" },
            { label: "Resolved", value: stats.resolved, color: "#34d399" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border px-3 py-2 text-center"
              style={{
                borderColor: "rgba(255,255,255,0.07)",
                background: "#1a1d27",
              }}
            >
              <p className="text-2xl font-bold" style={{ color }}>
                {value}
              </p>
              <p
                className="text-[15px]"
                style={{ color: adminColors.textMuted }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg text-l border bg-white/4 text-white/70 focus:outline-none"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <option className="text-black" value="">
              {t("allStatuses")}
            </option>
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <option className="text-black" key={v} value={v}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg text-l border bg-white/4 text-white/70 focus:outline-none"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <option className="text-black" value="">
              All priorities
            </option>
            {Object.entries(PRIORITY_CONFIG).map(([v, c]) => (
              <option className="text-black" key={v} value={v}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <MessageSquare
                size={28}
                style={{ color: adminColors.textMuted }}
              />
              <p
                className="text-l text-center"
                style={{ color: adminColors.textMuted }}
              >
                No tickets found
              </p>
            </div>
          ) : (
            displayed.map((ticket) => {
              const statusConf =
                STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
              const priorityConf =
                PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.NORMAL;
              const isSelected = selectedTicket?.id === ticket.id;
              const unread = ticket.replies.length;

              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="w-full text-left rounded-xl border p-3 transition-all"
                  style={{
                    borderColor: isSelected
                      ? "rgba(245,158,11,0.4)"
                      : "rgba(255,255,255,0.07)",
                    background: isSelected
                      ? "rgba(245,158,11,0.06)"
                      : "rgba(255,255,255,0.02)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    {/* Priority dot */}
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: priorityConf.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-l font-semibold truncate"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {ticket.subject}
                      </p>
                      <p
                        className="text-[15px] mt-0.5 truncate"
                        style={{ color: "#fff1c9" }}
                      >
                        {getUserName(ticket)}
                      </p>
                      <p
                        className="text-[15px] line-clamp-1 mt-1"
                        style={{ color: "#cab8cf" }}
                      >
                        {ticket.body}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className="text-[15px]"
                          style={{ color: statusConf.color }}
                        >
                          {statusConf.label}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{ color: adminColors.textMuted }}
                        >
                          {new Date(ticket.createdAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                            },
                          )}
                        </span>
                        {unread > 0 && (
                          <span
                            className="ml-auto text-[15px] px-1.5 py-0.5 rounded-full"
                            style={{
                              background: "rgba(245,158,11,0.15)",
                              color: "#f59e0b",
                            }}
                          >
                            {unread} repl{unread > 1 ? "ies" : "y"}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={5}
                      style={{ color: adminColors.textMuted, flexShrink: 0 }}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Reply panel ── */}
      <div
        className="flex-1 rounded-2xl border flex flex-col overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "#1a1d27" }}
      >
        {!selectedTicket ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <MessageSquare size={36} style={{ color: adminColors.textMuted }} />
            <p className="text-xl" style={{ color: adminColors.textMuted }}>
              Select a ticket to view and reply
            </p>
          </div>
        ) : (
          <TicketDetail
            ticket={selectedTicket}
            adminUserId={adminUserId}
            getUserName={getUserName}
            fmtDate={fmtDate}
            onRefresh={() => {
              onRefresh();
              setSelectedTicket(null);
            }}
            onClose={() => setSelectedTicket(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Ticket detail + reply
// ─────────────────────────────────────────────

interface TicketDetailProps {
  ticket: SerializedTicket;
  adminUserId: string;
  getUserName: (t: SerializedTicket) => string;
  fmtDate: (iso: string) => string;
  onRefresh: () => void;
  onClose: () => void;
}

function TicketDetail({
  ticket,
  adminUserId,
  getUserName,
  fmtDate,
  onRefresh,
  onClose,
}: TicketDetailProps) {
  const [replyBody, setReplyBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isUpdating, startUpdate] = useTransition();

  const statusConf = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
  const priorityConf =
    PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.NORMAL;

  const handleReply = () => {
    if (!replyBody.trim()) return;
    startTransition(async () => {
      const result = await replyToTicket(
        ticket.id,
        adminUserId,
        replyBody,
        ticket.user.id,
      );
      if (result.success) {
        setReplyBody("");
        onRefresh();
      }
    });
  };
  const handleStatusChange = (status: string) => {
    startUpdate(async () => {
      await updateTicketStatus(ticket.id, status as any);
      onRefresh();
    });
  };

  const handlePriorityChange = (priority: string) => {
    startUpdate(async () => {
      await updateTicketPriority(ticket.id, priority as any);
      onRefresh();
    });
  };

  return (
    <>
      {/* Header */}
      <div
        className="flex items-start justify-between px-5 py-4 border-b shrink-0"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="flex-1 min-w-0 pr-4">
          <p
            className="text-xl font-semibold"
            style={{ color: adminColors.textPrimary }}
          >
            {ticket.subject}
          </p>
          <p className="text-l mt-0.5" style={{ color: adminColors.textMuted }}>
            {getUserName(ticket)} · {fmtDate(ticket.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status selector */}
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={isUpdating}
            className="px-2 py-1 rounded-lg text-l border bg-white/4 focus:outline-none"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              color: statusConf.color,
            }}
          >
            {Object.entries(STATUS_CONFIG).map(([v, c]) => (
              <option className="text-black" key={v} value={v}>
                {c.label}
              </option>
            ))}
          </select>
          {/* Priority selector */}
          <select
            value={ticket.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            disabled={isUpdating}
            className="px-2 py-1 rounded-lg text-l border bg-white/4 focus:outline-none"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              color: priorityConf.color,
            }}
          >
            {Object.entries(PRIORITY_CONFIG).map(([v, c]) => (
              <option className="text-black" key={v} value={v}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} style={{ color: adminColors.pinkText }} />
          </button>
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Original message */}
        <div className="flex gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[15px] font-semibold"
            style={{ background: "rgba(96,165,250,0.15)", color: "#60a5fa" }}
          >
            {getUserName(ticket)
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p
                className="text-l font-semibold"
                style={{ color: adminColors.textPrimary }}
              >
                {getUserName(ticket)}
              </p>
              <span
                className="text-[15px] px-1.5 py-0.5 rounded"
                style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa" }}
              >
                Student
              </span>
              <p
                className="text-[15px]"
                style={{ color: adminColors.textMuted }}
              >
                {fmtDate(ticket.createdAt)}
              </p>
            </div>
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-xl whitespace-pre-wrap"
                style={{ color: adminColors.textSecondary }}
              >
                {ticket.body}
              </p>
            </div>
          </div>
        </div>

        {/* Replies */}
        {ticket.replies.map((reply) => {
          const isAdmin = reply.user.role === "ADMIN";
          const replyName = reply.user.adminProfile
            ? `${reply.user.adminProfile.firstName} ${reply.user.adminProfile.lastName}`
            : reply.user.studentProfile
              ? `${reply.user.studentProfile.firstName} ${reply.user.studentProfile.lastName}`
              : reply.user.teacherProfile
                ? `${reply.user.teacherProfile.firstName} ${reply.user.teacherProfile.lastName}`
                : "Unknown";

          return (
            <div
              key={reply.id}
              className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : ""}`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[15px] font-semibold"
                style={{
                  background: isAdmin
                    ? "rgba(245,158,11,0.15)"
                    : "rgba(96,165,250,0.15)",
                  color: isAdmin ? "#f59e0b" : "#60a5fa",
                }}
              >
                {replyName
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className={`flex-1 ${isAdmin ? "items-end" : ""}`}>
                <div
                  className={`flex items-center gap-2 mb-1 ${isAdmin ? "flex-row-reverse" : ""}`}
                >
                  <p
                    className="text-l font-semibold"
                    style={{ color: adminColors.textPrimary }}
                  >
                    {replyName}
                  </p>
                  <span
                    className="text-[15px] px-1.5 py-0.5 rounded"
                    style={{
                      background: isAdmin
                        ? "rgba(245,158,11,0.1)"
                        : "rgba(96,165,250,0.1)",
                      color: isAdmin ? "#f59e0b" : "#60a5fa",
                    }}
                  >
                    {isAdmin ? "Admin" : "Student"}
                  </span>
                  <p
                    className="text-[10px]"
                    style={{ color: adminColors.textMuted }}
                  >
                    {fmtDate(reply.createdAt)}
                  </p>
                </div>
                <div
                  className={`rounded-xl px-4 py-3 ${isAdmin ? "ml-8" : "mr-8"}`}
                  style={{
                    background: isAdmin
                      ? "rgba(245,158,11,0.08)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isAdmin ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <p
                    className="text-xl whitespace-pre-wrap"
                    style={{ color: adminColors.textSecondary }}
                  >
                    {reply.body}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply box */}
      {ticket.status !== "CLOSED" && (
        <div
          className="px-5 py-4 border-t shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div className="flex gap-3">
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                  handleReply();
              }}
              placeholder="Type your reply… (Ctrl+Enter to send)"
              rows={3}
              className="flex-1 px-3 py-2.5 rounded-xl border bg-white/3 text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-500/40 resize-none"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}
            />
            <AdminButton
              variant="primary"
              onClick={handleReply}
              disabled={isPending || !replyBody.trim()}
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </AdminButton>
          </div>
        </div>
      )}
    </>
  );
}
