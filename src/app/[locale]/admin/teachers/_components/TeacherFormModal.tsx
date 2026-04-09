"use client";

import { useRef, useState, useTransition } from "react";
import {
  X,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Upload,
} from "lucide-react";
import {
  createTeacher,
  updateTeacher,
  assignSubClassesToTeacher,
  uploadTeacherPhoto,
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
import { useTranslations } from "next-intl";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  editing?: SerializedTeacher | null;
  allClasses: ClassWithSubsForAssignment[];
}

// Add this above the component (or in a shared utils file):
function isError(result: unknown): result is { error: string } {
  return typeof result === "object" && result !== null && "error" in result;
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    editing?.photoUrl ?? null,
  );
  const [langTab, setLangTab] = useState<"en" | "ar">("en");
  const t = useTranslations("admin");

  // ── Specialties ──
  const [specialties, setSpecialties] = useState<string[]>(
    editing?.specialties ?? [],
  );
  const [specInput, setSpecInput] = useState("");

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
      if (photoFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", photoFile);
        uploadForm.append("folder", "teachers");
        const uploaded = await uploadTeacherPhoto(uploadForm);
        if (isError(uploaded)) {
          setError(uploaded.error);
          return;
        }
        formData.set("photoUrl", uploaded.url);
      }

      const result = editing
        ? await updateTeacher(editing.id, formData)
        : await createTeacher(formData);

      if (isError(result)) {
        setError(result.error);
        return;
      }

      // TypeScript now knows result is the success branch here
      const teacherId =
        editing?.id ?? ("teacherId" in result ? result.teacherId : undefined);

      if (typeof teacherId === "string" && selectedSubIds.size > 0) {
        const assignResult = await assignSubClassesToTeacher(teacherId, [
          ...selectedSubIds,
        ]);
        if (isError(assignResult)) {
          setError(assignResult.error);
          return;
        }
      }

      onSuccess();
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
        className="relative w-full max-w-xl rounded-2xl border border-white/[0.08] shadow-2xl z-10 max-h-[92vh] flex flex-col"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
          <h2
            className="text-xl font-semibold"
            style={{ color: adminColors.textPrimary }}
          >
            {editing ? "Edit Teacher" : t("newTeacher")}
          </h2>
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
                        className="text-l"
                        style={{ color: adminColors.textMuted }}
                      >
                        Login account:
                      </span>
                      <span
                        className="text-l"
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
                        className="text-l"
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
              <div className="space-y-1.5">
                <label
                  className="text-l"
                  style={{ color: adminColors.textSecondary }}
                >
                  Bio <span className="text-red-400">*</span>
                  {langTab === "ar" && (
                    <span
                      className="ml-1 text-[10px]"
                      style={{ color: adminColors.textMuted }}
                    >
                      (Arabic)
                    </span>
                  )}
                </label>
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
                        color:
                          langTab === lang ? "#fbbf24" : adminColors.textMuted,
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
                <textarea
                  name="bio"
                  defaultValue={editing?.bio ?? ""}
                  className="w-full text-l rounded-lg border px-3 py-2 outline-none"
                  style={{
                    ...inputStyle,
                    display: langTab === "en" ? "block" : "none",
                  }}
                />
                <textarea
                  name="bio_ar"
                  defaultValue={(editing as any)?.bio_ar ?? ""}
                  dir="rtl"
                  className="w-full text-l rounded-lg border px-3 py-2 outline-none"
                  style={{
                    ...inputStyle,
                    fontFamily: "var(--font-layla, sans-serif)",
                    display: langTab === "ar" ? "block" : "none",
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-l font-medium mb-1.5"
                  style={{ color: adminColors.textSecondary }}
                >
                  Profile Photo
                </label>

                {/* Preview */}
                {photoPreview && (
                  <div className="mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover"
                      style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                )}

                {/* File input */}
                <label
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-l transition-colors hover:bg-white/[0.03]"
                  style={{
                    borderColor: adminColors.border,
                    color: adminColors.textSecondary,
                  }}
                >
                  <Upload size={13} />
                  {photoFile
                    ? photoFile.name
                    : photoPreview
                      ? "Change photo"
                      : "Choose photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPhotoFile(file);
                      // Local preview
                      const reader = new FileReader();
                      reader.onload = (ev) =>
                        setPhotoPreview(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
              {/* Keep the hidden input for the existing URL (edit mode) */}
              <input type="hidden" name="photoUrl" value={photoPreview ?? ""} />
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
                  placeholder="e.g. Violin, Ballet, Drums…"
                  className="flex-1 px-3 py-2 rounded-lg text-xl border bg-white/[0.04] text-white/80 placeholder-white/20 focus:outline-none focus:border-amber-500/50 transition-all"
                  style={{ borderColor: adminColors.border }}
                />
                <AdminButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addSpecialty}
                >
                  <Plus size={18} /> Add
                </AdminButton>
              </div>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {specialties.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-l font-medium"
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
                        <Trash2 size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Section>

            {/* ── Sub-class Assignment ── */}
            <Section title="Assigned Sub-classes">
              <p className="text-l" style={{ color: adminColors.textMuted }}>
                Select which sub-classes this teacher is responsible for. A
                sub-class can only have one teacher.
              </p>

              {allClasses.length === 0 ? (
                <p className="text-l" style={{ color: adminColors.textMuted }}>
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
                            className="flex-1 text-xl font-medium"
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
                            className="text-l"
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
                                className="px-4 py-2 text-l"
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
                                      className="text-xl flex-1"
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
                                        className="text-[15px]"
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
                  className="text-l mt-2"
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
                    <option className="text-black" value="true">
                      Available
                    </option>
                    <option className="text-black" value="false">
                      Unavailable
                    </option>
                  </AdminSelect>
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
                </div>
              </Section>
            )}

            {error && (
              <p className="text-l px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
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
        className="text-[15px] font-semibold tracking-widest uppercase"
        style={{ color: "rgba(245,158,11,0.6)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
