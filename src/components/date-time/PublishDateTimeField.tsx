"use client";

import { useState } from "react";
import DatePicker from "@/components/date-time/DatePicker";
import TimePicker from "@/components/date-time/TimePicker";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Splits "2024-03-15T14:30" into { date: "2024-03-15", time: "14:30" }
function splitDatetime(iso: string) {
  if (!iso) return { date: "", time: "" };
  const [date, time] = iso.split("T");
  return { date: date ?? "", time: time?.slice(0, 5) ?? "" };
}

const fieldClassName =
  "w-full text-l rounded-lg border px-3 py-2 outline-none focus:border-amber-500/50 transition-all duration-150";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  name: string;
  defaultValue?: string; // "YYYY-MM-DDTHH:MM"
  inputStyle: React.CSSProperties;
  required?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PublishDateTimeField({
  name,
  defaultValue = "",
  inputStyle,
  required = false,
}: Props) {
  const { date: initDate, time: initTime } = splitDatetime(defaultValue);

  const [date, setDate] = useState(initDate);
  const [time, setTime] = useState(initTime);

  // Combined value submitted to the server — matches what datetime-local used to produce
  const combined =
    date && time ? `${date}T${time}` : date ? `${date}T00:00` : "";

  return (
    <div className="space-y-2">
      {/* Single hidden input carries the full datetime-local value */}
      <input type="hidden" name={name} value={combined} />

      {/* Date row */}
      <DatePicker
        id={`${name}_date`}
        name={`${name}_date`} // ignored — real value is in hidden input above
        defaultValue={initDate}
        placeholder="Select date"
        theme="dark"
        fieldClassName={fieldClassName}
        inputStyle={inputStyle}
        required={required}
        onChange={setDate}
      />

      {/* Time row */}
      <TimePicker
        id={`${name}_time`}
        name={`${name}_time`} // ignored
        defaultValue={initTime}
        placeholder="Select time"
        theme="dark"
        fieldClassName={fieldClassName}
        inputStyle={inputStyle}
        onChange={setTime}
      />
    </div>
  );
}
