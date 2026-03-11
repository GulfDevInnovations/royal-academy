"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  CreditCard,
  XCircle,
  AlertTriangle,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Ban,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  cancelEnrollment,
  deleteEnrollment,
  getEnrollments,
  getCapacitySummary,
} from "@/lib/actions/admin/Enrollments.actions";
import type {
  SerializedEnrollment,
  SerializedCapacityItem,
  SerializedFormOptions,
} from "../page";
import { ToastContainer } from "@/components/admin/Toast";
import { useToast } from "../../hooks/useToast";
import {
  AdminCard,
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  AdminTable,
  AdminThead,
  AdminTh,
  AdminTbody,
  AdminTr,
  AdminTd,
  AdminEmptyState,
  adminColors,
} from "@/components/admin/ui";
import EnrollmentFormModal from "./EnrollmentFormModal";
import PaymentModal from "./PaymentModal";
import DeleteConfirmModal from "../../../../../components/admin/DeleteConfirmModal";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    variant: "success" | "warning" | "error" | "info" | "default";
    icon: React.ReactNode;
  }
> = {
  CONFIRMED: {
    label: "Confirmed",
    variant: "success",
    icon: <CheckCircle2 size={11} />,
  },
  PENDING: { label: "Pending", variant: "warning", icon: <Clock size={11} /> },
  CANCELLED: { label: "Cancelled", variant: "error", icon: <Ban size={11} /> },
  COMPLETED: {
    label: "Completed",
    variant: "info",
    icon: <CheckCircle2 size={11} />,
  },
  NO_SHOW: {
    label: "No Show",
    variant: "default",
    icon: <XCircle size={11} />,
  },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  PAID: { label: "Paid", color: "#34d399" },
  PENDING: { label: "Unpaid", color: "#f59e0b" },
  FAILED: { label: "Failed", color: "#f87171" },
  REFUNDED: { label: "Refunded", color: "#60a5fa" },
};

// Capacity color thresholds
function capacityColor(enrolled: number, capacity: number) {
  const pct = capacity > 0 ? enrolled / capacity : 0;
  if (pct >= 1) return { bar: "#f87171", text: "#f87171" };
  if (pct >= 0.8) return { bar: "#f59e0b", text: "#f59e0b" };
  return { bar: "#34d399", text: "#34d399" };
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface Props {
  initialEnrollments: SerializedEnrollment[];
  initialCapacity: SerializedCapacityItem[];
  formOptions: SerializedFormOptions;
  defaultMonth: number;
  defaultYear: number;
}

type Modal =
  | { type: "add" }
  | { type: "payment"; data: SerializedEnrollment }
  | { type: "cancel"; data: SerializedEnrollment }
  | { type: "delete"; data: SerializedEnrollment };

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function EnrollmentsClient({
  initialEnrollments,
  initialCapacity,
  formOptions,
  defaultMonth,
  defaultYear,
}: Props) {
  const router = useRouter();
  const { toasts, toast, remove } = useToast();
  const [, startRefresh] = useTransition();

  // View state
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [modal, setModal] = useState<Modal | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Month/year navigation (shared between views)
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);

  // List view filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubClass, setFilterSubClass] = useState("");

  // Data — refreshed client-side after mutations
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [capacity, setCapacity] = useState(initialCapacity);

  // ── Data refresh ──
  const refreshData = useCallback(async () => {
    const [newEnrollments, newCapacity] = await Promise.all([
      getEnrollments({ month, year }),
      getCapacitySummary(month, year),
    ]);
    // Serialize client-side (Decimal comes back as string from action)
    setEnrollments(
      newEnrollments.map((e) => ({
        ...e,
        bookedAt: e.bookedAt.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        totalAmount: Number(e.totalAmount),
        subClass: {
          ...e.subClass,
          oncePriceMonthly:
            e.subClass.oncePriceMonthly != null
              ? Number(e.subClass.oncePriceMonthly)
              : null,
          twicePriceMonthly:
            e.subClass.twicePriceMonthly != null
              ? Number(e.subClass.twicePriceMonthly)
              : null,
        },
        payment: e.payment
          ? {
              ...e.payment,
              amount: Number(e.payment.amount),
              paidAt: e.payment.paidAt?.toISOString() ?? null,
            }
          : null,
      })) as any,
    );
    setCapacity(
      newCapacity.map((sc) => ({
        ...sc,
        oncePriceMonthly:
          sc.oncePriceMonthly != null ? Number(sc.oncePriceMonthly) : null,
        twicePriceMonthly:
          sc.twicePriceMonthly != null ? Number(sc.twicePriceMonthly) : null,
        monthlyEnrollments: sc.monthlyEnrollments.map((e) => ({
          ...e,
          bookedAt: e.bookedAt.toISOString(),
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
          totalAmount: Number(e.totalAmount),
          payment: e.payment
            ? {
                ...e.payment,
                amount: Number(e.payment.amount),
                paidAt: e.payment.paidAt?.toISOString() ?? null,
              }
            : null,
        })),
      })) as any,
    );
  }, [month, year]);

  const handleSuccess = useCallback(() => {
    setModal(null);
    refreshData();
  }, [refreshData]);

  // ── Month navigation ──
  const navigateMonth = (dir: -1 | 1) => {
    let m = month + dir;
    let y = year;
    if (m < 1) {
      m = 12;
      y--;
    }
    if (m > 12) {
      m = 1;
      y++;
    }
    setMonth(m);
    setYear(y);
  };

  // Refresh when month/year changes
  const [prevMonth, setPrevMonth] = useState(month);
  const [prevYear, setPrevYear] = useState(year);
  if (month !== prevMonth || year !== prevYear) {
    setPrevMonth(month);
    setPrevYear(year);
    refreshData();
  }

  // ── Actions ──
  const handleCancel = async (id: string) => {
    const result = await cancelEnrollment(id);
    if (result.error) toast(result.error, "error");
    else {
      toast("Enrollment cancelled.", "success");
      handleSuccess();
    }
    return result;
  };

  const handleDelete = async (id: string) => {
    const result = await deleteEnrollment(id);
    if (result.error) {
      toast(result.error, "error");
      setModal(null);
    } else {
      toast("Enrollment deleted.", "success");
      handleSuccess();
    }
    return result;
  };

  // ── Derived data ──
  const uniqueClasses = useMemo(
    () => [
      ...new Map(
        formOptions.subClasses.map((s) => [s.class.id, s.class]),
      ).values(),
    ],
    [formOptions],
  );

  const filteredSubClasses = useMemo(
    () =>
      filterClass
        ? formOptions.subClasses.filter((s) => s.class.id === filterClass)
        : formOptions.subClasses,
    [filterClass, formOptions],
  );

  const filteredEnrollments = useMemo(() => {
    let list = enrollments;
    if (filterStatus) list = list.filter((e) => e.status === filterStatus);
    if (filterClass)
      list = list.filter((e) => e.subClass.class.id === filterClass);
    if (filterSubClass)
      list = list.filter((e) => e.subClassId === filterSubClass);
    return list;
  }, [enrollments, filterStatus, filterClass, filterSubClass]);

  // Summary stats for header
  const stats = useMemo(
    () => ({
      total: enrollments.length,
      confirmed: enrollments.filter((e) => e.status === "CONFIRMED").length,
      pending: enrollments.filter((e) => e.status === "PENDING").length,
      unpaid: enrollments.filter(
        (e) => !e.payment || e.payment.status !== "PAID",
      ).length,
      revenue: enrollments
        .filter((e) => e.payment?.status === "PAID")
        .reduce((sum, e) => sum + (e.payment?.amount ?? 0), 0),
    }),
    [enrollments],
  );

  // ─────────────────────────────────────────────
  // MONTH VIEW — subclass cards with roster
  // ─────────────────────────────────────────────

  const MonthView = () => {
    // Only show subclasses that have at least one enrollment OR have capacity warnings
    const activeSubClasses = capacity.filter(
      (sc) => sc.monthlyEnrollments.length > 0 || sc.capacity <= 3,
    );
    const fullSubClasses = capacity.filter(
      (sc) =>
        sc.monthlyEnrollments.filter((e) => e.status !== "CANCELLED").length >=
        sc.capacity,
    );

    return (
      <div className="space-y-4">
        {/* Capacity warnings */}
        {fullSubClasses.length > 0 && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl border"
            style={{
              background: "rgba(248,113,113,0.06)",
              borderColor: "rgba(248,113,113,0.2)",
            }}
          >
            <AlertTriangle
              size={15}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "#f87171" }}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: "#f87171" }}>
                {fullSubClasses.length} sub-class
                {fullSubClasses.length > 1 ? "es are" : " is"} full
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: adminColors.textMuted }}
              >
                {fullSubClasses.map((sc) => sc.name).join(", ")}
              </p>
            </div>
          </div>
        )}

        {activeSubClasses.length === 0 && (
          <AdminCard>
            <AdminEmptyState
              title="No enrollments this month"
              description="No students have enrolled for this period yet."
              action={
                <AdminButton
                  variant="primary"
                  onClick={() => setModal({ type: "add" })}
                >
                  <Plus size={14} /> New Enrollment
                </AdminButton>
              }
            />
          </AdminCard>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeSubClasses.map((sc) => {
            const active = sc.monthlyEnrollments.filter(
              (e) => e.status !== "CANCELLED",
            );
            const confirmed = active.filter((e) => e.status === "CONFIRMED");
            const pending = active.filter((e) => e.status === "PENDING");
            const paid = active.filter((e) => e.payment?.status === "PAID");
            const colors = capacityColor(active.length, sc.capacity);
            const pct =
              sc.capacity > 0 ? Math.min(active.length / sc.capacity, 1) : 0;
            const revenue = paid.reduce(
              (sum, e) => sum + (e.payment?.amount ?? 0),
              0,
            );
            const schedDays = [
              ...new Set(sc.classSchedules.map((s) => s.dayOfWeek)),
            ];

            return (
              <div
                key={sc.id}
                className="rounded-2xl border overflow-hidden"
                style={{
                  borderColor: "rgba(255,255,255,0.07)",
                  background: "#1a1d27",
                }}
              >
                {/* Card header */}
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {sc.name}
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: adminColors.textMuted }}
                      >
                        {sc.class.name}
                        {schedDays.length > 0 && (
                          <span className="ml-2">
                            · {schedDays.map((d) => DAY_SHORT[d]).join(" + ")}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-sm font-bold"
                        style={{ color: colors.text }}
                      >
                        {active.length}/{sc.capacity}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: adminColors.textMuted }}
                      >
                        enrolled
                      </p>
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div
                    className="mt-3 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct * 100}%`, background: colors.bar }}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-2.5">
                    <span className="text-[11px]" style={{ color: "#34d399" }}>
                      ✓ {confirmed.length} confirmed
                    </span>
                    {pending.length > 0 && (
                      <span
                        className="text-[11px]"
                        style={{ color: "#f59e0b" }}
                      >
                        ⏳ {pending.length} pending
                      </span>
                    )}
                    <span
                      className="text-[11px] ml-auto"
                      style={{ color: adminColors.textMuted }}
                    >
                      {revenue.toFixed(3)} OMR collected
                    </span>
                  </div>
                </div>

                {/* Student roster */}
                <div
                  className="divide-y"
                  style={{ divideColor: "rgba(255,255,255,0.04)" }}
                >
                  {active.length === 0 ? (
                    <p
                      className="px-4 py-3 text-xs"
                      style={{ color: adminColors.textMuted }}
                    >
                      No active enrollments
                    </p>
                  ) : (
                    active.map((enrollment) => {
                      const payStatus = enrollment.payment?.status ?? "PENDING";
                      const payConf =
                        PAYMENT_CONFIG[payStatus] ?? PAYMENT_CONFIG.PENDING;
                      const statusConf =
                        STATUS_CONFIG[enrollment.status] ??
                        STATUS_CONFIG.PENDING;

                      return (
                        <div
                          key={enrollment.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.01] transition-colors"
                        >
                          {/* Avatar */}
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold"
                            style={{
                              background: "rgba(245,158,11,0.12)",
                              color: "#f59e0b",
                            }}
                          >
                            {enrollment.student.firstName[0]}
                            {enrollment.student.lastName[0]}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: adminColors.textPrimary }}
                            >
                              {enrollment.student.firstName}{" "}
                              {enrollment.student.lastName}
                            </p>
                            <p
                              className="text-[10px]"
                              style={{ color: adminColors.textMuted }}
                            >
                              {enrollment.frequency === "TWICE_PER_WEEK"
                                ? "2×/wk"
                                : "1×/wk"}
                              {enrollment.preferredDays.length > 0 && (
                                <span className="ml-1">
                                  ·{" "}
                                  {enrollment.preferredDays
                                    .map((d: string) => DAY_SHORT[d] ?? d)
                                    .join("+")}
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Payment badge */}
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              background: `${payConf.color}18`,
                              color: payConf.color,
                            }}
                          >
                            {payConf.label}
                          </span>

                          {/* Action menu */}
                          <div className="relative flex-shrink-0">
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === enrollment.id
                                    ? null
                                    : enrollment.id,
                                )
                              }
                              className="p-1 rounded-lg transition-colors text-white/20 hover:text-white/60 hover:bg-white/[0.05]"
                            >
                              <MoreHorizontal size={13} />
                            </button>
                            {openMenuId === enrollment.id && (
                              <div
                                className="absolute right-0 top-7 z-20 rounded-xl border shadow-xl overflow-hidden w-40"
                                style={{
                                  background: "#1a1d27",
                                  borderColor: "rgba(255,255,255,0.1)",
                                }}
                              >
                                {payStatus !== "PAID" && (
                                  <MenuBtn
                                    icon={<CreditCard size={12} />}
                                    label="Record Payment"
                                    color="#34d399"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setModal({
                                        type: "payment",
                                        data: enrollment as any,
                                      });
                                    }}
                                  />
                                )}
                                {enrollment.status !== "CANCELLED" && (
                                  <MenuBtn
                                    icon={<XCircle size={12} />}
                                    label="Cancel"
                                    color="#f87171"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setModal({
                                        type: "cancel",
                                        data: enrollment as any,
                                      });
                                    }}
                                  />
                                )}
                                {payStatus !== "PAID" && (
                                  <MenuBtn
                                    icon={<Trash2 size={12} />}
                                    label="Delete"
                                    color="#f87171"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setModal({
                                        type: "delete",
                                        data: enrollment as any,
                                      });
                                    }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // LIST VIEW — filterable table
  // ─────────────────────────────────────────────

  const ListView = () => (
    <AdminCard noPadding>
      {filteredEnrollments.length === 0 ? (
        <AdminEmptyState
          title="No enrollments found"
          description="Try adjusting your filters or create a new enrollment."
          action={
            <AdminButton
              variant="primary"
              onClick={() => setModal({ type: "add" })}
            >
              <Plus size={14} /> New Enrollment
            </AdminButton>
          }
        />
      ) : (
        <AdminTable>
          <AdminThead>
            <AdminTh>Student</AdminTh>
            <AdminTh>Sub-class</AdminTh>
            <AdminTh>Period</AdminTh>
            <AdminTh>Frequency</AdminTh>
            <AdminTh>Amount</AdminTh>
            <AdminTh>Payment</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </AdminThead>
          <AdminTbody>
            {filteredEnrollments.map((enrollment) => {
              const payStatus = enrollment.payment?.status ?? "PENDING";
              const payConf =
                PAYMENT_CONFIG[payStatus] ?? PAYMENT_CONFIG.PENDING;
              const statusConf =
                STATUS_CONFIG[enrollment.status] ?? STATUS_CONFIG.PENDING;

              return (
                <AdminTr key={enrollment.id}>
                  <AdminTd>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold"
                        style={{
                          background: "rgba(245,158,11,0.1)",
                          color: "#f59e0b",
                        }}
                      >
                        {enrollment.student.firstName[0]}
                        {enrollment.student.lastName[0]}
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: adminColors.textPrimary }}
                        >
                          {enrollment.student.firstName}{" "}
                          {enrollment.student.lastName}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: adminColors.textMuted }}
                        >
                          {enrollment.student.user.phone ??
                            enrollment.student.user.email ??
                            "—"}
                        </p>
                      </div>
                    </div>
                  </AdminTd>

                  <AdminTd>
                    <p
                      className="text-sm"
                      style={{ color: adminColors.textSecondary }}
                    >
                      {enrollment.subClass.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: adminColors.textMuted }}
                    >
                      {enrollment.subClass.class.name}
                    </p>
                  </AdminTd>

                  <AdminTd>
                    <p
                      className="text-sm"
                      style={{ color: adminColors.textSecondary }}
                    >
                      {MONTHS_SHORT[enrollment.month - 1]} {enrollment.year}
                    </p>
                  </AdminTd>

                  <AdminTd>
                    <div>
                      <p
                        className="text-xs"
                        style={{ color: adminColors.textSecondary }}
                      >
                        {enrollment.frequency === "TWICE_PER_WEEK"
                          ? "2× / week"
                          : "1× / week"}
                      </p>
                      {enrollment.preferredDays.length > 0 && (
                        <p
                          className="text-[10px]"
                          style={{ color: adminColors.textMuted }}
                        >
                          {enrollment.preferredDays
                            .map((d: string) => DAY_SHORT[d] ?? d)
                            .join(" + ")}
                        </p>
                      )}
                    </div>
                  </AdminTd>

                  <AdminTd>
                    <p
                      className="text-sm font-medium"
                      style={{ color: adminColors.textPrimary }}
                    >
                      {enrollment.totalAmount.toFixed(3)}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: adminColors.textMuted }}
                    >
                      OMR
                    </p>
                  </AdminTd>

                  <AdminTd>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: payConf.color }}
                      />
                      <span
                        className="text-xs"
                        style={{ color: payConf.color }}
                      >
                        {payConf.label}
                      </span>
                    </div>
                    {enrollment.payment?.paidAt && (
                      <p
                        className="text-[10px] mt-0.5"
                        style={{ color: adminColors.textMuted }}
                      >
                        {new Date(enrollment.payment.paidAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                          },
                        )}
                      </p>
                    )}
                  </AdminTd>

                  <AdminTd>
                    <AdminBadge variant={statusConf.variant}>
                      <span className="flex items-center gap-1">
                        {statusConf.icon} {statusConf.label}
                      </span>
                    </AdminBadge>
                  </AdminTd>

                  <AdminTd className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {payStatus !== "PAID" && (
                        <button
                          onClick={() =>
                            setModal({ type: "payment", data: enrollment })
                          }
                          className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-green-400 hover:bg-green-500/[0.08]"
                          title="Record payment"
                        >
                          <CreditCard size={13} />
                        </button>
                      )}
                      {enrollment.status !== "CANCELLED" && (
                        <button
                          onClick={() =>
                            setModal({ type: "cancel", data: enrollment })
                          }
                          className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-red-400 hover:bg-red-500/[0.08]"
                          title="Cancel enrollment"
                        >
                          <XCircle size={13} />
                        </button>
                      )}
                      {payStatus !== "PAID" && (
                        <button
                          onClick={() =>
                            setModal({ type: "delete", data: enrollment })
                          }
                          className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-red-400 hover:bg-red-500/[0.08]"
                          title="Delete enrollment"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </AdminTd>
                </AdminTr>
              );
            })}
          </AdminTbody>
        </AdminTable>
      )}
    </AdminCard>
  );

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div
      className="space-y-4 max-w-7xl mx-auto"
      onClick={() => setOpenMenuId(null)}
    >
      <AdminPageHeader
        title="Enrollments"
        subtitle={`${MONTHS[month - 1]} ${year}`}
        action={
          <AdminButton
            variant="primary"
            onClick={() => setModal({ type: "add" })}
          >
            <Plus size={14} /> New Enrollment
          </AdminButton>
        }
      />

      {/* ── Stats bar ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Total",
            value: stats.total,
            color: adminColors.textPrimary,
          },
          { label: "Confirmed", value: stats.confirmed, color: "#34d399" },
          { label: "Pending", value: stats.pending, color: "#f59e0b" },
          {
            label: "Revenue",
            value: `${stats.revenue.toFixed(3)} OMR`,
            color: "#60a5fa",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border px-4 py-3"
            style={{
              borderColor: "rgba(255,255,255,0.07)",
              background: "#1a1d27",
            }}
          >
            <p className="text-lg font-bold" style={{ color }}>
              {value}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View toggle */}
        <div
          className="flex items-center rounded-lg border overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {(["month", "list"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
              style={{
                background:
                  viewMode === mode
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(255,255,255,0.02)",
                color: viewMode === mode ? "#f59e0b" : adminColors.textMuted,
              }}
            >
              {mode === "month" ? <Users size={13} /> : <List size={13} />}
              {mode === "month" ? "By Sub-class" : "All Enrollments"}
            </button>
          ))}
        </div>

        {/* Month navigator */}
        <div
          className="flex items-center gap-1 rounded-lg border px-1"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 rounded-md transition-colors text-white/40 hover:text-white/80"
          >
            <ChevronLeft size={14} />
          </button>
          <span
            className="text-sm px-2 font-medium"
            style={{ color: adminColors.textSecondary }}
          >
            {MONTHS_SHORT[month - 1]} {year}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 rounded-md transition-colors text-white/40 hover:text-white/80"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* List-view filters */}
        {viewMode === "list" && (
          <>
            <select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setFilterSubClass("");
              }}
              className="px-3 py-2 rounded-lg text-sm border bg-white/[0.04] text-white/70 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <option className="text-black" value="">
                All classes
              </option>
              {uniqueClasses.map((c) => (
                <option className="text-black" key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={filterSubClass}
              onChange={(e) => setFilterSubClass(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border bg-white/[0.04] text-white/70 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <option className="text-black" value="">
                All sub-classes
              </option>
              {filteredSubClasses.map((s) => (
                <option className="text-black" key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm border bg-white/[0.04] text-white/70 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <option className="text-black" value="">
                All statuses
              </option>
              {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                <option className="text-black" key={v} value={v}>
                  {c.label}
                </option>
              ))}
            </select>
          </>
        )}

        <span
          className="text-xs ml-auto"
          style={{ color: adminColors.textMuted }}
        >
          {viewMode === "list"
            ? `${filteredEnrollments.length} enrollments`
            : `${stats.total} enrollments this month`}
        </span>
      </div>

      {/* ── Main view ── */}
      {viewMode === "month" ? <MonthView /> : <ListView />}

      {/* ── Modals ── */}
      {modal?.type === "add" && (
        <EnrollmentFormModal
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
          formOptions={formOptions}
          defaultMonth={month}
          defaultYear={year}
        />
      )}
      {modal?.type === "payment" && (
        <PaymentModal
          enrollment={modal.data}
          onClose={() => setModal(null)}
          onSuccess={() => {
            toast("Payment recorded. Enrollment confirmed.", "success");
            handleSuccess();
          }}
        />
      )}
      {modal?.type === "cancel" && (
        <DeleteConfirmModal
          title="Cancel enrollment?"
          description={`Cancel ${modal.data.student.firstName} ${modal.data.student.lastName}'s enrollment in ${modal.data.subClass.name} for ${MONTHS[modal.data.month - 1]} ${modal.data.year}? This will not delete the payment record.`}
          confirmLabel="Yes, Cancel"
          onConfirm={() => handleCancel(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirmModal
          title="Delete enrollment?"
          description={`Permanently delete ${modal.data.student.firstName} ${modal.data.student.lastName}'s enrollment in ${modal.data.subClass.name}? This cannot be undone.`}
          onConfirm={() => handleDelete(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}

// ── Small menu button ──
function MenuBtn({
  icon,
  label,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs transition-colors hover:bg-white/[0.04]"
      style={{ color }}
    >
      {icon} {label}
    </button>
  );
}
