"use client";

import { X } from "lucide-react";
import type { SerializedStudent } from "../page";
import { AdminBadge, adminColors } from "@/components/admin/ui";

interface Props {
  student: SerializedStudent;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-[10px] font-semibold tracking-widest uppercase"
        style={{ color: adminColors.textMuted }}
      >
        {label}
      </span>
      <span
        className="text-l"
        style={{
          color: value ? adminColors.textPrimary : adminColors.textMuted,
        }}
      >
        {value || "—"}
      </span>
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
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</div>
    </div>
  );
}

export default function StudentViewModal({ student, onClose }: Props) {
  const dob = student.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  const joined = new Date(student.user.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const formatRelationship = (r?: string | null) => {
    if (!r) return null;
    return r.charAt(0) + r.slice(1).toLowerCase();
  };

  const formatTrack = (t?: string | null) => {
    if (!t) return null;
    return t.charAt(0) + t.slice(1).toLowerCase();
  };

  const formatExperience = (e?: string | null) => {
    if (!e) return null;
    const map: Record<string, string> = {
      NO_EXPERIENCE: "No experience",
      LESS_THAN_ONE_YEAR: "Less than a year",
      MORE_THAN_ONE_YEAR: "More than a year",
    };
    return map[e] ?? e;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-3xl rounded-2xl border border-white/[0.08] shadow-2xl z-10 max-h-[90vh] flex flex-col"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: "rgba(96,165,250,0.12)", color: "#60a5fa" }}
            >
              {student.firstName.charAt(0)}
              {student.lastName.charAt(0)}
            </div>
            <div>
              <h2
                className="text-sm font-semibold"
                style={{ color: adminColors.textPrimary }}
              >
                {student.firstName} {student.lastName}
              </h2>
              <p
                className="text-xs mt-0.5"
                style={{ color: adminColors.textMuted }}
              >
                {student.user.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AdminBadge variant={student.user.isActive ? "success" : "default"}>
              {student.user.isActive ? "Active" : "Inactive"}
            </AdminBadge>
            {student.agreePolicy && (
              <AdminBadge variant="info">Terms accepted</AdminBadge>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={16} style={{ color: adminColors.pinkText }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Personal */}
          <Section title="Personal Info">
            <Row label="First Name" value={student.firstName} />
            <Row label="Last Name" value={student.lastName} />
            <Row label="Date of Birth" value={dob} />
            <Row
              label="Gender"
              value={
                student.gender
                  ? student.gender.charAt(0) +
                    student.gender.slice(1).toLowerCase()
                  : null
              }
            />
            <Row label="Phone" value={student.user.phone} />
            <Row label="Joined" value={joined} />
          </Section>

          {/* Address */}
          <Section title="Address">
            <Row label="Country" value={student.country} />
            <Row label="City" value={student.city} />
            <Row label="District / Address" value={student.address} />
          </Section>

          {/* Emergency */}
          <Section title="Emergency Contact">
            <Row label="Name" value={student.emergencyContactName} />
            <Row label="Phone" value={student.emergencyContactPhone} />
            <Row
              label="Relationship"
              value={formatRelationship(student.emergencyRelationship)}
            />
          </Section>

          {/* Learning */}
          <Section title="Learning Details">
            <Row
              label="Preferred Track"
              value={formatTrack(student.preferredTrack)}
            />
            <Row
              label="Experience"
              value={formatExperience(student.experience)}
            />
          </Section>

          {/* Enrollments */}
          <div className="space-y-3">
            <p
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "rgba(245,158,11,0.6)" }}
            >
              Enrollments
            </p>
            {student.monthlyEnrollments.length === 0 ? (
              <p className="text-l" style={{ color: adminColors.textMuted }}>
                No enrollments
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {student.monthlyEnrollments.map((e) => (
                  <div
                    key={e.id}
                    className="px-3 py-1.5 rounded-lg border text-l"
                    style={{
                      borderColor: "rgba(96,165,250,0.2)",
                      background: "rgba(96,165,250,0.06)",
                      color: "#60a5fa",
                    }}
                  >
                    <span className="font-medium">{e.subClass.name}</span>
                    <span style={{ color: adminColors.textMuted }}>
                      {" "}
                      · {e.subClass.class.name}
                    </span>
                    {e.subClass.classSchedules.length > 0 && (
                      <span style={{ color: adminColors.textMuted }}>
                        {" "}
                        ·{" "}
                        {e.subClass.classSchedules
                          .map(
                            (sc) =>
                              `${sc.dayOfWeek.slice(0, 3)} ${sc.startTime}–${sc.endTime}`,
                          )
                          .join(", ")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medical */}
          <div className="space-y-3">
            <p
              className="text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: "rgba(245,158,11,0.6)" }}
            >
              Medical
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: student.hasMedicalCondition
                    ? "#f87171"
                    : "#34d399",
                }}
              />
              <span
                className="text-l"
                style={{ color: adminColors.textSecondary }}
              >
                {student.hasMedicalCondition
                  ? "Has a medical condition"
                  : "No medical conditions reported"}
              </span>
            </div>
            {student.hasMedicalCondition && student.medicalConditionDetails && (
              <div
                className="px-4 py-3 rounded-xl text-l border"
                style={{
                  background: "rgba(248,113,113,0.05)",
                  borderColor: "rgba(248,113,113,0.15)",
                  color: adminColors.textSecondary,
                }}
              >
                {student.medicalConditionDetails}
              </div>
            )}
          </div>

          {/* Notes */}
          {student.notes && (
            <div className="space-y-3">
              <p
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "rgba(245,158,11,0.6)" }}
              >
                Internal Notes
              </p>
              <div
                className="px-4 py-3 rounded-xl text-l border"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: adminColors.border,
                  color: adminColors.textSecondary,
                }}
              >
                {student.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
