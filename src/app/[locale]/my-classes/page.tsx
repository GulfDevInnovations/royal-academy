// src/app/[locale]/my-classes/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import MyClassesClient from "./_components/MyClassesClient";
import type {
  EnrolledClass,
  RescheduledSession,
} from "./_components/MyClassesClient";

export const metadata = { title: "My Classes | Royal Academy" };

function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function resolveSlots(
  scheduleIds: string[],
  preferredDays: string[],
  classSchedules: any[],
) {
  if (scheduleIds.length > 0) {
    return classSchedules
      .filter((s: any) => scheduleIds.includes(s.id))
      .map((s: any) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        teacher: s.teacher ?? null,
      }));
  }
  const seen = new Set<string>();
  return classSchedules
    .filter((s: any) => {
      if (!preferredDays.includes(s.dayOfWeek)) return false;
      if (seen.has(s.dayOfWeek)) return false;
      seen.add(s.dayOfWeek);
      return true;
    })
    .map((s: any) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime: s.endTime,
      teacher: s.teacher ?? null,
    }));
}

export default async function MyClassesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/my-classes");

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!studentProfile) redirect("/onboarding");

  const studentId = studentProfile.id;

  const [singles, multis, rescheduleLogs, workshopBookings] = await Promise.all([
    prisma.monthlyEnrollment.findMany({
      where: {
        studentId,
        multiMonthEnrollmentId: null,
        status: { in: ["CONFIRMED"] },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        payment: { select: { status: true, amount: true, paidAt: true } },
        subClass: {
          include: {
            class: { select: { id: true, name: true, iconUrl: true } },
            classSchedules: {
              where: { status: "ACTIVE" },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                teacher: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),

    prisma.multiMonthEnrollment.findMany({
      where: { studentId, status: { in: ["CONFIRMED"] } },
      orderBy: [{ startYear: "desc" }, { startMonth: "desc" }],
      include: {
        payment: { select: { status: true, amount: true, paidAt: true } },
        subClass: {
          include: {
            class: { select: { id: true, name: true, iconUrl: true } },
            classSchedules: {
              where: { status: "ACTIVE" },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                teacher: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),

    // Fetch all reschedule logs for this student, newest first
    prisma.rescheduleLog.findMany({
      where: { studentId },
      orderBy: { requestedAt: "desc" },
      select: {
        id: true,
        requestedAt: true,
        wasLost: true,
        lostReason: true,
        oldSession: {
          select: {
            id: true,
            sessionDate: true,
            startTime: true,
            endTime: true,
            schedule: {
              select: {
                subClassId: true,
                dayOfWeek: true,
              },
            },
          },
        },
        newSession: {
          select: {
            id: true,
            sessionDate: true,
            startTime: true,
            endTime: true,
            schedule: {
              select: {
                dayOfWeek: true,
              },
            },
          },
        },
      },
    }),

    // Workshop bookings for this student
    prisma.workshopBooking.findMany({
      where: { studentId, status: "CONFIRMED" },
      orderBy: { bookedAt: "desc" },
      include: {
        workshop: {
          include: {
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
        payment: { select: { status: true, amount: true, paidAt: true } },
      },
    }),
  ]);

  const p = plain({ singles, multis, rescheduleLogs });
  const plainWorkshops: any[] = plain(workshopBookings);

  // Build a map: subClassId → reschedule logs
  // so each enrollment card can show its own history
  const reschedulesBySubClass = new Map<string, RescheduledSession[]>();
  for (const log of p.rescheduleLogs) {
    const subClassId = log.oldSession?.schedule?.subClassId;
    if (!subClassId) continue;
    if (!reschedulesBySubClass.has(subClassId)) {
      reschedulesBySubClass.set(subClassId, []);
    }
    reschedulesBySubClass.get(subClassId)!.push({
      logId: log.id,
      requestedAt: log.requestedAt,
      wasLost: log.wasLost,
      lostReason: log.lostReason ?? null,
      oldSessionDate: log.oldSession?.sessionDate ?? null,
      oldStartTime: log.oldSession?.startTime ?? null,
      oldEndTime: log.oldSession?.endTime ?? null,
      oldDayOfWeek: log.oldSession?.schedule?.dayOfWeek ?? null,
      newSessionDate: log.newSession?.sessionDate ?? null,
      newStartTime: log.newSession?.startTime ?? null,
      newEndTime: log.newSession?.endTime ?? null,
      newDayOfWeek: log.newSession?.schedule?.dayOfWeek ?? null,
    });
  }

  const enrollments: EnrolledClass[] = [
    ...p.singles.map(
      (e: any): EnrolledClass => ({
        enrollmentId: e.id,
        enrollmentType: "SINGLE",
        status: e.status,
        frequency: e.frequency,
        preferredDays: e.preferredDays,
        month: e.month,
        year: e.year,
        startMonth: null,
        startYear: null,
        endMonth: null,
        endYear: null,
        totalMonths: null,
        totalAmount: Number(e.totalAmount),
        currency: e.currency,
        paymentStatus: e.payment?.status ?? null,
        paidAt: e.payment?.paidAt ?? null,
        resolvedSlots: resolveSlots(
          e.scheduleIds ?? [],
          e.preferredDays,
          e.subClass.classSchedules,
        ),
        rescheduledSessions: reschedulesBySubClass.get(e.subClass.id) ?? [],
        subClass: {
          id: e.subClass.id,
          name: e.subClass.name,
          description: e.subClass.description,
          coverUrl: e.subClass.coverUrl,
          durationMinutes: e.subClass.durationMinutes,
          level: e.subClass.level,
          ageGroup: e.subClass.ageGroup,
          isReschedulable: e.subClass.isReschedulable,
          oncePriceMonthly:
            e.subClass.oncePriceMonthly != null
              ? Number(e.subClass.oncePriceMonthly)
              : null,
          twicePriceMonthly:
            e.subClass.twicePriceMonthly != null
              ? Number(e.subClass.twicePriceMonthly)
              : null,
          class: e.subClass.class,
        },
      }),
    ),

    ...p.multis.map(
      (m: any): EnrolledClass => ({
        enrollmentId: m.id,
        enrollmentType: "MULTI",
        status: m.status,
        frequency: m.frequency,
        preferredDays: m.preferredDays,
        month: null,
        year: null,
        startMonth: m.startMonth,
        startYear: m.startYear,
        endMonth: m.endMonth,
        endYear: m.endYear,
        totalMonths: m.totalMonths,
        totalAmount: Number(m.totalAmount),
        currency: m.currency,
        paymentStatus: m.payment?.status ?? null,
        paidAt: m.payment?.paidAt ?? null,
        resolvedSlots: resolveSlots(
          m.scheduleIds ?? [],
          m.preferredDays,
          m.subClass.classSchedules,
        ),
        rescheduledSessions: reschedulesBySubClass.get(m.subClass.id) ?? [],
        subClass: {
          id: m.subClass.id,
          name: m.subClass.name,
          description: m.subClass.description,
          coverUrl: m.subClass.coverUrl,
          durationMinutes: m.subClass.durationMinutes,
          level: m.subClass.level,
          ageGroup: m.subClass.ageGroup,
          isReschedulable: m.subClass.isReschedulable,
          oncePriceMonthly:
            m.subClass.oncePriceMonthly != null
              ? Number(m.subClass.oncePriceMonthly)
              : null,
          twicePriceMonthly:
            m.subClass.twicePriceMonthly != null
              ? Number(m.subClass.twicePriceMonthly)
              : null,
          class: m.subClass.class,
        },
      }),
    ),

    ...plainWorkshops.map(
      (wb: any): EnrolledClass => ({
        enrollmentId: wb.id,
        enrollmentType: "WORKSHOP",
        status: wb.status,
        frequency: "",
        preferredDays: [],
        month: null,
        year: null,
        startMonth: null,
        startYear: null,
        endMonth: null,
        endYear: null,
        totalMonths: null,
        totalAmount: Number(wb.workshop.price),
        currency: wb.workshop.currency,
        paymentStatus: wb.payment?.status ?? null,
        paidAt: wb.payment?.paidAt ?? null,
        resolvedSlots: [],
        rescheduledSessions: [],
        workshopSlug: wb.workshop.slug,
        workshopEventDate: wb.workshop.eventDate,
        workshopStartTime: wb.workshop.startTime,
        workshopEndTime: wb.workshop.endTime,
        workshopTeacherName: wb.workshop.teacher
          ? `${wb.workshop.teacher.firstName} ${wb.workshop.teacher.lastName}`
          : null,
        subClass: {
          id: wb.workshop.id,
          name: wb.workshop.title,
          description: wb.workshop.description,
          coverUrl: wb.workshop.coverUrl,
          durationMinutes: 0,
          level: null,
          ageGroup: null,
          isReschedulable: false,
          oncePriceMonthly: null,
          twicePriceMonthly: null,
          class: { id: wb.workshop.id, name: "Workshop", iconUrl: null },
        },
      }),
    ),
  ];

  return (
    <MyClassesClient
      enrollments={enrollments}
      studentName={`${studentProfile.firstName} ${studentProfile.lastName}`}
    />
  );
}
