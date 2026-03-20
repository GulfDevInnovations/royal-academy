"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { AdminButton, adminColors } from "@/components/admin/ui";

interface Props {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<{ error?: string; success?: boolean }>;
  onClose: () => void;
}

export default function DeleteConfirmModal({
  title,
  description,
  onConfirm,
  onClose,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (result && result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/[0.08] shadow-2xl z-10 p-6"
        style={{ background: "#1a1d27" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
            <AlertTriangle size={16} className="text-red-400" />
          </div>
          <div className="space-y-1 pt-0.5">
            <h3
              className="text-sm font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              {title}
            </h3>
            <p
              className="text-xs leading-relaxed"
              style={{ color: adminColors.textMuted }}
            >
              {description}
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 mt-5">
          <AdminButton variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="danger"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            Delete
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
