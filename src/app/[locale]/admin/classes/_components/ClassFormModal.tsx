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

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  editing?: SerializedClass | null;
}

export default function ClassFormModal({ onClose, onSuccess, editing }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] shadow-2xl z-10"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2
            className="text-sm font-semibold"
            style={{ color: adminColors.textPrimary }}
          >
            {editing ? "Edit Class" : "New Class"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
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
            label="Class Name *"
            name="name"
            placeholder="e.g. Dance, Painting, Music"
            defaultValue={editing?.name ?? ""}
            required
          />

          <AdminTextarea
            label="Description"
            name="description"
            placeholder="Brief description of this class category..."
            defaultValue={editing?.description ?? ""}
          />

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
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </AdminSelect>
          )}

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <AdminButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" variant="primary" disabled={isPending}>
              {isPending && <Loader2 size={13} className="animate-spin" />}
              {editing ? "Save Changes" : "Create Class"}
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
