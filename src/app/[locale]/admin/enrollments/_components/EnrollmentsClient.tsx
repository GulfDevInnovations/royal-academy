"use client";

import {
  useState,
  useEffect,
  useMemo,
  useTransition,
  useCallback,
} from "react";
import {
  Plus,
  Users,
  CreditCard,
  XCircle,
  AlertTriangle,
  List,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Ban,
  MoreHorizontal,
  Trash2,
  Layers,
} from "lucide-react";
import {
  cancelEnrollment,
  cancelMultiMonthEnrollment,
  deleteEnrollment,
  deleteMultiMonthEnrollment,
  getEnrollments,
  getCapacitySummary,
  getMultiMonthEnrollments,
} from "@/lib/actions/admin/Enrollments.actions";
import type {
  SerializedEnrollment,
  SerializedMultiMonthEnrollment,
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
import { useTranslations } from "next-intl";

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
    variant: "success" | "warning" | "default" | "info";
    icon: React.ReactNode;
  }
> = {
  CONFIRMED: {
    label: "Confirmed",
    variant: "success",
    icon: <CheckCircle2 size={11} />,
  },
  CANCELLED: {
    label: "Cancelled",
    variant: "default",
    icon: <Ban size={11} />,
  },
  COMPLETED: {
    label: "Completed",
    variant: "info",
    icon: <CheckCircle2 size={11} />,
  },
};

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  PAID: { label: "Paid", color: "#34d399" },
  FAILED: { label: "Failed", color: "#f87171" },
  REFUNDED: { label: "Refunded", color: "#60a5fa" },
};

function capacityColor(enrolled: number, capacity: number) {
  const pct = capacity > 0 ? enrolled / capacity : 0;
  if (pct >= 1) return { bar: "#f87171", text: "#f87171" };
  if (pct >= 0.8) return { bar: "#f59e0b", text: "#f59e0b" };
  return { bar: "#34d399", text: "#34d399" };
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Props {
  initialEnrollments: SerializedEnrollment[];
  initialMultiMonthEnrollments: SerializedMultiMonthEnrollment[];
  initialCapacity: SerializedCapacityItem[];
  formOptions: SerializedFormOptions;
  defaultMonth: number;
  defaultYear: number;
}

type Modal =
  | { type: "add" }
  | { type: "payment-single"; data: SerializedEnrollment }
  | { type: "payment-multi"; data: SerializedMultiMonthEnrollment }
  | { type: "cancel-single"; data: SerializedEnrollment }
  | { type: "cancel-multi"; data: SerializedMultiMonthEnrollment }
  | { type: "delete-single"; data: SerializedEnrollment }
  | { type: "delete-multi"; data: SerializedMultiMonthEnrollment };

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function EnrollmentsClient({
  initialEnrollments,
  initialMultiMonthEnrollments,
  initialCapacity,
  formOptions,
  defaultMonth,
  defaultYear,
}: Props) {
  const { toasts, toast, remove } = useToast();
  const [, startRefresh] = useTransition();
  const t = useTranslations("admin");

  // View
  const [viewMode, setViewMode] = useState<"month" | "list" | "multi">("month");
  const [modal, setModal] = useState<Modal | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Month navigation
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);

  // List-view filters
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSubClass, setFilterSubClass] = useState("");

  // Data
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [multiMonthEnrollments, setMultiMonthEnrollments] = useState(
    initialMultiMonthEnrollments,
  );
  const [capacity, setCapacity] = useState(initialCapacity);

  // ── Refresh ──
  // Actions return plain() serialized data — cast to serialized types.
  const refreshData = useCallback(async () => {
    const [newE, newME, newCap] = await Promise.all([
      getEnrollments({ month, year }),
      getMultiMonthEnrollments(),
      getCapacitySummary(month, year),
    ]);
    setEnrollments(newE as unknown as SerializedEnrollment[]);
    setMultiMonthEnrollments(
      newME as unknown as SerializedMultiMonthEnrollment[],
    );
    setCapacity(newCap as unknown as SerializedCapacityItem[]);
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

  // Refresh data whenever month/year navigation changes — must be in
  // useEffect to avoid calling setState during render.
  useEffect(() => {
    refreshData();
  }, [month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ──
  const handleCancelSingle = async (id: string) => {
    const result = await cancelEnrollment(id);
    if (result.error) toast(result.error, "error");
    else {
      toast("Enrollment cancelled.", "success");
      handleSuccess();
    }
    return result;
  };

  const handleCancelMulti = async (id: string) => {
    const result = await cancelMultiMonthEnrollment(id);
    if (result.error) toast(result.error, "error");
    else {
      toast(
        `Multi-month enrollment cancelled. ${(result as any).cancelledMonths ?? 0} future months cancelled.`,
        "success",
      );
      handleSuccess();
    }
    return result;
  };

  const handleDeleteSingle = async (id: string) => {
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

  const handleDeleteMulti = async (id: string) => {
    const result = await deleteMultiMonthEnrollment(id);
    if (result.error) {
      toast(result.error, "error");
      setModal(null);
    } else {
      toast("Multi-month enrollment deleted.", "success");
      handleSuccess();
    }
    return result;
  };

  // ── Derived ──
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

  const stats = useMemo(
    () => ({
      total: enrollments.length,
      confirmed: enrollments.filter((e) => e.status === "CONFIRMED").length,
      revenue: enrollments
        .filter((e) => e.payment?.status === "PAID")
        .reduce((sum, e) => sum + (e.payment?.amount ?? 0), 0),
      multiPlans: multiMonthEnrollments.filter((m) => m.status !== "CANCELLED")
        .length,
    }),
    [enrollments, multiMonthEnrollments],
  );

  // ─────────────────────────────────────────────
  // MONTH VIEW — sub-class roster cards
  // ─────────────────────────────────────────────

  const MonthView = () => {
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
        {fullSubClasses.length > 0 && (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl border"
            style={{
              background: "rgba(248,113,113,0.06)",
              borderColor: "rgba(248,113,113,0.2)",
            }}
          >
            <AlertTriangle
              size={19}
              className="shrink-0 mt-0.5"
              style={{ color: "#f87171" }}
            />
            <div>
              <p className="text-xl font-medium" style={{ color: "#f87171" }}>
                {fullSubClasses.length} sub-class
                {fullSubClasses.length > 1 ? "es are" : " is"} full
              </p>
              <p
                className="text-l mt-0.5"
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
              title={t("newEnrollment")}
              description="No students have enrolled for this period yet."
              action={
                <AdminButton
                  variant="primary"
                  onClick={() => setModal({ type: "add" })}
                >
                  <Plus size={18} /> {t("newEnrollment")}
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
                <div
                  className="px-4 py-3 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p
                        className="text-xl font-semibold"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {sc.name}
                      </p>
                      <p
                        className="text-l mt-0.5"
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
                    <div className="text-center shrink-0">
                      <p
                        className="text-xl font-bold"
                        style={{ color: colors.text }}
                      >
                        {active.length}/{sc.capacity}
                      </p>
                      <p
                        className="text-[15px]"
                        style={{ color: adminColors.textMuted }}
                      >
                        enrolled
                      </p>
                    </div>
                  </div>

                  <div
                    className="mt-3 h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct * 100}%`, background: colors.bar }}
                    />
                  </div>

                  <div className="flex items-center gap-4 mt-2.5">
                    <span className="text-[16px]" style={{ color: "#34d399" }}>
                      ✓ {confirmed.length} confirmed
                    </span>

                    <span
                      className="text-[16px] ml-auto"
                      style={{ color: adminColors.textMuted }}
                    >
                      {revenue.toFixed(3)} OMR collected
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-white/4">
                  {active.length === 0 ? (
                    <p
                      className="px-4 py-3 text-l"
                      style={{ color: adminColors.textMuted }}
                    >
                      No active enrollments
                    </p>
                  ) : (
                    active.map((enrollment) => {
                      const payStatus = enrollment.payment?.status ?? "FAILED";
                      const payConf =
                        PAYMENT_CONFIG[payStatus] ?? PAYMENT_CONFIG.FAILED;
                      // Find matching full enrollment to get multiMonthEnrollment link
                      const full = enrollments.find(
                        (e) => e.id === enrollment.id,
                      );
                      const isMultiChild = !!full?.multiMonthEnrollment;

                      return (
                        <div
                          key={enrollment.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/1 transition-colors"
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[16px] font-semibold"
                            style={{
                              background: "rgba(245,158,11,0.12)",
                              color: "#f59e0b",
                            }}
                          >
                            {enrollment.student.firstName[0]}
                            {enrollment.student.lastName[0]}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p
                                className="text-l font-medium truncate"
                                style={{ color: adminColors.textPrimary }}
                              >
                                {enrollment.student.firstName}{" "}
                                {enrollment.student.lastName}
                              </p>
                              {isMultiChild && (
                                <span
                                  className="text-[14px] px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5"
                                  style={{
                                    background: "rgba(96,165,250,0.1)",
                                    color: "#60a5fa",
                                  }}
                                >
                                  <Layers size={12} /> Multi
                                </span>
                              )}
                            </div>
                            <p
                              className="text-[15px]"
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

                          <span
                            className="text-[15px] font-medium px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              background: `${payConf.color}18`,
                              color: payConf.color,
                            }}
                          >
                            {payConf.label}
                          </span>

                          <div className="relative shrink-0">
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === enrollment.id
                                    ? null
                                    : enrollment.id,
                                )
                              }
                              className="p-1 rounded-lg transition-colors text-white/20 hover:text-white/60 hover:bg-white/5"
                            >
                              <MoreHorizontal size={17} />
                            </button>
                            {openMenuId === enrollment.id && (
                              <div
                                className="absolute right-0 top-7 z-20 rounded-xl border shadow-xl overflow-hidden w-44"
                                style={{
                                  background: "#1a1d27",
                                  borderColor: "rgba(255,255,255,0.1)",
                                }}
                              >
                                {/* If multi-child: show payment action on the parent */}
                                {isMultiChild && full?.multiMonthEnrollment ? (
                                  <>
                                    {full.multiMonthEnrollment.payment
                                      ?.status !== "PAID" && (
                                      <MenuBtn
                                        icon={<CreditCard size={16} />}
                                        label="Pay Multi-plan"
                                        color="#34d399"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          // We need the full multi-month enrollment — find it
                                          const mme =
                                            multiMonthEnrollments.find(
                                              (m) =>
                                                m.id ===
                                                full.multiMonthEnrollment!.id,
                                            );
                                          if (mme)
                                            setModal({
                                              type: "payment-multi",
                                              data: mme,
                                            });
                                        }}
                                      />
                                    )}
                                    <MenuBtn
                                      icon={<XCircle size={16} />}
                                      label="Cancel Multi-plan"
                                      color="#f87171"
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        const mme = multiMonthEnrollments.find(
                                          (m) =>
                                            m.id ===
                                            full.multiMonthEnrollment!.id,
                                        );
                                        if (mme)
                                          setModal({
                                            type: "cancel-multi",
                                            data: mme,
                                          });
                                      }}
                                    />
                                  </>
                                ) : (
                                  <>
                                    {payStatus !== "PAID" && (
                                      <MenuBtn
                                        icon={<CreditCard size={16} />}
                                        label="Record Payment"
                                        color="#34d399"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setModal({
                                            type: "payment-single",
                                            data: enrollment as any,
                                          });
                                        }}
                                      />
                                    )}
                                    {enrollment.status !== "CANCELLED" && (
                                      <MenuBtn
                                        icon={<XCircle size={16} />}
                                        label="Cancel"
                                        color="#f87171"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setModal({
                                            type: "cancel-single",
                                            data: enrollment as any,
                                          });
                                        }}
                                      />
                                    )}
                                    {payStatus !== "PAID" && (
                                      <MenuBtn
                                        icon={<Trash2 size={16} />}
                                        label="Delete"
                                        color="#f87171"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setModal({
                                            type: "delete-single",
                                            data: enrollment as any,
                                          });
                                        }}
                                      />
                                    )}
                                  </>
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
  // LIST VIEW — single-month enrollments table
  // ─────────────────────────────────────────────

  const ListView = () => (
    <AdminCard noPadding>
      {filteredEnrollments.length === 0 ? (
        <AdminEmptyState
          title={t("newEnrollment")}
          description="Try adjusting your filters or create a new enrollment."
          action={
            <AdminButton
              variant="primary"
              onClick={() => setModal({ type: "add" })}
            >
              <Plus size={18} /> {t("newEnrollment")}
            </AdminButton>
          }
        />
      ) : (
        <AdminTable>
          <AdminThead>
            <AdminTh>{t("student")}</AdminTh>
            <AdminTh>{t("subClass")}</AdminTh>
            <AdminTh>{t("period")}</AdminTh>
            <AdminTh>{t("frequency")}</AdminTh>
            <AdminTh>{t("teacher")}</AdminTh>
            <AdminTh>{t("schedule")}</AdminTh>
            <AdminTh>{t("amount")}</AdminTh>
            <AdminTh>{t("payment")}</AdminTh>
            <AdminTh>{t("status")}</AdminTh>
            <AdminTh className="text-center">{t("actions")}</AdminTh>
          </AdminThead>
          <AdminTbody>
            {filteredEnrollments.map((enrollment) => {
              const payStatus = enrollment.payment?.status ?? "FAILED";
              const payConf =
                PAYMENT_CONFIG[payStatus] ?? PAYMENT_CONFIG.FAILED;
              const statusConf =
                STATUS_CONFIG[enrollment.status] ?? STATUS_CONFIG.FAILED;
              const isMultiChild = !!enrollment.multiMonthEnrollment;

              return (
                <AdminTr key={enrollment.id}>
                  <AdminTd>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[15px] font-semibold"
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
                          className="text-xl font-medium"
                          style={{ color: adminColors.textPrimary }}
                        >
                          {enrollment.student.firstName}{" "}
                          {enrollment.student.lastName}
                        </p>
                        <p
                          className="text-l"
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
                      className="text-xl"
                      style={{ color: adminColors.textSecondary }}
                    >
                      {enrollment.subClass.name}
                    </p>
                    <p
                      className="text-l"
                      style={{ color: adminColors.textMuted }}
                    >
                      {enrollment.subClass.class.name}
                    </p>
                  </AdminTd>

                  <AdminTd>
                    <div className="flex items-center gap-1.5">
                      <p
                        className="text-xl"
                        style={{ color: adminColors.textSecondary }}
                      >
                        {MONTHS_SHORT[enrollment.month - 1]} {enrollment.year}
                      </p>
                      {isMultiChild && (
                        <span
                          className="text-[14px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                          style={{
                            background: "rgba(96,165,250,0.1)",
                            color: "#60a5fa",
                          }}
                        >
                          <Layers size={12} />
                          {
                            MONTHS_SHORT[
                              enrollment.multiMonthEnrollment!.startMonth - 1
                            ]
                          }{" "}
                          {enrollment.multiMonthEnrollment!.startYear}
                          {" → "}
                          {
                            MONTHS_SHORT[
                              enrollment.multiMonthEnrollment!.endMonth - 1
                            ]
                          }{" "}
                          {enrollment.multiMonthEnrollment!.endYear}
                        </span>
                      )}
                    </div>
                  </AdminTd>

                  <AdminTd>
                    <p
                      className="text-l"
                      style={{ color: adminColors.textSecondary }}
                    >
                      {enrollment.frequency === "TWICE_PER_WEEK"
                        ? "2× / week"
                        : "1× / week"}
                    </p>
                    {enrollment.preferredDays.length > 0 && (
                      <p
                        className="text-[15px]"
                        style={{ color: adminColors.textMuted }}
                      >
                        {enrollment.preferredDays
                          .map((d: string) => DAY_SHORT[d] ?? d)
                          .join(" + ")}
                      </p>
                    )}
                  </AdminTd>

                  {/* Teacher column */}
                  <AdminTd>
                    {(enrollment.resolvedSlots ?? []).length === 0 ? (
                      <span
                        className="text-l"
                        style={{ color: adminColors.textMuted }}
                      >
                        —
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {enrollment.resolvedSlots.map((slot, i) => (
                          <p
                            key={i}
                            className="text-l font-medium"
                            style={{ color: adminColors.textSecondary }}
                          >
                            {slot.teacher
                              ? `${slot.teacher.firstName} ${slot.teacher.lastName}`
                              : "—"}
                          </p>
                        ))}
                      </div>
                    )}
                  </AdminTd>

                  {/* Schedule column */}
                  <AdminTd>
                    {(enrollment.resolvedSlots ?? []).length === 0 ? (
                      <span
                        className="text-l"
                        style={{ color: adminColors.textMuted }}
                      >
                        —
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {enrollment.resolvedSlots.map((slot, i) => (
                          <div key={i}>
                            <p
                              className="text-l font-medium"
                              style={{ color: adminColors.textSecondary }}
                            >
                              {DAY_SHORT[slot.dayOfWeek] ?? slot.dayOfWeek}
                            </p>
                            <p
                              className="text-[15px]"
                              style={{ color: adminColors.textMuted }}
                            >
                              {slot.startTime}–{slot.endTime}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </AdminTd>

                  <AdminTd>
                    <p
                      className="text-xl font-medium"
                      style={{ color: adminColors.textPrimary }}
                    >
                      {enrollment.totalAmount.toFixed(3)}
                    </p>
                    <p
                      className="text-l"
                      style={{ color: adminColors.textMuted }}
                    >
                      OMR
                    </p>
                  </AdminTd>

                  <AdminTd>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: payConf.color }}
                      />
                      <span className="text-l" style={{ color: payConf.color }}>
                        {payConf.label}
                      </span>
                    </div>
                    {enrollment.payment?.paidAt && (
                      <p
                        className="text-[15px] mt-0.5"
                        style={{ color: adminColors.textMuted }}
                      >
                        {new Date(enrollment.payment.paidAt).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short" },
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

                  <AdminTd className="text-center">
                    <div className="flex items-center justify-end gap-1">
                      {isMultiChild ? (
                        // Multi-child rows: actions operate on the parent plan
                        <>
                          {enrollment.multiMonthEnrollment?.payment?.status !==
                            "PAID" && (
                            <button
                              onClick={() => {
                                const mme = multiMonthEnrollments.find(
                                  (m) =>
                                    m.id ===
                                    enrollment.multiMonthEnrollment!.id,
                                );
                                if (mme)
                                  setModal({
                                    type: "payment-multi",
                                    data: mme,
                                  });
                              }}
                              className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-green-400 hover:bg-green-500/8"
                              title="Pay multi-month plan"
                            >
                              <CreditCard size={16} />
                            </button>
                          )}
                          {enrollment.status !== "CANCELLED" && (
                            <button
                              onClick={() => {
                                const mme = multiMonthEnrollments.find(
                                  (m) =>
                                    m.id ===
                                    enrollment.multiMonthEnrollment!.id,
                                );
                                if (mme)
                                  setModal({ type: "cancel-multi", data: mme });
                              }}
                              className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-red-400 hover:bg-red-500/8"
                              title="Cancel multi-month plan"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </>
                      ) : (
                        // Single enrollment actions
                        <>
                          {payStatus !== "PAID" && (
                            <button
                              onClick={() =>
                                setModal({
                                  type: "payment-single",
                                  data: enrollment,
                                })
                              }
                              className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-green-400 hover:bg-green-500/8"
                              title="Record payment"
                            >
                              <CreditCard size={16} />
                            </button>
                          )}
                          {enrollment.status !== "CANCELLED" && (
                            <button
                              onClick={() =>
                                setModal({
                                  type: "cancel-single",
                                  data: enrollment,
                                })
                              }
                              className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-red-400 hover:bg-red-500/8"
                              title="Cancel enrollment"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                          {payStatus !== "PAID" && (
                            <button
                              onClick={() =>
                                setModal({
                                  type: "delete-single",
                                  data: enrollment,
                                })
                              }
                              className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-red-400 hover:bg-red-500/8"
                              title="Delete enrollment"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </>
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
  // MULTI VIEW — multi-month enrollment plans
  // ─────────────────────────────────────────────

  const MultiView = () => {
    const active = multiMonthEnrollments.filter(
      (m) => m.status !== "CANCELLED",
    );
    const cancelled = multiMonthEnrollments.filter(
      (m) => m.status === "CANCELLED",
    );

    if (multiMonthEnrollments.length === 0) {
      return (
        <AdminCard>
          <AdminEmptyState
            title="No multi-month plans"
            description="Create a multi-month enrollment to see it here."
            action={
              <AdminButton
                variant="primary"
                onClick={() => setModal({ type: "add" })}
              >
                <Plus size={18} /> {t("newEnrollment")}
              </AdminButton>
            }
          />
        </AdminCard>
      );
    }

    return (
      <AdminCard noPadding>
        <AdminTable>
          <AdminThead>
            <AdminTh>{t("student")}</AdminTh>
            <AdminTh>{t("subClass")}</AdminTh>
            <AdminTh>{t("period")}</AdminTh>
            <AdminTh>{t("teacher")}</AdminTh>
            <AdminTh>{t("schedule")}</AdminTh>
            <AdminTh>Total</AdminTh>
            <AdminTh>{t("payment")}</AdminTh>
            <AdminTh>{t("status")}</AdminTh>
            <AdminTh className="text-center">{t("actions")}</AdminTh>
          </AdminThead>
          <AdminTbody>
            {multiMonthEnrollments.map((m) => {
              const payStatus = m.payment?.status ?? "FAILED";
              const payConf =
                PAYMENT_CONFIG[payStatus] ?? PAYMENT_CONFIG.FAILED;
              const statusConf =
                STATUS_CONFIG[m.status] ?? STATUS_CONFIG.FAILED;
              const confirmedMonths = m.monthlyEnrollments.filter(
                (me) => me.status === "CONFIRMED",
              ).length;
              const cancelledMonths = m.monthlyEnrollments.filter(
                (me) => me.status === "CANCELLED",
              ).length;
              // resolvedSlots are identical across all child months — read from first
              const resolvedSlots =
                m.monthlyEnrollments[0]?.resolvedSlots ?? [];

              return (
                <AdminTr key={m.id}>
                  <AdminTd>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[15px] font-semibold"
                        style={{
                          background: "rgba(96,165,250,0.12)",
                          color: "#60a5fa",
                        }}
                      >
                        {m.student.firstName[0]}
                        {m.student.lastName[0]}
                      </div>
                      <div>
                        <p
                          className="text-xl font-medium"
                          style={{ color: adminColors.textPrimary }}
                        >
                          {m.student.firstName} {m.student.lastName}
                        </p>
                        <p
                          className="text-l"
                          style={{ color: adminColors.textMuted }}
                        >
                          {m.student.user.phone ?? m.student.user.email ?? "—"}
                        </p>
                      </div>
                    </div>
                  </AdminTd>

                  <AdminTd>
                    <p
                      className="text-xl"
                      style={{ color: adminColors.textSecondary }}
                    >
                      {m.subClass.name}
                    </p>
                    <p
                      className="text-l"
                      style={{ color: adminColors.textMuted }}
                    >
                      {m.subClass.class.name}
                    </p>
                  </AdminTd>

                  <AdminTd>
                    <p className="text-l" style={{ color: "#60a5fa" }}>
                      {MONTHS_SHORT[m.startMonth - 1]} {m.startYear}
                      {" → "}
                      {MONTHS_SHORT[m.endMonth - 1]} {m.endYear}
                    </p>
                    <p
                      className="text-xl text-[15px]"
                      style={{ color: adminColors.textPrimary }}
                    >
                      {m.totalMonths} months
                    </p>
                    <p
                      className="text-[15px]"
                      style={{ color: adminColors.textMuted }}
                    >
                      {confirmedMonths} confirmed
                      {cancelledMonths > 0 && `, ${cancelledMonths} cancelled`}
                    </p>
                    {/* <CalendarDays size={15} style={{ color: "#60a5fa" }} /> */}
                  </AdminTd>

                  {/* Teacher column */}
                  <AdminTd>
                    {resolvedSlots.length === 0 ? (
                      <span
                        className="text-l"
                        style={{ color: adminColors.textMuted }}
                      >
                        —
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {resolvedSlots.map((slot, i) => (
                          <p
                            key={i}
                            className="text-l font-medium"
                            style={{ color: adminColors.textSecondary }}
                          >
                            {slot.teacher
                              ? `${slot.teacher.firstName} ${slot.teacher.lastName}`
                              : "—"}
                          </p>
                        ))}
                      </div>
                    )}
                  </AdminTd>

                  {/* Schedule column */}
                  <AdminTd>
                    {resolvedSlots.length === 0 ? (
                      <span
                        className="text-l"
                        style={{ color: adminColors.textMuted }}
                      >
                        —
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {resolvedSlots.map((slot, i) => (
                          <div key={i}>
                            <p
                              className="text-l font-medium"
                              style={{ color: adminColors.textSecondary }}
                            >
                              {DAY_SHORT[slot.dayOfWeek] ?? slot.dayOfWeek}
                            </p>
                            <p
                              className="text-[15px]"
                              style={{ color: adminColors.textMuted }}
                            >
                              {slot.startTime}–{slot.endTime}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </AdminTd>

                  <AdminTd>
                    <p
                      className="text-xl font-medium"
                      style={{ color: adminColors.textPrimary }}
                    >
                      {Number(m.totalAmount).toFixed(3)}
                    </p>
                    <p
                      className="text-l"
                      style={{ color: adminColors.textMuted }}
                    >
                      OMR
                    </p>
                  </AdminTd>

                  <AdminTd>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: payConf.color }}
                      />
                      <span className="text-l" style={{ color: payConf.color }}>
                        {payConf.label}
                      </span>
                    </div>
                    {m.payment?.paidAt && (
                      <p
                        className="text-[15px] mt-0.5"
                        style={{ color: adminColors.textMuted }}
                      >
                        {new Date(m.payment.paidAt).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short" },
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

                  <AdminTd className="text-center">
                    <div className="flex items-center justify-end gap-1">
                      {payStatus !== "PAID" && (
                        <button
                          onClick={() =>
                            setModal({ type: "payment-multi", data: m })
                          }
                          className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-green-400 hover:bg-green-500/8"
                          title="Record payment"
                        >
                          <CreditCard size={13} />
                        </button>
                      )}
                      {m.status !== "CANCELLED" && (
                        <button
                          onClick={() =>
                            setModal({ type: "cancel-multi", data: m })
                          }
                          className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-red-400 hover:bg-red-500/8"
                          title="Cancel plan"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                      {payStatus !== "PAID" && (
                        <button
                          onClick={() =>
                            setModal({ type: "delete-multi", data: m })
                          }
                          className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-red-400 hover:bg-red-500/8"
                          title="Delete plan"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </AdminTd>
                </AdminTr>
              );
            })}
          </AdminTbody>
        </AdminTable>
      </AdminCard>
    );
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div
      className="space-y-4 max-w-8xl mx-auto"
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
            <Plus size={18} /> {t("newEnrollment")}
          </AdminButton>
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          {
            label: "Total",
            value: stats.total,
            color: adminColors.textPrimary,
          },
          { label: "Confirmed", value: stats.confirmed, color: "#34d399" },
          { label: "Multi-plans", value: stats.multiPlans, color: "#60a5fa" },
          {
            label: "Revenue",
            value: `${stats.revenue.toFixed(3)} OMR`,
            color: "#a78bfa",
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
            <p className="text-2xl font-bold" style={{ color }}>
              {value}
            </p>
            <p
              className="text-l mt-0.5"
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
          {(
            [
              {
                mode: "month",
                icon: <Users size={16} />,
                label: "By Sub-class",
              },
              {
                mode: "list",
                icon: <List size={16} />,
                label: "All Enrollments",
              },
              {
                mode: "multi",
                icon: <Layers size={16} />,
                label: "Multi-month",
              },
            ] as const
          ).map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="flex items-center gap-1.5 px-3 py-2 text-l font-medium transition-colors"
              style={{
                background:
                  viewMode === mode
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(255,255,255,0.02)",
                color: viewMode === mode ? "#f59e0b" : adminColors.textMuted,
              }}
            >
              {icon} {label}
              {mode === "multi" && stats.multiPlans > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-[14px] font-bold"
                  style={{
                    background: "rgba(96,165,250,0.15)",
                    color: "#60a5fa",
                  }}
                >
                  {stats.multiPlans}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Month navigator (hidden on multi view) */}
        {viewMode !== "multi" && (
          <div
            className="flex items-center gap-1 rounded-lg border px-1"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 rounded-md transition-colors text-white/40 hover:text-white/80"
            >
              <ChevronLeft size={18} />
            </button>
            <span
              className="text-xl px-2 font-medium"
              style={{ color: adminColors.textSecondary }}
            >
              {MONTHS_SHORT[month - 1]} {year}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 rounded-md transition-colors text-white/40 hover:text-white/80"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* List-view filters */}
        {viewMode === "list" && (
          <>
            <select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setFilterSubClass("");
              }}
              className="px-3 py-2 rounded-lg text-xl border bg-white/4 text-white/70 focus:outline-none"
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
              className="px-3 py-2 rounded-lg text-xl border bg-white/4 text-white/70 focus:outline-none"
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
              className="px-3 py-2 rounded-lg text-xl border bg-white/4 text-white/70 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <option className="text-black" value="">
                {t("allStatuses")}
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
          className="text-l ml-auto"
          style={{ color: adminColors.textMuted }}
        >
          {viewMode === "list"
            ? `${filteredEnrollments.length} enrollments`
            : viewMode === "multi"
              ? `${multiMonthEnrollments.length} plans`
              : `${stats.total} enrollments this month`}
        </span>
      </div>

      {/* ── Main view ── */}
      {viewMode === "month" && <MonthView />}
      {viewMode === "list" && <ListView />}
      {viewMode === "multi" && <MultiView />}

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
      {modal?.type === "payment-single" && (
        <PaymentModal
          type="single"
          enrollment={modal.data}
          onClose={() => setModal(null)}
          onSuccess={() => {
            toast("Payment recorded. Enrollment confirmed.", "success");
            handleSuccess();
          }}
        />
      )}
      {modal?.type === "payment-multi" && (
        <PaymentModal
          type="multi"
          enrollment={modal.data}
          onClose={() => setModal(null)}
          onSuccess={() => {
            toast("Payment recorded. All months confirmed.", "success");
            handleSuccess();
          }}
        />
      )}
      {modal?.type === "cancel-single" && (
        <DeleteConfirmModal
          title="Cancel enrollment?"
          description={`Cancel ${modal.data.student.firstName} ${modal.data.student.lastName}'s enrollment in ${modal.data.subClass.name} for ${MONTHS[modal.data.month - 1]} ${modal.data.year}? This will not delete the payment record.`}
          confirmLabel="Yes, Cancel"
          onConfirm={() => {
            handleCancelSingle(modal.data.id);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "cancel-multi" && (
        <DeleteConfirmModal
          title="Cancel multi-month plan?"
          description={`Cancel ${modal.data.student.firstName} ${modal.data.student.lastName}'s ${modal.data.totalMonths}-month plan for ${modal.data.subClass.name}? Only future months will be cancelled — past and current months are unaffected.`}
          confirmLabel="Yes, Cancel Future Months"
          onConfirm={() => {
            handleCancelMulti(modal.data.id);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete-single" && (
        <DeleteConfirmModal
          title="Delete enrollment?"
          description={`Permanently delete ${modal.data.student.firstName} ${modal.data.student.lastName}'s enrollment in ${modal.data.subClass.name}? This cannot be undone.`}
          onConfirm={() => {
            handleDeleteSingle(modal.data.id);
          }}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "delete-multi" && (
        <DeleteConfirmModal
          title="Delete multi-month plan?"
          description={`Permanently delete ${modal.data.student.firstName} ${modal.data.student.lastName}'s ${modal.data.totalMonths}-month plan and all its monthly enrollments? This cannot be undone.`}
          onConfirm={() => {
            handleDeleteMulti(modal.data.id);
          }}
          onClose={() => setModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}

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
      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-l transition-colors hover:bg-white/4"
      style={{ color }}
    >
      {icon} {label}
    </button>
  );
}
