"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Loader2, Search } from "lucide-react";
import {
  enrollStudentInWorkshop,
  getStudentsForSelect,
} from "@/lib/actions/admin/Workshops.actions";
import { adminColors, AdminButton } from "@/components/admin/ui";
import { BookingStatus, PaymentMethod } from "@prisma/client";
import type { SerializedWorkshop } from "../page";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  user: { email: string };
}

interface Props {
  workshop: SerializedWorkshop;
  onClose: () => void;
  onSuccess: () => void;
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CREDIT_CARD", label: "CREDIT_CARD" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "DEBIT_CARD", label: "DEBIT_CARD" },
];

const inputCls =
  "w-full px-3 py-2 rounded-lg border bg-white/[0.03] text-sm focus:outline-none focus:border-amber-500/40 transition-colors";
const inputStyle = {
  borderColor: "rgba(255,255,255,0.08)",
  color: adminColors.textPrimary,
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs font-medium"
        style={{ color: adminColors.textSecondary }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function EnrollStudentModal({
  workshop,
  onClose,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState<string>(String(workshop.price));
  const [currency, setCurrency] = useState(workshop.currency);

  // Load students once
  useEffect(() => {
    getStudentsForSelect().then((s) => setStudents(s as Student[]));
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(q) ||
      s.lastName.toLowerCase().includes(q) ||
      s.user.email.toLowerCase().includes(q)
    );
  });

  const availableSeats = workshop.capacity - workshop.enrolledCount;

  const handleEnroll = () => {
    setError("");
    if (!selectedStudent) return setError("Please select a student.");
    if (!amount || Number(amount) < 0) return setError("Enter a valid amount.");

    startTransition(async () => {
      const result = await enrollStudentInWorkshop({
        workshopId: workshop.id,
        studentId: selectedStudent.id,
        amount: Number(amount),
        currency,
        method,
        status: BookingStatus.CONFIRMED,
      });

      if (result.success) onSuccess();
      else setError(result.error ?? "Enrollment failed.");
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] shadow-2xl z-10 max-h-[92vh] flex flex-col"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              Enroll Student
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              {workshop.title} — {availableSeats} seat
              {availableSeats !== 1 ? "s" : ""} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Student search */}
          <Field label="Select Student">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedStudent(null);
                }}
                placeholder="Search by name or email…"
                className={inputCls + " pl-8"}
                style={inputStyle}
              />
            </div>

            {/* Dropdown list */}
            {search && !selectedStudent && (
              <div
                className="mt-1 rounded-xl border overflow-hidden max-h-44 overflow-y-auto"
                style={{
                  background: "#13161f",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                {filtered.length === 0 ? (
                  <p
                    className="px-3 py-2.5 text-xs"
                    style={{ color: adminColors.textMuted }}
                  >
                    No students found
                  </p>
                ) : (
                  filtered.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudent(s);
                        setSearch(`${s.firstName} ${s.lastName}`);
                      }}
                      className="w-full flex flex-col px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors border-b last:border-b-0"
                      style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    >
                      <span
                        className="text-xs font-medium"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {s.firstName} {s.lastName}
                      </span>
                      <span
                        className="text-[11px]"
                        style={{ color: adminColors.textMuted }}
                      >
                        {s.user.email}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Confirmed selection chip */}
            {selectedStudent && (
              <div
                className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                <div className="flex-1">
                  <p
                    className="text-xs font-medium"
                    style={{ color: adminColors.textPrimary }}
                  >
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: adminColors.textMuted }}
                  >
                    {selectedStudent.user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSearch("");
                  }}
                  className="text-white/30 hover:text-white/60"
                >
                  <X size={13} />
                </button>
              </div>
            )}
          </Field>

          {/* Payment method */}
          <Field label="Payment Method">
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className="px-3 py-2 rounded-lg border text-xs font-medium transition-all"
                  style={{
                    borderColor:
                      method === m.value
                        ? adminColors.accent
                        : "rgba(255,255,255,0.08)",
                    background:
                      method === m.value
                        ? "rgba(245,158,11,0.1)"
                        : "rgba(255,255,255,0.02)",
                    color:
                      method === m.value
                        ? adminColors.accent
                        : adminColors.textSecondary,
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Amount + Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Amount">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputCls}
                  style={inputStyle}
                />
              </Field>
            </div>
            <Field label="Currency">
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputCls}
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Summary */}
          {selectedStudent && (
            <div
              className="rounded-xl p-3 space-y-1.5"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-[11px] font-medium uppercase tracking-wide"
                style={{ color: adminColors.textMuted }}
              >
                Summary
              </p>
              <div className="flex justify-between text-xs">
                <span style={{ color: adminColors.textSecondary }}>
                  Student
                </span>
                <span style={{ color: adminColors.textPrimary }}>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: adminColors.textSecondary }}>
                  Workshop
                </span>
                <span style={{ color: adminColors.textPrimary }}>
                  {workshop.title}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: adminColors.textSecondary }}>
                  Payment
                </span>
                <span style={{ color: adminColors.accent }}>
                  {currency} {Number(amount).toFixed(2)} —{" "}
                  {method.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: adminColors.textSecondary }}>Status</span>
                <span className="text-emerald-400">Confirmed immediately</span>
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-2 px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <AdminButton variant="ghost" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={handleEnroll}
            disabled={isPending || !selectedStudent}
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            Confirm Enrollment
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
