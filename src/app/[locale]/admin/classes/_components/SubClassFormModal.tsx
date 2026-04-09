"use client";

import { useRef, useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import {
  createSubClass,
  updateSubClass,
} from "@/lib/actions/admin/classes.actions";
import type { SerializedClass, SerializedSubClass } from "../page";
import {
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";
import { useTranslations } from "next-intl";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  parentClass: SerializedClass;
  teachers: Teacher[];
  onClose: () => void;
  onSuccess: () => void;
  editing?: SerializedSubClass | null;
}

const SESSION_TYPES = [
  { value: "PUBLIC", label: "Public" },
  { value: "TRIAL", label: "Trial (One-time taster)" },
  { value: "PRIVATE", label: "Private" },
];

const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];
const AGE_GROUPS = ["Kids", "Adults", "All Ages"];

export default function SubClassFormModal({
  parentClass,
  teachers,
  onClose,
  onSuccess,
  editing,
}: Props) {
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
        ? await updateSubClass(editing.id, formData)
        : await createSubClass(parentClass.id, formData);

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
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/8 shadow-2xl z-10 max-h-[90vh] flex flex-col"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
          <div>
            <h2
              className="text-xl font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              {editing ? "Edit Sub-Class" : "New Sub-Class"}
            </h2>
            <p
              className="text-l mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              Under: {parentClass.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} style={{ color: adminColors.pinkText }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="px-6 py-5 space-y-5"
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
                      langTab === lang
                        ? "rgba(251,191,36,0.15)"
                        : "transparent",
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
            {/* ── Basic Info ── */}
            <Section title="Basic Info">
              <div className="space-y-1.5">
                <label
                  className="text-l"
                  style={{ color: adminColors.textSecondary }}
                >
                  Class Name <span className="text-red-400">*</span>
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
              <div className="grid grid-cols-2 gap-3">
                <AdminSelect
                  label="Session Type"
                  name="sessionType"
                  defaultValue={editing?.sessionType ?? "PUBLIC"}
                >
                  {SESSION_TYPES.map((t) => (
                    <option
                      className="text-black"
                      key={t.value}
                      value={t.value}
                    >
                      {t.label}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Teacher"
                  name="teacherId"
                  defaultValue={editing?.teachers?.[0]?.teacherId ?? ""}
                >
                  <option className="text-black" value="">
                    No teacher assigned
                  </option>
                  {teachers.map((t) => (
                    <option className="text-black" key={t.id} value={t.id}>
                      {t.firstName} {t.lastName}
                    </option>
                  ))}
                </AdminSelect>
              </div>
            </Section>

            {/* ── Class Details ── */}
            <Section title="Class Details">
              <div className="grid grid-cols-2 gap-3">
                <AdminSelect
                  label="Level"
                  name="level"
                  defaultValue={editing?.level ?? ""}
                >
                  <option value="">Not specified</option>
                  {LEVELS.map((l) => (
                    <option className="text-black" key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </AdminSelect>
                <AdminSelect
                  label="Age Group"
                  name="ageGroup"
                  defaultValue={editing?.ageGroup ?? ""}
                >
                  <option value="">Not specified</option>
                  {AGE_GROUPS.map((a) => (
                    <option className="text-black" key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </AdminSelect>
                <AdminInput
                  label="Capacity (students)"
                  name="capacity"
                  type="number"
                  min="1"
                  defaultValue={editing?.capacity?.toString() ?? "10"}
                />
                <AdminInput
                  label="Duration (minutes)"
                  name="durationMinutes"
                  type="number"
                  min="15"
                  step="15"
                  defaultValue={editing?.durationMinutes?.toString() ?? "60"}
                />
              </div>
            </Section>

            {/* ── Pricing ── */}
            <Section title="Pricing (OMR)">
              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="Base Price"
                  name="price"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0.00"
                  defaultValue={editing?.price?.toString() ?? ""}
                />
                <AdminInput
                  label="Trial Price"
                  name="trialPrice"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="10.00"
                  defaultValue={editing?.trialPrice?.toString() ?? "10"}
                />
                <AdminInput
                  label="Monthly (Once/week)"
                  name="oncePriceMonthly"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0.00"
                  defaultValue={editing?.oncePriceMonthly?.toString() ?? ""}
                />
                <AdminInput
                  label="Monthly (Twice/week)"
                  name="twicePriceMonthly"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0.00"
                  defaultValue={editing?.twicePriceMonthly?.toString() ?? ""}
                />
              </div>
            </Section>

            {/* ── Settings ── */}
            <Section title="Settings">
              <div className="grid grid-cols-2 gap-3">
                <AdminSelect
                  label="Trial Available"
                  name="isTrialAvailable"
                  defaultValue={
                    editing != null
                      ? editing.isTrialAvailable
                        ? "true"
                        : "false"
                      : "true"
                  }
                >
                  <option className="text-black" value="true">
                    Yes
                  </option>
                  <option className="text-black" value="false">
                    No
                  </option>
                </AdminSelect>
                {editing && (
                  <AdminSelect
                    label="Status"
                    name="isActive"
                    defaultValue={editing.isActive ? "true" : "false"}
                  >
                    <option className="text-black" value="true">
                      Active
                    </option>
                    <option className="text-black" value="false">
                      Inactive
                    </option>
                  </AdminSelect>
                )}
              </div>
            </Section>

            {error && (
              <p className="text-l px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1 pb-1">
              <AdminButton type="button" variant="ghost" onClick={onClose}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" variant="primary" disabled={isPending}>
                {isPending && <Loader2 size={13} className="animate-spin" />}
                {editing ? "Save Changes" : "Create Sub-Class"}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Small section wrapper for visual grouping
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p
        className="text-[15px] font-semibold tracking-widest uppercase"
        style={{ color: "rgba(245,158,11,0.6)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
