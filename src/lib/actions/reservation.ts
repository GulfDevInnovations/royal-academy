// src/lib/actions/reservation.ts
"use server";

import { PrismaClient } from "@prisma/client";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  parseISO,
  isWithinInterval,
} from "date-fns";

const prisma = new PrismaClient();

export type SessionForCalendar = {
  id: string;
  sessionDate: string; // ISO date string "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  status: string;
  isActualSession: boolean; // true = ClassSession, false = generated from schedule
  scheduleId: string;
  subClass: {
    id: string;
    name: string;
    description: string | null;
    price: string;
    currency: string;
    level: string | null;
    ageGroup: string | null;
    durationMinutes: number;
    capacity: number;
    coverUrl: string | null;
    class: {
      name: string;
      iconUrl: string | null;
    };
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    bio: string | null;
    photoUrl: string | null;
    specialties: string[];
  };
  room: {
    name: string;
    location: {
      name: string;
      isOnline: boolean;
    };
  } | null;
  spotsLeft: number;
  onlineLink: string | null;
};

const DAY_MAP: Record<string, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export async function getSessionsForMonth(
  year: number,
  month: number // 0-indexed (JS Date month)
): Promise<SessionForCalendar[]> {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));

  // 1. Fetch actual ClassSessions in this month
  const actualSessions = await prisma.classSession.findMany({
    where: {
      sessionDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      status: { not: "CANCELLED" },
    },
    include: {
      schedule: {
        include: {
          subClass: { include: { class: true } },
          teacher: true,
          room: { include: { location: true } },
        },
      },
      bookings: { where: { status: { not: "CANCELLED" } } },
    },
  });

  // 2. Fetch active ClassSchedules that overlap with this month
  const schedules = await prisma.classSchedule.findMany({
    where: {
      status: "ACTIVE",
      startDate: { lte: monthEnd },
      OR: [{ endDate: null }, { endDate: { gte: monthStart } }],
    },
    include: {
      subClass: { include: { class: true } },
      teacher: true,
      room: { include: { location: true } },
      sessions: {
        where: {
          sessionDate: { gte: monthStart, lte: monthEnd },
        },
      },
    },
  });

  // Map of scheduleId+date → actual session (for override)
  const actualSessionMap = new Map<string, (typeof actualSessions)[0]>();
  for (const s of actualSessions) {
    const dateKey = format(s.sessionDate, "yyyy-MM-dd");
    actualSessionMap.set(`${s.scheduleId}:${dateKey}`, s);
  }

  const results: SessionForCalendar[] = [];

  // 3. Generate virtual sessions from schedules
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  for (const schedule of schedules) {
    const scheduleDayNum = DAY_MAP[schedule.dayOfWeek];

    for (const day of allDays) {
      if (day.getDay() !== scheduleDayNum) continue;

      // Check day is within schedule active range
      if (!isWithinInterval(day, { start: schedule.startDate, end: schedule.endDate ?? monthEnd })) continue;

      const dateKey = format(day, "yyyy-MM-dd");
      const mapKey = `${schedule.id}:${dateKey}`;

      // Check if there's an actual session for this slot (override)
      const actual = actualSessionMap.get(mapKey);

      if (actual) {
        // Use actual session data
        results.push(mapActualSession(actual, dateKey));
      } else {
        // Check no explicit ClassSession exists that was cancelled for this slot
        const cancelledExists = schedule.sessions.some(
          (s) => format(s.sessionDate, "yyyy-MM-dd") === dateKey && s.status === "CANCELLED"
        );
        if (cancelledExists) continue;

        // Generate virtual session from schedule
        results.push(mapScheduleToVirtual(schedule, dateKey));
      }
    }
  }

  // Also add actual sessions that don't match a schedule day pattern (one-offs)
  for (const actual of actualSessions) {
    const dateKey = format(actual.sessionDate, "yyyy-MM-dd");
    const mapKey = `${actual.scheduleId}:${dateKey}`;
    if (!actualSessionMap.has(mapKey) || results.some((r) => r.id === actual.id)) continue;
    results.push(mapActualSession(actual, dateKey));
  }

  return results.sort((a, b) => {
    if (a.sessionDate !== b.sessionDate) return a.sessionDate.localeCompare(b.sessionDate);
    return a.startTime.localeCompare(b.startTime);
  });
}

function mapActualSession(
  s: Awaited<ReturnType<typeof prisma.classSession.findMany>>[0] & {
    schedule: {
      subClass: { class: { name: string; iconUrl: string | null }; name: string; description: string | null; price: any; currency: string; level: string | null; ageGroup: string | null; durationMinutes: number; capacity: number; coverUrl: string | null; id: string };
      teacher: { id: string; firstName: string; lastName: string; bio: string | null; photoUrl: string | null; specialties: string[] };
      room: { name: string; location: { name: string; isOnline: boolean } } | null;
      maxCapacity: number;
      onlineLink: string | null;
    };
    bookings: { id: string }[];
  },
  dateKey: string
): SessionForCalendar {
  return {
    id: s.id,
    sessionDate: dateKey,
    startTime: s.startTime,
    endTime: s.endTime,
    status: s.status,
    isActualSession: true,
    scheduleId: s.scheduleId,
    subClass: {
      id: s.schedule.subClass.id,
      name: s.schedule.subClass.name,
      description: s.schedule.subClass.description,
      price: s.schedule.subClass.price.toString(),
      currency: s.schedule.subClass.currency,
      level: s.schedule.subClass.level,
      ageGroup: s.schedule.subClass.ageGroup,
      durationMinutes: s.schedule.subClass.durationMinutes,
      capacity: s.schedule.subClass.capacity,
      coverUrl: s.schedule.subClass.coverUrl,
      class: s.schedule.subClass.class,
    },
    teacher: s.schedule.teacher,
    room: s.schedule.room,
    spotsLeft: s.schedule.maxCapacity - s.bookings.length,
    onlineLink: s.schedule.onlineLink,
  };
}

function mapScheduleToVirtual(
  schedule: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    maxCapacity: number;
    currentEnrolled: number;
    onlineLink: string | null;
    subClass: {
      id: string;
      name: string;
      description: string | null;
      price: any;
      currency: string;
      level: string | null;
      ageGroup: string | null;
      durationMinutes: number;
      capacity: number;
      coverUrl: string | null;
      class: { name: string; iconUrl: string | null };
    };
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
      bio: string | null;
      photoUrl: string | null;
      specialties: string[];
    };
    room: { name: string; location: { name: string; isOnline: boolean } } | null;
  },
  dateKey: string
): SessionForCalendar {
  return {
    id: `virtual:${schedule.id}:${dateKey}`,
    sessionDate: dateKey,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    status: schedule.status,
    isActualSession: false,
    scheduleId: schedule.id,
    subClass: {
      id: schedule.subClass.id,
      name: schedule.subClass.name,
      description: schedule.subClass.description,
      price: schedule.subClass.price.toString(),
      currency: schedule.subClass.currency,
      level: schedule.subClass.level,
      ageGroup: schedule.subClass.ageGroup,
      durationMinutes: schedule.subClass.durationMinutes,
      capacity: schedule.subClass.capacity,
      coverUrl: schedule.subClass.coverUrl,
      class: schedule.subClass.class,
    },
    teacher: schedule.teacher,
    room: schedule.room,
    spotsLeft: schedule.maxCapacity - schedule.currentEnrolled,
    onlineLink: schedule.onlineLink,
  };
}

export async function createBooking(
  sessionId: string,
  scheduleId: string,
  sessionDate: string,
  studentId: string
): Promise<{ bookingId: string; paymentNeeded: boolean }> {
  // If virtual session (no real ClassSession yet), create one first
  let realSessionId = sessionId;

  if (sessionId.startsWith("virtual:")) {
    const existing = await prisma.classSession.findFirst({
      where: {
        scheduleId,
        sessionDate: new Date(sessionDate),
      },
    });

    if (existing) {
      realSessionId = existing.id;
    } else {
      const schedule = await prisma.classSchedule.findUniqueOrThrow({
        where: { id: scheduleId },
      });
      const newSession = await prisma.classSession.create({
        data: {
          scheduleId,
          sessionDate: new Date(sessionDate),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          status: "ACTIVE",
        },
      });
      realSessionId = newSession.id;
    }
  }

  const booking = await prisma.booking.create({
    data: {
      studentId,
      sessionId: realSessionId,
      status: "PENDING",
    },
  });

  // Create pending payment record
  const session = await prisma.classSession.findUniqueOrThrow({
    where: { id: realSessionId },
    include: {
      schedule: {
        include: { subClass: true },
      },
    },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: session.schedule.subClass.price,
      currency: session.schedule.subClass.currency,
      status: "PENDING",
    },
  });

  return { bookingId: booking.id, paymentNeeded: true };
}