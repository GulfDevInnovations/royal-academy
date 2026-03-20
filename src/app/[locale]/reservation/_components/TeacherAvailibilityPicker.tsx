"use client";

/**
 * TeacherAvailabilityPicker
 *
 * Shows a two-month mini-calendar of a teacher's available session slots.
 * Past dates are greyed out and unselectable. The student taps a date+slot
 * to confirm their first (or trial) session date/time.
 *
 * Props:
 *   teacher      — the selected SubClassTeacherInfo (carries schedules)
 *   accent       — theme color hex string
 *   onSelect     — called with { date, dayOfWeek, startTime, endTime }
 *   selected     — currently selected slot key "YYYY-MM-DD|startTime|endTime" | null
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react";
import type {
  SubClassTeacherInfo,
  SubClassTeacherSchedule,
} from "@/lib/actions/classes";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AvailableSlot = {
  date: string; // "YYYY-MM-DD"
  dayOfWeek: string; // e.g. "FRIDAY"
  startTime: string; // e.g. "10:00"
  endTime: string; // e.g. "10:45"
};

export type SlotKey = string; // "YYYY-MM-DD|startTime|endTime"

export function slotKey(s: AvailableSlot): SlotKey {
  return `${s.date}|${s.startTime}|${s.endTime}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

// JS getDay() → our DayOfWeek enum (JS: 0 = Sun)
const JS_DAY_TO_ENUM: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

const DAY_SHORT = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a calendar grid (Mon–Sun) for a given year/month (0-based). */
function buildGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const grid: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) grid.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++)
    grid.push(new Date(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

/** Format a Date as "YYYY-MM-DD". */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * For a given date, return all schedule slots that:
 *  1. Match the date's day-of-week
 *  2. The schedule is still active on that date (endDate is null or >= date)
 */
function slotsForDate(
  date: Date,
  schedules: SubClassTeacherSchedule[],
): SubClassTeacherSchedule[] {
  const dayEnum = JS_DAY_TO_ENUM[date.getDay()];
  return schedules.filter((s) => {
    if (s.dayOfWeek !== dayEnum) return false;
    if (s.endDate && new Date(s.endDate) < date) return false;
    return true;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  teacher: SubClassTeacherInfo;
  accent: string;
  selected: SlotKey | null;
  onSelect: (slot: AvailableSlot) => void;
}

export function TeacherAvailabilityPicker({
  teacher,
  accent,
  selected,
  onSelect,
}: Props) {
  const now = new Date();
  const todayStr = isoDate(now);

  // Start on current month; allow browsing up to 2 months ahead
  const [navYear, setNavYear] = useState(now.getFullYear());
  const [navMonth, setNavMonth] = useState(now.getMonth());

  // The date cell the student clicked — may have multiple time slots
  const [focusedDate, setFocusedDate] = useState<string | null>(null);

  const grid = useMemo(() => buildGrid(navYear, navMonth), [navYear, navMonth]);

  // Compute the max browseable month (2 months ahead)
  const maxMonth = now.getMonth() + 2;
  const maxYear = now.getFullYear() + Math.floor(maxMonth / 12);
  const normMax = maxMonth % 12;
  const atMin = navYear === now.getFullYear() && navMonth === now.getMonth();
  const atMax = navYear === maxYear && navMonth === normMax;

  const prevMonth = () => {
    if (atMin) return;
    if (navMonth === 0) {
      setNavYear((y) => y - 1);
      setNavMonth(11);
    } else setNavMonth((m) => m - 1);
    setFocusedDate(null);
  };
  const nextMonth = () => {
    if (atMax) return;
    if (navMonth === 11) {
      setNavYear((y) => y + 1);
      setNavMonth(0);
    } else setNavMonth((m) => m + 1);
    setFocusedDate(null);
  };

  // Days in this month that have at least one slot
  const activeDays = useMemo(() => {
    const set = new Set<string>();
    grid.forEach((d) => {
      if (!d) return;
      if (slotsForDate(d, teacher.schedules).length > 0) set.add(isoDate(d));
    });
    return set;
  }, [grid, teacher.schedules]);

  // Slots for the focused date
  const focusedSlots = useMemo(() => {
    if (!focusedDate) return [];
    const [fy, fm, fd] = focusedDate.split("-").map(Number);
    const d = new Date(fy, fm - 1, fd);
    return slotsForDate(d, teacher.schedules).map(
      (s): AvailableSlot => ({
        date: focusedDate,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }),
    );
  }, [focusedDate, teacher.schedules]);

  // Selected date string (derived from selected slot key)
  const selectedDate = selected ? selected.split("|")[0] : null;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays className="w-3.5 h-3.5" style={{ color: accent }} />
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: `${accent}99` }}
        >
          Available Sessions
        </p>
      </div>
      <p className="text-[11px] text-royal-cream/35 -mt-2">
        Tap a highlighted day to see available times, then select your preferred
        slot.
      </p>

      {/* ── Calendar ── */}
      <div
        className="rounded-2xl overflow-hidden border"
        style={{
          background: "rgba(255,255,255,0.02)",
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        {/* Month nav */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <button
            onClick={prevMonth}
            disabled={atMin}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-20"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-royal-cream/80">
            {MONTH_NAMES[navMonth]} {navYear}
          </span>
          <button
            onClick={nextMonth}
            disabled={atMax}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-20"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div
          className="grid border-b"
          style={{
            gridTemplateColumns: "repeat(7,1fr)",
            borderColor: "rgba(255,255,255,0.04)",
          }}
        >
          {DAY_SHORT.map((d) => (
            <div key={d} className="py-2 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-royal-cream/25">
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div
          className="grid p-2 gap-1"
          style={{ gridTemplateColumns: "repeat(7,1fr)" }}
        >
          {grid.map((date, idx) => {
            if (!date) return <div key={idx} />;

            const str = isoDate(date);
            const isPast = str < todayStr;
            const hasSlots = activeDays.has(str);
            const isFocused = focusedDate === str;
            const isSelected = selectedDate === str;

            const disabled = isPast || !hasSlots;

            return (
              <button
                key={str}
                disabled={disabled}
                onClick={() => setFocusedDate(isFocused ? null : str)}
                className="aspect-square rounded-xl flex items-center justify-center text-xs font-medium transition-all duration-150 relative"
                style={{
                  background: isSelected
                    ? accent
                    : isFocused
                      ? `${accent}28`
                      : hasSlots && !isPast
                        ? `${accent}10`
                        : "transparent",
                  color: isSelected
                    ? "#100e0c"
                    : hasSlots && !isPast
                      ? "rgba(255,255,255,0.85)"
                      : "rgba(255,255,255,0.18)",
                  border:
                    isFocused && !isSelected
                      ? `1px solid ${accent}60`
                      : "1px solid transparent",
                  cursor: disabled ? "default" : "pointer",
                }}
              >
                {date.getDate()}
                {/* Dot indicator for available days */}
                {hasSlots && !isPast && !isSelected && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: accent }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div
          className="flex items-center gap-4 px-4 py-2.5 border-t"
          style={{ borderColor: "rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: accent }}
            />
            <span className="text-[10px] text-royal-cream/30">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white/10" />
            <span className="text-[10px] text-royal-cream/30">Unavailable</span>
          </div>
          {selectedDate && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: accent }}
              />
              <span className="text-[10px]" style={{ color: accent }}>
                Selected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Time slot picker (shown when a date is focused) ── */}
      <AnimatePresence>
        {focusedDate && focusedSlots.length > 0 && (
          <motion.div
            key={focusedDate}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3 h-3" style={{ color: `${accent}80` }} />
              <p
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: `${accent}80` }}
              >
                {(() => {
                  const [fy, fm, fd] = focusedDate.split("-").map(Number);
                  return new Date(fy, fm - 1, fd).toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  });
                })()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {focusedSlots.map((slot) => {
                const key = slotKey(slot);
                const isSel = selected === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      onSelect(slot);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200"
                    style={
                      isSel
                        ? {
                            background: `${accent}22`,
                            borderColor: accent,
                            color: accent,
                          }
                        : {
                            background: "rgba(255,255,255,0.03)",
                            borderColor: "rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.6)",
                          }
                    }
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {slot.startTime} – {slot.endTime}
                  </button>
                );
              })}
            </div>
            {focusedSlots.length === 0 && (
              <p className="text-[11px] text-royal-cream/30">
                No time slots available for this day.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Confirmed selection summary ── */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ background: `${accent}10`, borderColor: `${accent}30` }}
          >
            <CalendarDays
              className="w-4 h-4 flex-shrink-0"
              style={{ color: accent }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: accent }}>
                {(() => {
                  const [date, start, end] = selected.split("|");
                  const [y, m, d] = date.split("-").map(Number);
                  const dt = new Date(y, m - 1, d); // local time — no UTC ambiguity
                  return `${dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · ${start}–${end}`;
                })()}
              </p>
              <p className="text-[10px] text-royal-cream/35 mt-0.5">
                First session date · change by tapping another date
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
