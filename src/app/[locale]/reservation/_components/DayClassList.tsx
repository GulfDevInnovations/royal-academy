"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SessionForCalendar } from "@/lib/actions/reservation";
import { ClassCard } from "./ClassCard";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";

interface DayClassListProps {
  date: Date | undefined;
  sessions: SessionForCalendar[];
  onSelectSession: (session: SessionForCalendar) => void;
}

export function DayClassList({
  date,
  sessions,
  onSelectSession,
}: DayClassListProps) {
  if (!date) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <CalendarDays className="w-10 h-10 text-royal-cream/20 mb-3" />
        <p className="text-royal-cream/40 text-sm">
          Select a date on the calendar to see available classes
        </p>
      </div>
    );
  }

  const dateLabel = format(date, "EEEE, MMMM d");

  return (
    <div>
      {/* Date header */}
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-royal-cream font-goudy">
            {dateLabel}
          </h2>
          <p className="text-xs text-royal-cream/40 mt-0.5">
            {sessions.length === 0
              ? "No classes scheduled"
              : `${sessions.length} class${sessions.length > 1 ? "es" : ""} available`}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {sessions.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-royal-cream/5 flex items-center justify-center mb-4">
              <CalendarDays className="w-8 h-8 text-royal-cream/20" />
            </div>
            <p className="text-royal-cream/40 text-sm">
              No classes on this day
            </p>
            <p className="text-royal-cream/25 text-xs mt-1">
              Try selecting a different date
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
              >
                <ClassCard session={session} onClick={onSelectSession} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
