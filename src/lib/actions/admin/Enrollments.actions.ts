"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus, PaymentStatus, PaymentMethod, FrequencyType } from "@prisma/client";

// ─────────────────────────────────────────────
// READ — all enrollments with full relations
// ─────────────────────────────────────────────

export async function getEnrollments(filters?: {
  month?:      number;
  year?:       number;
  subClassId?: string;
  classId?:    string;
  status?:     BookingStatus;
}) {
  return prisma.monthlyEnrollment.findMany({
    where: {
      ...(filters?.month      ? { month:      filters.month }      : {}),
      ...(filters?.year       ? { year:        filters.year }       : {}),
      ...(filters?.subClassId ? { subClassId: filters.subClassId } : {}),
      ...(filters?.status     ? { status:      filters.status }     : {}),
      ...(filters?.classId    ? {
        subClass: { classId: filters.classId },
      } : {}),
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { bookedAt: "desc" }],
    include: {
      student: {
        select: {
          id: true, firstName: true, lastName: true,
          user: { select: { email: true, phone: true } },
        },
      },
      subClass: {
        select: {
          id: true, name: true, capacity: true,
          oncePriceMonthly: true, twicePriceMonthly: true,
          class: { select: { id: true, name: true } },
          // Schedules to show available days
          classSchedules: {
            where: { status: "ACTIVE" },
            select: { dayOfWeek: true, startTime: true, endTime: true },
          },
        },
      },
      payment: {
        select: {
          id: true, amount: true, status: true,
          method: true, paidAt: true, currency: true,
        },
      },
    },
  });
}

// ── Capacity summary per subclass for a given month/year ──
export async function getCapacitySummary(month: number, year: number) {
  const subClasses = await prisma.subClass.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, capacity: true,
      class: { select: { id: true, name: true } },
      classSchedules: {
        where: { status: "ACTIVE" },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
      monthlyEnrollments: {
        where: { month, year, status: { in: ["CONFIRMED", "PENDING"] } },
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          payment: { select: { status: true, amount: true, paidAt: true } },
        },
      },
    },
    orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
  });
  return subClasses;
}

// ── Form options ──
export async function getEnrollmentFormOptions() {
  const [students, subClasses] = await Promise.all([
    prisma.studentProfile.findMany({
      where: { user: { isActive: true } },
      orderBy: { firstName: "asc" },
      select: {
        id: true, firstName: true, lastName: true,
        user: { select: { email: true, phone: true } },
      },
    }),
    prisma.subClass.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, capacity: true,
        oncePriceMonthly: true, twicePriceMonthly: true, trialPrice: true,
        class: { select: { id: true, name: true } },
        classSchedules: {
          where: { status: "ACTIVE" },
          select: { dayOfWeek: true, startTime: true, endTime: true },
        },
      },
    }),
  ]);
  return { students, subClasses };
}

// ─────────────────────────────────────────────
// CREATE — admin enrolls a student
// Auto-confirms if payment is provided
// ─────────────────────────────────────────────

export async function createEnrollment(formData: FormData) {
  const studentId    = formData.get("studentId")    as string;
  const subClassId   = formData.get("subClassId")   as string;
  const month        = parseInt(formData.get("month")  as string);
  const year         = parseInt(formData.get("year")   as string);
  const frequency    = formData.get("frequency")    as FrequencyType;
  const preferredDaysRaw = formData.get("preferredDays") as string;
  const preferredDays    = preferredDaysRaw
    ? preferredDaysRaw.split(",").filter(Boolean) as any[]
    : [];

  // Payment fields (optional — if provided, auto-confirms)
  const payNow       = formData.get("payNow") === "true";
  const payAmount    = formData.get("payAmount")    as string | null;
  const payMethod    = formData.get("payMethod")    as PaymentMethod | null;

  if (!studentId)  return { error: "Student is required." };
  if (!subClassId) return { error: "Sub-class is required." };
  if (!month || !year) return { error: "Month and year are required." };
  if (!frequency)  return { error: "Frequency is required." };

  // Check for duplicate
  const existing = await prisma.monthlyEnrollment.findUnique({
    where: { studentId_subClassId_month_year: { studentId, subClassId, month, year } },
  });
  if (existing) return { error: "This student is already enrolled in this sub-class for this month." };

  // Fetch subclass for pricing
  const subClass = await prisma.subClass.findUnique({
    where: { id: subClassId },
    select: { oncePriceMonthly: true, twicePriceMonthly: true, capacity: true },
  });
  if (!subClass) return { error: "Sub-class not found." };

  // Capacity check
  const enrolled = await prisma.monthlyEnrollment.count({
    where: { subClassId, month, year, status: { in: ["CONFIRMED", "PENDING"] } },
  });
  if (enrolled >= subClass.capacity) {
    return { error: `This sub-class is full (${subClass.capacity}/${subClass.capacity}). Increase capacity or choose another sub-class.` };
  }

  // Determine price
  const price = frequency === "TWICE_PER_WEEK"
    ? Number(subClass.twicePriceMonthly ?? 0)
    : Number(subClass.oncePriceMonthly  ?? 0);

  // Determine initial status
  const status: BookingStatus = payNow && payAmount ? "CONFIRMED" : "PENDING";

  const enrollment = await prisma.$transaction(async (tx) => {
    const newEnrollment = await tx.monthlyEnrollment.create({
      data: {
        studentId,
        subClassId,
        month,
        year,
        frequency,
        preferredDays,
        status,
        totalAmount: price,
        currency:    "OMR",
      },
    });

    // If paying now, create MonthlyPayment record
    if (payNow && payAmount && payMethod) {
      await tx.monthlyPayment.create({
        data: {
          enrollmentId: newEnrollment.id,
          amount:       parseFloat(payAmount),
          currency:     "OMR",
          status:       "PAID",
          method:       payMethod,
          paidAt:       new Date(),
        },
      });
    }

    return newEnrollment;
  });

  return { success: true, enrollmentId: enrollment.id };
}

// ─────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────

export async function updateEnrollmentStatus(
  id: string,
  status: BookingStatus
) {
  await prisma.monthlyEnrollment.update({
    where: { id },
    data:  { status },
  });
  return { success: true };
}

// ─────────────────────────────────────────────
// RECORD PAYMENT (for existing PENDING enrollment)
// Marks enrollment as CONFIRMED when paid
// ─────────────────────────────────────────────

export async function recordPayment(
  enrollmentId: string,
  formData: FormData
) {
  const amount  = parseFloat(formData.get("amount")  as string);
  const method  = formData.get("method")  as PaymentMethod;
  const notes   = formData.get("notes")   as string | null;

  if (!amount || isNaN(amount)) return { error: "Valid amount is required." };
  if (!method) return { error: "Payment method is required." };

  const enrollment = await prisma.monthlyEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { payment: true },
  });
  if (!enrollment) return { error: "Enrollment not found." };

  await prisma.$transaction(async (tx) => {
    if (enrollment.payment) {
      // Update existing payment record
      await tx.monthlyPayment.update({
        where: { id: enrollment.payment.id },
        data: { amount, method, status: "PAID", paidAt: new Date() },
      });
    } else {
      // Create new payment record
      await tx.monthlyPayment.create({
        data: {
          enrollmentId,
          amount,
          currency: "OMR",
          status:   "PAID",
          method,
          paidAt:   new Date(),
        },
      });
    }

    // Auto-confirm the enrollment
    await tx.monthlyEnrollment.update({
      where: { id: enrollmentId },
      data:  { status: "CONFIRMED" },
    });
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// CANCEL ENROLLMENT
// ─────────────────────────────────────────────

export async function cancelEnrollment(id: string) {
  const enrollment = await prisma.monthlyEnrollment.findUnique({
    where: { id },
    include: { payment: true },
  });
  if (!enrollment) return { error: "Enrollment not found." };
  if (enrollment.status === "CANCELLED") return { error: "Already cancelled." };

  await prisma.monthlyEnrollment.update({
    where: { id },
    data:  { status: "CANCELLED" },
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// DELETE (admin only — removes record entirely)
// ─────────────────────────────────────────────

export async function deleteEnrollment(id: string) {
  const enrollment = await prisma.monthlyEnrollment.findUnique({
    where: { id },
    include: { payment: { select: { status: true } } },
  });
  if (!enrollment) return { error: "Enrollment not found." };
  if (enrollment.payment?.status === "PAID") {
    return { error: "Cannot delete a paid enrollment. Cancel and refund it instead." };
  }

  await prisma.monthlyEnrollment.delete({ where: { id } });
  return { success: true };
}