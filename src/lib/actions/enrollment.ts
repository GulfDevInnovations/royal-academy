// src/lib/actions/enrollment.ts
"use server";

import { prisma } from "@/lib/prisma";
import { DayOfWeek } from "@prisma/client";
import {
  notifyMonthlyEnrollmentConfirmed,
  notifyMultiMonthEnrollmentConfirmed,
  notifyTrialBookingConfirmed,
} from "@/lib/actions/notifications/student-events"; // ← ADD

export type EnrollmentResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

function addMonths(month: number, year: number, n: number) {
  const d = new Date(year, month - 1 + n, 1);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function buildMonthRange(startMonth: number, startYear: number, totalMonths: number) {
  return Array.from({ length: totalMonths }, (_, i) =>
    addMonths(startMonth, startYear, i),
  );
}

export async function createMonthlyEnrollment({
  studentId, subClassId, teacherId,
  month, year, frequency, preferredDays, preferredSlotIds,
}: {
  studentId: string; subClassId: string; teacherId: string;
  month: number; year: number;
  frequency: "ONCE_PER_WEEK" | "TWICE_PER_WEEK";
  preferredDays: string[]; preferredSlotIds?: string[];
}): Promise<EnrollmentResult> {
  try {
    const existing = await prisma.monthlyEnrollment.findFirst({
      where: { studentId, subClassId, month, year, status: "CONFIRMED" },
    });
    if (existing) {
      return { success: false, error: "You are already enrolled in this class for this month." };
    }

    const lastDayOfMonth = new Date(year, month, 0);
    const coveringSchedule = await prisma.classSchedule.findFirst({
      where: {
        subClassId, teacherId, status: "ACTIVE",
        dayOfWeek: { in: preferredDays as any },
        OR: [{ endDate: null }, { endDate: { gte: lastDayOfMonth } }],
      },
    });

    if (!coveringSchedule) {
      const latestSchedule = await prisma.classSchedule.findFirst({
        where: { subClassId, teacherId, status: "ACTIVE", dayOfWeek: { in: preferredDays as any } },
        orderBy: { endDate: "desc" },
        select: { endDate: true },
      });
      const monthLabel = new Date(year, month - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      const endLabel = latestSchedule?.endDate
        ? new Date(latestSchedule.endDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
        : "an earlier date";
      return { success: false, error: `This instructor's schedule does not cover ${monthLabel}. Their schedule ends in ${endLabel}.` };
    }

    const subClass = await prisma.subClass.findUniqueOrThrow({ where: { id: subClassId } });
    const amount = frequency === "ONCE_PER_WEEK"
      ? (subClass.oncePriceMonthly ?? subClass.price)
      : (subClass.twicePriceMonthly ?? subClass.price);

    const enrollment = await prisma.$transaction(async (tx) => {
      const e = await tx.monthlyEnrollment.create({
        data: {
          studentId, subClassId, month, year, frequency,
          preferredDays: preferredDays as DayOfWeek[],
          scheduleIds: preferredSlotIds ?? [],
          status: "CONFIRMED",
          totalAmount: amount,
          currency: subClass.currency,
        },
      });
      await tx.monthlyPayment.create({
        data: {
          enrollmentId: e.id,
          amount,
          currency: subClass.currency,
          status: "PAID",
          method: "CASH",
          paidAt: new Date(),
        },
      });
      return e;
    });

    // ── Notify student (outside transaction — non-critical) ──────────────
    await notifyMonthlyEnrollmentConfirmed({ studentId, subClassId, month, year });

    return { success: true, redirectTo: `/payment/monthly?enrollmentId=${enrollment.id}` };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { success: false, error: "You are already enrolled in this class for this month." };
    }
    console.error("createMonthlyEnrollment error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function createMultiMonthStudentEnrollment({
  studentId, subClassId, teacherId,
  startMonth, startYear, totalMonths,
  frequency, preferredDays, preferredSlotIds,
}: {
  studentId: string; subClassId: string; teacherId: string;
  startMonth: number; startYear: number; totalMonths: number;
  frequency: "ONCE_PER_WEEK" | "TWICE_PER_WEEK";
  preferredDays: string[]; preferredSlotIds?: string[];
}): Promise<EnrollmentResult> {
  try {
    if (totalMonths < 2 || totalMonths > 12) {
      return { success: false, error: "Multi-month enrollment must be between 2 and 12 months." };
    }

    const months = buildMonthRange(startMonth, startYear, totalMonths);
    const endPeriod = months[months.length - 1];

    const duplicates = await prisma.monthlyEnrollment.findMany({
      where: {
        studentId, subClassId,
        OR: months.map(({ month, year }) => ({ month, year })),
        status: "CONFIRMED",
      },
      select: { month: true, year: true },
    });
    if (duplicates.length > 0) {
      const labels = duplicates
        .map(({ month, year }) => new Date(year, month - 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" }))
        .join(", ");
      return { success: false, error: `You are already enrolled for: ${labels}.` };
    }

    const schedules = await prisma.classSchedule.findMany({
      where: { subClassId, teacherId, status: "ACTIVE", dayOfWeek: { in: preferredDays as any } },
      select: { endDate: true },
    });

    for (const { month, year } of months) {
      const lastDayOfMonth = new Date(year, month, 0);
      const covered = schedules.some((s) => s.endDate == null || new Date(s.endDate) >= lastDayOfMonth);
      if (!covered) {
        const monthLabel = new Date(year, month - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        const finiteEnds = schedules.filter((s) => s.endDate != null).map((s) => new Date(s.endDate!));
        const latestEnd = finiteEnds.length > 0 ? new Date(Math.max(...finiteEnds.map((d) => d.getTime()))) : null;
        const endLabel = latestEnd
          ? latestEnd.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
          : "an earlier date";
        return { success: false, error: `This instructor's schedule does not cover ${monthLabel}. Their schedule ends in ${endLabel}. Please reduce the number of months.` };
      }
    }

    const subClass = await prisma.subClass.findUniqueOrThrow({ where: { id: subClassId } });

    for (const { month, year } of months) {
      const enrolled = await prisma.monthlyEnrollment.count({
        where: { subClassId, month, year, status: "CONFIRMED" },
      });
      if (enrolled >= subClass.capacity) {
        const label = new Date(year, month - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        return { success: false, error: `This class is full for ${label}. Please choose a different month range.` };
      }
    }

    const monthlyPrice = frequency === "ONCE_PER_WEEK"
      ? (subClass.oncePriceMonthly ?? subClass.price)
      : (subClass.twicePriceMonthly ?? subClass.price);
    const totalAmount = Number(monthlyPrice) * totalMonths;

    const parent = await prisma.$transaction(async (tx) => {
      const newParent = await tx.multiMonthEnrollment.create({
        data: {
          studentId, subClassId, frequency,
          preferredDays: preferredDays as DayOfWeek[],
          scheduleIds: preferredSlotIds ?? [],
          startMonth, startYear,
          endMonth: endPeriod.month,
          endYear: endPeriod.year,
          totalMonths, totalAmount,
          currency: subClass.currency,
          status: "CONFIRMED",
        },
      });

      for (const { month, year } of months) {
        await tx.monthlyEnrollment.create({
          data: {
            studentId, subClassId, month, year, frequency,
            preferredDays: preferredDays as DayOfWeek[],
            scheduleIds: preferredSlotIds ?? [],
            status: "CONFIRMED",
            totalAmount: Number(monthlyPrice),
            currency: subClass.currency,
            multiMonthEnrollmentId: newParent.id,
          },
        });
      }

      await tx.multiMonthPayment.create({
        data: {
          multiMonthEnrollmentId: newParent.id,
          amount: totalAmount,
          currency: subClass.currency,
          status: "PAID",
          method: "CASH",
          paidAt: new Date(),
        },
      });

      return newParent;
    });

    // ── Notify student (outside transaction — non-critical) ──────────────
    await notifyMultiMonthEnrollmentConfirmed({
      studentId,
      subClassId,
      startMonth,
      startYear,
      totalMonths,
    });

    return { success: true, redirectTo: `/payment/multi-month?enrollmentId=${parent.id}` };
  } catch (err: any) {
    console.error("createMultiMonthStudentEnrollment error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function createTrialEnrollment({
  studentId, subClassId, teacherId, sessionDate,
}: {
  studentId: string; subClassId: string;
  teacherId: string; sessionDate?: string;
}): Promise<EnrollmentResult> {
  try {
    const existing = await prisma.trialBooking.findUnique({
      where: { studentId_subClassId: { studentId, subClassId } },
    });
    if (existing) {
      return { success: false, error: "You have already taken a trial for this class." };
    }

    let nextSession: { id: string } | null = null;

    if (sessionDate) {
      const [sy, sm, sd] = sessionDate.split("-").map(Number);
      const dayStart = new Date(sy, sm - 1, sd, 0, 0, 0);
      const dayEnd   = new Date(sy, sm - 1, sd, 23, 59, 59);

      nextSession = await prisma.classSession.findFirst({
        where: { sessionDate: { gte: dayStart, lte: dayEnd }, status: "ACTIVE", schedule: { subClassId, teacherId } },
        orderBy: { sessionDate: "asc" },
        select: { id: true },
      });

      if (!nextSession) {
        const JS_DAY: Record<number, string> = {
          0: "SUNDAY", 1: "MONDAY", 2: "TUESDAY", 3: "WEDNESDAY",
          4: "THURSDAY", 5: "FRIDAY", 6: "SATURDAY",
        };
        const schedule = await prisma.classSchedule.findFirst({
          where: {
            subClassId, teacherId, status: "ACTIVE",
            dayOfWeek: JS_DAY[dayStart.getDay()] as any,
            startDate: { lte: dayEnd },
            OR: [{ endDate: null }, { endDate: { gte: dayStart } }],
          },
          select: { id: true, startTime: true, endTime: true },
        });
        if (!schedule) {
          return { success: false, error: "No active schedule found for the selected date and instructor." };
        }
        const [h, m] = schedule.startTime.split(":").map(Number);
        nextSession = await prisma.classSession.create({
          data: {
            scheduleId: schedule.id,
            sessionDate: dayStart,
            sessionDatetime: new Date(sy, sm - 1, sd, h, m, 0),
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            status: "ACTIVE",
          },
          select: { id: true },
        });
      }
    } else {
      nextSession = await prisma.classSession.findFirst({
        where: { sessionDate: { gte: new Date() }, status: "ACTIVE", schedule: { subClassId, teacherId } },
        orderBy: { sessionDate: "asc" },
        select: { id: true },
      });
    }

    if (!nextSession) {
      return {
        success: false,
        error: sessionDate
          ? "No upcoming session found for the selected date. Please choose another date or contact us."
          : "No upcoming sessions available for this instructor. Please contact us.",
      };
    }

    const subClass = await prisma.subClass.findUniqueOrThrow({ where: { id: subClassId } });

    const trial = await prisma.$transaction(async (tx) => {
      const t = await tx.trialBooking.create({
        data: {
          studentId, subClassId,
          sessionId: nextSession!.id,
          status: "CONFIRMED",
        },
      });
      await tx.payment.create({
        data: {
          trialBookingId: t.id,
          amount: subClass.trialPrice,
          currency: subClass.currency,
          status: "PAID",
          method: "CASH",
          paidAt: new Date(),
        },
      });
      return t;
    });

    // ── Notify student (outside transaction — non-critical) ──────────────
    await notifyTrialBookingConfirmed({
      studentId,
      subClassId,
      sessionId: trial.sessionId,
    });

    return { success: true, redirectTo: `/payment/trial?trialBookingId=${trial.id}` };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return { success: false, error: "You have already taken a trial for this class." };
    }
    console.error("createTrialEnrollment error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}