"use client";

import { useEffect, useRef, useState } from "react";
import {
  DrumColumn,
  DrumSeparator,
  PICKER_THEMES,
  type PickerTheme,
} from "./DrumPicker";

// ─── Data ─────────────────────────────────────────────────────────────────────

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);

const MONTHS_EN = [
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

const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1929 }, (_, i) =>
  String(currentYear - i),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISODate(dayIdx: number, monthIdx: number, year: string): string {
  return `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(dayIdx + 1).padStart(2, "0")}`;
}

function parseISO(iso: string) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const yearIdx = YEARS.indexOf(String(y));
  return {
    dayIdx: d - 1,
    monthIdx: m - 1,
    yearIdx: yearIdx >= 0 ? yearIdx : 0,
  };
}

function formatDisplay(
  dayIdx: number,
  monthIdx: number,
  yearIdx: number,
  locale: "en" | "ar",
) {
  const months = locale === "ar" ? MONTHS_AR : MONTHS_EN;
  return `${String(dayIdx + 1).padStart(2, "0")} ${months[monthIdx]} ${YEARS[yearIdx]}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  locale?: "en" | "ar";
  required?: boolean;
  theme?: PickerTheme;
  fieldClassName: string;
  inputStyle: React.CSSProperties;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  onChange?: (isoDate: string) => void; // "YYYY-MM-DD"
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function DatePicker({
  id,
  name,
  label,
  placeholder,
  defaultValue = "",
  locale = "en",
  required = false,
  theme = "sand",
  fieldClassName,
  inputStyle,
  ariaInvalid,
  ariaDescribedBy,
  onChange,
}: Props) {
  const t = PICKER_THEMES[theme];
  const parsed = parseISO(defaultValue);

  const [dayIdx, setDayIdx] = useState(parsed?.dayIdx ?? 0);
  const [monthIdx, setMonthIdx] = useState(parsed?.monthIdx ?? 0);
  const [yearIdx, setYearIdx] = useState(parsed?.yearIdx ?? 20);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const months = locale === "ar" ? MONTHS_AR : MONTHS_EN;

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches);
    const h = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ── Handlers that update state AND call onChange ───────────────────────────

  const handleDayChange = (i: number) => {
    setDayIdx(i);
    onChange?.(toISODate(i, monthIdx, YEARS[yearIdx]));
  };

  const handleMonthChange = (i: number) => {
    setMonthIdx(i);
    onChange?.(toISODate(dayIdx, i, YEARS[yearIdx]));
  };

  const handleYearChange = (i: number) => {
    setYearIdx(i);
    onChange?.(toISODate(dayIdx, monthIdx, YEARS[i]));
  };

  // ─────────────────────────────────────────────────────────────────────────

  const isoValue = toISODate(dayIdx, monthIdx, YEARS[yearIdx]);
  const displayValue = formatDisplay(dayIdx, monthIdx, yearIdx, locale);
  const defaultPlaceholder =
    placeholder ?? (locale === "ar" ? "اختر التاريخ" : "Select date");

  // ── Mobile ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm"
            style={{ color: t.text }}
          >
            {label}
            {required && <span style={{ color: "#f87171" }}> *</span>}
          </label>
        )}
        <input
          id={id}
          type="date"
          name={name}
          className={fieldClassName}
          style={inputStyle}
          defaultValue={defaultValue}
          required={required}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    );
  }

  // ── Desktop ───────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} className="space-y-1.5 relative">
      {/* Hidden input for standalone use (when onChange is not used) */}
      <input type="hidden" name={name} value={isoValue} />

      {label && (
        <label htmlFor={id} className="block text-sm" style={{ color: t.text }}>
          {label}
          {required && <span style={{ color: "#f87171" }}> *</span>}
        </label>
      )}

      <button
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        onClick={() => setOpen((p) => !p)}
        className={`${fieldClassName} w-full text-left flex items-center justify-between gap-2`}
        style={{ ...inputStyle, unicodeBidi: "plaintext", textAlign: "start" }}
      >
        <span
          style={{
            color: defaultValue || open ? t.triggerText : t.placeholder,
            fontFamily: "Tahoma, Arial, sans-serif",
          }}
        >
          {displayValue || defaultPlaceholder}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="w-4 h-4 flex-shrink-0"
          stroke={t.iconStroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="16" height="16" rx="3" />
          <path d="M2 8h16M7 2v2M13 2v2" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={locale === "ar" ? "اختيار التاريخ" : "Date picker"}
          className="absolute z-40 mt-1 rounded-2xl"
          style={{ ...t.popup, minWidth: "300px" }}
        >
          <div className="flex items-start justify-center gap-2 px-5 py-5">
            <DrumColumn
              items={DAYS}
              selectedIndex={dayIdx}
              onSelect={handleDayChange}
              theme={theme}
              label={locale === "ar" ? "يوم" : "Day"}
            />
            <DrumSeparator char="." theme={theme} />
            <DrumColumn
              items={months}
              selectedIndex={monthIdx}
              onSelect={handleMonthChange}
              theme={theme}
              label={locale === "ar" ? "شهر" : "Month"}
            />
            <DrumSeparator char="." theme={theme} />
            <DrumColumn
              items={YEARS}
              selectedIndex={yearIdx}
              onSelect={handleYearChange}
              theme={theme}
              label={locale === "ar" ? "سنة" : "Year"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
