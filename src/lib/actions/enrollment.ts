// src/lib/actions/enrollment.ts
"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type EnrollmentResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string };

// ─── Monthly Enrollment ───────────────────────────────────────────

export async function createMonthlyEnrollment({
  studentId,
  subClassId,
  teacherId,
  month,
  year,
  frequency,
  preferredDays,
}: {
  studentId: string;
  subClassId: string;
  teacherId: string;
  month: number;
  year: number;
  frequency: "ONCE_PER_WEEK" | "TWICE_PER_WEEK";
  preferredDays: string[];
}): Promise<EnrollmentResult> {
  try {
    // Check for existing enrollment for this student + subclass + teacher + month
    const existing = await prisma.monthlyEnrollment.findFirst({
      where: { studentId, subClassId, month, year },
    });

    if (existing) {
      if (existing.status === "PENDING") {
        return {
          success: true,
          redirectTo: `/payment/monthly?enrollmentId=${existing.id}`,
        };
      }
      return {
        success: false,
        error: "You are already enrolled in this class for this month.",
      };
    }

    const subClass = await prisma.subClass.findUniqueOrThrow({
      where: { id: subClassId },
    });

    const amount =
      frequency === "ONCE_PER_WEEK"
        ? (subClass.oncePriceMonthly ?? subClass.price)
        : (subClass.twicePriceMonthly ?? subClass.price);

    const enrollment = await prisma.monthlyEnrollment.create({
      data: {
        studentId,
        subClassId,
        month,
        year,
        frequency,
        preferredDays,
        status: "PENDING",
        totalAmount: amount,
        currency: subClass.currency,
      },
    });

    await prisma.monthlyPayment.create({
      data: {
        enrollmentId: enrollment.id,
        amount,
        currency: subClass.currency,
        status: "PENDING",
      },
    });

    return {
      success: true,
      redirectTo: `/payment/monthly?enrollmentId=${enrollment.id}`,
    };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return {
        success: false,
        error: "You are already enrolled in this class for this month.",
      };
    }
    console.error("createMonthlyEnrollment error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ─── Trial Booking ────────────────────────────────────────────────

export async function createTrialEnrollment({
  studentId,
  subClassId,
  teacherId,
}: {
  studentId: string;
  subClassId: string;
  teacherId: string;
}): Promise<EnrollmentResult> {
  try {
    const existing = await prisma.trialBooking.findUnique({
      where: { studentId_subClassId: { studentId, subClassId } },
    });

    if (existing) {
      if (existing.status === "PENDING") {
        return {
          success: true,
          redirectTo: `/payment/trial?trialBookingId=${existing.id}`,
        };
      }
      return {
        success: false,
        error: "You have already taken a trial for this class.",
      };
    }

    // Find next available session for this subclass + this specific teacher
    const nextSession = await prisma.classSession.findFirst({
      where: {
        sessionDate: { gte: new Date() },
        status: "ACTIVE",
        schedule: {
          subClassId,
          teacherId, // ← scoped to chosen teacher
        },
      },
      orderBy: { sessionDate: "asc" },
    });

    if (!nextSession) {
      return {
        success: false,
        error: "No upcoming sessions available for this instructor. Please contact us.",
      };
    }

    const subClass = await prisma.subClass.findUniqueOrThrow({
      where: { id: subClassId },
    });

    const trial = await prisma.trialBooking.create({
      data: {
        studentId,
        subClassId,
        sessionId: nextSession.id,
        status: "PENDING",
      },
    });

    await prisma.payment.create({
      data: {
        trialBookingId: trial.id,
        amount: subClass.trialPrice,
        currency: subClass.currency,
        status: "PENDING",
      },
    });

    return {
      success: true,
      redirectTo: `/payment/trial?trialBookingId=${trial.id}`,
    };
  } catch (err: any) {
    if (err?.code === "P2002") {
      return {
        success: false,
        error: "You have already taken a trial for this class.",
      };
    }
    console.error("createTrialEnrollment error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}