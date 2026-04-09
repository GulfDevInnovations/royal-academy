"use client";

import { useRef, useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import {
  AdminInput,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";
import {
  createGalleryCategory,
  updateGalleryCategory,
} from "@/lib/actions/admin/gallery.actions";
import type { SerializedCategory } from "./GalleryClient";
import { useTranslations } from "next-intl";

interface Props {
  editing?: SerializedCategory;
  onClose: () => void;
  onSuccess: () => void;
}

const toSlug = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export default function CategoryModal({ editing, onClose, onSuccess }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("admin");

  // Controlled state only for the name→slug auto-derivation (create mode)
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!editing); // in edit mode slug is pre-filled
  const [langTab, setLangTab] = useState<"en" | "ar">("en");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    // Auto-sync slug only while user hasn't manually edited it
    if (!slugTouched) setSlug(toSlug(val));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugTouched(true);
    setSlug(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);

    startTransition(async () => {
      const result = editing
        ? await updateGalleryCategory(editing.id, formData)
        : await createGalleryCategory(formData);
      if (result.error) setError(result.error);
      else onSuccess();
    });
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    borderColor: adminColors.border,
    color: adminColors.textPrimary,
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
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
            {editing ? "Edit Category" : t("newCategory")}
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
                className="px-3 py-1 rounded-md text-l font-medium transition-all"
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
              category Name <span className="text-red-400">*</span>
              {langTab === "ar" && (
                <span
                  className="ml-1 text-[16px]"
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
              className="w-full text-l rounded-lg border px-3 py-2 outline-none"
              style={{
                ...inputStyle,
                fontFamily: "var(--font-layla, sans-serif)",
                display: langTab === "ar" ? "block" : "none",
              }}
            />
          </div>

          {/* Slug — auto-derived, but editable */}
          <div>
            <AdminInput
              label="Slug *"
              name="slug"
              placeholder="dance"
              value={slug}
              onChange={handleSlugChange}
              required
            />
            {!editing && (
              <p
                className="text-[16px] mt-1"
                style={{ color: adminColors.textMuted }}
              >
                Auto-generated from name. Edit if needed.
              </p>
            )}
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

          <div className="flex items-center justify-end gap-2 pt-2">
            <AdminButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" variant="primary" disabled={isPending}>
              {isPending && <Loader2 size={16} className="animate-spin" />}
              {editing ? "Save Changes" : "Create"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
