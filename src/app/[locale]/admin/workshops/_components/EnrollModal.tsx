"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Loader2, Search, ChevronDown, CheckCircle2 } from "lucide-react";
import {
  enrollStudentInWorkshop,
  getStudentsForSelect,
  getWorkshopsForSelect,
} from "@/lib/actions/admin/Workshops.actions";
import { adminColors, AdminButton } from "@/components/admin/ui";
import { useTranslations } from "next-intl";
import DatePicker from "@/components/date-time/DatePicker";
import TimePicker from "@/components/date-time/TimePicker";

// ── Types ─────────────────────────────────────────────────────
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  user: { email: string };
}

interface WorkshopOption {
  id: string;
  title: string;
  eventDate: string;
  price: number;
  currency: string;
  capacity: number;
  enrolledCount: number;
  reservedCount: number;
}

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

// ── Constants ─────────────────────────────────────────────────
const METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
] as const;

type MethodValue = (typeof METHODS)[number]["value"];

// ── Helpers ────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2 rounded-lg border bg-white/[0.03] text-xl focus:outline-none focus:border-amber-500/40 transition-colors placeholder:text-white/20";
const inputStyle = {
  borderColor: "rgba(255,255,255,0.08)",
  color: adminColors.textPrimary,
};

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-l font-medium"
        style={{ color: adminColors.textSecondary }}
      >
        {label}
        {required && <span style={{ color: adminColors.accent }}> *</span>}
      </label>
      {children}
    </div>
  );
}

// ── Searchable dropdown ────────────────────────────────────────
function SearchDropdown<T extends { id: string }>({
  items,
  selected,
  onSelect,
  onClear,
  placeholder,
  renderItem,
  renderSelected,
  filterFn,
  emptyText = "No results",
}: {
  items: T[];
  selected: T | null;
  onSelect: (item: T) => void;
  onClear: () => void;
  placeholder: string;
  renderItem: (item: T) => React.ReactNode;
  renderSelected: (item: T) => React.ReactNode;
  filterFn: (item: T, query: string) => boolean;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const t = useTranslations("admin");

  const filtered = query
    ? items.filter((i) => filterFn(i, query.toLowerCase()))
    : items;

  if (selected) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
        style={{
          borderColor: "rgba(245,158,11,0.25)",
          background: "rgba(245,158,11,0.06)",
        }}
      >
        <div className="flex-1 min-w-0">{renderSelected(selected)}</div>
        <button
          type="button"
          onClick={() => {
            onClear();
            setQuery("");
          }}
          className="flex-shrink-0 hover:bg-white/5 transition-colors"
        >
          <X size={16} style={{ color: adminColors.pinkText }} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "rgba(255,255,255,0.25)" }}
      />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={inputCls + " pl-8"}
        style={inputStyle}
      />
      {open && (
        <div
          className="absolute z-20 mt-1 w-full rounded-xl border overflow-hidden max-h-48 overflow-y-auto shadow-xl"
          style={{
            background: "#13161f",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {filtered.length === 0 ? (
            <p
              className="px-3 py-3 text-l"
              style={{ color: adminColors.textMuted }}
            >
              {emptyText}
            </p>
          ) : (
            filtered.slice(0, 10).map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={() => {
                  onSelect(item);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-white/[0.05] transition-colors border-b last:border-b-0"
                style={{ borderColor: "rgba(255,255,255,0.04)" }}
              >
                {renderItem(item)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function EnrollModal({ onClose, onSuccess }: Props) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [students, setStudents] = useState<Student[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedWorkshop, setSelectedWorkshop] =
    useState<WorkshopOption | null>(null);

  const [method, setMethod] = useState<MethodValue>("CASH");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("OMR");

  // Default date = today, default time = now
  const nowDate = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);
  const [paidDate, setPaidDate] = useState(nowDate);
  const [paidTime, setPaidTime] = useState(nowTime);

  // Load students + workshops once
  useEffect(() => {
    Promise.all([getStudentsForSelect(), getWorkshopsForSelect()]).then(
      ([s, w]) => {
        setStudents(s as Student[]);
        setWorkshops(
          (w as any[]).map((x) => ({
            ...x,
            price: Number(x.price),
            eventDate:
              x.eventDate instanceof Date
                ? x.eventDate.toISOString()
                : String(x.eventDate),
          })),
        );
        setLoadingData(false);
      },
    );
  }, []);

  // When workshop changes, pre-fill amount + currency
  useEffect(() => {
    if (selectedWorkshop) {
      setAmount(selectedWorkshop.price.toFixed(2));
      setCurrency(selectedWorkshop.currency);
    }
  }, [selectedWorkshop]);

  const seatsLeft = selectedWorkshop
    ? selectedWorkshop.capacity -
      selectedWorkshop.enrolledCount -
      selectedWorkshop.reservedCount
    : null;

  const handleSubmit = () => {
    setError("");
    if (!selectedStudent) return setError("Please select a student.");
    if (!selectedWorkshop) return setError("Please select a workshop.");
    if (!amount || Number(amount) < 0) return setError("Enter a valid amount.");
    if (seatsLeft !== null && seatsLeft <= 0)
      return setError("This workshop is at full capacity.");

    const paidAt = new Date(`${paidDate}T${paidTime}`);

    startTransition(async () => {
      const result = await enrollStudentInWorkshop({
        workshopId: selectedWorkshop.id,
        studentId: selectedStudent.id,
        amount: Number(amount),
        currency,
        method,
        paidAt,
        status: "CONFIRMED",
      });

      if (result.success) onSuccess();
      else setError(result.error ?? "Enrollment failed.");
    });
  };

  const canSubmit =
    !!selectedStudent && !!selectedWorkshop && !!amount && !isPending;

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
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div>
            <h2
              className="text-xl font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              {t("enrollStudentWorkshop")}
            </h2>
            <p
              className="text-l mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              {t("manualEnroll")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} style={{ color: adminColors.pinkText }} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {loadingData ? (
            <div
              className="flex items-center justify-center py-12 gap-2"
              style={{ color: adminColors.textMuted }}
            >
              <Loader2 size={16} className="animate-spin" />
              <span className="text-l">Loading data…</span>
            </div>
          ) : (
            <>
              {/* ── Student ── */}
              <Field label="Student" required>
                <SearchDropdown
                  items={students}
                  selected={selectedStudent}
                  onSelect={setSelectedStudent}
                  onClear={() => setSelectedStudent(null)}
                  placeholder="Search by name or email…"
                  filterFn={(s, q) =>
                    s.firstName.toLowerCase().includes(q) ||
                    s.lastName.toLowerCase().includes(q) ||
                    s.user.email.toLowerCase().includes(q)
                  }
                  renderItem={(s) => (
                    <div>
                      <p
                        className="text-l font-medium"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {s.firstName} {s.lastName}
                      </p>
                      <p
                        className="text-[16px]"
                        style={{ color: adminColors.textMuted }}
                      >
                        {s.user.email}
                      </p>
                    </div>
                  )}
                  renderSelected={(s) => (
                    <div>
                      <p
                        className="text-l font-medium"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {s.firstName} {s.lastName}
                      </p>
                      <p
                        className="text-[16px]"
                        style={{ color: adminColors.textMuted }}
                      >
                        {s.user.email}
                      </p>
                    </div>
                  )}
                  emptyText="No students found"
                />
              </Field>

              {/* ── Workshop ── */}
              <Field label="Workshop" required>
                <SearchDropdown
                  items={workshops}
                  selected={selectedWorkshop}
                  onSelect={setSelectedWorkshop}
                  onClear={() => setSelectedWorkshop(null)}
                  placeholder="Search workshop by title…"
                  filterFn={(w, q) => w.title.toLowerCase().includes(q)}
                  renderItem={(w) => {
                    const seats =
                      w.capacity - w.enrolledCount - w.reservedCount;
                    return (
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p
                            className="text-l font-medium"
                            style={{ color: adminColors.textPrimary }}
                          >
                            {w.title}
                          </p>
                          <p
                            className="text-[16px]"
                            style={{ color: adminColors.textMuted }}
                          >
                            {new Date(w.eventDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <span
                          className="text-[16px] flex-shrink-0"
                          style={{
                            color:
                              seats <= 0 ? "#f87171" : adminColors.textMuted,
                          }}
                        >
                          {seats <= 0 ? "Full" : `${seats} left`}
                        </span>
                      </div>
                    );
                  }}
                  renderSelected={(w) => {
                    const seats =
                      w.capacity - w.enrolledCount - w.reservedCount;
                    return (
                      <div>
                        <p
                          className="text-l font-medium"
                          style={{ color: adminColors.textPrimary }}
                        >
                          {w.title}
                        </p>
                        <p
                          className="text-[16px]"
                          style={{ color: adminColors.textMuted }}
                        >
                          {new Date(w.eventDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                          {" · "}
                          <span
                            style={{
                              color:
                                seats <= 0 ? "#f87171" : adminColors.textMuted,
                            }}
                          >
                            {seats <= 0
                              ? "Full"
                              : `${seats} seat${seats !== 1 ? "s" : ""} left`}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                  emptyText="No active workshops found"
                />
              </Field>

              {/* ── Payment method ── */}
              <Field label={t("paymentMethod")} required>
                <div className="grid grid-cols-2 gap-2">
                  {METHODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className="px-3 py-2.5 rounded-lg border text-l font-medium transition-all text-left"
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

              {/* ── Amount + Currency ── */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Amount" required>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.000"
                      className={inputCls}
                      style={inputStyle}
                    />
                  </Field>
                </div>
                <Field label="Currency">
                  <input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    maxLength={3}
                    className={inputCls}
                    style={inputStyle}
                  />
                </Field>
              </div>

              {/* ── Payment date + time ── */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Payment Date">
                  <DatePicker
                    id="paidDate"
                    name="paidDate"
                    defaultValue={paidDate}
                    theme="dark"
                    fieldClassName={inputCls}
                    inputStyle={inputStyle}
                    onChange={setPaidDate}
                  />
                </Field>
                <Field label="Payment Time">
                  <TimePicker
                    id="paidTime"
                    name="paidTime"
                    defaultValue={paidTime}
                    theme="dark"
                    fieldClassName={inputCls}
                    inputStyle={inputStyle}
                    onChange={setPaidTime}
                  />
                </Field>
              </div>

              {/* ── Summary card ── */}
              {selectedStudent && selectedWorkshop && (
                <div
                  className="rounded-xl p-4 space-y-2"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <p
                    className="text-[15px] font-semibold uppercase tracking-widest"
                    style={{ color: adminColors.textMuted }}
                  >
                    Summary
                  </p>
                  {[
                    {
                      label: "Student",
                      value: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
                    },
                    { label: "Workshop", value: selectedWorkshop.title },
                    {
                      label: "Payment",
                      value: `${currency} ${Number(amount || 0).toFixed(3)} · ${METHODS.find((m) => m.value === method)?.label}`,
                    },
                    { label: "Date", value: `${paidDate} at ${paidTime}` },
                    { label: "Status", value: "Confirmed", highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between text-l"
                    >
                      <span style={{ color: adminColors.textSecondary }}>
                        {label}
                      </span>
                      <span
                        style={{
                          color: highlight
                            ? "#34d399"
                            : adminColors.textPrimary,
                        }}
                      >
                        {highlight && (
                          <CheckCircle2 size={16} className="inline mr-1" />
                        )}
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-l px-3 py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  {error}
                </p>
              )}
            </>
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
            onClick={handleSubmit}
            disabled={!canSubmit || loadingData}
          >
            {isPending && <Loader2 size={16} className="animate-spin" />}
            Confirm Enrollment
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
