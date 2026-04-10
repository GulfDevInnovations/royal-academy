"use client";

import { useEffect, useRef, useState } from "react";
import {
  DrumColumn,
  DrumSeparator,
  PICKER_THEMES,
  type PickerTheme,
} from "./DrumPicker";

// ─── Data ─────────────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
); // 01–12

const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
); // 00–59

const PERIODS = ["AM", "PM"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTimeValue(
  hourIdx: number,
  minuteIdx: number,
  periodIdx: number,
): string {
  let h = hourIdx + 1; // 1–12
  if (periodIdx === 1 && h !== 12) h += 12; // PM
  if (periodIdx === 0 && h === 12) h = 0; // 12 AM → 00
  return `${String(h).padStart(2, "0")}:${String(minuteIdx).padStart(2, "0")}`;
}

function parseTime(time: string) {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const periodIdx = h >= 12 ? 1 : 0;
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hourIdx: hour12 - 1, minuteIdx: m, periodIdx };
}

function formatDisplay(
  hourIdx: number,
  minuteIdx: number,
  periodIdx: number,
  locale: "en" | "ar",
) {
  const h = String(hourIdx + 1).padStart(2, "0");
  const m = String(minuteIdx).padStart(2, "0");
  const period =
    locale === "ar" ? (periodIdx === 0 ? "ص" : "م") : PERIODS[periodIdx];
  return `${h}:${m} ${period}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  defaultValue?: string; // "HH:MM" 24h
  locale?: "en" | "ar";
  required?: boolean;
  theme?: PickerTheme;
  fieldClassName: string;
  inputStyle: React.CSSProperties;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
  onChange?: (time: string) => void; // "HH:MM" 24h
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimePicker({
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
  const parsed = parseTime(defaultValue);

  const now = new Date();
  const defaultHour = now.getHours() % 12;
  const defaultMinute = now.getMinutes();
  const defaultPeriod = now.getHours() >= 12 ? 1 : 0;

  const [hourIdx, setHourIdx] = useState(parsed?.hourIdx ?? defaultHour);
  const [minuteIdx, setMinuteIdx] = useState(
    parsed?.minuteIdx ?? defaultMinute,
  );
  const [periodIdx, setPeriodIdx] = useState(
    parsed?.periodIdx ?? defaultPeriod,
  );
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const handleHourChange = (i: number) => {
    setHourIdx(i);
    onChange?.(toTimeValue(i, minuteIdx, periodIdx));
  };

  const handleMinuteChange = (i: number) => {
    setMinuteIdx(i);
    onChange?.(toTimeValue(hourIdx, i, periodIdx));
  };

  const handlePeriodChange = (i: number) => {
    setPeriodIdx(i);
    onChange?.(toTimeValue(hourIdx, minuteIdx, i));
  };

  // ─────────────────────────────────────────────────────────────────────────

  const timeValue = toTimeValue(hourIdx, minuteIdx, periodIdx);
  const displayValue = formatDisplay(hourIdx, minuteIdx, periodIdx, locale);
  const defaultPlaceholder =
    placeholder ?? (locale === "ar" ? "اختر الوقت" : "Select time");
  const periodLabels = locale === "ar" ? ["ص", "م"] : PERIODS;

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
          type="time"
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
      <input type="hidden" name={name} value={timeValue} />

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
          <circle cx="10" cy="10" r="8" />
          <path d="M10 6v4l2.5 2.5" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={locale === "ar" ? "اختيار الوقت" : "Time picker"}
          className="absolute z-40 mt-1 rounded-2xl"
          style={{ ...t.popup, minWidth: "240px" }}
        >
          <div className="flex items-start justify-center gap-2 px-5 py-5">
            <DrumColumn
              items={HOURS}
              selectedIndex={hourIdx}
              onSelect={handleHourChange}
              theme={theme}
              label={locale === "ar" ? "ساعة" : "Hour"}
            />
            <DrumSeparator char=":" theme={theme} />
            <DrumColumn
              items={MINUTES}
              selectedIndex={minuteIdx}
              onSelect={handleMinuteChange}
              theme={theme}
              label={locale === "ar" ? "دقيقة" : "Min"}
            />
            <div className="flex flex-col items-center gap-1 select-none ml-1">
              <span
                className="text-xs tracking-widest uppercase pb-1"
                style={{ color: t.columnLabel, letterSpacing: "0.12em" }}
              >
                {locale === "ar" ? "فترة" : "Period"}
              </span>
              <DrumColumn
                items={periodLabels}
                selectedIndex={periodIdx}
                onSelect={handlePeriodChange}
                theme={theme}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
