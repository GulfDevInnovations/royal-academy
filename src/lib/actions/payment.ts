// src/lib/actions/payment.ts
"use server";

import { prisma } from "@/lib/prisma";

export type ConfirmResult =
  | { success: true }
  | { success: false; error: string };

// Called from /payment/session after successful payment.
// Creates Booking + Payment in one transaction — nothing existed before.

export async function confirmPayment(params: {
  studentId: string;
  sessionId: string;
  amount:    number;
  currency:  string;
}): Promise<ConfirmResult> {
  try {
    // Idempotency guard
    const existing = await prisma.booking.findUnique({
      where: {
        studentId_sessionId: {
          studentId: params.studentId,
          sessionId: params.sessionId,
        },
      },
    });
    if (existing) return { success: true };

    await prisma.$transaction(async (tx) => {
      // 1. Create the booking — CONFIRMED from the start
      const booking = await tx.booking.create({
        data: {
          studentId: params.studentId,
          sessionId: params.sessionId,
          status:    "CONFIRMED",
        },
        include: { session: true },
      });

      // 2. Create the payment — PAID from the start
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount:    params.amount,
          currency:  params.currency,
          status:    "PAID",
          method:    "CREDIT_CARD", // swap for Thawani method when ready
          paidAt:    new Date(),
        },
      });

      // 3. Increment currentEnrolled on the schedule
      if (booking.session.scheduleId) {
        await tx.classSchedule.update({
          where: { id: booking.session.scheduleId },
          data:  { currentEnrolled: { increment: 1 } },
        });
      }
    });

    return { success: true };
  } catch (err) {
    console.error("confirmPayment error:", err);
    return { success: false, error: "Payment confirmation failed." };
  }
}