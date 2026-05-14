"use client";

/**
 * TeacherAvailabilityPicker — Preply-inspired redesign
 *
 * Clean white card, vibrant teal accent, pill-shaped time slots,
 * animated transitions. Same functionality as the original.
 *
 * Props:
 *   teacher      — the selected SubClassTeacherInfo (carries schedules)
 *   accent       — theme color hex string (defaults to Preply teal #00c896)
 *   onSelect     — called with { date, dayOfWeek, startTime, endTime }
 *   selected     — currently selected slot key "YYYY-MM-DD|startTime|endTime" | null
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock3 } from "lucide-react";
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

const JS_DAY_TO_ENUM: Record<number, string> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildGrid(year: number, month: number): (Date | null)[] {
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

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatSelectedSummary(selected: string): string {
  const [date, start, end] = selected.split("|");
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · ${start}–${end}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  teacher: SubClassTeacherInfo;
  accent?: string;
  selected: SlotKey | null;
  onSelect: (slot: AvailableSlot) => void;
}

export function TeacherAvailabilityPicker({
  teacher,
  accent = "#00c896",
  selected,
  onSelect,
}: Props) {
  const now = new Date();
  const todayStr = isoDate(now);

  const [navYear, setNavYear] = useState(now.getFullYear());
  const [navMonth, setNavMonth] = useState(now.getMonth());
  const [focusedDate, setFocusedDate] = useState<string | null>(null);

  const grid = useMemo(() => buildGrid(navYear, navMonth), [navYear, navMonth]);

  // Max: 2 months ahead
  const maxRaw = now.getMonth() + 2;
  const maxYear = now.getFullYear() + Math.floor(maxRaw / 12);
  const normMax = maxRaw % 12;
  const atMin = navYear === now.getFullYear() && navMonth === now.getMonth();
  const atMax = navYear === maxYear && navMonth === normMax;

  const prevMonth = () => {
    if (atMin) return;
    navMonth === 0
      ? (setNavYear((y) => y - 1), setNavMonth(11))
      : setNavMonth((m) => m - 1);
    setFocusedDate(null);
  };
  const nextMonth = () => {
    if (atMax) return;
    navMonth === 11
      ? (setNavYear((y) => y + 1), setNavMonth(0))
      : setNavMonth((m) => m + 1);
    setFocusedDate(null);
  };

  const activeDays = useMemo(() => {
    const set = new Set<string>();
    grid.forEach((d) => {
      if (!d) return;
      if (slotsForDate(d, teacher.schedules).length > 0) set.add(isoDate(d));
    });
    return set;
  }, [grid, teacher.schedules]);

  const focusedSlots = useMemo((): AvailableSlot[] => {
    if (!focusedDate) return [];
    const [fy, fm, fd] = focusedDate.split("-").map(Number);
    const d = new Date(fy, fm - 1, fd);
    return slotsForDate(d, teacher.schedules).map((s) => ({
      date: focusedDate,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
    }));
  }, [focusedDate, teacher.schedules]);

  const selectedDate = selected ? selected.split("|")[0] : null;

  // Derive a slightly darker shade of accent for hover states
  const accentLight = `${accent}18`; // ~10% opacity
  const accentMedium = `${accent}30`; // ~19% opacity
  const accentStrong = `${accent}20`; // slot hover

  return (
    <div
      className="w-full rounded-3xl overflow-hidden shadow-xl"
      style={{
        background: "#ffffff",
        fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif",
      }}
    >
      {/* ── Top header bar ── */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "1.5px solid #f0f0f0" }}
      >
        <div>
          <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
            Schedule a lesson
          </p>
          <p className="text-[22px] font-bold text-gray-900 leading-tight mt-0.5">
            Pick a date & time
          </p>
        </div>
        {selected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold"
            style={{ background: accentLight, color: accent }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Booked
          </motion.div>
        )}
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* ── Month navigation ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevMonth}
            disabled={atMin}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-25"
            style={{ background: "#f4f4f4", color: "#555" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <motion.span
            key={`${navYear}-${navMonth}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="text-[16px] font-bold text-gray-800"
          >
            {MONTH_NAMES[navMonth]} {navYear}
          </motion.span>

          <button
            onClick={nextMonth}
            disabled={atMax}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-25"
            style={{ background: "#f4f4f4", color: "#555" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* ── Day-of-week headers ── */}
        <div className="grid grid-cols-7 gap-1">
          {DAY_SHORT.map((d) => (
            <div key={d} className="text-center py-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* ── Date grid ── */}
        <motion.div
          key={`${navYear}-${navMonth}-grid`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1"
        >
          {grid.map((date, idx) => {
            if (!date) return <div key={idx} className="aspect-square" />;

            const str = isoDate(date);
            const isPast = str < todayStr;
            const hasSlots = activeDays.has(str);
            const isFocused = focusedDate === str;
            const isSelected = selectedDate === str;
            const isToday = str === todayStr;
            const disabled = isPast || !hasSlots;

            let bgColor = "transparent";
            let textColor = isPast ? "#c8c8c8" : hasSlots ? "#111" : "#b0b0b0";
            let borderStr = "1.5px solid transparent";
            const fontWeight = hasSlots && !isPast ? "700" : "400";

            if (isSelected) {
              bgColor = accent;
              textColor = "#fff";
              borderStr = `1.5px solid ${accent}`;
            } else if (isFocused) {
              bgColor = accentLight;
              borderStr = `1.5px solid ${accent}`;
              textColor = accent;
            } else if (hasSlots && !isPast) {
              bgColor = "#f8f8f8";
              borderStr = "1.5px solid #ececec";
            }

            return (
              <button
                key={str}
                disabled={disabled}
                onClick={() => setFocusedDate(isFocused ? null : str)}
                className="aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-150 relative group"
                style={{
                  background: bgColor,
                  color: textColor,
                  border: borderStr,
                  fontWeight,
                  fontSize: "13px",
                  cursor: disabled ? "default" : "pointer",
                }}
              >
                {date.getDate()}

                {/* Today underline dot */}
                {isToday && !isSelected && (
                  <span
                    className="absolute bottom-[5px] w-1 h-1 rounded-full"
                    style={{ background: isSelected ? "#fff" : accent }}
                  />
                )}

                {/* Available dot */}
                {hasSlots && !isPast && !isSelected && !isFocused && (
                  <span
                    className="absolute bottom-[5px] w-1.5 h-1.5 rounded-full"
                    style={{ background: accent, opacity: 0.7 }}
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* ── Legend ── */}
        <div className="flex items-center gap-5 pt-1">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: accent }}
            />
            <span className="text-[11px] text-gray-400 font-medium">
              Available
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-200" />
            <span className="text-[11px] text-gray-400 font-medium">
              Unavailable
            </span>
          </div>
          {selectedDate && (
            <div className="flex items-center gap-1.5 ml-auto">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: accent }}
              />
              <span
                className="text-[11px] font-semibold"
                style={{ color: accent }}
              >
                Selected
              </span>
            </div>
          )}
        </div>

        {/* ── Time slot picker ── */}
        <AnimatePresence mode="wait">
          {focusedDate && focusedSlots.length > 0 && (
            <motion.div
              key={focusedDate}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="pt-1 space-y-3"
            >
              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-100" />
                <div className="flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5" style={{ color: accent }} />
                  <span
                    className="text-[12px] font-bold uppercase tracking-widest"
                    style={{ color: accent }}
                  >
                    {formatDisplayDate(focusedDate)}
                  </span>
                </div>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {/* Slot pills */}
              <div className="flex flex-wrap gap-2">
                {focusedSlots.map((slot) => {
                  const key = slotKey(slot);
                  const isSel = selected === key;

                  return (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onSelect(slot)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150 border"
                      style={
                        isSel
                          ? {
                              background: accent,
                              borderColor: accent,
                              color: "#fff",
                              boxShadow: `0 4px 14px ${accentMedium}`,
                            }
                          : {
                              background: "#f5f5f5",
                              borderColor: "#e8e8e8",
                              color: "#333",
                            }
                      }
                    >
                      <Clock3 className="w-3.5 h-3.5" />
                      {slot.startTime} – {slot.endTime}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Confirmed selection summary ── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
              style={{
                background: accentLight,
                border: `1.5px solid ${accentMedium}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: accent }}
              >
                <CheckCircle2 className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold" style={{ color: accent }}>
                  {formatSelectedSummary(selected)}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  First session · tap another date to change
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
