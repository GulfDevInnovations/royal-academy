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
  RefreshCw,
  Wifi,
  WifiOff,
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
// Constants
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
// Time slots for the calendar grid (7am – 10pm)
const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 7;
  return `${String(h).padStart(2, "0")}:00`;
});

// Deterministic color per class name
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

const STATUS_BADGE: Record<
  string,
  "success" | "default" | "warning" | "error" | "info"
> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  CANCELLED: "error",
  COMPLETED: "info",
};

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

interface FormOptions {
  subClasses: {
    id: string;
    name: string;
    class: { id: string; name: string };
    teachers: {
      teacher: { id: string; firstName: string; lastName: string };
    }[];
  }[];
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

// ─────────────────────────────────────────────
// Component
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
  const [filterDay, setFilterDay] = useState<string>("");
  const [filterClass, setFilterClass] = useState<string>("");

  // Sessions drawer
  const [drawerSchedule, setDrawerSchedule] =
    useState<SerializedSchedule | null>(null);
  const [drawerSessions, setDrawerSessions] = useState<SessionRow[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

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

  const openSessions = async (schedule: SerializedSchedule) => {
    setDrawerSchedule(schedule);
    setLoadingSessions(true);
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
    setLoadingSessions(false);
  };

  // ── Filtered schedules ──
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

  // ─────────────────────────────────────────────
  // CALENDAR VIEW
  // ─────────────────────────────────────────────

  const CalendarView = () => {
    // Group schedules by day
    const byDay = useMemo(() => {
      const map: Record<string, SerializedSchedule[]> = {};
      for (const day of DAYS) map[day] = [];
      for (const s of displayed) {
        if (!map[s.dayOfWeek]) map[s.dayOfWeek] = [];
        map[s.dayOfWeek].push(s);
      }
      return map;
    }, []);

    const GRID_START = 7 * 60; // 7:00am in minutes
    const GRID_END = 22 * 60; // 10:00pm in minutes
    const GRID_MINUTES = GRID_END - GRID_START;
    const SLOT_HEIGHT = 60; // px per hour

    return (
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "#13161f" }}
      >
        {/* Day headers */}
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

        {/* Time grid */}
        <div
          className="relative overflow-y-auto"
          style={{ maxHeight: "600px" }}
        >
          <div
            className="relative"
            style={{ height: `${(GRID_MINUTES / 60) * SLOT_HEIGHT}px` }}
          >
            {/* Hour lines + labels */}
            {TIME_SLOTS.map((time, i) => (
              <div
                key={time}
                className="absolute w-full border-t flex"
                style={{
                  top: `${i * SLOT_HEIGHT}px`,
                  borderColor: "rgba(255,255,255,0.04)",
                }}
              >
                <div className="w-14 flex-shrink-0 px-2 -translate-y-2.5">
                  <span
                    className="text-[10px]"
                    style={{ color: adminColors.textMuted }}
                  >
                    {time}
                  </span>
                </div>
              </div>
            ))}

            {/* Day columns + schedule blocks */}
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: "56px repeat(7, 1fr)",
                pointerEvents: "none",
              }}
            >
              <div /> {/* time label column spacer */}
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

                    // Count how many days this subclass runs this week
                    const subClassDayCount = displayed.filter(
                      (x) => x.subClassId === schedule.subClassId,
                    ).length;

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
                          {schedule.subClass.name}
                        </p>
                        {height > 36 && (
                          <p
                            className="text-[9px] truncate mt-0.5"
                            style={{ color: adminColors.textMuted }}
                          >
                            {schedule.startTime}–{schedule.endTime}
                          </p>
                        )}
                        {height > 52 && (
                          <p
                            className="text-[9px] truncate"
                            style={{ color: adminColors.textMuted }}
                          >
                            {schedule.teacher.firstName}{" "}
                            {schedule.teacher.lastName}
                          </p>
                        )}
                        {height > 68 && subClassDayCount > 1 && (
                          <p
                            className="text-[9px] mt-0.5"
                            style={{ color: color.text, opacity: 0.7 }}
                          >
                            {subClassDayCount}×/week
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
                        <p
                          className="text-xs"
                          style={{ color: adminColors.textMuted }}
                        >
                          {schedule.subClass.class.name}
                          {(() => {
                            const days = displayed.filter(
                              (x) => x.subClassId === schedule.subClassId,
                            );
                            if (days.length > 1) {
                              const dayNames = days
                                .map((d) => DAY_SHORT[d.dayOfWeek])
                                .join(" + ");
                              return (
                                <span
                                  className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{
                                    background: "rgba(245,158,11,0.1)",
                                    color: "#f59e0b",
                                  }}
                                >
                                  {dayNames} ({days.length}×/wk)
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </p>
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
                    <div className="flex items-center gap-1.5">
                      <AdminBadge
                        variant={STATUS_BADGE[schedule.status] ?? "default"}
                      >
                        {schedule.status}
                      </AdminBadge>
                      {schedule.onlineLink && (
                        <Wifi
                          size={12}
                          style={{ color: "#60a5fa" }}
                          title="Has online link"
                        />
                      )}
                    </div>
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

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View toggle */}
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

        {/* Class filter */}
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

        {/* Day filter */}
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

        <span
          className="text-xs ml-auto"
          style={{ color: adminColors.textMuted }}
        >
          {displayed.length} of {initialSchedules.length} schedules
        </span>
      </div>

      {/* ── Main view ── */}
      {viewMode === "calendar" ? <CalendarView /> : <ListView />}

      {/* ── Legend (calendar only) ── */}
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

      {/* ── Modals ── */}
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

      {/* ── Sessions drawer ── */}
      {drawerSchedule && (
        <SessionsDrawer
          schedule={drawerSchedule}
          sessions={drawerSessions}
          onClose={() => {
            setDrawerSchedule(null);
            setDrawerSessions([]);
          }}
          onRefresh={() => openSessions(drawerSchedule)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
