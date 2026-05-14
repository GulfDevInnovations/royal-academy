"use client";

import { useState, useTransition } from "react";
import { X, Loader2, MessageSquare, AlertTriangle } from "lucide-react";
import { sendSmsToStudents } from "@/lib/actions/admin/students.actions";
import { AdminButton, adminColors } from "@/components/admin/ui";

// Generic shape — works for both students and teachers
export interface SmsRecipient {
  id: string;
  firstName: string;
  lastName: string;
  user: { phone: string | null };
}

interface Props {
  students: SmsRecipient[];
  onClose: () => void;
  onSuccess: (count: number) => void;
}

const MAX_SMS_LENGTH = 160;

export default function SmsModal({ students, onClose, onSuccess }: Props) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Students without a phone number — warn the admin
  const withoutPhone = students.filter((s) => !s.user.phone);
  const withPhone = students.filter((s) => !!s.user.phone);

  const handleSend = () => {
    setError(null);
    if (!message.trim()) {
      setError("Message cannot be empty.");
      return;
    }
    if (withPhone.length === 0) {
      setError("None of the selected students have a phone number.");
      return;
    }

    startTransition(async () => {
      const result = await sendSmsToStudents(
        withPhone.map((s) => s.id),
        message,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      onSuccess(result.count ?? 0);
    });
  };

  const charsLeft = MAX_SMS_LENGTH - message.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] shadow-2xl z-10"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} style={{ color: "#f59e0b" }} />
            <h2
              className="text-sm font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              Send SMS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} style={{ color: adminColors.pinkText }} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Recipient summary */}
          <div
            className="rounded-lg px-4 py-3 border border-white/[0.07]"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <p className="text-xs" style={{ color: adminColors.textSecondary }}>
              Sending to{" "}
              <span className="font-semibold" style={{ color: "#f59e0b" }}>
                {withPhone.length} student{withPhone.length !== 1 ? "s" : ""}
              </span>
              {withoutPhone.length > 0 && (
                <span style={{ color: adminColors.textMuted }}>
                  {" "}
                  ({withoutPhone.length} skipped — no phone number)
                </span>
              )}
            </p>
            {/* Show skipped names */}
            {withoutPhone.length > 0 && (
              <div className="mt-2 flex items-start gap-1.5">
                <AlertTriangle
                  size={12}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "#f59e0b" }}
                />
                <p
                  className="text-xs"
                  style={{ color: "rgba(245,158,11,0.7)" }}
                >
                  Skipped:{" "}
                  {withoutPhone
                    .map((s) => `${s.firstName} ${s.lastName}`)
                    .join(", ")}
                </p>
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                className="text-xs font-medium"
                style={{ color: adminColors.textSecondary }}
              >
                Message
              </label>
              <span
                className="text-xs"
                style={{
                  color: charsLeft < 20 ? "#f87171" : adminColors.textMuted,
                }}
              >
                {charsLeft} chars left
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_SMS_LENGTH}
              rows={4}
              placeholder="Type your message here…"
              className="w-full px-3 py-2 rounded-lg text-sm border bg-white/[0.04] text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
              style={{ borderColor: adminColors.border }}
            />
          </div>

          {/* Quick templates */}
          <div className="space-y-1.5">
            <p
              className="text-xs font-medium"
              style={{ color: adminColors.textMuted }}
            >
              Quick templates
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Class cancelled today. We apologise for the inconvenience.",
                "Reminder: your class is tomorrow. See you there!",
                "Your class schedule has been updated. Please check the app.",
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMessage(t)}
                  className="text-xs px-2.5 py-1.5 rounded-lg border transition-colors hover:border-amber-500/40 hover:text-white/70 text-left"
                  style={{
                    borderColor: adminColors.border,
                    color: adminColors.textMuted,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  {t.length > 50 ? t.slice(0, 50) + "…" : t}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <AdminButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton
              type="button"
              variant="primary"
              onClick={handleSend}
              disabled={isPending || withPhone.length === 0}
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Send to {withPhone.length} student
              {withPhone.length !== 1 ? "s" : ""}
            </AdminButton>
          </div>
        </div>
      </div>
    </div>
  );
}
