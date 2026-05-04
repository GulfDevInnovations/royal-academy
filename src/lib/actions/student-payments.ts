// src/lib/actions/student-payments.ts
'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // ← fix singleton
import { jsonToStringArray } from '@/utils/prisma-json';

export type PaymentStatus =
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface StudentPaymentRecord {
  id: string;
  invoiceNo: string;
  type: 'MONTHLY' | 'MULTI_MONTHLY' | 'TRIAL' | 'WORKSHOP' | 'BOOKING';
  subClassName: string;
  className: string;
  teacherName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  frequency?: string;
  month?: string;
  year?: number;
  eventDate?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  paidAt?: string;
  subClassId: string;
  workshopSlug?: string;
  level?: string;
  ageGroup?: string;
  timeString?: string;
}

function monthName(m: number) {
  return new Date(2000, m - 1, 1).toLocaleString('en', { month: 'long' });
}

export async function getStudentPayments(): Promise<{
  data: StudentPaymentRecord[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) return { data: [], error: 'Not authenticated' };

    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { studentProfile: true },
    });
    if (!dbUser?.studentProfile)
      return { data: [], error: 'Student profile not found' };

    const studentId = dbUser.studentProfile.id;

    const [
      monthlyEnrollments,
      multiMonthEnrollments,
      trialBookings,
      workshopBookings,
      bookings,
    ] = await Promise.all([
      // ── Monthly — exclude children of multi-month ─────────────────────────
      prisma.monthlyEnrollment.findMany({
        where: {
          studentId,
          status: 'CONFIRMED',
          multiMonthEnrollmentId: null, // ← exclude multi-month children
          payment: { status: 'PAID' },
        },
        include: {
          subClass: { include: { class: true } },
          payment: true,
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),

      // ── Multi-month ───────────────────────────────────────────────────────
      prisma.multiMonthEnrollment.findMany({
        where: {
          studentId,
          status: 'CONFIRMED',
          payment: { status: 'PAID' },
        },
        include: {
          subClass: { include: { class: true } },
          payment: true,
        },
        orderBy: [{ startYear: 'desc' }, { startMonth: 'desc' }],
      }),

      prisma.trialBooking.findMany({
        where: {
          studentId,
          status: 'CONFIRMED',
          payment: { status: 'PAID' },
        },
        include: {
          subClass: { include: { class: true } },
          session: {
            include: {
              schedule: { include: { teacher: true } },
            },
          },
          payment: true,
        },
        orderBy: { bookedAt: 'desc' },
      }),

      prisma.workshopBooking.findMany({
        where: {
          studentId,
          status: 'CONFIRMED',
          payment: { status: 'PAID' },
        },
        include: {
          workshop: { include: { teacher: true } },
          payment: true,
        },
        orderBy: { bookedAt: 'desc' },
      }),

      prisma.booking.findMany({
        where: {
          studentId,
          status: 'CONFIRMED',
          payment: { status: 'PAID' },
        },
        include: {
          session: {
            include: {
              schedule: {
                include: {
                  subClass: { include: { class: true } },
                  teacher: true,
                },
              },
            },
          },
          payment: true,
        },
        orderBy: { bookedAt: 'desc' },
      }),
    ]);

    const records: StudentPaymentRecord[] = [];

    // ── Monthly enrollments ───────────────────────────────────────────────────────
    for (const e of monthlyEnrollments) {
      const p = e.payment!;
      const sc = e.subClass;

      const scheduleIds = jsonToStringArray(e.scheduleIds as any);
      const preferredDays = jsonToStringArray(e.preferredDays as any);

      // Fetch ALL schedules matching preferred days — not just one
      const schedules =
        scheduleIds.length > 0
          ? await prisma.classSchedule.findMany({
              where: { id: { in: scheduleIds } },
              include: { teacher: true },
              orderBy: { startTime: 'asc' },
            })
          : await prisma.classSchedule.findMany({
              // Fallback for old records that didn't store scheduleIds
              where: {
                subClassId: sc.id,
                status: 'ACTIVE',
                ...(preferredDays.length > 0
                  ? { dayOfWeek: { in: preferredDays as any } }
                  : {}),
              },
              include: { teacher: true },
              orderBy: { startTime: 'asc' },
              take: e.frequency === 'TWICE_PER_WEEK' ? 2 : 1,
            });

      const firstSchedule = schedules[0];

      const dayString =
        schedules.length > 0
          ? schedules
              .map(
                (s) =>
                  s.dayOfWeek.charAt(0) + s.dayOfWeek.slice(1).toLowerCase(),
              )
              .join(' & ')
          : '—';

      const timeString =
        schedules.length > 1
          ? schedules.map((s) => `${s.startTime} – ${s.endTime}`).join(' & ')
          : firstSchedule
            ? `${firstSchedule.startTime} – ${firstSchedule.endTime}`
            : '—';

      records.push({
        id: e.id,
        invoiceNo: `RA-${e.year}-${String(e.id.slice(-4)).toUpperCase()}`,
        type: 'MONTHLY',
        subClassName: sc.name,
        className: sc.class.name,
        teacherName: firstSchedule?.teacher
          ? `${firstSchedule.teacher.firstName} ${firstSchedule.teacher.lastName}`
          : 'TBA',
        dayOfWeek: dayString,
        startTime: schedules[0]?.startTime ?? '—',
        endTime: schedules[schedules.length - 1]?.endTime ?? '—', // last schedule's end
        frequency:
          e.frequency === 'ONCE_PER_WEEK' ? 'Once per week' : 'Twice per week',
        month: monthName(e.month),
        year: e.year,
        amount: Number(p.amount),
        currency: e.currency,
        status: p.status as PaymentStatus,
        method: p.method ?? undefined,
        paidAt: p.paidAt?.toISOString(),
        subClassId: sc.id,
        level: sc.level ?? undefined,
        ageGroup: sc.ageGroup ?? undefined,
        // Store combined time string so PaymentCard can display it correctly
        timeString,
      });
    }

    // ── Multi-month enrollments ───────────────────────────────────────────────────
    for (const e of multiMonthEnrollments) {
      const p = e.payment!;
      const sc = e.subClass;

      const scheduleIds = jsonToStringArray(e.scheduleIds as any);
      const preferredDays = jsonToStringArray(e.preferredDays as any);

      const schedules =
        scheduleIds.length > 0
          ? await prisma.classSchedule.findMany({
              where: { id: { in: scheduleIds } },
              include: { teacher: true },
              orderBy: { startTime: 'asc' },
            })
          : await prisma.classSchedule.findMany({
              where: {
                subClassId: sc.id,
                status: 'ACTIVE',
                ...(preferredDays.length > 0
                  ? { dayOfWeek: { in: preferredDays as any } }
                  : {}),
              },
              include: { teacher: true },
              orderBy: { startTime: 'asc' },
              take: e.frequency === 'TWICE_PER_WEEK' ? 2 : 1,
            });

      const firstSchedule = schedules[0];

      const dayString =
        schedules.length > 0
          ? schedules
              .map(
                (s) =>
                  s.dayOfWeek.charAt(0) + s.dayOfWeek.slice(1).toLowerCase(),
              )
              .join(' & ')
          : '—';

      const timeString =
        schedules.length > 1
          ? schedules.map((s) => `${s.startTime} – ${s.endTime}`).join(' & ')
          : firstSchedule
            ? `${firstSchedule.startTime} – ${firstSchedule.endTime}`
            : '—';

      const startLabel = new Date(e.startYear, e.startMonth - 1).toLocaleString(
        'en',
        { month: 'short', year: 'numeric' },
      );
      const endLabel = new Date(e.endYear, e.endMonth - 1).toLocaleString(
        'en',
        { month: 'short', year: 'numeric' },
      );

      records.push({
        id: e.id,
        invoiceNo: `RA-${e.startYear}-${String(e.id.slice(-4)).toUpperCase()}`,
        type: 'MULTI_MONTHLY',
        subClassName: sc.name,
        className: sc.class.name,
        teacherName: firstSchedule?.teacher
          ? `${firstSchedule.teacher.firstName} ${firstSchedule.teacher.lastName}`
          : 'TBA',
        dayOfWeek: dayString,
        startTime: schedules[0]?.startTime ?? '—',
        endTime: schedules[schedules.length - 1]?.endTime ?? '—',
        frequency:
          e.frequency === 'ONCE_PER_WEEK' ? 'Once per week' : 'Twice per week',
        month: `${startLabel} → ${endLabel}`,
        year: e.startYear,
        amount: Number(p.amount),
        currency: e.currency,
        status: p.status as PaymentStatus,
        method: p.method ?? undefined,
        paidAt: p.paidAt?.toISOString(),
        subClassId: sc.id,
        level: sc.level ?? undefined,
        ageGroup: sc.ageGroup ?? undefined,
        timeString,
      });
    }

    // ── Trial bookings ────────────────────────────────────────────────────────
    for (const t of trialBookings) {
      const p = t.payment!;
      const sc = t.subClass;
      const schedule = t.session.schedule;

      records.push({
        id: t.id,
        invoiceNo: `RA-TRIAL-${t.id.slice(-4).toUpperCase()}`,
        type: 'TRIAL',
        subClassName: `Trial — ${sc.name}`,
        className: sc.class.name,
        teacherName: `${schedule.teacher.firstName} ${schedule.teacher.lastName}`,
        dayOfWeek:
          schedule.dayOfWeek.charAt(0) +
          schedule.dayOfWeek.slice(1).toLowerCase(),
        startTime: t.session.startTime,
        endTime: t.session.endTime,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status as PaymentStatus,
        method: p.method ?? undefined,
        paidAt: p.paidAt?.toISOString(),
        subClassId: sc.id,
        level: sc.level ?? undefined,
        ageGroup: sc.ageGroup ?? undefined,
      });
    }

    // ── Workshop bookings ─────────────────────────────────────────────────────
    for (const w of workshopBookings) {
      const p = w.payment!;
      const ws = w.workshop;

      records.push({
        id: w.id,
        invoiceNo: `RA-WS-${w.id.slice(-4).toUpperCase()}`,
        type: 'WORKSHOP',
        subClassName: ws.title,
        className: 'Workshop',
        teacherName: ws.teacher
          ? `${ws.teacher.firstName} ${ws.teacher.lastName}`
          : 'TBA',
        dayOfWeek: new Date(ws.eventDate).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        startTime: ws.startTime,
        endTime: ws.endTime,
        eventDate: ws.eventDate.toISOString(),
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status as PaymentStatus,
        method: p.method ?? undefined,
        paidAt: p.paidAt?.toISOString(),
        subClassId: ws.id,
        workshopSlug: ws.slug ?? undefined,
      });
    }

    // ── Regular bookings ──────────────────────────────────────────────────────
    for (const b of bookings) {
      const p = b.payment!;
      const schedule = b.session.schedule;
      const sc = schedule.subClass;

      records.push({
        id: b.id,
        invoiceNo: `RA-BK-${b.id.slice(-4).toUpperCase()}`,
        type: 'BOOKING',
        subClassName: sc.name,
        className: sc.class.name,
        teacherName: `${schedule.teacher.firstName} ${schedule.teacher.lastName}`,
        dayOfWeek:
          schedule.dayOfWeek.charAt(0) +
          schedule.dayOfWeek.slice(1).toLowerCase(),
        startTime: b.session.startTime,
        endTime: b.session.endTime,
        amount: Number(p.amount),
        currency: p.currency,
        status: p.status as PaymentStatus,
        method: p.method ?? undefined,
        paidAt: p.paidAt?.toISOString(),
        subClassId: sc.id,
        level: sc.level ?? undefined,
        ageGroup: sc.ageGroup ?? undefined,
      });
    }

    records.sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''));

    return { data: records };
  } catch (err) {
    console.error('getStudentPayments error:', err);
    return { data: [], error: 'Failed to load payments' };
  }
}
