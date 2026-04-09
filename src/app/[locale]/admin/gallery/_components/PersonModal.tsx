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
  createGalleryPerson,
  updateGalleryPerson,
} from "@/lib/actions/admin/gallery.actions";
import type { SerializedPerson, Teacher } from "./GalleryClient";
import { useTranslations } from "next-intl";

interface Props {
  editing?: SerializedPerson;
  teachers: Teacher[];
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS = ["Teacher", "Student", "Guest Artist", "Staff", "Other"];

export default function PersonModal({
  editing,
  teachers,
  onClose,
  onSuccess,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("admin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);

    startTransition(async () => {
      const result = editing
        ? await updateGalleryPerson(editing.id, formData)
        : await createGalleryPerson(formData);
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
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
        className="relative w-full max-w-md rounded-2xl border border-white/8 shadow-2xl z-10"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2
            className="text-xl font-semibold"
            style={{ color: adminColors.textPrimary }}
          >
            {editing ? "Edit Person" : t("newPerson")}
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
          <AdminInput
            label="Display Name *"
            name="displayName"
            placeholder="e.g. Sarah Al-Farsi"
            defaultValue={editing?.displayName ?? ""}
            required
          />

          <AdminSelect
            label="Role"
            name="role"
            defaultValue={editing?.role ?? ""}
          >
            <option value="" className="text-black">
              — Select role —
            </option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r} className="text-black">
                {r}
              </option>
            ))}
          </AdminSelect>

          {/* Link to teacher profile */}
          <AdminSelect
            label="Link to Teacher Profile (optional)"
            name="teacherId"
            defaultValue={editing?.teacherId ?? ""}
          >
            <option value="" className="text-black">
              — Not linked —
            </option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id} className="text-black">
                {t.firstName} {t.lastName}
              </option>
            ))}
          </AdminSelect>

          <div
            className="text-l px-3 py-2 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.03)",
              color: adminColors.textMuted,
            }}
          >
            Linking to a teacher profile allows the gallery to automatically use
            their name and photo when tagged.
          </div>

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
              {editing ? "Save Changes" : "Create Person"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
