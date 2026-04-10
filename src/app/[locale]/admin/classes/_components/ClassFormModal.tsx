"use client";

import { useRef, useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { createClass, updateClass } from "@/lib/actions/admin/classes.actions";
import type { SerializedClass } from "../page";
import {
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";
import { useTranslations } from "next-intl";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  editing?: SerializedClass | null;
}

export default function ClassFormModal({ onClose, onSuccess, editing }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [langTab, setLangTab] = useState<"en" | "ar">("en");
  const t = useTranslations("admin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);

    startTransition(async () => {
      const result = editing
        ? await updateClass(editing.id, formData)
        : await createClass(formData);

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    borderColor: adminColors.border,
    color: adminColors.textPrimary,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/8 shadow-2xl z-10"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2
            className="text-xl font-semibold"
            style={{ color: adminColors.textPrimary }}
          >
            {editing ? "Edit Class" : t("newClass")}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} style={{ color: adminColors.pinkText }} />
          </button>
        </div>

        {/* Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-4"
        >
          <div
            className="flex items-center gap-1 p-1 rounded-lg w-fit"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {(["en", "ar"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLangTab(lang)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={{
                  background:
                    langTab === lang ? "rgba(251,191,36,0.15)" : "transparent",
                  color: langTab === lang ? "#fbbf24" : adminColors.textMuted,
                  border:
                    langTab === lang
                      ? "1px solid rgba(251,191,36,0.3)"
                      : "1px solid transparent",
                }}
              >
                {lang === "en" ? "🇬🇧 English" : "🇴🇲 Arabic"}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <label
              className="text-l"
              style={{ color: adminColors.textSecondary }}
            >
              Class Name <span className="text-red-400">*</span>
              {langTab === "ar" && (
                <span
                  className="ml-1 text-[11px]"
                  style={{ color: adminColors.textMuted }}
                >
                  (Arabic)
                </span>
              )}
            </label>
            <input
              name="name"
              defaultValue={editing?.name ?? ""}
              placeholder="e.g. Dance, Painting, Music"
              className="w-full text-l rounded-lg border px-3 py-2 outline-none"
              style={{
                ...inputStyle,
                display: langTab === "en" ? "block" : "none",
              }}
            />
            <input
              name="name_ar"
              defaultValue={(editing as any)?.name_ar ?? ""}
              dir="rtl"
              placeholder="مثال: رقص، رسم، موسيقى"
              className="w-full text-xs rounded-lg border px-3 py-2 outline-none"
              style={{
                ...inputStyle,
                fontFamily: "var(--font-layla, sans-serif)",
                display: langTab === "ar" ? "block" : "none",
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-l">
              Description
              {langTab === "ar" && (
                <span
                  className="ml-1 text-[16px]"
                  style={{ color: adminColors.textMuted }}
                >
                  (Arabic)
                </span>
              )}
            </label>
            <textarea
              name="description"
              defaultValue={editing?.description ?? ""}
              rows={3}
              className="w-full text-l rounded-lg border px-3 py-2 outline-none resize-none"
              style={{
                ...inputStyle,
                display: langTab === "en" ? "block" : "none",
              }}
            />
            <textarea
              name="description_ar"
              defaultValue={(editing as any)?.description_ar ?? ""}
              rows={3}
              dir="rtl"
              placeholder="الوصف بالعربي"
              className="w-full text-l rounded-lg border px-3 py-2 outline-none resize-none"
              style={{
                ...inputStyle,
                fontFamily: "var(--font-layla, sans-serif)",
                display: langTab === "ar" ? "block" : "none",
              }}
            />
          </div>
          <AdminInput
            label="Sort Order"
            name="sortOrder"
            type="number"
            placeholder="0"
            defaultValue={editing?.sortOrder?.toString() ?? "0"}
          />

          {editing && (
            <AdminSelect
              label="Status"
              name="isActive"
              defaultValue={editing.isActive ? "true" : "false"}
            >
              <option value="true" className="text-black">
                Active
              </option>
              <option value="false" className="text-black">
                Inactive
              </option>
            </AdminSelect>
          )}

          {error && (
            <p className="text-l px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <AdminButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" variant="primary" disabled={isPending}>
              {isPending && <Loader2 size={17} className="animate-spin" />}
              {editing ? "Save Changes" : "Create Class"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
