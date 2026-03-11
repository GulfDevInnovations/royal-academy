"use server";

import { PrismaClient } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";

const prisma = new PrismaClient();

// ─── Unified payment record shape for the UI ─────────────────────────────────

export type PaymentStatus = "PAID" | "PENDING" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export interface StudentPaymentRecord {
  id: string;                  // payment/enrollment id
  invoiceNo: string;           // e.g. RA-2025-0081 or "—" for bookings without invoice
  type: "MONTHLY" | "TRIAL" | "WORKSHOP" | "BOOKING";
  subClassName: string;
  className: string;
  teacherName: string;
  dayOfWeek: string;           // e.g. "Tuesday & Thursday"
  startTime: string;
  endTime: string;
  frequency?: string;          // monthly enrollments only
  month?: string;              // e.g. "March"
  year?: number;
  eventDate?: string;          // workshops only
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: string;
  paidAt?: string;
  subClassId: string;
  level?: string;
  ageGroup?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function monthName(m: number) {
  return new Date(2000, m - 1, 1).toLocaleString("en", { month: "long" });
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

export async function getStudentPayments(): Promise<{
  data: StudentPaymentRecord[];
  error?: string;
}> {
  try {
    // 1. Resolve the logged-in user via Supabase
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: [], error: "Not authenticated" };
    }

    // 2. Find the matching User row and their StudentProfile
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: { studentProfile: true },
    });

    if (!dbUser?.studentProfile) {
      return { data: [], error: "Student profile not found" };
    }

    const studentId = dbUser.studentProfile.id;

    // 3. Fetch all four payment types in parallel
    const [monthlyEnrollments, trialBookings, workshopBookings, bookings] =
      await Promise.all([
        // ── Monthly enrollments ───────────────────────────────────────────────
        prisma.monthlyEnrollment.findMany({
          where: { studentId },
          include: {
            subClass: {
              include: { class: true },
            },
            payment: true,
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
        }),

        // ── Trial bookings ────────────────────────────────────────────────────
        prisma.trialBooking.findMany({
          where: { studentId },
          include: {
            subClass: {
              include: { class: true },
            },
            session: {
              include: {
                schedule: {
                  include: { teacher: true },
                },
              },
            },
            payment: true,
          },
          orderBy: { bookedAt: "desc" },
        }),

        // ── Workshop bookings ─────────────────────────────────────────────────
        prisma.workshopBooking.findMany({
          where: { studentId },
          include: {
            workshop: {
              include: { teacher: true },
            },
            payment: true,
          },
          orderBy: { bookedAt: "desc" },
        }),

        // ── Regular session bookings ──────────────────────────────────────────
        prisma.booking.findMany({
          where: { studentId },
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
          orderBy: { bookedAt: "desc" },
        }),
      ]);

    const records: StudentPaymentRecord[] = [];

    // ── Map monthly enrollments ───────────────────────────────────────────────
    for (const e of monthlyEnrollments) {
      const p = e.payment;
      const sc = e.subClass;

      // Find a schedule to get teacher/time — take first active one
      const schedule = await prisma.classSchedule.findFirst({
        where: { subClassId: sc.id, status: "ACTIVE" },
        include: { teacher: true },
      });

      // Build day string from preferredDays array
      const dayString =
        e.preferredDays.length > 0
          ? e.preferredDays
              .map((d) => d.charAt(0) + d.slice(1).toLowerCase())
              .join(" & ")
          : schedule?.dayOfWeek
          ? schedule.dayOfWeek.charAt(0) + schedule.dayOfWeek.slice(1).toLowerCase()
          : "—";

      records.push({
        id: e.id,
        invoiceNo: `RA-${e.year}-${String(e.id.slice(-4)).toUpperCase()}`,
        type: "MONTHLY",
        subClassName: sc.name,
        className: sc.class.name,
        teacherName: schedule?.teacher
          ? `${schedule.teacher.firstName} ${schedule.teacher.lastName}`
          : "TBA",
        dayOfWeek: dayString,
        startTime: schedule?.startTime ?? "—",
        endTime: schedule?.endTime ?? "—",
        frequency:
          e.frequency === "ONCE_PER_WEEK" ? "Once per week" : "Twice per week",
        month: monthName(e.month),
        year: e.year,
        amount: Number(p?.amount ?? e.totalAmount),
        currency: e.currency,
        status: (p?.status ?? "PENDING") as PaymentStatus,
        method: p?.method ?? undefined,
        paidAt: p?.paidAt?.toISOString(),
        subClassId: sc.id,
        level: sc.level ?? undefined,
        ageGroup: sc.ageGroup ?? undefined,
      });
    }

    // ── Map trial bookings ────────────────────────────────────────────────────
    for (const t of trialBookings) {
      const p = t.payment;
      const sc = t.subClass;
      const schedule = t.session.schedule;

      records.push({
        id: t.id,
        invoiceNo: p?.invoice
          ? `RA-INV-${p.id.slice(-6).toUpperCase()}`
          : `RA-TRIAL-${t.id.slice(-4).toUpperCase()}`,
        type: "TRIAL",
        subClassName: `Trial — ${sc.name}`,
        className: sc.class.name,
        teacherName: `${schedule.teacher.firstName} ${schedule.teacher.lastName}`,
        dayOfWeek:
          schedule.dayOfWeek.charAt(0) +
          schedule.dayOfWeek.slice(1).toLowerCase(),
        startTime: t.session.startTime,
        endTime: t.session.endTime,
        amount: Number(p?.amount ?? sc.trialPrice),
        currency: p?.currency ?? "OMR",
        status: (p?.status ?? "PENDING") as PaymentStatus,
        method: p?.method ?? undefined,
        paidAt: p?.paidAt?.toISOString(),
        subClassId: sc.id,
        level: sc.level ?? undefined,
        ageGroup: sc.ageGroup ?? undefined,
      });
    }

    // ── Map workshop bookings ─────────────────────────────────────────────────
    for (const w of workshopBookings) {
      const p = w.payment;
      const ws = w.workshop;

      records.push({
        id: w.id,
        invoiceNo: `RA-WS-${w.id.slice(-4).toUpperCase()}`,
        type: "WORKSHOP",
        subClassName: ws.title,
        className: "Workshop",
        teacherName: ws.teacher
          ? `${ws.teacher.firstName} ${ws.teacher.lastName}`
          : "TBA",
        dayOfWeek: new Date(ws.eventDate).toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        startTime: ws.startTime,
        endTime: ws.endTime,
        eventDate: ws.eventDate.toISOString(),
        amount: Number(p?.amount ?? ws.price),
        currency: p?.currency ?? "OMR",
        status: (p?.status ?? "PENDING") as PaymentStatus,
        method: p?.method ?? undefined,
        paidAt: p?.paidAt?.toISOString(),
        subClassId: ws.id,   // used for the "Continue" link — adjust if needed
      });
    }

    // ── Map regular bookings ──────────────────────────────────────────────────
    for (const b of bookings) {
      const p = b.payment;
      const schedule = b.session.schedule;
      const sc = schedule.subClass;

      records.push({
        id: b.id,
        invoiceNo: `RA-BK-${b.id.slice(-4).toUpperCase()}`,
        type: "BOOKING",
        subClassName: sc.name,
        className: sc.class.name,
        teacherName: `${schedule.teacher.firstName} ${schedule.teacher.lastName}`,
        dayOfWeek:
          schedule.dayOfWeek.charAt(0) +
          schedule.dayOfWeek.slice(1).toLowerCase(),
        startTime: b.session.startTime,
        endTime: b.session.endTime,
        amount: Number(p?.amount ?? sc.price),
        currency: p?.currency ?? "OMR",
        status: (p?.status ?? "PENDING") as PaymentStatus,
        method: p?.method ?? undefined,
        paidAt: p?.paidAt?.toISOString(),
        subClassId: sc.id,
        level: sc.level ?? undefined,
        ageGroup: sc.ageGroup ?? undefined,
      });
    }

    // 4. Sort all records newest first
    records.sort((a, b) => {
      const aDate = a.paidAt ?? "";
      const bDate = b.paidAt ?? "";
      return bDate.localeCompare(aDate);
    });

    return { data: records };
  } catch (err) {
    console.error("getStudentPayments error:", err);
    return { data: [], error: "Failed to load payments" };
  }
}