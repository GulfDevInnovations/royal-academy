"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export type ToastType = "error" | "success" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number; // ms, default 4500
}

const styles: Record<
  ToastType,
  { bg: string; border: string; icon: typeof AlertTriangle; iconColor: string }
> = {
  error: {
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.25)",
    icon: AlertTriangle,
    iconColor: "#f87171",
  },
  success: {
    bg: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.25)",
    icon: CheckCircle2,
    iconColor: "#34d399",
  },
  info: {
    bg: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.25)",
    icon: Info,
    iconColor: "#60a5fa",
  },
};

export function Toast({
  message,
  type = "info",
  onClose,
  duration = 4500,
}: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const show = requestAnimationFrame(() => setVisible(true));

    // Auto-dismiss
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // wait for exit animation
    }, duration);

    return () => {
      cancelAnimationFrame(show);
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  const s = styles[type];
  const Icon = s.icon;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl border shadow-2xl max-w-sm w-full"
      style={{
        background: s.bg,
        borderColor: s.border,
        backdropFilter: "blur(12px)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
    >
      <Icon
        size={15}
        className="flex-shrink-0 mt-0.5"
        style={{ color: s.iconColor }}
      />

      <p
        className="text-sm flex-1 leading-relaxed"
        style={{ color: "rgba(255,255,255,0.8)" }}
      >
        {message}
      </p>

      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="flex-shrink-0 p-0.5 rounded transition-colors hover:bg-white/10"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ── Toast container — renders toasts in bottom-right corner ──
export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => onRemove(t.id)}
        />
      ))}
    </div>
  );
}
