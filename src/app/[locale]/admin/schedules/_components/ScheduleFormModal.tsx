"use client";

import { useRef, useState, useTransition } from "react";
import { X, Loader2, AlertTriangle } from "lucide-react";
import {
  createSchedule,
  updateSchedule,
} from "@/lib/actions/admin/Schedules.actions";
import type { SerializedSchedule } from "../page";
import {
  AdminInput,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

interface SubClassOption {
  id: string;
  name: string;
  class: { id: string; name: string };
  teachers: { teacher: { id: string; firstName: string; lastName: string } }[];
}

interface TeacherOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  editing?: SerializedSchedule | null;
  onClose: () => void;
  onSuccess: () => void;
  subClasses: SubClassOption[];
  teachers: TeacherOption[];
}

export default function ScheduleFormModal({
  editing,
  onClose,
  onSuccess,
  subClasses,
  teachers,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Track selected subclass to filter teachers to those assigned to it
  const [selectedSubClassId, setSelectedSubClassId] = useState<string>(
    editing?.subClassId ?? "",
  );

  const selectedSubClass = subClasses.find((s) => s.id === selectedSubClassId);
  // Show teachers assigned to this subclass, fall back to all teachers
  const availableTeachers = selectedSubClass?.teachers.length
    ? selectedSubClass.teachers.map((t) => t.teacher)
    : teachers;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      const result = editing
        ? await updateSchedule(editing.id, fd)
        : await createSchedule(fd);
      if (result.error) setError(result.error);
      else onSuccess();
    });
  };

  const startDateVal = editing
    ? new Date(editing.startDate).toISOString().split("T")[0]
    : "";
  const endDateVal = editing?.endDate
    ? new Date(editing.endDate).toISOString().split("T")[0]
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/[0.08] shadow-2xl z-10 max-h-[92vh] flex flex-col"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              {editing ? "Edit Schedule" : "New Schedule"}
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              {editing
                ? "Update this recurring class slot"
                : "Creates recurring sessions automatically"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="px-6 py-5 space-y-5"
          >
            {/* ── Class & Teacher ── */}
            <Section title="Class Assignment">
              {!editing ? (
                <AdminSelect
                  label="Sub-class *"
                  name="subClassId"
                  value={selectedSubClassId}
                  onChange={(e) => setSelectedSubClassId(e.target.value)}
                  required
                >
                  <option value="">Select a sub-class…</option>
                  {subClasses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.class.name} → {s.name}
                    </option>
                  ))}
                </AdminSelect>
              ) : (
                <div
                  className="px-3 py-2 rounded-lg border border-white/[0.06] text-sm"
                  style={{ color: adminColors.textSecondary }}
                >
                  {editing.subClass.class.name} → {editing.subClass.name}
                  <input
                    type="hidden"
                    name="subClassId"
                    value={editing.subClassId}
                  />
                </div>
              )}

              <AdminSelect
                label="Teacher *"
                name="teacherId"
                defaultValue={editing?.teacherId ?? ""}
                required
              >
                <option value="">Select a teacher…</option>
                {availableTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </AdminSelect>

              {selectedSubClass && selectedSubClass.teachers.length === 0 && (
                <div
                  className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.2)",
                  }}
                >
                  <AlertTriangle
                    size={13}
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: "#f59e0b" }}
                  />
                  <p
                    className="text-xs"
                    style={{ color: "rgba(245,158,11,0.8)" }}
                  >
                    No teachers assigned to this sub-class yet. Showing all
                    teachers. Assign teachers in the Teachers section first.
                  </p>
                </div>
              )}
            </Section>

            {/* ── Timing ── */}
            <Section title="Timing">
              <AdminSelect
                label="Day of Week *"
                name="dayOfWeek"
                defaultValue={editing?.dayOfWeek ?? ""}
                required
              >
                <option value="">Select day…</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABELS[d]}
                  </option>
                ))}
              </AdminSelect>

              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="Start Time *"
                  name="startTime"
                  type="time"
                  defaultValue={editing?.startTime ?? ""}
                  required
                />
                <AdminInput
                  label="End Time *"
                  name="endTime"
                  type="time"
                  defaultValue={editing?.endTime ?? ""}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="Start Date *"
                  name="startDate"
                  type="date"
                  defaultValue={startDateVal}
                  required
                />
                <AdminInput
                  label="End Date"
                  name="endDate"
                  type="date"
                  defaultValue={endDateVal}
                  helperText="Leave blank for open-ended"
                />
              </div>

              {!editing && (
                <div
                  className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(96,165,250,0.06)",
                    border: "1px solid rgba(96,165,250,0.15)",
                  }}
                >
                  <p
                    className="text-xs"
                    style={{ color: "rgba(96,165,250,0.8)" }}
                  >
                    Sessions are generated once per week on the selected day. To
                    support{" "}
                    <strong style={{ color: "#93c5fd" }}>twice-per-week</strong>{" "}
                    enrollment, create a second schedule for the same sub-class
                    on a different day (e.g. Monday + Wednesday). Students will
                    then be able to choose once or twice per week when
                    enrolling.
                  </p>
                </div>
              )}
            </Section>

            {/* ── Settings ── */}
            <Section title="Settings">
              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="Max Capacity"
                  name="maxCapacity"
                  type="number"
                  min="1"
                  max="100"
                  defaultValue={String(editing?.maxCapacity ?? 10)}
                />
                <AdminSelect
                  label="Visibility"
                  name="isPublic"
                  defaultValue={editing?.isPublic ? "true" : "false"}
                >
                  <option value="false">Private</option>
                  <option value="true">Public</option>
                </AdminSelect>
              </div>
              <AdminSelect
                label="Recurring"
                name="isRecurring"
                defaultValue={editing?.isRecurring !== false ? "true" : "false"}
              >
                <option value="true">Yes — weekly recurring</option>
                <option value="false">No — one-off</option>
              </AdminSelect>
              <AdminInput
                label="Online Link (optional)"
                name="onlineLink"
                type="url"
                placeholder="https://meet.google.com/…"
                defaultValue={editing?.onlineLink ?? ""}
              />
              {editing && (
                <AdminSelect
                  label="Status"
                  name="status"
                  defaultValue={editing.status}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </AdminSelect>
              )}
            </Section>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle
                  size={13}
                  className="flex-shrink-0 mt-0.5 text-red-400"
                />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <AdminButton type="button" variant="ghost" onClick={onClose}>
                Cancel
              </AdminButton>
              <AdminButton type="submit" variant="primary" disabled={isPending}>
                {isPending && <Loader2 size={13} className="animate-spin" />}
                {editing ? "Save Changes" : "Create Schedule"}
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
