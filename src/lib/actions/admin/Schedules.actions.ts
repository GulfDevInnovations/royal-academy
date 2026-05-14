"use server";

import { prisma } from "@/lib/prisma";
import { DayOfWeek, ClassStatus } from "@prisma/client";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const DAY_INDEX: Record<DayOfWeek, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
};

/**
 * Given a schedule's startDate, endDate, and dayOfWeek,
 * returns every Date that falls on that weekday within the range.
 */
function generateSessionDates(
  startDate: Date,
  endDate: Date,
  dayOfWeek: DayOfWeek
): Date[] {
  const dates: Date[] = [];
  const target = DAY_INDEX[dayOfWeek];
  const cursor = new Date(startDate);

  // Advance to first occurrence of the target weekday
  while (cursor.getDay() !== target) {
    cursor.setDate(cursor.getDate() + 1);
  }

  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return dates;
}

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export async function getSchedules() {
  return prisma.classSchedule.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    include: {
      subClass: {
        select: {
          id: true,
          name: true,
          isReschedulable: true,
          sessionType: true,
          class: { select: { id: true, name: true } },
        },
      },
      teacher: {
        select: { id: true, firstName: true, lastName: true, photoUrl: true },
      },
      _count: { select: { sessions: true } },
      
    },
  });
}

export async function getScheduleById(id: string) {
  return prisma.classSchedule.findUnique({
    where: { id },
    include: {
      subClass: {
        select: { id: true, name: true, class: { select: { id: true, name: true } } },
      },
      teacher: {
        select: { id: true, firstName: true, lastName: true },
      },
      sessions: {
        orderBy: { sessionDate: "asc" },
      },
    },
  });
}

// Options for dropdowns
export async function getScheduleFormOptions() {
  const [subClasses, teachers] = await Promise.all([
    prisma.subClass.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isReschedulable: true,
        sessionType: true,
        class: { select: { id: true, name: true } },
        // Only teachers assigned to this subclass via junction
        teachers: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    }),
    prisma.teacherProfile.findMany({
      where: { isActive: true },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);
  return { subClasses, teachers };
}

// ─────────────────────────────────────────────
// CONFLICT CHECK
// Rules:
//   1. A teacher cannot be in two places at the same time (same day, overlapping time)
//   2. A subclass cannot run twice on the SAME day at overlapping times
//      (it CAN have schedules on different days — that's how once/twice-per-week works)
// ─────────────────────────────────────────────

async function checkConflicts(
  dayOfWeek: DayOfWeek,
  startTime: string,
  endTime: string,
  teacherId: string,
  subClassId: string,
  excludeId?: string
): Promise<string | null> {
  const overlapping = await prisma.classSchedule.findMany({
    where: {
      id:        { not: excludeId },
      dayOfWeek,                        // only same day matters
      status:    { not: "CANCELLED" },
      OR: [{ teacherId }, { subClassId }],
    },
    include: {
      subClass: { select: { name: true } },
      teacher:  { select: { firstName: true, lastName: true } },
    },
  });

  for (const s of overlapping) {
    // Times overlap if startA < endB AND endA > startB
    if (startTime < s.endTime && endTime > s.startTime) {
      if (s.teacherId === teacherId) {
        return `Teacher ${s.teacher.firstName} ${s.teacher.lastName} is already teaching on ${dayOfWeek} from ${s.startTime}–${s.endTime}. Choose a different time or teacher.`;
      }
      if (s.subClassId === subClassId) {
        // Same subclass, same day, overlapping time — this is a genuine conflict.
        // Note: same subclass on a DIFFERENT day is allowed (once/twice-per-week support).
        return `${s.subClass.name} already has a schedule on ${dayOfWeek} from ${s.startTime}–${s.endTime}. A subclass can only run once per day.`;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────
// CREATE — with auto session generation
// ─────────────────────────────────────────────

export async function createSchedule(formData: FormData) {
  const subClassId    = formData.get("subClassId")    as string;
  const teacherId     = formData.get("teacherId")     as string;
  const dayOfWeek     = formData.get("dayOfWeek")     as DayOfWeek;
  const startTime     = formData.get("startTime")     as string;
  const endTime       = formData.get("endTime")       as string;
  const startDateStr  = formData.get("startDate")     as string;
  const endDateStr    = formData.get("endDate")       as string | null;
  const isRecurring   = formData.get("isRecurring")   !== "false";
  const onlineLink    = (formData.get("onlineLink")   as string | null) || null;

  if (!subClassId) return { error: "Sub-class is required." };
  if (!teacherId)  return { error: "Teacher is required." };
  if (!dayOfWeek)  return { error: "Day of week is required." };
  if (!startTime)  return { error: "Start time is required." };
  if (!endTime)    return { error: "End time is required." };
  if (!startDateStr) return { error: "Start date is required." };
  if (startTime >= endTime) return { error: "End time must be after start time." };

  const subClass = await prisma.subClass.findUnique({
    where: { id: subClassId },
    select: { sessionType: true },
  });
  if (!subClass) return { error: "Sub-class not found." };

  const isPrivate = ["MUSIC", "PRIVATE"].includes(subClass.sessionType);
  const maxCapacity = isPrivate
    ? 1
    : parseInt(formData.get("maxCapacity") as string) || 10;


  const startDate = new Date(startDateStr);
  const endDate   = endDateStr ? new Date(endDateStr) : null;

  // Conflict check
  const conflict = await checkConflicts(dayOfWeek, startTime, endTime, teacherId, subClassId);
  if (conflict) return { error: conflict };

  // Create schedule + sessions in a transaction
  const schedule = await prisma.$transaction(async (tx) => {
    const newSchedule = await tx.classSchedule.create({
      data: {
        subClassId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        startDate,
        endDate,
        maxCapacity,
        isRecurring,
        onlineLink,
        status: "ACTIVE",
      },
    });

    if (endDate) {
  const sessionDates = generateSessionDates(startDate, endDate, dayOfWeek);
  if (sessionDates.length > 0) {
    await tx.classSession.createMany({
      data: sessionDates.map((date) => {
        const [hours, minutes] = startTime.split(":").map(Number);
        const sessionDatetime = new Date(date);
        sessionDatetime.setHours(hours, minutes, 0, 0);
        return {
          scheduleId:      newSchedule.id,
          sessionDate:     date,
          startTime,
          endTime,
          sessionDatetime,
          status:          "ACTIVE" as ClassStatus,
        };
      }),
      skipDuplicates: true,
    });
  }
}

    return newSchedule;
  });

  return { success: true, scheduleId: schedule.id };
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updateSchedule(id: string, formData: FormData) {
  const teacherId   = formData.get("teacherId")   as string;
  const dayOfWeek   = formData.get("dayOfWeek")   as DayOfWeek;
  const startTime   = formData.get("startTime")   as string;
  const endTime     = formData.get("endTime")     as string;
  const onlineLink  = (formData.get("onlineLink") as string | null) || null;
  const status      = formData.get("status")      as ClassStatus;
  const endDateRaw  = formData.get("endDate") as string | null;
  const endDate     = endDateRaw ? new Date(endDateRaw) : null;

  if (!teacherId) return { error: "Teacher is required." };
  if (startTime >= endTime) return { error: "End time must be after start time." };

  const existing = await prisma.classSchedule.findUnique({
    where: { id },
    include: { subClass: { select: { sessionType: true } } },
  });
  if (!existing) return { error: "Schedule not found." };

  const isPrivate = ["MUSIC", "PRIVATE"].includes(existing.subClass.sessionType);
  const maxCapacity = isPrivate
    ? 1
    : parseInt(formData.get("maxCapacity") as string) || 10;

  const conflict = await checkConflicts(
    dayOfWeek, startTime, endTime, teacherId, existing.subClassId, id
  );
  if (conflict) return { error: conflict };

  await prisma.classSchedule.update({
    where: { id },
    data: {
      teacherId, dayOfWeek, startTime, endTime,
      maxCapacity, onlineLink, status,
      endDate, // ↓ add this
    },
  });
  return { success: true };
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

export async function deleteSchedule(id: string) {
  const bookingCount = await prisma.booking.count({
    where: { session: { scheduleId: id } },
  });

  if (bookingCount > 0) {
    return {
      error: `Cannot delete: this schedule has ${bookingCount} booking${bookingCount > 1 ? "s" : ""}. Cancel the bookings first.`,
    };
  }

  try {
    // Sessions cascade-delete via onDelete on ClassSession → ClassSchedule
    await prisma.classSchedule.delete({ where: { id } });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2003") {
      return { error: "Cannot delete: schedule is still referenced by other records." };
    }
    throw e;
  }

  return { success: true };
}

// ─────────────────────────────────────────────
// CANCEL SINGLE SESSION
// ─────────────────────────────────────────────

export async function cancelSession(sessionId: string, reason?: string) {
  await prisma.classSession.update({
    where: { id: sessionId },
    data: {
      status:          "CANCELLED",
      cancelledReason: reason || null,
    },
  });
  return { success: true };
}

// ─────────────────────────────────────────────
// REGENERATE SESSIONS
// Useful if endDate is extended or schedule dates change
// ─────────────────────────────────────────────

export async function regenerateSessions(scheduleId: string) {
  const schedule = await prisma.classSchedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule)        return { error: "Schedule not found." };
  if (!schedule.endDate) return { error: "Schedule has no end date — cannot generate sessions." };

  // Delete future sessions that have no bookings
  await prisma.classSession.deleteMany({
    where: {
      scheduleId,
      sessionDate: { gte: new Date() },
      bookings:    { none: {} },
      trialBookings: { none: {} },
    },
  });

  // Re-generate from today or startDate (whichever is later)
  const fromDate = schedule.startDate > new Date() ? schedule.startDate : new Date();
  const sessionDates = generateSessionDates(fromDate, schedule.endDate, schedule.dayOfWeek);

  if (sessionDates.length > 0) {
  await prisma.classSession.createMany({
    data: sessionDates.map((date) => {
      const [hours, minutes] = schedule.startTime.split(":").map(Number);
      const sessionDatetime = new Date(date);
      sessionDatetime.setHours(hours, minutes, 0, 0);
      return {
        scheduleId:   schedule.id,
        sessionDate:  date,
        startTime:    schedule.startTime,
        endTime:      schedule.endTime,
        sessionDatetime,
        status:       "ACTIVE" as ClassStatus,
      };
    }),
    skipDuplicates: true,
  });
}

  return { success: true, count: sessionDates.length };
}