"use client";

import { useRef, useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { updateStudent } from "@/lib/actions/admin/students.actions";
import type { SerializedStudent } from "../page";
import {
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";
import { useTranslations } from "next-intl";
import DatePicker from "@/components/date-time/DatePicker";

interface Props {
  student: SerializedStudent;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudentEditModal({
  student,
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
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      const result = await updateStudent(student.id, fd);
      if (result.error) setError(result.error);
      else onSuccess();
    });
  };

  const dob = student.dateOfBirth
    ? new Date(student.dateOfBirth).toISOString().split("T")[0]
    : "";

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] flex-shrink-0">
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              Edit Student
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              {student.user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} style={{ color: adminColors.pinkText }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="px-6 py-5 space-y-5"
          >
            <Section title="Personal Info">
              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="First Name *"
                  name="firstName"
                  defaultValue={student.firstName}
                  required
                />
                <AdminInput
                  label="Last Name *"
                  name="lastName"
                  defaultValue={student.lastName}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DatePicker
                  id="dateOfBirth"
                  name="dateOfBirth"
                  label="Date of Birth"
                  defaultValue={dob}
                  theme="dark"
                  fieldClassName="w-full px-3 py-2 rounded-lg border bg-white/4 text-white/80..."
                  inputStyle={{ borderColor: adminColors.border }}
                />
                <AdminSelect
                  label="Gender"
                  name="gender"
                  defaultValue={student.gender ?? ""}
                >
                  <option className="text-black" value="">
                    Not specified
                  </option>
                  <option className="text-black" value="MALE">
                    Male
                  </option>
                  <option className="text-black" value="FEMALE">
                    Female
                  </option>
                  <option className="text-black" value="OTHER">
                    Other
                  </option>
                </AdminSelect>
              </div>
              <AdminInput
                label="Phone"
                name="phone"
                type="tel"
                placeholder="+968 XXXX XXXX"
                defaultValue={student.user.phone ?? ""}
              />
            </Section>

            <Section title="Address">
              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="City"
                  name="city"
                  defaultValue={student.city ?? ""}
                />
                <AdminInput
                  label="Country"
                  name="country"
                  defaultValue={student.country ?? ""}
                />
              </div>
              <AdminInput
                label="Address"
                name="address"
                defaultValue={student.address ?? ""}
              />
            </Section>

            <Section title="Emergency & Notes">
              <div className="grid grid-cols-2 gap-3">
                <AdminInput
                  label="Contact Name"
                  name="emergencyContactName"
                  placeholder="Full name"
                  defaultValue={student.emergencyContactName ?? ""}
                />
                <AdminInput
                  label="Contact Phone"
                  name="emergencyContactPhone"
                  placeholder="+968 XXXX XXXX"
                  defaultValue={student.emergencyContactPhone ?? ""}
                />
              </div>
              <AdminInput
                label="Relationship"
                name="emergencyRelationship"
                placeholder="e.g. Mother, Father, Sibling"
                defaultValue={student.emergencyRelationship ?? ""}
              />
              <AdminTextarea
                label="Internal Notes"
                name="notes"
                placeholder="Visible to admin only…"
                defaultValue={student.notes ?? ""}
              />
            </Section>

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
                Save Changes
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
