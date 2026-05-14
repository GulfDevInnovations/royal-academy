"use server";

import { prisma } from "@/lib/prisma";
import { PaymentStatus, PaymentMethod } from "@prisma/client";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type PaymentTab = "ALL" | "ENROLLMENT" | "BOOKING" | "TRIAL" | "WORKSHOP";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function generateInvoiceNo(date: Date): string {
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit suffix
  return `INV-${yyyy}${mm}-${rand}`;
}

async function ensureUniqueInvoiceNo(date: Date): Promise<string> {
  let no: string;
  let attempts = 0;
  do {
    no = generateInvoiceNo(date);
    const exists = await prisma.invoice.findUnique({ where: { invoiceNo: no } });
    if (!exists) return no;
    attempts++;
  } while (attempts < 10);
  // Fallback: timestamp-based
  return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${Date.now().toString().slice(-4)}`;
}

// ─────────────────────────────────────────────
// READ — enrollment payments (MonthlyPayment)
// ─────────────────────────────────────────────

export async function getEnrollmentPayments(filters?: {
  status?: PaymentStatus;
  month?:  number;
  year?:   number;
}) {
  return prisma.monthlyPayment.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.month || filters?.year ? {
        enrollment: {
          ...(filters?.month ? { month: filters.month } : {}),
          ...(filters?.year  ? { year:  filters.year  } : {}),
        },
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      enrollment: {
        include: {
          student: {
            select: {
              id: true, firstName: true, lastName: true,
              user: { select: { email: true, phone: true } },
            },
          },
          subClass: {
            select: {
              id: true, name: true,
              class: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
}

// ─────────────────────────────────────────────
// READ — booking / trial / workshop payments (Payment)
// ─────────────────────────────────────────────

export async function getOtherPayments(filters?: {
  status?: PaymentStatus;
  tab?:    "BOOKING" | "TRIAL" | "WORKSHOP";
}) {
  return prisma.payment.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.tab === "BOOKING"  ? { bookingId:         { not: null } } : {}),
      ...(filters?.tab === "TRIAL"    ? { trialBookingId:    { not: null } } : {}),
      ...(filters?.tab === "WORKSHOP" ? { workshopBookingId: { not: null } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        include: {
          student: {
            select: {
              id: true, firstName: true, lastName: true,
              user: { select: { email: true, phone: true } },
            },
          },
          session: {
            include: {
              schedule: {
                include: {
                  subClass: {
                    select: {
                      name: true,
                      class: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      trialBooking: {
        include: {
          student: {
            select: {
              id: true, firstName: true, lastName: true,
              user: { select: { email: true, phone: true } },
            },
          },
          subClass: {
            select: {
              name: true,
              class: { select: { name: true } },
            },
          },
        },
      },
      workshopBooking: {
        include: {
          student: {
            select: {
              id: true, firstName: true, lastName: true,
              user: { select: { email: true, phone: true } },
            },
          },
          workshop: { select: { title: true } },
        },
      },
      invoice: { select: { invoiceNo: true } },
    },
  });
}

// ─────────────────────────────────────────────
// STATS — for the summary bar
// ─────────────────────────────────────────────

export async function getPaymentStats(month?: number, year?: number) {
  const monthFilter = month && year ? { month, year } : undefined;

  const [enrollmentStats, paymentStats] = await Promise.all([
    prisma.monthlyPayment.groupBy({
      by:    ["status"],
      _sum:  { amount: true },
      _count: true,
      where: monthFilter ? { enrollment: monthFilter } : undefined,
    }),
    prisma.payment.groupBy({
      by:    ["status"],
      _sum:  { amount: true },
      _count: true,
    }),
  ]);

  const combine = (
    items: { status: PaymentStatus; _sum: { amount: any }; _count: number }[]
  ) => items.reduce((acc, item) => {
    acc[item.status] = {
      count:  (acc[item.status]?.count  ?? 0) + item._count,
      amount: (acc[item.status]?.amount ?? 0) + Number(item._sum.amount ?? 0),
    };
    return acc;
  }, {} as Record<string, { count: number; amount: number }>);

  const e = combine(enrollmentStats as any);
  const p = combine(paymentStats   as any);

  const merge = (s: PaymentStatus) => ({
    count:  (e[s]?.count  ?? 0) + (p[s]?.count  ?? 0),
    amount: (e[s]?.amount ?? 0) + (p[s]?.amount ?? 0),
  });

  return {
    paid:     merge("PAID"),
    failed:   merge("FAILED"),
    refunded: merge("REFUNDED"),
  };
}

// ─────────────────────────────────────────────
// REFUND — enrollment payment
// ─────────────────────────────────────────────

export async function refundEnrollmentPayment(
  paymentId: string,
  reason: string
) {
  if (!reason.trim()) return { error: "Refund reason is required." };

  const payment = await prisma.monthlyPayment.findUnique({
    where: { id: paymentId },
    include: { enrollment: true },
  });
  if (!payment)             return { error: "Payment not found." };
  if (payment.status !== "PAID") return { error: "Only paid payments can be refunded." };

  await prisma.$transaction([
    prisma.monthlyPayment.update({
      where: { id: paymentId },
      data:  { status: "REFUNDED" },
    }),
    prisma.monthlyEnrollment.update({
      where: { id: payment.enrollmentId },
      data:  { status: "CANCELLED" },
    }),
  ]);

  return { success: true };
}

// ─────────────────────────────────────────────
// REFUND — booking / trial / workshop payment
// ─────────────────────────────────────────────

export async function refundPayment(paymentId: string, reason: string) {
  if (!reason.trim()) return { error: "Refund reason is required." };

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment)             return { error: "Payment not found." };
  if (payment.status !== "PAID") return { error: "Only paid payments can be refunded." };

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status:        "REFUNDED",
      refundReason:  reason,
      refundedAt:    new Date(),
      refundedAmount: payment.amount,
    },
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// CREATE / GET INVOICE for an enrollment payment
// ─────────────────────────────────────────────

export async function getOrCreateInvoiceForEnrollment(enrollmentPaymentId: string) {
  // Check if invoice already exists via Payment → Invoice link
  // MonthlyPayment doesn't link to Invoice directly in schema,
  // so we store invoiceNo in a metadata approach via a standalone Invoice record
  // keyed by the enrollment payment id stored in notes field.

  const payment = await prisma.monthlyPayment.findUnique({
    where: { id: enrollmentPaymentId },
    include: {
      enrollment: {
        include: {
          student: {
            include: { user: { select: { email: true, phone: true } } },
          },
          subClass: {
            select: {
              name: true,
              class: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!payment) return { error: "Payment not found." };

  // Look for existing invoice by matching notes field (our reference)
  const existingInvoice = await prisma.invoice.findFirst({
    where: { notes: `enrollment_payment:${enrollmentPaymentId}` },
  });

  if (existingInvoice) {
    return { success: true, invoice: existingInvoice };
  }

  // Create new invoice
  const now       = new Date();
  const invoiceNo = await ensureUniqueInvoiceNo(now);
  const amount    = Number(payment.amount);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      studentId:   payment.enrollment.studentId,
      amount,
      tax:         0,
      totalAmount: amount,
      currency:    payment.currency,
      status:      payment.status === "PAID" ? "PAID" : "ISSUED",
      issuedAt:    now,
      paidAt:      payment.paidAt ?? undefined,
      notes:       `enrollment_payment:${enrollmentPaymentId}`,
    },
  });

  return { success: true, invoice };
}