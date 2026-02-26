"use client";

import { DayPicker } from "react-day-picker";
import { format, isSameDay, parseISO } from "date-fns";
import { SessionForCalendar } from "@/lib/actions/reservation";
import { useMemo } from "react";

interface ReservationCalendarProps {
  sessions: SessionForCalendar[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
}

// Color palette per class category
const CLASS_COLORS: Record<string, string> = {
  Piano: "#C9A84C",
  Dance: "#A855F7",
  Ballet: "#EC4899",
  Violin: "#3B82F6",
  Guitar: "#10B981",
  Painting: "#F97316",
  Singing: "#EF4444",
  default: "#94A3B8",
};

function getClassColor(className: string): string {
  return CLASS_COLORS[className] ?? CLASS_COLORS.default;
}

export function ReservationCalendar({
  sessions,
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
}: ReservationCalendarProps) {
  // Map date string → unique class names for that day
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, SessionForCalendar[]>();
    for (const s of sessions) {
      const key = s.sessionDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [sessions]);

  return (
    <div className="reservation-calendar">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={onSelectDate}
        month={currentMonth}
        onMonthChange={onMonthChange}
        showOutsideDays={false}
        components={{
          DayButton: ({ day, modifiers, ...buttonProps }) => {
            const dateKey = format(day.date, "yyyy-MM-dd");
            const daySessions = sessionsByDate.get(dateKey) ?? [];
            const isSelected = selectedDate
              ? isSameDay(day.date, selectedDate)
              : false;
            const isToday = modifiers.today;
            const isPast = day.date < new Date(new Date().setHours(0, 0, 0, 0));

            // Get unique class names for dots (max 3)
            const uniqueClasses = [
              ...new Set(daySessions.map((s) => s.subClass.class.name)),
            ].slice(0, 3);

            return (
              <button
                {...buttonProps}
                className={`
                  relative flex flex-col items-center justify-start
                  w-full h-full min-h-[52px] pt-1.5 pb-1 px-0.5
                  rounded-lg transition-all duration-200 group
                  ${
                    isSelected
                      ? "bg-royal-gold text-royal-dark font-bold shadow-lg shadow-royal-gold/30"
                      : isToday
                        ? "bg-royal-cream/10 text-royal-gold border border-royal-gold/40"
                        : isPast
                          ? "text-royal-cream/30 cursor-default"
                          : daySessions.length > 0
                            ? "text-royal-cream hover:bg-royal-cream/10 cursor-pointer"
                            : "text-royal-cream/50 cursor-default"
                  }
                `}
              >
                <span className="text-sm leading-none">
                  {format(day.date, "d")}
                </span>

                {/* Session dots */}
                {daySessions.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full px-1">
                    {uniqueClasses.map((cls) => (
                      <span
                        key={cls}
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getClassColor(cls) }}
                      />
                    ))}
                    {daySessions.length > 3 && (
                      <span className="text-[8px] text-royal-cream/60 leading-none self-center">
                        +{daySessions.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Session count badge on hover */}
                {daySessions.length > 0 && !isSelected && !isPast && (
                  <span
                    className="
                      absolute -top-1 -right-1 hidden group-hover:flex
                      items-center justify-center
                      w-4 h-4 rounded-full bg-royal-gold text-royal-dark
                      text-[9px] font-bold leading-none
                    "
                  >
                    {daySessions.length}
                  </span>
                )}
              </button>
            );
          },
        }}
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full",
          month_caption: "flex items-center justify-between px-2 mb-4",
          caption_label:
            "text-xl font-bold text-royal-gold tracking-wide font-goudy",
          nav: "flex gap-2",
          button_previous:
            "w-8 h-8 flex items-center justify-center rounded-full border border-royal-gold/30 text-royal-gold hover:bg-royal-gold/10 transition-colors",
          button_next:
            "w-8 h-8 flex items-center justify-center rounded-full border border-royal-gold/30 text-royal-gold hover:bg-royal-gold/10 transition-colors",
          month_grid: "w-full border-separate border-spacing-1",
          weekdays: "mb-1",
          weekday:
            "text-center text-xs font-semibold text-royal-cream/40 uppercase tracking-widest py-1",
          week: "",
          day: "p-0",
          today: "",
          selected: "",
          outside: "opacity-0 pointer-events-none",
          disabled: "",
        }}
      />

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-royal-cream/10 flex flex-wrap gap-x-4 gap-y-2">
        {Object.entries(CLASS_COLORS)
          .filter(([k]) => k !== "default")
          .map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-royal-cream/50">{name}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
