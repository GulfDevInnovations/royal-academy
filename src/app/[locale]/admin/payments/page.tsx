// src/app/[locale]/admin/payments/page.tsx

import {
  getEnrollmentPayments,
  getOtherPayments,
  getPaymentStats,
} from "@/lib/actions/admin/payments.actions";
import PaymentsClient from "./_components/PaymentsClient";

function serializeEnrollmentPayments(
  payments: Awaited<ReturnType<typeof getEnrollmentPayments>>,
) {
  return payments.map((p) => ({
    ...p,
    amount: Number(p.amount),
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    enrollment: {
      ...p.enrollment,
      totalAmount: Number(p.enrollment.totalAmount),
      bookedAt: p.enrollment.bookedAt.toISOString(),
      createdAt: p.enrollment.createdAt.toISOString(),
      updatedAt: p.enrollment.updatedAt.toISOString(),
    },
  }));
}

function serializeOtherPayments(
  payments: Awaited<ReturnType<typeof getOtherPayments>>,
) {
  return payments.map((p) => ({
    ...p,
    amount: Number(p.amount),
    refundedAmount: p.refundedAmount ? Number(p.refundedAmount) : null,
    paidAt: p.paidAt ? p.paidAt.toISOString() : null,
    failedAt: p.failedAt ? p.failedAt.toISOString() : null,
    refundedAt: p.refundedAt ? p.refundedAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    booking: p.booking
      ? {
          ...p.booking,
          bookedAt: p.booking.bookedAt.toISOString(),
          createdAt: p.booking.createdAt.toISOString(),
          updatedAt: p.booking.updatedAt.toISOString(),
        }
      : null,
    trialBooking: p.trialBooking
      ? {
          ...p.trialBooking,
          bookedAt: p.trialBooking.bookedAt.toISOString(),
          createdAt: p.trialBooking.createdAt.toISOString(),
          updatedAt: p.trialBooking.updatedAt.toISOString(),
        }
      : null,
    workshopBooking: p.workshopBooking
      ? {
          ...p.workshopBooking,
          bookedAt: p.workshopBooking.bookedAt.toISOString(),
          createdAt: p.workshopBooking.createdAt.toISOString(),
          updatedAt: p.workshopBooking.updatedAt.toISOString(),
        }
      : null,
  }));
}

export type SerializedEnrollmentPayment = ReturnType<
  typeof serializeEnrollmentPayments
>[number];
export type SerializedOtherPayment = ReturnType<
  typeof serializeOtherPayments
>[number];
export type PaymentStats = Awaited<ReturnType<typeof getPaymentStats>>;

export default async function AdminPaymentsPage() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [enrollmentPayments, otherPayments, stats] = await Promise.all([
    getEnrollmentPayments({ month, year }),
    getOtherPayments(),
    getPaymentStats(month, year),
  ]);

  return (
    <PaymentsClient
      initialEnrollmentPayments={serializeEnrollmentPayments(
        enrollmentPayments,
      )}
      initialOtherPayments={serializeOtherPayments(otherPayments)}
      initialStats={stats}
      defaultMonth={month}
      defaultYear={year}
    />
  );
}
