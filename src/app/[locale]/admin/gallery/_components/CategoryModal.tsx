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

  // Controlled state only for the name→slug auto-derivation (create mode)
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!editing); // in edit mode slug is pre-filled

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
            className="text-sm font-semibold"
            style={{ color: adminColors.textPrimary }}
          >
            {editing ? "Edit Category" : "New Category"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-4"
        >
          <AdminInput
            label="Category Name *"
            name="name"
            placeholder="e.g. Dance, Music, Events"
            value={name}
            onChange={handleNameChange}
            required
          />

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
                className="text-[11px] mt-1"
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
            <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <AdminButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" variant="primary" disabled={isPending}>
              {isPending && <Loader2 size={13} className="animate-spin" />}
              {editing ? "Save Changes" : "Create"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
