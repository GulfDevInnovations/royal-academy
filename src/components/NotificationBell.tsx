"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications.client.actions";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AppNotification {
  id: string;
  subject: string | null;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
}

interface Props {
  userId: string;
  isArabic: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function timeAgo(date: Date | string, isArabic: boolean): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diff < 60) return isArabic ? "الآن" : "just now";
  if (diff < 3600)
    return isArabic
      ? `${Math.floor(diff / 60)} د`
      : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)
    return isArabic
      ? `${Math.floor(diff / 3600)} س`
      : `${Math.floor(diff / 3600)}h ago`;
  return isArabic
    ? `${Math.floor(diff / 86400)} ي`
    : `${Math.floor(diff / 86400)}d ago`;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function NotificationBell({ userId, isArabic }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unread = notifications.filter((n) => !n.readAt).length;

  // ── Fetch on mount and when opening ──
  const fetchNotifications = async () => {
    setLoading(true);
    const data = await getMyNotifications(userId);
    setNotifications(data as AppNotification[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [userId]);

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Mark one as read + open link ──
  const handleNotificationClick = (n: AppNotification) => {
    // Open the window FIRST — synchronously in the click handler,
    // before any await, so the browser doesn't treat it as a popup.
    if (n.linkUrl) {
      window.open(n.linkUrl, "_blank", "noopener,noreferrer");
    }

    // Then mark as read asynchronously — order doesn't matter for UX
    if (!n.readAt) {
      startTransition(async () => {
        await markNotificationRead(n.id, userId);
        setNotifications((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
          ),
        );
      });
    }
  };

  // ── Mark all as read ──
  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead(userId);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
      );
    });
  };

  // ── Dropdown animation — seals from top (matching navbar style) ──
  const dropdownVariants = {
    hidden: { clipPath: "circle(0% at 50% 0%)", opacity: 0, scale: 0.94 },
    visible: {
      clipPath: "circle(150% at 50% 0%)",
      opacity: 1,
      scale: 1,
      transition: {
        clipPath: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.2 },
        scale: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      },
    },
    exit: {
      clipPath: "circle(0% at 50% 0%)",
      opacity: 0,
      scale: 0.95,
      transition: {
        clipPath: { duration: 0.35, ease: [0.55, 0, 0.8, 0.2] },
        opacity: { duration: 0.25 },
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: { opacity: 0, y: 4, transition: { duration: 0.15 } },
  };

  const glassHoverStyle = {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.07) 100%)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: `
      0 4px 20px rgba(0,0,0,0.2),
      inset 0 1px 1px rgba(255,255,255,0.22),
      inset 0 -1px 1px rgba(0,0,0,0.12),
      inset 1px 0 1px rgba(255,255,255,0.09),
      inset -1px 0 1px rgba(0,0,0,0.08)
    `,
  };

  return (
    <div ref={containerRef} className="relative">
      {/* ── Bell button — same pill style as navbar buttons ── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.2 }}
        className={`
          shimmer relative flex items-center justify-center
          w-18 h-14 rounded-full transition-all duration-300 cursor-pointer
          ${open ? "liquid-glass-gold" : "liquid-glass"}
        `}
        aria-label="Notifications"
      >
        {/* Bell icon — SVG so no extra dep */}
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-colors duration-300 ${open ? "text-royal-gold" : "text-royal-cream/80"}`}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="min-w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold px-1"
              style={{
                background: "#d4b896",
                color: "#592c41",
              }}
            >
              {unread > 99 ? "99+" : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Dropdown ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-20 left-1/2 -translate-x-1/2 w-80 rounded-3xl overflow-hidden liquid-glass shadow-2xl shadow-black/60 z-50"
            style={{ minWidth: "320px" }}
          >
            {/* Top gold line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-royal-gold/50 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <p className="text-royal-cream text-xl tracking-wide">
                {isArabic ? "الإشعارات" : "Notifications"}
              </p>
              {unread > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="text-royal-gold/60 hover:text-royal-gold text-xs tracking-widest uppercase transition-colors duration-200"
                >
                  {isArabic ? "قراءة الكل" : "Mark all read"}
                </button>
              )}
            </div>

            {/* Notification list */}
            <div
              className="max-h-[420px] overflow-y-auto px-3 pb-4 space-y-1
              scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 rounded-full border-2 border-royal-gold/30 border-t-royal-gold animate-spin" />
                </div>
              )}

              {!loading && notifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    className="text-royal-cream/20"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <p className="text-royal-cream/30 text-sm tracking-wide">
                    {isArabic ? "لا توجد إشعارات" : "No notifications yet"}
                  </p>
                </div>
              )}

              {!loading &&
                notifications.map((n, i) => {
                  const isUnread = !n.readAt;
                  const hasLink = !!n.linkUrl;

                  return (
                    <motion.div
                      key={n.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                    >
                      <button
                        onClick={() => handleNotificationClick(n)}
                        className={`
                        group relative w-full text-left rounded-2xl p-4
                        transition-all duration-300
                        ${hasLink ? "cursor-pointer" : "cursor-default"}
                      `}
                      >
                        {/* Hover glass bg */}
                        <span
                          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 pointer-events-none"
                          style={glassHoverStyle}
                        />

                        {/* Unread dot */}
                        {isUnread && (
                          <span
                            className="absolute top-4 right-4 w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: "#f59e0b" }}
                          />
                        )}

                        <div className="relative z-10 flex gap-3">
                          {/* Image */}
                          {n.imageUrl && (
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 liquid-glass">
                              <Image
                                src={n.imageUrl}
                                alt={n.subject ?? "notification"}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            {/* Subject */}
                            {n.subject && (
                              <p
                                className={`text-sm font-medium tracking-wide truncate
                              ${isUnread ? "text-royal-cream" : "text-royal-cream/60"}`}
                              >
                                {n.subject}
                              </p>
                            )}

                            {/* Body */}
                            <p
                              className={`text-xs leading-relaxed mt-0.5 line-clamp-2
                            ${isUnread ? "text-royal-cream/80" : "text-royal-cream/40"}`}
                            >
                              {n.body}
                            </p>

                            {/* Footer row */}
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <p className="text-[10px] text-royal-gold/40 tracking-widest">
                                {timeAgo(n.createdAt, isArabic)}
                              </p>
                              {hasLink && (
                                <span
                                  className="flex items-center gap-1 text-[10px] text-royal-gold/50
                                group-hover:text-royal-gold transition-colors duration-200 tracking-widest uppercase"
                                >
                                  {isArabic ? "فتح" : "Open"}
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bottom divider — not on last item */}
                        <div className="absolute bottom-0 left-4 right-4 h-px bg-white/[0.04]" />
                      </button>
                    </motion.div>
                  );
                })}
            </div>

            {/* Bottom gold line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-royal-gold/50 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
