// src/lib/actions/payment.ts
"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function confirmPayment(
  bookingId: string,
  paymentId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Mark booking as CONFIRMED
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CONFIRMED" },
      });

      // Mark payment as PAID
      if (paymentId) {
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: "PAID",
            method: "CREDIT_CARD", // placeholder until Thawani integration
            paidAt: new Date(),
          },
        });
      }

      // Increment currentEnrolled on the schedule
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { session: true },
      });

      if (booking?.session.scheduleId) {
        await tx.classSchedule.update({
          where: { id: booking.session.scheduleId },
          data: { currentEnrolled: { increment: 1 } },
        });
      }
    });

    return { success: true };
  } catch (err) {
    console.error("confirmPayment error:", err);
    return { success: false, error: "Payment confirmation failed" };
  }
}