"use client";

import {
  useState,
  useCallback,
  useEffect,
  useTransition,
  useMemo,
} from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import {
  SessionForCalendar,
  getSessionsForMonth,
  createBooking,
} from "@/lib/actions/reservation";
import { ReservationCalendar } from "./ReservationCalendar";
import { DayClassList } from "./DayClassList";
import { ClassModal } from "./ClassModal";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ReservationPageClientProps {
  initialSessions: SessionForCalendar[];
  preSelectedSessionId?: string;
  preSelectedDate?: string;
}

export function ReservationPageClient({
  initialSessions,
  preSelectedSessionId,
  preSelectedDate,
}: ReservationPageClientProps) {
  const router = useRouter();
  const [sessions, setSessions] =
    useState<SessionForCalendar[]>(initialSessions);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    if (preSelectedDate) return parseISO(preSelectedDate);
    return new Date(); // default to today
  });
  const [selectedSession, setSelectedSession] =
    useState<SessionForCalendar | null>(null);
  const [isLoadingMonth, startMonthTransition] = useTransition();
  const [isBooking, setIsBooking] = useState(false);

  // Sessions for the selected date
  const sessionsForDay = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return sessions.filter((s) => s.sessionDate === dateKey);
  }, [sessions, selectedDate]);

  // Pre-select session from URL param (after login redirect)
  useEffect(() => {
    if (preSelectedSessionId && sessions.length > 0) {
      const session = sessions.find((s) => s.id === preSelectedSessionId);
      if (session) {
        setSelectedDate(parseISO(session.sessionDate));
        setSelectedSession(session);
      }
    }
  }, [preSelectedSessionId, sessions]);

  // Fetch sessions when month changes
  const handleMonthChange = useCallback((month: Date) => {
    setCurrentMonth(month);
    startMonthTransition(async () => {
      const newSessions = await getSessionsForMonth(
        month.getFullYear(),
        month.getMonth(),
      );
      setSessions(newSessions);
    });
  }, []);

  // Handle booking
  const handleBook = useCallback(
    async (session: SessionForCalendar) => {
      setIsBooking(true);
      try {
        // Check if user is logged in
        const authRes = await fetch("/api/auth/check");
        const { authenticated, studentId } = await authRes.json();

        if (!authenticated) {
          // Save intended booking to URL and redirect to login
          const redirectUrl = `/reservation?sessionId=${session.id}&date=${session.sessionDate}`;
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
          return;
        }

        // Create booking + payment record
        const { bookingId } = await createBooking(
          session.id,
          session.scheduleId,
          session.sessionDate,
          studentId,
        );

        // Navigate to payment page
        router.push(`/payment?bookingId=${bookingId}`);
      } catch (err) {
        console.error("Booking error:", err);
        // TODO: show toast error
      } finally {
        setIsBooking(false);
      }
    },
    [router],
  );

  return (
    <>
      <main className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            {/* <p className="text-xs font-semibold uppercase tracking-widest text-royal-gold mb-2">
              Royal Academy
            </p> */}
            <h1 className="text-4xl sm:text-5xl font-bold text-royal-cream font-goudy">
              Reserve a Class
            </h1>
            {/* <p className="text-royal-cream/50 mt-2 max-w-lg">
              Browse available classes, select a date, and book your spot in a
              few clicks.
            </p> */}
          </motion.div>

          {/* Layout: calendar left, class list right */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 xl:gap-10">
            {/* Calendar panel */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="
                relative rounded-2xl border border-royal-cream/10
                bg-linear-to-br from-white/[0.04] to-white/[0.01]
                p-6 sm:p-8
              "
            >
              {/* Month loading overlay */}
              {isLoadingMonth && (
                <div className="absolute inset-0 rounded-2xl bg-royal-dark/60 backdrop-blur-sm z-10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-royal-gold animate-spin" />
                </div>
              )}
              <ReservationCalendar
                sessions={sessions}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                currentMonth={currentMonth}
                onMonthChange={handleMonthChange}
              />
            </motion.div>

            {/* Class list panel */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="
                rounded-2xl border border-royal-cream/10
                bg-gradient-to-br from-white/[0.04] to-white/[0.01]
                p-6
                lg:max-h-[700px] lg:overflow-y-auto
                scrollbar-thin scrollbar-track-transparent scrollbar-thumb-royal-cream/10
              "
            >
              <DayClassList
                date={selectedDate}
                sessions={sessionsForDay}
                onSelectSession={setSelectedSession}
              />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Class detail modal */}
      <ClassModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onBook={handleBook}
        isBooking={isBooking}
      />
    </>
  );
}
