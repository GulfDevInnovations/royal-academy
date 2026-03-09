"use client";

import { useState, useTransition, useCallback } from "react";
import { Send, History, MessageSquare, Bell } from "lucide-react";
import {
  getNotifications,
  getNotificationStats,
  getTickets,
  getTicketStats,
} from "@/lib/actions/admin/Notifications.actions";
import type {
  SerializedNotification,
  SerializedTicket,
  AudienceOptions,
  NotifStats,
  TicketStats,
} from "../page";
import { ToastContainer } from "@/components/admin/Toast";
import { useToast } from "../../hooks/useToast";
import { AdminPageHeader, adminColors } from "@/components/admin/ui";
import ComposeTab from "./ComposeTab";
import HistoryTab from "./HistoryTab";
import TicketsTab from "./TicketsTab";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Tab = "compose" | "history" | "tickets";

interface Props {
  initialNotifications: SerializedNotification[];
  initialNotifStats: NotifStats;
  audienceOptions: AudienceOptions;
  initialTickets: SerializedTicket[];
  initialTicketStats: TicketStats;
  // Admin user id — needed for ticket replies
  // Passed from server via session; stubbed here, wire up to your auth session
  adminUserId?: string;
}

// ─────────────────────────────────────────────
// Serialisation helpers (mirroring page.tsx)
// ─────────────────────────────────────────────

function serializeNotifs(
  notifs: Awaited<ReturnType<typeof getNotifications>>,
): SerializedNotification[] {
  return notifs.map((n) => ({
    ...n,
    sentAt: n.sentAt ? n.sentAt.toISOString() : null,
    scheduledFor: n.scheduledFor ? n.scheduledFor.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  })) as any;
}

function serializeTickets(
  tickets: Awaited<ReturnType<typeof getTickets>>,
): SerializedTicket[] {
  return tickets.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    replies: t.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  })) as any;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function NotificationsClient({
  initialNotifications,
  initialNotifStats,
  audienceOptions,
  initialTickets,
  initialTicketStats,
  adminUserId = "",
}: Props) {
  const { toasts, toast, remove } = useToast();
  const [, startRefresh] = useTransition();

  const [activeTab, setActiveTab] = useState<Tab>("compose");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [notifStats, setNotifStats] = useState(initialNotifStats);
  const [tickets, setTickets] = useState(initialTickets);
  const [ticketStats, setTicketStats] = useState(initialTicketStats);

  // ── Refresh notifications ──
  const refreshNotifs = useCallback(async () => {
    const [notifs, stats] = await Promise.all([
      getNotifications({ limit: 100 }),
      getNotificationStats(),
    ]);
    setNotifications(serializeNotifs(notifs));
    setNotifStats(stats);
  }, []);

  // ── Refresh tickets ──
  const refreshTickets = useCallback(async () => {
    const [tix, stats] = await Promise.all([getTickets(), getTicketStats()]);
    setTickets(serializeTickets(tix));
    setTicketStats(stats);
  }, []);

  // ── Sidebar badge counts ──
  const pendingNotifCount = notifStats.pending;
  const openTicketCount = ticketStats.open + ticketStats.inProgress;

  const TABS: {
    key: Tab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    { key: "compose", label: "Compose", icon: <Send size={14} /> },
    {
      key: "history",
      label: "History",
      icon: <History size={14} />,
      badge: pendingNotifCount,
    },
    {
      key: "tickets",
      label: "Tickets",
      icon: <MessageSquare size={14} />,
      badge: openTicketCount,
    },
  ];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Notifications"
        subtitle="Compose messages, track delivery, manage support tickets"
        action={
          <div className="flex items-center gap-2">
            <Bell size={14} style={{ color: adminColors.textMuted }} />
            <span className="text-xs" style={{ color: adminColors.textMuted }}>
              {notifStats.total} total notifications
            </span>
          </div>
        }
      />

      {/* ── Tab bar ── */}
      <div
        className="flex items-center gap-1 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        {TABS.map(({ key, label, icon, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px"
            style={{
              borderColor: activeTab === key ? "#f59e0b" : "transparent",
              color: activeTab === key ? "#f59e0b" : adminColors.textMuted,
            }}
          >
            {icon}
            {label}
            {badge != null && badge > 0 && (
              <span
                className="flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                style={{ background: "#f59e0b", color: "#0f1117" }}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="min-h-[400px]">
        {activeTab === "compose" && (
          <ComposeTab
            audienceOptions={audienceOptions}
            onSent={(count) => {
              toast(
                `Queued for ${count} recipient${count !== 1 ? "s" : ""}.`,
                "success",
              );
              startRefresh(() => refreshNotifs());
              // Auto-switch to history so admin can see it
              setTimeout(() => setActiveTab("history"), 800);
            }}
          />
        )}

        {activeTab === "history" && (
          <HistoryTab
            notifications={notifications}
            stats={notifStats}
            onRefresh={() => startRefresh(() => refreshNotifs())}
          />
        )}

        {activeTab === "tickets" && (
          <TicketsTab
            tickets={tickets}
            stats={ticketStats}
            adminUserId={adminUserId}
            onRefresh={() => startRefresh(() => refreshTickets())}
          />
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
