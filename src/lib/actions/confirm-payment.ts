// src/lib/actions/confirm-payment.ts
"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type ConfirmResult =
  | { success: true }
  | { success: false; error: string };

// ─── Confirm Monthly Enrollment Payment ──────────────────────────

export async function confirmMonthlyPayment(
  enrollmentId: string
): Promise<ConfirmResult> {
  try {
    const enrollment = await prisma.monthlyEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { payment: true },
    });

    if (!enrollment) return { success: false, error: "Enrollment not found." };
    if (enrollment.status === "CONFIRMED") return { success: true }; // already paid

    await prisma.$transaction([
      prisma.monthlyEnrollment.update({
        where: { id: enrollmentId },
        data: { status: "CONFIRMED" },
      }),
      ...(enrollment.payment
        ? [
            prisma.monthlyPayment.update({
              where: { id: enrollment.payment.id },
              data: {
                status: "PAID",
                method: "CREDIT_CARD",
                paidAt: new Date(),
              },
            }),
          ]
        : []),
    ]);

    return { success: true };
  } catch (err) {
    console.error("confirmMonthlyPayment error:", err);
    return { success: false, error: "Payment confirmation failed. Please try again." };
  }
}

// ─── Confirm Trial Payment ────────────────────────────────────────

export async function confirmTrialPayment(
  trialBookingId: string
): Promise<ConfirmResult> {
  try {
    const trial = await prisma.trialBooking.findUnique({
      where: { id: trialBookingId },
      include: { payment: true },
    });

    if (!trial) return { success: false, error: "Trial booking not found." };
    if (trial.status === "CONFIRMED") return { success: true };

    await prisma.$transaction([
      prisma.trialBooking.update({
        where: { id: trialBookingId },
        data: { status: "CONFIRMED" },
      }),
      ...(trial.payment
        ? [
            prisma.payment.update({
              where: { id: trial.payment.id },
              data: {
                status: "PAID",
                method: "CREDIT_CARD",
                paidAt: new Date(),
              },
            }),
          ]
        : []),
    ]);

    return { success: true };
  } catch (err) {
    console.error("confirmTrialPayment error:", err);
    return { success: false, error: "Payment confirmation failed. Please try again." };
  }
}

// ─── Fetch Monthly Enrollment for payment page ───────────────────

export type MonthlyPaymentData = {
  enrollmentId: string;
  status: string;
  month: number;
  year: number;
  frequency: string;
  preferredDays: string[];
  totalAmount: string;
  currency: string;
  studentName: string;
  studentEmail: string;
  subClass: {
    name: string;
    level: string | null;
    durationMinutes: number;
    className: string;
    sessionType: string;
  };
  teacher: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  } | null;
};

export async function getMonthlyPaymentData(
  enrollmentId: string
): Promise<MonthlyPaymentData | null> {
  const enrollment = await prisma.monthlyEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: { include: { user: true } },
      subClass: {
        include: {
          class: true,
          teacher: true,
        },
      },
    },
  });

  if (!enrollment) return null;

  return {
    enrollmentId: enrollment.id,
    status: enrollment.status,
    month: enrollment.month,
    year: enrollment.year,
    frequency: enrollment.frequency,
    preferredDays: enrollment.preferredDays,
    totalAmount: enrollment.totalAmount.toString(),
    currency: enrollment.currency,
    studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
    studentEmail: enrollment.student.user.email,
    subClass: {
      name: enrollment.subClass.name,
      level: enrollment.subClass.level,
      durationMinutes: enrollment.subClass.durationMinutes,
      className: enrollment.subClass.class.name,
      sessionType: enrollment.subClass.sessionType,
    },
    teacher: enrollment.subClass.teacher
      ? {
          firstName: enrollment.subClass.teacher.firstName,
          lastName: enrollment.subClass.teacher.lastName,
          photoUrl: enrollment.subClass.teacher.photoUrl,
        }
      : null,
  };
}

// ─── Fetch Trial Booking for payment page ────────────────────────

export type TrialPaymentData = {
  trialBookingId: string;
  status: string;
  amount: string;
  currency: string;
  studentName: string;
  studentEmail: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  subClass: {
    name: string;
    level: string | null;
    durationMinutes: number;
    className: string;
  };
  teacher: {
    firstName: string;
    lastName: string;
    photoUrl: string | null;
  } | null;
};

export async function getTrialPaymentData(
  trialBookingId: string
): Promise<TrialPaymentData | null> {
  const trial = await prisma.trialBooking.findUnique({
    where: { id: trialBookingId },
    include: {
      student: { include: { user: true } },
      subClass: {
        include: {
          class: true,
          teacher: true,
        },
      },
      session: true,
      payment: true, // now a proper relation via trialBookingId
    },
  });

  if (!trial) return null;

  return {
    trialBookingId: trial.id,
    status: trial.status,
    amount: trial.payment?.amount.toString() ?? trial.subClass.trialPrice.toString(),
    currency: trial.payment?.currency ?? trial.subClass.currency,
    studentName: `${trial.student.firstName} ${trial.student.lastName}`,
    studentEmail: trial.student.user.email,
    sessionDate: trial.session.sessionDate.toISOString(),
    startTime: trial.session.startTime,
    endTime: trial.session.endTime,
    subClass: {
      name: trial.subClass.name,
      level: trial.subClass.level,
      durationMinutes: trial.subClass.durationMinutes,
      className: trial.subClass.class.name,
    },
    teacher: trial.subClass.teacher
      ? {
          firstName: trial.subClass.teacher.firstName,
          lastName: trial.subClass.teacher.lastName,
          photoUrl: trial.subClass.teacher.photoUrl,
        }
      : null,
  };
}
