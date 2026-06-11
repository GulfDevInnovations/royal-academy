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
    bg: "#fff5f5",
    border: "rgba(220,38,38,0.20)",
    icon: AlertTriangle,
    iconColor: "#dc2626",
  },
  success: {
    bg: "#f0fdf4",
    border: "rgba(5,150,105,0.20)",
    icon: CheckCircle2,
    iconColor: "#059669",
  },
  info: {
    bg: "#eff6ff",
    border: "rgba(37,99,235,0.20)",
    icon: Info,
    iconColor: "#2563eb",
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
        className="shrink-0 mt-0.5"
        style={{ color: s.iconColor }}
      />

      <p
        className="text-sm flex-1 leading-relaxed"
        style={{ color: "#374151" }}
      >
        {message}
      </p>

      <button
        onClick={() => {
          setVisible(false);
          setTimeout(onClose, 300);
        }}
        className="shrink-0 p-0.5 rounded transition-colors hover:bg-black/5"
        style={{ color: "#9ca3af" }}
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
