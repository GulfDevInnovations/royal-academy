// src/lib/actions/confirm-payment.ts
"use server";

import { prisma } from "@/lib/prisma";
import { DayOfWeek, FrequencyType } from "@prisma/client";
import {
  notifyMonthlyEnrollmentConfirmed,
  notifyMultiMonthEnrollmentConfirmed,
  notifyTrialBookingConfirmed,
} from "@/lib/actions/notifications/student-events";

export type ConfirmResult =
  | { success: true }
  | { success: false; error: string };

// ─── Confirm Monthly Enrollment Payment ──────────────────────────
// Called from /payment/monthly after successful payment
// Creates enrollment + payment in one transaction — nothing existed before

export async function confirmMonthlyPayment(params: {
  studentId:     string;
  subClassId:    string;
  month:         number;
  year:          number;
  frequency:     FrequencyType;
  preferredDays: DayOfWeek[];
  amount:        number;
  currency:      string;
}): Promise<ConfirmResult> {
  try {
    // Guard: don't double-create if webhook fires twice
    const existing = await prisma.monthlyEnrollment.findFirst({
      where: {
        studentId:  params.studentId,
        subClassId: params.subClassId,
        month:      params.month,
        year:       params.year,
        status:     "CONFIRMED",
      },
    });
    if (existing) return { success: true };

    await prisma.$transaction(async (tx) => {
      const enrollment = await tx.monthlyEnrollment.create({
        data: {
          studentId:     params.studentId,
          subClassId:    params.subClassId,
          month:         params.month,
          year:          params.year,
          frequency:     params.frequency,
          preferredDays: params.preferredDays,
          status:        "CONFIRMED",
          totalAmount:   params.amount,
          currency:      params.currency,
        },
      });

      await tx.monthlyPayment.create({
        data: {
          enrollmentId: enrollment.id,
          amount:       params.amount,
          currency:     params.currency,
          status:       "PAID",
          method:       "CREDIT_CARD", // replace with Thawani method when ready
          paidAt:       new Date(),
        },
      });
    });

      await notifyMonthlyEnrollmentConfirmed({
    studentId:  params.studentId,
    subClassId: params.subClassId,
    month:      params.month,
    year:       params.year,
  });

  return { success: true };

  } catch (err) {
    console.error("confirmMonthlyPayment error:", err);
    return { success: false, error: "Payment confirmation failed. Please try again." };
  }
}

// ─── Confirm Multi-Month Enrollment Payment ───────────────────────
// Called from /payment/multi-month after successful payment

export async function confirmMultiMonthPayment(params: {
  studentId:     string;
  subClassId:    string;
  startMonth:    number;
  startYear:     number;
  endMonth:      number;
  endYear:       number;
  totalMonths:   number;
  frequency:     FrequencyType;
  preferredDays: DayOfWeek[];
  monthlyPrice:  number;
  totalAmount:   number;
  currency:      string;
}): Promise<ConfirmResult> {
  try {
    // Guard: idempotency check on parent
    const existing = await prisma.multiMonthEnrollment.findFirst({
      where: {
        studentId:  params.studentId,
        subClassId: params.subClassId,
        startMonth: params.startMonth,
        startYear:  params.startYear,
        status:     "CONFIRMED",
      },
    });
    if (existing) return { success: true };

    // Build month range
    const months: { month: number; year: number }[] = [];
    let m = params.startMonth;
    let y = params.startYear;
    for (let i = 0; i < params.totalMonths; i++) {
      months.push({ month: m, year: y });
      m++;
      if (m > 12) { m = 1; y++; }
    }

    await prisma.$transaction(async (tx) => {
      // 1. Parent record
      const parent = await tx.multiMonthEnrollment.create({
        data: {
          studentId:     params.studentId,
          subClassId:    params.subClassId,
          frequency:     params.frequency,
          preferredDays: params.preferredDays,
          startMonth:    params.startMonth,
          startYear:     params.startYear,
          endMonth:      params.endMonth,
          endYear:       params.endYear,
          totalMonths:   params.totalMonths,
          totalAmount:   params.totalAmount,
          currency:      params.currency,
          status:        "CONFIRMED",
        },
      });

      // 2. One MonthlyEnrollment per month
      for (const { month, year } of months) {
        await tx.monthlyEnrollment.create({
          data: {
            studentId:              params.studentId,
            subClassId:             params.subClassId,
            month,
            year,
            frequency:              params.frequency,
            preferredDays:          params.preferredDays,
            status:                 "CONFIRMED",
            totalAmount:            params.monthlyPrice,
            currency:               params.currency,
            multiMonthEnrollmentId: parent.id,
          },
        });
      }

      // 3. Single payment covering all months
      await tx.multiMonthPayment.create({
        data: {
          multiMonthEnrollmentId: parent.id,
          amount:   params.totalAmount,
          currency: params.currency,
          status:   "PAID",
          method:   "CREDIT_CARD",
          paidAt:   new Date(),
        },
      });
    });

      await notifyMultiMonthEnrollmentConfirmed({
    studentId:   params.studentId,
    subClassId:  params.subClassId,
    startMonth:  params.startMonth,
    startYear:   params.startYear,
    totalMonths: params.totalMonths,
  });

  return { success: true };

  } catch (err) {
    console.error("confirmMultiMonthPayment error:", err);
    return { success: false, error: "Payment confirmation failed. Please try again." };
  }
}

// ─── Confirm Trial Payment ────────────────────────────────────────
// Called from /payment/trial after successful payment

export async function confirmTrialPayment(params: {
  studentId:  string;
  subClassId: string;
  sessionId:  string;
  amount:     number;
  currency:   string;
}): Promise<ConfirmResult> {
  try {
    // Guard: already confirmed
    const existing = await prisma.trialBooking.findUnique({
      where: { studentId_subClassId: { studentId: params.studentId, subClassId: params.subClassId } },
    });
    if (existing) return { success: true };

    await prisma.$transaction(async (tx) => {
      const trial = await tx.trialBooking.create({
        data: {
          studentId:  params.studentId,
          subClassId: params.subClassId,
          sessionId:  params.sessionId,
          status:     "CONFIRMED",
        },
      });

      await tx.payment.create({
        data: {
          trialBookingId: trial.id,
          amount:         params.amount,
          currency:       params.currency,
          status:         "PAID",
          method:         "CREDIT_CARD",
          paidAt:         new Date(),
        },
      });
    });


  // ← ADD THIS
  await notifyTrialBookingConfirmed({
    studentId:  params.studentId,
    subClassId: params.subClassId,
    sessionId:  params.sessionId,
  });

    return { success: true };
  } catch (err) {
    console.error("confirmTrialPayment error:", err);
    return { success: false, error: "Payment confirmation failed. Please try again." };
  }
}