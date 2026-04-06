"use client";

import { useState, useMemo, useTransition } from "react";
import {
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Filter,
} from "lucide-react";
import {
  retryNotification,
  deleteNotification,
} from "@/lib/actions/admin/Notifications.actions";
import type { SerializedNotification, NotifStats } from "../page";
import {
  AdminTable,
  AdminThead,
  AdminTh,
  AdminTbody,
  AdminTr,
  AdminTd,
  AdminBadge,
  AdminEmptyState,
  adminColors,
} from "@/components/admin/ui";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "danger" | "default";
    icon: React.ReactNode;
  }
> = {
  SENT: { label: "Sent", variant: "success", icon: <CheckCircle2 size={11} /> },
  PENDING: { label: "Pending", variant: "warning", icon: <Clock size={11} /> },
  FAILED: { label: "Failed", variant: "danger", icon: <XCircle size={11} /> },
};

const TYPE_COLORS: Record<string, string> = {
  SMS: "#f59e0b",
  EMAIL: "#60a5fa",
  BOTH: "#a78bfa",
};

interface Props {
  notifications: SerializedNotification[];
  stats: NotifStats;
  onRefresh: () => void;
}

export default function HistoryTab({ notifications, stats, onRefresh }: Props) {
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const displayed = useMemo(() => {
    let list = notifications;
    if (filterStatus) list = list.filter((n) => n.status === filterStatus);
    if (filterType) list = list.filter((n) => n.type === filterType);
    return list;
  }, [notifications, filterStatus, filterType]);

  const handleRetry = (id: string) => {
    setLoadingId(id);
    startTransition(async () => {
      await retryNotification(id);
      onRefresh();
      setLoadingId(null);
    });
  };

  const handleDelete = (id: string) => {
    setLoadingId(id);
    startTransition(async () => {
      await deleteNotification(id);
      onRefresh();
      setLoadingId(null);
    });
  };

  const getUserName = (n: SerializedNotification) => {
    const u = n.user;
    if (u.studentProfile)
      return `${u.studentProfile.firstName} ${u.studentProfile.lastName}`;
    if (u.teacherProfile)
      return `${u.teacherProfile.firstName} ${u.teacherProfile.lastName}`;
    return u.email ?? "Unknown";
  };

  const fmtDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="space-y-4">
      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sent", value: stats.sent, color: "#34d399" },
          { label: "Pending", value: stats.pending, color: "#f59e0b" },
          { label: "Failed", value: stats.failed, color: "#f87171" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border px-4 py-3"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: "#1a1d27",
            }}
          >
            <p className="text-xl font-bold" style={{ color }}>
              {value}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={13} style={{ color: adminColors.textMuted }} />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border bg-white/4 text-white/70 focus:outline-none"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <option className="text-black" value="">
            All statuses
          </option>
          <option className="text-black" value="SENT">
            Sent
          </option>
          <option className="text-black" value="PENDING">
            Pending
          </option>
          <option className="text-black" value="FAILED">
            Failed
          </option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border bg-white/4 text-white/70 focus:outline-none"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <option className="text-black" value="">
            All types
          </option>
          <option className="text-black" value="SMS">
            SMS
          </option>
          <option className="text-black" value="EMAIL">
            Email
          </option>
          <option className="text-black" value="BOTH">
            Both
          </option>
        </select>
        <span
          className="text-xs ml-auto"
          style={{ color: adminColors.textMuted }}
        >
          {displayed.length} of {notifications.length}
        </span>
      </div>

      {/* ── Table ── */}
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "#1a1d27" }}
      >
        {displayed.length === 0 ? (
          <AdminEmptyState
            title="No notifications found"
            description="Send a notification from the Compose tab and it will appear here."
          />
        ) : (
          <AdminTable>
            <AdminThead>
              <AdminTh>Recipient</AdminTh>
              <AdminTh>Type</AdminTh>
              <AdminTh>Message</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh>Scheduled</AdminTh>
              <AdminTh>Sent At</AdminTh>
              <AdminTh className="text-right">Actions</AdminTh>
            </AdminThead>
            <AdminTbody>
              {displayed.map((n) => {
                const statusConf =
                  STATUS_CONFIG[n.status] ?? STATUS_CONFIG.PENDING;
                const isLoading = loadingId === n.id;
                return (
                  <AdminTr key={n.id}>
                    <AdminTd>
                      <p
                        className="text-sm font-medium"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {getUserName(n)}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: adminColors.textMuted }}
                      >
                        {n.user.phone ?? n.user.email ?? "—"}
                      </p>
                    </AdminTd>

                    <AdminTd>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${TYPE_COLORS[n.type] ?? "#94a3b8"}18`,
                          color: TYPE_COLORS[n.type] ?? "#94a3b8",
                        }}
                      >
                        {n.type}
                      </span>
                    </AdminTd>

                    <AdminTd>
                      {n.subject && (
                        <p
                          className="text-xs font-medium"
                          style={{ color: adminColors.textSecondary }}
                        >
                          {n.subject}
                        </p>
                      )}
                      <p
                        className="text-xs line-clamp-1"
                        style={{ color: adminColors.textMuted }}
                      >
                        {n.body}
                      </p>
                    </AdminTd>

                    <AdminTd>
                      <AdminBadge variant={statusConf.variant}>
                        <span className="flex items-center gap-1">
                          {statusConf.icon} {statusConf.label}
                        </span>
                      </AdminBadge>
                      {n.failReason && (
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "#f87171" }}
                        >
                          {n.failReason}
                        </p>
                      )}
                    </AdminTd>

                    <AdminTd>
                      <p
                        className="text-xs"
                        style={{ color: adminColors.textMuted }}
                      >
                        {n.scheduledFor ? fmtDate(n.scheduledFor) : "Immediate"}
                      </p>
                    </AdminTd>

                    <AdminTd>
                      <p
                        className="text-xs"
                        style={{ color: adminColors.textMuted }}
                      >
                        {fmtDate(n.sentAt)}
                      </p>
                    </AdminTd>

                    <AdminTd className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {n.status === "FAILED" && (
                          <button
                            onClick={() => handleRetry(n.id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-amber-400 hover:bg-amber-500/8"
                            title="Retry"
                          >
                            {isLoading ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <RefreshCw size={12} />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(n.id)}
                          disabled={isLoading}
                          className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-red-400 hover:bg-red-500/8"
                          title="Delete"
                        >
                          {isLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </button>
                      </div>
                    </AdminTd>
                  </AdminTr>
                );
              })}
            </AdminTbody>
          </AdminTable>
        )}
      </div>
    </div>
  );
}
