// src/app/api/reschedule/available-slots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!studentProfile)
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  // ── Params ────────────────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const bookingId      = searchParams.get("bookingId");
  const rawSessionId   = searchParams.get("sessionId");
  const enrollmentId   = searchParams.get("enrollmentId");
  const enrollmentType = searchParams.get("enrollmentType") as "SINGLE" | "MULTI" | null;

  if ((!bookingId && !rawSessionId) || !enrollmentId || !enrollmentType)
    return NextResponse.json(
      { error: "bookingId (or sessionId), enrollmentId and enrollmentType required" },
      { status: 400 },
    );

  // ── Resolve teacher + subClass from source session ────────────────────────
  let subClassId: string;
  let teacherId: string;
  let excludeSessionId: string;
  let teacherInfo: { id: string; firstName: string; lastName: string } | null = null;

  if (bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        studentId: true,
        sessionId: true,
        session: {
          select: {
            id: true,
            schedule: {
              select: {
                subClassId: true,
                teacherId:  true,
                teacher: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
    if (!booking || booking.studentId !== studentProfile.id)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    subClassId       = booking.session.schedule.subClassId;
    teacherId        = booking.session.schedule.teacherId;
    teacherInfo      = booking.session.schedule.teacher;
    excludeSessionId = booking.sessionId;
  } else {
    const session = await prisma.classSession.findUnique({
      where: { id: rawSessionId! },
      select: {
        id: true,
        schedule: {
          select: {
            subClassId: true,
            teacherId:  true,
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!session)
      return NextResponse.json({ error: "Session not found" }, { status: 404 });

    subClassId       = session.schedule.subClassId;
    teacherId        = session.schedule.teacherId;
    teacherInfo      = session.schedule.teacher;
    excludeSessionId = session.id;
  }

  // ── Allowed months + enrolled scheduleIds ────────────────────────────────
  let allowedMonths: { month: number; year: number }[] = [];
  let enrolledScheduleIds: string[] = [];

  if (enrollmentType === "SINGLE") {
    const enrollment = await prisma.monthlyEnrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        studentId: true, month: true, year: true,
        scheduleIds: true, preferredDays: true, subClassId: true,
      },
    });
    if (!enrollment || enrollment.studentId !== studentProfile.id)
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    allowedMonths       = [{ month: enrollment.month, year: enrollment.year }];
    enrolledScheduleIds = enrollment.scheduleIds ?? [];

    if (enrolledScheduleIds.length === 0) {
      const uniqueDays = [...new Set(enrollment.preferredDays)];
      const rows = await prisma.classSchedule.findMany({
        where: { subClassId: enrollment.subClassId, status: "ACTIVE", dayOfWeek: { in: uniqueDays as any[] } },
        select: { id: true },
      });
      enrolledScheduleIds = rows.map((r) => r.id);
    }
  } else {
    const enrollment = await prisma.multiMonthEnrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        studentId: true, startMonth: true, startYear: true, endMonth: true, endYear: true,
        scheduleIds: true, preferredDays: true, subClassId: true,
      },
    });
    if (!enrollment || enrollment.studentId !== studentProfile.id)
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    let m = enrollment.startMonth, y = enrollment.startYear;
    while (y < enrollment.endYear || (y === enrollment.endYear && m <= enrollment.endMonth)) {
      allowedMonths.push({ month: m, year: y });
      if (++m > 12) { m = 1; y++; }
    }

    enrolledScheduleIds = enrollment.scheduleIds ?? [];
    if (enrolledScheduleIds.length === 0) {
      const uniqueDays = [...new Set(enrollment.preferredDays)];
      const rows = await prisma.classSchedule.findMany({
        where: { subClassId: enrollment.subClassId, status: "ACTIVE", dayOfWeek: { in: uniqueDays as any[] } },
        select: { id: true },
      });
      enrolledScheduleIds = rows.map((r) => r.id);
    }
  }

  // Source schedule (the one being rescheduled FROM) is always excluded
  const sourceSchedule = await prisma.classSession.findUnique({
    where: { id: excludeSessionId },
    select: { scheduleId: true },
  });
  const sourceScheduleId = sourceSchedule?.scheduleId ?? null;

  const excludedScheduleIds = new Set([
    ...enrolledScheduleIds,
    ...(sourceScheduleId ? [sourceScheduleId] : []),
  ]);

  // ── Date window ───────────────────────────────────────────────────────────
  const now      = new Date();
  const gateTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const enrollmentStart = new Date(
    Math.min(...allowedMonths.map((m) => new Date(m.year, m.month - 1, 1).getTime()))
  );
  const from = gateTime > enrollmentStart ? gateTime : enrollmentStart;

  const last = allowedMonths.reduce(
    (a, b) => b.year > a.year || (b.year === a.year && b.month > a.month) ? b : a,
    allowedMonths[0]
  );
  const maxDate = new Date(last.year, last.month, 0, 23, 59, 59);

  // ── Schedules — only those NOT already enrolled in ────────────────────────
  const schedules = await prisma.classSchedule.findMany({
    where: {
      teacherId,
      subClassId,
      status: "ACTIVE",
      id: { notIn: [...excludedScheduleIds] },
    },
    select: { id: true, maxCapacity: true, dayOfWeek: true },
  });

  if (schedules.length === 0)
    return NextResponse.json({ slots: [] });

  const scheduleIds = schedules.map((s) => s.id);
  const capacityMap = new Map(schedules.map((s) => [s.id, s.maxCapacity]));

  // ── Candidate sessions ────────────────────────────────────────────────────
  let sessions = await prisma.classSession.findMany({
    where: {
      scheduleId:      { in: scheduleIds },
      status:          "ACTIVE",
      id:              { not: excludeSessionId },
      sessionDatetime: { gte: from, lte: maxDate },
    },
    orderBy: { sessionDatetime: "asc" },
    select: {
      id: true, sessionDate: true, sessionDatetime: true,
      startTime: true, endTime: true, scheduleId: true,
      schedule: { select: { dayOfWeek: true } },
    },
  });

  if (sessions.length === 0) {
    sessions = await prisma.classSession.findMany({
      where: {
        scheduleId:  { in: scheduleIds },
        status:      "ACTIVE",
        id:          { not: excludeSessionId },
        sessionDate: { gte: from, lte: maxDate },
      },
      orderBy: { sessionDate: "asc" },
      select: {
        id: true, sessionDate: true, sessionDatetime: true,
        startTime: true, endTime: true, scheduleId: true,
        schedule: { select: { dayOfWeek: true } },
      },
    });
  }

  if (sessions.length === 0)
    return NextResponse.json({ slots: [] });

  // ── Per-session actual booking count (source of truth for capacity) ───────
  // We do NOT use ClassSchedule.currentEnrolled because it's a denormalized
  // counter that can drift (e.g. after reschedules increment/decrement it).
  // Count real CONFIRMED bookings per session instead.
  const sessionIds = sessions.map((s) => s.id);

  const bookingCounts = await prisma.booking.groupBy({
    by: ["sessionId"],
    where: {
      sessionId: { in: sessionIds },
      status: { in: ["CONFIRMED"] },
    },
    _count: { sessionId: true },
  });
  const bookedCountMap = new Map(
    bookingCounts.map((b) => [b.sessionId, b._count.sessionId])
  );

  // ── Sessions the student already holds a CONFIRMED booking for ────────────
  const studentBookings = await prisma.booking.findMany({
    where: {
      studentId: studentProfile.id,
      sessionId: { in: sessionIds },
      status: { in: ["CONFIRMED"] },
    },
    select: { sessionId: true },
  });
  const studentBookedIds = new Set(studentBookings.map((b) => b.sessionId));

  // ── Build response ────────────────────────────────────────────────────────
  const slots = sessions
    .filter((s) => {
      // Student already has this session
      if (studentBookedIds.has(s.id)) return false;
      // Check real capacity
      const capacity    = capacityMap.get(s.scheduleId) ?? 0;
      const bookedCount = bookedCountMap.get(s.id) ?? 0;
      return bookedCount < capacity;
    })
    .map((s) => {
      const capacity    = capacityMap.get(s.scheduleId) ?? 0;
      const bookedCount = bookedCountMap.get(s.id) ?? 0;
      return {
        sessionId:       s.id,
        sessionDate:     s.sessionDate,
        sessionDatetime: s.sessionDatetime,
        startTime:       s.startTime,
        endTime:         s.endTime,
        dayOfWeek:       s.schedule.dayOfWeek,
        currentEnrolled: bookedCount,
        capacity,
        teacher:         teacherInfo,
      };
    });

  return NextResponse.json({ slots });
}