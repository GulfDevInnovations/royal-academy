"use client";

import { useRef, useState, useTransition } from "react";
import CloudinaryUpload from "@/components/admin/CloudinaryUpload";
import {
  X,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import {
  createTeacher,
  updateTeacher,
  assignSubClassesToTeacher,
} from "@/lib/actions/admin/teachers.actions";
import type { SerializedTeacher, ClassWithSubsForAssignment } from "../page";
import {
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminButton,
  AdminBadge,
  adminColors,
} from "@/components/admin/ui";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  editing?: SerializedTeacher | null;
  allClasses: ClassWithSubsForAssignment[];
}

export default function TeacherFormModal({
  onClose,
  onSuccess,
  editing,
  allClasses,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Specialties ──
  const [specialties, setSpecialties] = useState<string[]>(
    editing?.specialties ?? [],
  );
  const [specInput, setSpecInput] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>(editing?.photoUrl ?? "");

  const [selectedSubIds, setSelectedSubIds] = useState<Set<string>>(
    new Set(editing?.subClasses.map((s) => s.id) ?? []),
  );
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(
    new Set(),
  );

  const toggleSubClass = (id: string) => {
    setSelectedSubIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleClassExpand = (id: string) =>
    setExpandedClasses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const addSpecialty = () => {
    const val = specInput.trim();
    if (val && !specialties.includes(val)) setSpecialties((p) => [...p, val]);
    setSpecInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);
    formData.set("specialties", specialties.join(","));

    startTransition(async () => {
      // 1. Create or update the teacher profile
      const result = editing
        ? await updateTeacher(editing.id, formData)
        : await createTeacher(formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      // 2. Assign sub-classes — for create we need the new teacher's id.
      //    createTeacher returns { success, teacherId } so we can use it.
      const teacherId =
        editing?.id ?? (result as { teacherId?: string }).teacherId;

      if (teacherId && selectedSubIds.size >= 0) {
        const assignResult = await assignSubClassesToTeacher(teacherId, [
          ...selectedSubIds,
        ]);
        if (assignResult.error) {
          setError((assignResult as { error: string }).error);
          return;
        }
      }

      onSuccess();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-xl rounded-2xl border border-white/[0.08] shadow-2xl z-10 max-h-[92vh] flex flex-col"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
          <h2
            className="text-sm font-semibold"
            style={{ color: adminColors.textPrimary }}
          >
            {editing ? "Edit Teacher" : "New Teacher"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="px-6 py-5 space-y-6"
          >
            {/* ── Account ── */}
            <Section title="Basic Info">
              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="First Name *"
                  name="firstName"
                  defaultValue={editing?.firstName ?? ""}
                  required
                />
                <AdminInput
                  label="Last Name *"
                  name="lastName"
                  defaultValue={editing?.lastName ?? ""}
                  required
                />
              </div>
              {!editing ? (
                <div className="space-y-3">
                  <AdminInput
                    label="Email (optional)"
                    name="email"
                    type="email"
                    placeholder="teacher@studio.com — creates a login account for future portal"
                    helperText="Leave blank if teacher doesn't need portal access yet"
                  />
                  <AdminInput
                    label="Phone (optional)"
                    name="phone"
                    type="tel"
                    placeholder="+968 XXXX XXXX"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {editing.user ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06]">
                      <span
                        className="text-xs"
                        style={{ color: adminColors.textMuted }}
                      >
                        Login account:
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: adminColors.textSecondary }}
                      >
                        {editing.user.email}
                      </span>
                      {editing.user.phone && (
                        <span
                          className="text-xs ml-auto"
                          style={{ color: adminColors.textMuted }}
                        >
                          {editing.user.phone}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="px-3 py-2 rounded-lg border border-dashed border-white/[0.08]">
                      <p
                        className="text-xs"
                        style={{ color: adminColors.textMuted }}
                      >
                        No login account linked — teacher cannot access portal
                        yet.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* ── Profile ── */}
            <Section title="Profile">
              <AdminTextarea
                label="Bio"
                name="bio"
                placeholder="Background, teaching style, experience…"
                defaultValue={editing?.bio ?? ""}
                rows={3}
              />
              <CloudinaryUpload
                value={photoUrl}
                onChange={(url) => setPhotoUrl(url)}
                folder="teachers"
              />
              {/* Hidden input so FormData picks up the Cloudinary URL */}
              <input type="hidden" name="photoUrl" value={photoUrl} />
            </Section>

            {/* ── Specialties ── */}
            <Section title="Specialties">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialty();
                    }
                  }}
                  placeholder="e.g. Piano, Ballet, Drums…"
                  className="flex-1 px-3 py-2 rounded-lg text-sm border bg-white/[0.04] text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-all"
                  style={{ borderColor: adminColors.border }}
                />
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addSpecialty}
                >
                  <Plus size={13} /> Add
                </AdminButton>
              </div>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {specialties.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "rgba(245,158,11,0.1)",
                        color: "#f59e0b",
                      }}
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() =>
                          setSpecialties((p) => p.filter((x) => x !== s))
                        }
                        className="hover:opacity-70"
                      >
                        <Trash2 size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Section>

            {/* ── Sub-class Assignment ── */}
            <Section title="Assigned Sub-classes">
              <p className="text-xs" style={{ color: adminColors.textMuted }}>
                Select which sub-classes this teacher is responsible for. A
                sub-class can only have one teacher.
              </p>

              {allClasses.length === 0 ? (
                <p className="text-xs" style={{ color: adminColors.textMuted }}>
                  No classes available yet.
                </p>
              ) : (
                <div className="space-y-1.5 mt-2">
                  {allClasses.map((cls) => {
                    const isExpanded = expandedClasses.has(cls.id);
                    const assignedInClass = cls.subClasses.filter((s) =>
                      selectedSubIds.has(s.id),
                    ).length;

                    return (
                      <div
                        key={cls.id}
                        className="rounded-lg border overflow-hidden"
                        style={{ borderColor: adminColors.border }}
                      >
                        {/* Class header — click to expand */}
                        <button
                          type="button"
                          onClick={() => toggleClassExpand(cls.id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
                        >
                          {isExpanded ? (
                            <ChevronDown
                              size={13}
                              style={{ color: adminColors.textMuted }}
                            />
                          ) : (
                            <ChevronRight
                              size={13}
                              style={{ color: adminColors.textMuted }}
                            />
                          )}
                          <BookOpen size={13} style={{ color: "#f59e0b" }} />
                          <span
                            className="flex-1 text-sm font-medium"
                            style={{ color: adminColors.textPrimary }}
                          >
                            {cls.name}
                          </span>
                          {assignedInClass > 0 && (
                            <AdminBadge variant="warning">
                              {assignedInClass} assigned
                            </AdminBadge>
                          )}
                          <span
                            className="text-xs"
                            style={{ color: adminColors.textMuted }}
                          >
                            {cls.subClasses.length} sub-class
                            {cls.subClasses.length !== 1 ? "es" : ""}
                          </span>
                        </button>

                        {/* Sub-class checkboxes */}
                        {isExpanded && (
                          <div
                            className="border-t"
                            style={{ borderColor: adminColors.border }}
                          >
                            {cls.subClasses.length === 0 ? (
                              <p
                                className="px-4 py-2 text-xs"
                                style={{ color: adminColors.textMuted }}
                              >
                                No sub-classes in this class.
                              </p>
                            ) : (
                              cls.subClasses.map((sub) => {
                                const isChecked = selectedSubIds.has(sub.id);
                                // Other teachers already assigned (excluding the one being edited)
                                const otherTeachers = sub.teachers
                                  .map((t) => t.teacher)
                                  .filter((t) => t.id !== editing?.id);
                                return (
                                  <label
                                    key={sub.id}
                                    className="flex items-center gap-3 px-5 py-2.5 cursor-pointer transition-colors hover:bg-white/[0.02]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleSubClass(sub.id)}
                                      className="accent-amber-500 w-3.5 h-3.5"
                                    />
                                    <span
                                      className="text-sm flex-1"
                                      style={{
                                        color: isChecked
                                          ? adminColors.textPrimary
                                          : adminColors.textSecondary,
                                      }}
                                    >
                                      {sub.name}
                                    </span>
                                    {/* Show other teachers sharing this subclass */}
                                    {otherTeachers.length > 0 && (
                                      <span
                                        className="text-[10px]"
                                        style={{ color: adminColors.textMuted }}
                                      >
                                        also:{" "}
                                        {otherTeachers
                                          .map(
                                            (t) =>
                                              `${t.firstName} ${t.lastName}`,
                                          )
                                          .join(", ")}
                                      </span>
                                    )}
                                    {isChecked && (
                                      <AdminBadge variant="success">
                                        Assigned
                                      </AdminBadge>
                                    )}
                                  </label>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary */}
              {selectedSubIds.size > 0 && (
                <p
                  className="text-xs mt-2"
                  style={{ color: adminColors.textMuted }}
                >
                  <span style={{ color: "#f59e0b" }}>
                    {selectedSubIds.size}
                  </span>{" "}
                  sub-class{selectedSubIds.size !== 1 ? "es" : ""} selected
                </p>
              )}
            </Section>

            {/* ── Settings (edit only) ── */}
            {editing && (
              <Section title="Settings">
                <div className="grid grid-cols-2 gap-3">
                  <AdminSelect
                    label="Availability"
                    name="isAvailable"
                    defaultValue={editing.isAvailable ? "true" : "false"}
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </AdminSelect>
                  <AdminSelect
                    label="Status"
                    name="isActive"
                    defaultValue={editing.isActive ? "true" : "false"}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </AdminSelect>
                </div>
              </Section>
            )}

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <AdminButton type="button" variant="ghost" onClick={onClose}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" variant="primary" disabled={isPending}>
                {isPending && <Loader2 size={13} className="animate-spin" />}
                {editing ? "Save Changes" : "Create Teacher"}
              </AdminButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

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
        className="text-[10px] font-semibold tracking-widest uppercase"
        style={{ color: "rgba(245,158,11,0.6)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
