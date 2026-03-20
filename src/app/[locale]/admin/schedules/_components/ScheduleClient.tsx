"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Eye,
  LayoutGrid,
  X,
} from "lucide-react";
import {
  deleteSchedule,
  getScheduleById,
} from "@/lib/actions/admin/Schedules.actions";
import type { SerializedSchedule } from "../page";
import type { SessionRow } from "./SessionsDrawer";
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
import ScheduleFormModal from "./ScheduleFormModal";
import SessionsDrawer from "./SessionsDrawer";
import DeleteConfirmModal from "../../../../../components/admin/DeleteConfirmModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

// Match exactly what AdminBadge accepts — remove "error" if your BadgeVariant doesn't have it
type BadgeVariant = "success" | "warning" | "default" | "info";

interface SubClassOption {
  id: string;
  name: string;
  isReschedulable: boolean;
  sessionType: string;
  class: { id: string; name: string };
  teachers: {
    teacher: { id: string; firstName: string; lastName: string };
  }[];
}

interface FormOptions {
  subClasses: SubClassOption[];
  teachers: { id: string; firstName: string; lastName: string }[];
}

interface Props {
  initialSchedules: SerializedSchedule[];
  formOptions: FormOptions;
}

type Modal =
  | { type: "add" }
  | { type: "edit"; data: SerializedSchedule }
  | { type: "delete"; data: SerializedSchedule };

type CalendarSubView = "week" | "month";

interface DayCellPopup {
  date: Date;
  schedules: SerializedSchedule[];
  anchorRect: DOMRect;
}

// ─────────────────────────────────────────────
// Constants & helpers
// ─────────────────────────────────────────────

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

const DAY_SHORT: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

const JS_DAY_TO_ENUM: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 7;
  return `${String(h).padStart(2, "0")}:00`;
});

const MONTH_NAMES = [
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

const CLASS_COLORS = [
  {
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.4)",
    text: "#f59e0b",
  },
  {
    bg: "rgba(96,165,250,0.15)",
    border: "rgba(96,165,250,0.4)",
    text: "#60a5fa",
  },
  {
    bg: "rgba(52,211,153,0.15)",
    border: "rgba(52,211,153,0.4)",
    text: "#34d399",
  },
  {
    bg: "rgba(167,139,250,0.15)",
    border: "rgba(167,139,250,0.4)",
    text: "#a78bfa",
  },
  {
    bg: "rgba(251,113,133,0.15)",
    border: "rgba(251,113,133,0.4)",
    text: "#fb7185",
  },
  {
    bg: "rgba(34,211,238,0.15)",
    border: "rgba(34,211,238,0.4)",
    text: "#22d3ee",
  },
];

function colorForClass(className: string) {
  let hash = 0;
  for (const c of className) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return CLASS_COLORS[Math.abs(hash) % CLASS_COLORS.length];
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function scheduleActiveInMonth(
  schedule: SerializedSchedule,
  year: number,
  month: number,
): boolean {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const start = new Date(schedule.startDate);
  const end = schedule.endDate ? new Date(schedule.endDate) : null;
  if (start > monthEnd) return false;
  if (end && end < monthStart) return false;
  return true;
}

function buildCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const grid: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) grid.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++)
    grid.push(new Date(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

// Only variants your AdminBadge actually supports
const STATUS_BADGE: Record<string, BadgeVariant> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  COMPLETED: "info",
  CANCELLED: "default",
};

// ─────────────────────────────────────────────
// Day-cell popup panel
// ─────────────────────────────────────────────

interface DayCellPopupProps {
  popup: DayCellPopup;
  onClose: () => void;
  onSelectSchedule: (schedule: SerializedSchedule, dateLabel: string) => void;
}

function DayCellPopupPanel({
  popup,
  onClose,
  onSelectSchedule,
}: DayCellPopupProps) {
  const dateLabel = popup.date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  // Position the popup so it doesn't go offscreen
  const top = Math.min(popup.anchorRect.bottom + 6, window.innerHeight - 320);
  const left = Math.min(popup.anchorRect.left, window.innerWidth - 290);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-xl shadow-2xl border overflow-hidden"
        style={{
          background: "#1a1d27",
          borderColor: "rgba(255,255,255,0.10)",
          minWidth: "230px",
          maxWidth: "280px",
          top,
          left,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-3 py-2.5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <span
            className="text-xs font-semibold"
            style={{ color: adminColors.textPrimary }}
          >
            {dateLabel}
            <span
              className="ml-2 font-normal"
              style={{ color: adminColors.textMuted }}
            >
              {popup.schedules.length} class
              {popup.schedules.length > 1 ? "es" : ""}
            </span>
          </span>
          <button
            onClick={onClose}
            className="p-0.5 rounded text-white/30 hover:text-white/70 transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        {/* Schedule list */}
        <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
          {popup.schedules.map((schedule) => {
            const color = colorForClass(schedule.subClass.class.name);
            const cancelled = schedule.status === "CANCELLED";
            return (
              <button
                key={schedule.id}
                onClick={() => {
                  onSelectSchedule(schedule, dateLabel);
                  onClose();
                }}
                className="w-full text-left rounded-lg px-3 py-2.5 transition-all hover:brightness-125"
                style={{
                  background: cancelled ? "rgba(255,255,255,0.03)" : color.bg,
                  border: `1px solid ${cancelled ? "rgba(255,255,255,0.06)" : color.border}`,
                  opacity: cancelled ? 0.55 : 1,
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span
                    className="text-xs font-semibold truncate"
                    style={{
                      color: cancelled ? adminColors.textMuted : color.text,
                    }}
                  >
                    {schedule.subClass.name}
                  </span>
                  <span
                    className="text-[10px] flex-shrink-0"
                    style={{ color: adminColors.textMuted }}
                  >
                    {schedule.startTime}–{schedule.endTime}
                  </span>
                </div>
                <p
                  className="text-[10px]"
                  style={{ color: adminColors.textMuted }}
                >
                  {schedule.teacher.firstName} {schedule.teacher.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {schedule.subClass.isReschedulable && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                      style={{
                        background: "rgba(52,211,153,0.1)",
                        color: "#34d399",
                      }}
                    >
                      Reschedulable
                    </span>
                  )}
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: adminColors.textMuted,
                    }}
                  >
                    {schedule.currentEnrolled}/{schedule.maxCapacity} enrolled
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function SchedulesClient({
  initialSchedules,
  formOptions,
}: Props) {
  const router = useRouter();
  const { toasts, toast, remove } = useToast();
  const [, startRefresh] = useTransition();

  const [modal, setModal] = useState<Modal | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [calSub, setCalSub] = useState<CalendarSubView>("month");
  const [filterDay, setFilterDay] = useState<string>("");
  const [filterClass, setFilterClass] = useState<string>("");

  const now = new Date();
  const [navYear, setNavYear] = useState(now.getFullYear());
  const [navMonth, setNavMonth] = useState(now.getMonth());

  const [drawerSchedule, setDrawerSchedule] =
    useState<SerializedSchedule | null>(null);
  const [drawerSessions, setDrawerSessions] = useState<SessionRow[]>([]);
  const [drawerDateLabel, setDrawerDateLabel] = useState<string | undefined>();
  const [popup, setPopup] = useState<DayCellPopup | null>(null);

  const handleSuccess = useCallback(() => {
    setModal(null);
    startRefresh(() => router.refresh());
  }, [router]);

  const handleDelete = async (id: string) => {
    const result = await deleteSchedule(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else handleSuccess();
    return result;
  };

  const openSessions = async (
    schedule: SerializedSchedule,
    dateLabel?: string,
  ) => {
    setDrawerSchedule(schedule);
    setDrawerDateLabel(dateLabel);
    const data = await getScheduleById(schedule.id);
    if (data) {
      setDrawerSessions(
        data.sessions.map((s) => ({
          ...s,
          sessionDate: s.sessionDate.toISOString(),
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        })),
      );
    }
  };

  const displayed = useMemo(() => {
    let list = initialSchedules;
    if (filterDay) list = list.filter((s) => s.dayOfWeek === filterDay);
    if (filterClass)
      list = list.filter((s) => s.subClass.class.id === filterClass);
    return list;
  }, [initialSchedules, filterDay, filterClass]);

  const uniqueClasses = useMemo(
    () => [
      ...new Map(
        initialSchedules.map((s) => [s.subClass.class.id, s.subClass.class]),
      ).values(),
    ],
    [initialSchedules],
  );

  const prevMonth = () => {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear((y) => y - 1);
    } else setNavMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear((y) => y + 1);
    } else setNavMonth((m) => m + 1);
  };

  // ─────────────────────────────────────────────
  // MONTHLY VIEW
  // ─────────────────────────────────────────────

  const MonthlyView = () => {
    const grid = useMemo(() => buildCalendarGrid(navYear, navMonth), []);

    const activeThisMonth = useMemo(
      () =>
        displayed.filter((s) => scheduleActiveInMonth(s, navYear, navMonth)),
      [],
    );

    const schedulesForDate = (date: Date): SerializedSchedule[] =>
      activeThisMonth
        .filter((s) => s.dayOfWeek === JS_DAY_TO_ENUM[date.getDay()])
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const today = new Date();
    const isToday = (d: Date) =>
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const handleCellClick = (
      e: React.MouseEvent<HTMLDivElement>,
      date: Date,
      schedules: SerializedSchedule[],
    ) => {
      if (schedules.length === 0) return;
      if (schedules.length === 1) {
        const label = date.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        });
        openSessions(schedules[0], label);
        return;
      }
      setPopup({
        date,
        schedules,
        anchorRect: e.currentTarget.getBoundingClientRect(),
      });
    };

    return (
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "#13161f" }}
      >
        {/* Navigator */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-white/70 hover:bg-white/[0.06]"
          >
            <ChevronLeft size={15} />
          </button>
          <div className="flex items-center gap-3">
            <span
              className="text-sm font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              {MONTH_NAMES[navMonth]} {navYear}
            </span>
            {(navYear !== now.getFullYear() || navMonth !== now.getMonth()) && (
              <button
                onClick={() => {
                  setNavYear(now.getFullYear());
                  setNavMonth(now.getMonth());
                }}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245,158,11,0.2)",
                }}
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-white/70 hover:bg-white/[0.06]"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Weekday headers */}
        <div
          className="grid border-b"
          style={{
            gridTemplateColumns: "repeat(7, 1fr)",
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div
              key={d}
              className="px-2 py-2.5 text-center border-l first:border-l-0"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}
            >
              <span
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: adminColors.textMuted }}
              >
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          {grid.map((date, idx) => {
            const schedules = date ? schedulesForDate(date) : [];
            const todayCell = date ? isToday(date) : false;
            const isPast = date
              ? date <
                new Date(today.getFullYear(), today.getMonth(), today.getDate())
              : false;

            return (
              <div
                key={idx}
                onClick={(e) => date && handleCellClick(e, date, schedules)}
                className="min-h-26 border-t border-l p-1.5"
                style={{
                  borderColor: "rgba(255,255,255,0.04)",
                  background: todayCell
                    ? "rgba(245,158,11,0.04)"
                    : !date
                      ? "rgba(0,0,0,0.15)"
                      : "transparent",
                  cursor: schedules.length > 0 ? "pointer" : "default",
                }}
              >
                {date && (
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full"
                      style={{
                        background: todayCell
                          ? "rgba(245,158,11,0.15)"
                          : "transparent",
                        color: todayCell
                          ? "#f59e0b"
                          : isPast
                            ? adminColors.textMuted
                            : adminColors.textSecondary,
                      }}
                    >
                      {date.getDate()}
                    </span>
                    {schedules.length > 0 && (
                      <span
                        className="text-[9px]"
                        style={{ color: adminColors.textMuted }}
                      >
                        {schedules.length > 2 ? `${schedules.length}` : ""}
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-0.5">
                  {schedules.slice(0, 2).map((schedule) => {
                    const color = colorForClass(schedule.subClass.class.name);
                    const cancelled = schedule.status === "CANCELLED";
                    return (
                      <div
                        key={schedule.id}
                        className="rounded px-1.5 py-1 text-[9px] leading-tight"
                        style={{
                          background: cancelled
                            ? "rgba(255,255,255,0.03)"
                            : color.bg,
                          border: `1px solid ${cancelled ? "rgba(255,255,255,0.06)" : color.border}`,
                          opacity: isPast ? 0.55 : 1,
                        }}
                        title={`${schedule.subClass.name} · ${schedule.teacher.firstName} ${schedule.teacher.lastName}`}
                      >
                        <div
                          className="font-semibold truncate"
                          style={{
                            color: cancelled
                              ? adminColors.textMuted
                              : color.text,
                          }}
                        >
                          {schedule.startTime} {schedule.subClass.name}
                        </div>
                        <div
                          className="truncate mt-0.5"
                          style={{ color: adminColors.textMuted }}
                        >
                          {schedule.teacher.firstName}{" "}
                          {schedule.teacher.lastName}
                        </div>
                      </div>
                    );
                  })}
                  {schedules.length > 2 && (
                    <div
                      className="text-[9px] px-1.5 py-0.5 rounded text-center"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        color: adminColors.textMuted,
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      +{schedules.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex items-center gap-5 flex-wrap"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {uniqueClasses.map((c) => {
            const active = displayed.filter(
              (s) =>
                s.subClass.class.id === c.id &&
                scheduleActiveInMonth(s, navYear, navMonth),
            );
            if (!active.length) return null;
            const color = colorForClass(c.name);
            const gridDates = buildCalendarGrid(navYear, navMonth).filter(
              Boolean,
            ) as Date[];
            const totalSessions = active.reduce(
              (acc, s) =>
                acc +
                gridDates.filter(
                  (d) => JS_DAY_TO_ENUM[d.getDay()] === s.dayOfWeek,
                ).length,
              0,
            );
            return (
              <div key={c.id} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                  }}
                />
                <span
                  className="text-xs"
                  style={{ color: adminColors.textMuted }}
                >
                  {c.name}
                </span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: adminColors.textMuted,
                  }}
                >
                  {totalSessions} sessions
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // WEEKLY VIEW
  // ─────────────────────────────────────────────

  const WeeklyView = () => {
    const byDay = useMemo(() => {
      const map: Record<string, SerializedSchedule[]> = {};
      for (const day of DAYS) map[day] = [];
      for (const s of displayed) {
        if (!map[s.dayOfWeek]) map[s.dayOfWeek] = [];
        map[s.dayOfWeek].push(s);
      }
      return map;
    }, []);

    const GRID_START = 7 * 60;
    const GRID_END = 22 * 60;
    const GRID_MINUTES = GRID_END - GRID_START;
    const SLOT_HEIGHT = 60;

    return (
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "#13161f" }}
      >
        <div
          className="grid border-b"
          style={{
            gridTemplateColumns: "56px repeat(7, 1fr)",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <div className="px-2 py-3" />
          {DAYS.map((day) => {
            const count = byDay[day].length;
            return (
              <div
                key={day}
                className="px-2 py-3 text-center border-l"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: adminColors.textSecondary }}
                >
                  {DAY_SHORT[day]}
                </p>
                {count > 0 && (
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: adminColors.textMuted }}
                  >
                    {count} class{count > 1 ? "es" : ""}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="relative overflow-y-auto"
          style={{ maxHeight: "600px" }}
        >
          <div
            className="relative"
            style={{ height: `${(GRID_MINUTES / 60) * SLOT_HEIGHT}px` }}
          >
            {TIME_SLOTS.map((time, i) => (
              <div
                key={time}
                className="absolute w-full border-t flex"
                style={{
                  top: `${i * SLOT_HEIGHT}px`,
                  borderColor: "rgba(255,255,255,0.04)",
                }}
              >
                <div className="w-14 shrink-0 px-2 -translate-y-2.5">
                  <span
                    className="text-[10px]"
                    style={{ color: adminColors.textMuted }}
                  >
                    {time}
                  </span>
                </div>
              </div>
            ))}

            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: "56px repeat(7, 1fr)",
                pointerEvents: "none",
              }}
            >
              <div />
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="relative border-l"
                  style={{
                    borderColor: "rgba(255,255,255,0.04)",
                    pointerEvents: "auto",
                  }}
                >
                  {byDay[day].map((schedule) => {
                    const startMin =
                      timeToMinutes(schedule.startTime) - GRID_START;
                    const endMin = timeToMinutes(schedule.endTime) - GRID_START;
                    const top = Math.max(0, (startMin / 60) * SLOT_HEIGHT);
                    const height = Math.max(
                      24,
                      ((endMin - startMin) / 60) * SLOT_HEIGHT - 2,
                    );
                    const color = colorForClass(schedule.subClass.class.name);
                    const isCancelled = schedule.status === "CANCELLED";

                    return (
                      <div
                        key={schedule.id}
                        onClick={() => openSessions(schedule)}
                        className="absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer transition-all hover:brightness-125 overflow-hidden"
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          background: isCancelled
                            ? "rgba(255,255,255,0.03)"
                            : color.bg,
                          border: `1px solid ${isCancelled ? "rgba(255,255,255,0.08)" : color.border}`,
                          opacity: isCancelled ? 0.5 : 1,
                        }}
                      >
                        <p
                          className="text-[10px] font-semibold leading-tight truncate"
                          style={{
                            color: isCancelled
                              ? adminColors.textMuted
                              : color.text,
                          }}
                        >
                          {schedule.subClass.name} {schedule.teacher.firstName}{" "}
                          {schedule.teacher.lastName}
                        </p>
                        {height > 30 && (
                          <p
                            className="text-[9px] truncate mt-0.5"
                            style={{ color: adminColors.textMuted }}
                          >
                            {schedule.startTime}–{schedule.endTime}
                          </p>
                        )}
                        {height > 46 && (
                          <p
                            className="text-[9px] truncate"
                            style={{ color: adminColors.textMuted }}
                          >
                            {schedule.teacher.firstName}{" "}
                            {schedule.teacher.lastName}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────

  const ListView = () => (
    <AdminCard noPadding>
      {displayed.length === 0 ? (
        <AdminEmptyState
          title="No schedules found"
          description="Create your first schedule to start assigning sessions."
          action={
            <AdminButton
              variant="primary"
              onClick={() => setModal({ type: "add" })}
            >
              <Plus size={14} /> New Schedule
            </AdminButton>
          }
        />
      ) : (
        <AdminTable>
          <AdminThead>
            <AdminTh>Sub-class</AdminTh>
            <AdminTh>Day & Time</AdminTh>
            <AdminTh>Teacher</AdminTh>
            <AdminTh>Term</AdminTh>
            <AdminTh>Capacity</AdminTh>
            <AdminTh>Sessions</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </AdminThead>
          <AdminTbody>
            {displayed.map((schedule) => {
              const color = colorForClass(schedule.subClass.class.name);
              const badge = STATUS_BADGE[schedule.status] ?? "default";
              return (
                <AdminTr key={schedule.id}>
                  <AdminTd>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: color.text }}
                      />
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: adminColors.textPrimary }}
                        >
                          {schedule.subClass.name}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p
                            className="text-xs"
                            style={{ color: adminColors.textMuted }}
                          >
                            {schedule.subClass.class.name}
                          </p>
                          {schedule.subClass.isReschedulable && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                              style={{
                                background: "rgba(52,211,153,0.1)",
                                color: "#34d399",
                                border: "1px solid rgba(52,211,153,0.2)",
                              }}
                            >
                              Reschedulable
                            </span>
                          )}
                          {(() => {
                            const days = displayed.filter(
                              (x) => x.subClassId === schedule.subClassId,
                            );
                            if (days.length > 1) {
                              return (
                                <span
                                  className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{
                                    background: "rgba(245,158,11,0.1)",
                                    color: "#f59e0b",
                                  }}
                                >
                                  {days
                                    .map((d) => DAY_SHORT[d.dayOfWeek])
                                    .join(" + ")}{" "}
                                  ({days.length}×/wk)
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </AdminTd>

                  <AdminTd>
                    <p
                      className="text-sm"
                      style={{ color: adminColors.textSecondary }}
                    >
                      {DAY_SHORT[schedule.dayOfWeek]}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: adminColors.textMuted }}
                    >
                      {schedule.startTime}–{schedule.endTime}
                    </p>
                  </AdminTd>

                  <AdminTd>
                    <span style={{ color: adminColors.textSecondary }}>
                      {schedule.teacher.firstName} {schedule.teacher.lastName}
                    </span>
                  </AdminTd>

                  <AdminTd>
                    <p
                      className="text-xs"
                      style={{ color: adminColors.textSecondary }}
                    >
                      {new Date(schedule.startDate).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </p>
                    {schedule.endDate && (
                      <p
                        className="text-xs"
                        style={{ color: adminColors.textMuted }}
                      >
                        →{" "}
                        {new Date(schedule.endDate).toLocaleDateString(
                          "en-GB",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </p>
                    )}
                  </AdminTd>

                  <AdminTd>
                    <div className="flex items-center gap-1.5">
                      <Users
                        size={12}
                        style={{ color: adminColors.textMuted }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: adminColors.textSecondary }}
                      >
                        {schedule.currentEnrolled}/{schedule.maxCapacity}
                      </span>
                    </div>
                  </AdminTd>

                  <AdminTd>
                    <button
                      onClick={() => openSessions(schedule)}
                      className="flex items-center gap-1.5 text-xs transition-colors hover:text-amber-400"
                      style={{ color: adminColors.textSecondary }}
                    >
                      <CalendarDays size={13} />
                      {schedule._count.sessions} sessions
                    </button>
                  </AdminTd>

                  <AdminTd>
                    <AdminBadge variant={badge}>{schedule.status}</AdminBadge>
                  </AdminTd>

                  <AdminTd className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openSessions(schedule)}
                        className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-amber-400 hover:bg-amber-500/[0.08]"
                        title="View sessions"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() =>
                          setModal({ type: "edit", data: schedule })
                        }
                        className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-white/70 hover:bg-white/[0.05]"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() =>
                          setModal({ type: "delete", data: schedule })
                        }
                        className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-red-400 hover:bg-red-500/[0.08]"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
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
    <div className="space-y-4 max-w-7xl mx-auto">
      <AdminPageHeader
        title="Schedules"
        subtitle={`${initialSchedules.length} schedule${initialSchedules.length !== 1 ? "s" : ""}`}
        action={
          <AdminButton
            variant="primary"
            onClick={() => setModal({ type: "add" })}
          >
            <Plus size={14} /> New Schedule
          </AdminButton>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center rounded-lg border overflow-hidden"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {(["calendar", "list"] as const).map((mode) => (
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
              {mode === "calendar" ? (
                <CalendarDays size={13} />
              ) : (
                <List size={13} />
              )}
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {viewMode === "calendar" && (
          <div
            className="flex items-center rounded-lg border overflow-hidden"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            {(["month", "week"] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setCalSub(sub)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors"
                style={{
                  background:
                    calSub === sub
                      ? "rgba(96,165,250,0.10)"
                      : "rgba(255,255,255,0.02)",
                  color: calSub === sub ? "#60a5fa" : adminColors.textMuted,
                }}
              >
                {sub === "month" ? (
                  <LayoutGrid size={13} />
                ) : (
                  <Clock size={13} />
                )}
                {sub.charAt(0).toUpperCase() + sub.slice(1)}
              </button>
            ))}
          </div>
        )}

        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border bg-white/[0.04] text-white/70 focus:outline-none focus:border-amber-500/50"
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

        {!(viewMode === "calendar" && calSub === "month") && (
          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border bg-white/[0.04] text-white/70 focus:outline-none focus:border-amber-500/50"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <option className="text-black" value="">
              All days
            </option>
            {DAYS.map((d) => (
              <option className="text-black" key={d} value={d}>
                {DAY_SHORT[d]}
              </option>
            ))}
          </select>
        )}

        <span
          className="text-xs ml-auto"
          style={{ color: adminColors.textMuted }}
        >
          {displayed.length} of {initialSchedules.length} schedules
        </span>
      </div>

      {viewMode === "list" && <ListView />}
      {viewMode === "calendar" && calSub === "month" && <MonthlyView />}
      {viewMode === "calendar" && calSub === "week" && <WeeklyView />}

      {viewMode === "calendar" && uniqueClasses.length > 0 && (
        <div className="flex flex-wrap gap-3 px-1">
          {uniqueClasses.map((c) => {
            const color = colorForClass(c.name);
            return (
              <div key={c.id} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{
                    background: color.bg,
                    border: `1px solid ${color.border}`,
                  }}
                />
                <span
                  className="text-xs"
                  style={{ color: adminColors.textMuted }}
                >
                  {c.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Day-cell popup */}
      {popup && (
        <DayCellPopupPanel
          popup={popup}
          onClose={() => setPopup(null)}
          onSelectSchedule={(schedule, dateLabel) =>
            openSessions(schedule, dateLabel)
          }
        />
      )}

      {modal?.type === "add" && (
        <ScheduleFormModal
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
          subClasses={formOptions.subClasses}
          teachers={formOptions.teachers}
        />
      )}
      {modal?.type === "edit" && (
        <ScheduleFormModal
          editing={modal.data}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
          subClasses={formOptions.subClasses}
          teachers={formOptions.teachers}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirmModal
          title={`Delete ${modal.data.subClass.name} schedule?`}
          description={`This will permanently delete the ${DAY_SHORT[modal.data.dayOfWeek]} ${modal.data.startTime}–${modal.data.endTime} schedule and all its sessions that have no bookings.`}
          onConfirm={() => handleDelete(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}

      {drawerSchedule && (
        <SessionsDrawer
          schedule={drawerSchedule}
          sessions={drawerSessions}
          dateLabel={drawerDateLabel}
          onClose={() => {
            setDrawerSchedule(null);
            setDrawerSessions([]);
            setDrawerDateLabel(undefined);
          }}
          onRefresh={() => openSessions(drawerSchedule, drawerDateLabel)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
