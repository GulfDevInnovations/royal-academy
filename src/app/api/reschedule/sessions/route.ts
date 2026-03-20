// src/app/api/reschedule/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reschedule/sessions?enrollmentId=...&enrollmentType=SINGLE|MULTI
 *
 * Returns all upcoming ClassSession rows for the student's enrollment.
 * Sessions are shown regardless of whether an explicit Booking row exists —
 * monthly enrollments may not have per-session bookings pre-created.
 *
 * The student's existing Booking is attached when present; bookingId will be
 * null for sessions without one (handled in the server action via a create).
 */
export async function GET(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!studentProfile)
    return NextResponse.json({ error: "Student profile not found" }, { status: 404 });

  // ── Query params ─────────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const enrollmentId   = searchParams.get("enrollmentId");
  const enrollmentType = searchParams.get("enrollmentType") as "SINGLE" | "MULTI" | null;

  if (!enrollmentId || !enrollmentType)
    return NextResponse.json({ error: "enrollmentId and enrollmentType are required" }, { status: 400 });

  // ── Resolve schedule IDs + month range ───────────────────────────────────
  let scheduleIds: string[] = [];
  let allowedMonths: { month: number; year: number }[] = [];
  let subClassId = "";

  if (enrollmentType === "SINGLE") {
    const enrollment = await prisma.monthlyEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { studentId: true, scheduleIds: true, preferredDays: true, month: true, year: true, subClassId: true },
    });
    if (!enrollment || enrollment.studentId !== studentProfile.id)
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    subClassId  = enrollment.subClassId;
    scheduleIds = enrollment.scheduleIds ?? [];
    allowedMonths = [{ month: enrollment.month, year: enrollment.year }];

    if (scheduleIds.length === 0) {
      const uniqueDays = [...new Set(enrollment.preferredDays)];
      const rows = await prisma.classSchedule.findMany({
        where: { subClassId, status: "ACTIVE", dayOfWeek: { in: uniqueDays as any[] } },
        select: { id: true },
      });
      scheduleIds = rows.map((r) => r.id);
    }

  } else {
    const enrollment = await prisma.multiMonthEnrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        studentId: true, scheduleIds: true, preferredDays: true, subClassId: true,
        startMonth: true, startYear: true, endMonth: true, endYear: true,
      },
    });
    if (!enrollment || enrollment.studentId !== studentProfile.id)
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    subClassId  = enrollment.subClassId;
    scheduleIds = enrollment.scheduleIds ?? [];

    // Build full month list: April 2026 → May 2026 = [{4,2026},{5,2026}]
    let m = enrollment.startMonth, y = enrollment.startYear;
    while (y < enrollment.endYear || (y === enrollment.endYear && m <= enrollment.endMonth)) {
      allowedMonths.push({ month: m, year: y });
      if (++m > 12) { m = 1; y++; }
    }

    if (scheduleIds.length === 0) {
      // preferredDays may contain duplicates (e.g. ["FRIDAY","FRIDAY"] for
      // TWICE_PER_WEEK on the same day at different times). Deduplicate before
      // passing to Prisma so both schedule rows for Friday are found.
      const uniqueDays = [...new Set(enrollment.preferredDays)];
      const rows = await prisma.classSchedule.findMany({
        where: { subClassId, status: "ACTIVE", dayOfWeek: { in: uniqueDays as any[] } },
        select: { id: true },
      });
      scheduleIds = rows.map((r) => r.id);
    }
  }

  console.log("[reschedule/sessions] resolved scheduleIds:", scheduleIds);
  console.log("[reschedule/sessions] allowedMonths:", allowedMonths);

  if (scheduleIds.length === 0)
    return NextResponse.json({ sessions: [], debug: { reason: "no scheduleIds resolved", subClassId } });

  // ── Date window ───────────────────────────────────────────────────────────
  const now = new Date();

  // Start from now OR start of enrollment period, whichever is later
  const enrollmentStart = new Date(
    Math.min(...allowedMonths.map((m) => new Date(m.year, m.month - 1, 1).getTime()))
  );
  const from = now > enrollmentStart ? now : enrollmentStart;

  // Last moment of the last enrolled month.
  // new Date(year, month_1based, 0) = last day of that month.
  // e.g. endMonth=5 (May): new Date(2026, 5, 0) = May 31 2026 ✓
  const last    = allowedMonths.reduce(
    (a, b) => b.year > a.year || (b.year === a.year && b.month > a.month) ? b : a,
    allowedMonths[0]
  );
  const maxDate = new Date(last.year, last.month, 0, 23, 59, 59);

  console.log("[reschedule/sessions] from:", from.toISOString(), "maxDate:", maxDate.toISOString());

  // ── Fetch sessions ────────────────────────────────────────────────────────
  // Try sessionDatetime index first (fast); fall back to sessionDate if the
  // column wasn't populated on older rows.
  let sessions = await prisma.classSession.findMany({
    where: {
      scheduleId:      { in: scheduleIds },
      status:          "ACTIVE",
      sessionDatetime: { gte: from, lte: maxDate },
    },
    orderBy: { sessionDatetime: "asc" },
    select: {
      id: true, sessionDate: true, sessionDatetime: true,
      startTime: true, endTime: true, status: true,
      schedule: {
        select: {
          dayOfWeek: true,
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  console.log("[reschedule/sessions] sessionDatetime query count:", sessions.length);

  // Fallback: sessionDatetime may be null/unset on some rows
  if (sessions.length === 0) {
    sessions = await prisma.classSession.findMany({
      where: {
        scheduleId:  { in: scheduleIds },
        status:      "ACTIVE",
        sessionDate: { gte: from, lte: maxDate },
      },
      orderBy: { sessionDate: "asc" },
      select: {
        id: true, sessionDate: true, sessionDatetime: true,
        startTime: true, endTime: true, status: true,
        schedule: {
          select: {
            dayOfWeek: true,
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    console.log("[reschedule/sessions] sessionDate fallback count:", sessions.length);
  }

  if (sessions.length === 0)
    return NextResponse.json({
      sessions: [],
      debug: { scheduleIds, from: from.toISOString(), maxDate: maxDate.toISOString() },
    });

  // ── Attach bookings (if any) ─────────────────────────────────────────────
  const sessionIds = sessions.map((s) => s.id);
  const bookings   = await prisma.booking.findMany({
    where: { studentId: studentProfile.id, sessionId: { in: sessionIds } },
    select: { id: true, sessionId: true, status: true },
  });
  const bookingMap = new Map(bookings.map((b) => [b.sessionId, b]));

  const result = sessions
    .map((s) => ({
      sessionId:       s.id,
      sessionDate:     s.sessionDate,
      sessionDatetime: s.sessionDatetime,
      startTime:       s.startTime,
      endTime:         s.endTime,
      dayOfWeek:       s.schedule.dayOfWeek,
      teacher:         s.schedule.teacher ?? null,
      bookingId:       bookingMap.get(s.id)?.id   ?? null,
      bookingStatus:   bookingMap.get(s.id)?.status ?? null,
    }))
    // Exclude sessions the student already cancelled or rescheduled
    .filter((s) => s.bookingStatus !== "CANCELLED" && s.bookingStatus !== "RESCHEDULED");

  return NextResponse.json({ sessions: result });
}