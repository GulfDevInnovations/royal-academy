"use server";

import { prisma } from "@/lib/prisma";
import { BookingStatus, PaymentStatus, PaymentMethod, FrequencyType } from "@prisma/client";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Advance month by N, returning { month: 1-12, year } */
function addMonths(month: number, year: number, n: number): { month: number; year: number } {
  const date = new Date(year, month - 1 + n, 1);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}

/** Build array of { month, year } for N months starting from start */
function buildMonthRange(
  startMonth: number,
  startYear: number,
  totalMonths: number,
): { month: number; year: number }[] {
  return Array.from({ length: totalMonths }, (_, i) =>
    addMonths(startMonth, startYear, i),
  );
}

/** Strip Prisma Decimal/Date prototypes — returns a plain serializable object. */
function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function serializeDecimalFields(obj: any, fields: string[]): any {
  const result = { ...obj };
  for (const f of fields) {
    if (result[f] != null) result[f] = Number(result[f]);
  }
  return result;
}

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
  const rawE = plain(await prisma.monthlyEnrollment.findMany({
    where: {
      ...(filters?.month      ? { month:      filters.month }      : {}),
      ...(filters?.year       ? { year:        filters.year }       : {}),
      ...(filters?.subClassId ? { subClassId: filters.subClassId } : {}),
      ...(filters?.status     ? { status:      filters.status }     : {}),
      ...(filters?.classId    ? { subClass: { classId: filters.classId } } : {}),
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
          isReschedulable: true, sessionType: true,
          oncePriceMonthly: true, twicePriceMonthly: true,
          class: { select: { id: true, name: true } },
          classSchedules: {
            where: { status: "ACTIVE" },
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            select: {
              id: true, dayOfWeek: true, startTime: true, endTime: true,
              teacher: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      payment: {
        select: {
          id: true, amount: true, status: true,
          method: true, paidAt: true, currency: true,
        },
      },
      // Link to parent multi-month enrollment if exists
      multiMonthEnrollment: {
        select: {
          id: true, totalMonths: true, startMonth: true, startYear: true,
          endMonth: true, endYear: true, status: true, totalAmount: true,
          payment: { select: { id: true, status: true, amount: true, paidAt: true } },
        },
      },
    },
  }));
  // Convert Decimal string fields to numbers
  return rawE.map((e: any) => {
    const schedules: any[] = e.subClass?.classSchedules ?? [];
    const days: string[]   = e.preferredDays ?? [];
    // Use stored scheduleIds for exact slot resolution when available,
    // otherwise fall back to dayOfWeek matching (legacy / student enrollments).
    const storedIds: string[] = e.scheduleIds ?? [];
    const resolvedSlots = schedules
      .filter((s: any) =>
        storedIds.length > 0
          ? storedIds.includes(s.id)
          : days.includes(s.dayOfWeek),
      )
      .map((s: any) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime:   s.endTime,
        teacher:   s.teacher ?? null,
      }));

    return {
      ...e,
      totalAmount: Number(e.totalAmount),
      subClass: {
        ...e.subClass,
        oncePriceMonthly:  e.subClass.oncePriceMonthly  != null ? Number(e.subClass.oncePriceMonthly)  : null,
        twicePriceMonthly: e.subClass.twicePriceMonthly != null ? Number(e.subClass.twicePriceMonthly) : null,
      },
      payment: e.payment ? { ...e.payment, amount: Number(e.payment.amount) } : null,
      multiMonthEnrollment: e.multiMonthEnrollment ? {
        ...e.multiMonthEnrollment,
        totalAmount: Number(e.multiMonthEnrollment.totalAmount),
        payment: e.multiMonthEnrollment.payment
          ? { ...e.multiMonthEnrollment.payment, amount: Number(e.multiMonthEnrollment.payment.amount) }
          : null,
      } : null,
      resolvedSlots,
    };
  });
}

// ── Multi-month enrollments (parent records) ──
export async function getMultiMonthEnrollments(filters?: {
  subClassId?: string;
  classId?:    string;
  status?:     BookingStatus;
}) {
  const rawME = plain(await prisma.multiMonthEnrollment.findMany({
    where: {
      ...(filters?.subClassId ? { subClassId: filters.subClassId } : {}),
      ...(filters?.status     ? { status:     filters.status }     : {}),
      ...(filters?.classId    ? { subClass: { classId: filters.classId } } : {}),
    },
    orderBy: [{ startYear: "desc" }, { startMonth: "desc" }, { bookedAt: "desc" }],
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
          isReschedulable: true, sessionType: true,
          class: { select: { id: true, name: true } },
          classSchedules: {
            where: { status: "ACTIVE" },
            select: {
              id: true, dayOfWeek: true, startTime: true, endTime: true,
              teacher: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      monthlyEnrollments: {
        orderBy: [{ year: "asc" }, { month: "asc" }],
        select: {
          id: true, month: true, year: true, status: true,
          preferredDays: true, scheduleIds: true,
          payment: { select: { status: true, amount: true } },
        },
      },
      payment: {
        select: {
          id: true, amount: true, status: true,
          method: true, paidAt: true, currency: true,
        },
      },
    },
  }));
  return rawME.map((m: any) => {
    const schedules: any[] = m.subClass?.classSchedules ?? [];

    // For each child month, match the student's preferredDays against
    // the subClass schedules to find the specific teacher and time slot.
    const monthlyEnrollments = m.monthlyEnrollments.map((me: any) => {
      const days: string[] = me.preferredDays ?? [];
      // Find the schedule slot whose dayOfWeek matches one of the preferred days.
      // If the student has two days (twice/week) we pick the first match for
      // display — both slots belong to the same teacher in most cases, but
      // the UI can show all matched slots if needed.
      // Use stored scheduleIds for exact resolution, fall back to day matching
      const storedIds: string[] = me.scheduleIds ?? [];
      const matchedSlots = schedules.filter((s: any) =>
        storedIds.length > 0
          ? storedIds.includes(s.id)
          : days.includes(s.dayOfWeek),
      );
      const primarySlot = matchedSlots[0] ?? null;

      return {
        ...me,
        payment: me.payment ? { ...me.payment, amount: Number(me.payment.amount) } : null,
        resolvedTeacher:   primarySlot?.teacher   ?? null,
        resolvedStartTime: primarySlot?.startTime ?? null,
        resolvedEndTime:   primarySlot?.endTime   ?? null,
        resolvedDayOfWeek: primarySlot?.dayOfWeek ?? null,
        resolvedSlots: matchedSlots.map((s: any) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime:   s.endTime,
          teacher:   s.teacher,
        })),
      };
    });

    return {
      ...m,
      totalAmount: Number(m.totalAmount),
      payment: m.payment ? { ...m.payment, amount: Number(m.payment.amount) } : null,
      monthlyEnrollments,
    };
  });
}

// ── Capacity summary per subclass for a given month/year ──
export async function getCapacitySummary(month: number, year: number) {
  const rawCap = plain(await prisma.subClass.findMany({
    where: { isActive: true },
    select: {
      id: true, name: true, capacity: true,
      isReschedulable: true, sessionType: true,
      class: { select: { id: true, name: true } },
      classSchedules: {
        where: { status: "ACTIVE" },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        select: {
          id: true, dayOfWeek: true, startTime: true, endTime: true,
          teacher: { select: { firstName: true, lastName: true } },
        },
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
  }));
  return rawCap.map((sc: any) => ({
    ...sc,
    oncePriceMonthly:  sc.oncePriceMonthly  != null ? Number(sc.oncePriceMonthly)  : null,
    twicePriceMonthly: sc.twicePriceMonthly != null ? Number(sc.twicePriceMonthly) : null,
    monthlyEnrollments: sc.monthlyEnrollments.map((e: any) => ({
      ...e,
      totalAmount: Number(e.totalAmount),
      payment: e.payment ? { ...e.payment, amount: Number(e.payment.amount) } : null,
    })),
  }));
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
        isReschedulable: true, sessionType: true,
        oncePriceMonthly: true, twicePriceMonthly: true, trialPrice: true,
        class: { select: { id: true, name: true } },
        classSchedules: {
          where: { status: "ACTIVE" },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          select: {
            id: true, dayOfWeek: true, startTime: true, endTime: true,
            endDate: true,
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);
  const raw = plain({ students, subClasses });
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    students: raw.students,
    subClasses: raw.subClasses.map((s: any) => ({
      ...s,
      oncePriceMonthly:  s.oncePriceMonthly  != null ? Number(s.oncePriceMonthly)  : null,
      twicePriceMonthly: s.twicePriceMonthly != null ? Number(s.twicePriceMonthly) : null,
      trialPrice: s.trialPrice != null ? Number(s.trialPrice) : null,
      // endDate is kept on each classSchedule slot — max months is computed
      // client-side per selected slot + start month combination.
    })),
  };
}

// ─────────────────────────────────────────────
// CREATE — single-month enrollment
// ─────────────────────────────────────────────

export async function createEnrollment(formData: FormData) {
  const studentId        = formData.get("studentId")        as string;
  const subClassId       = formData.get("subClassId")       as string;
  const month            = parseInt(formData.get("month")   as string);
  const year             = parseInt(formData.get("year")    as string);
  const frequency        = formData.get("frequency")        as FrequencyType;
  const preferredDaysRaw = formData.get("preferredDays")    as string;
  const preferredDays    = preferredDaysRaw
    ? preferredDaysRaw.split(",").filter(Boolean) as any[]
    : [];
  const preferredSlotIds = ((formData.get("preferredSlotIds") as string) || "")
    .split(",").filter(Boolean);

  const payNow    = formData.get("payNow") === "true";
  const payAmount = formData.get("payAmount") as string | null;
  const payMethod = formData.get("payMethod") as PaymentMethod | null;

  if (!studentId)        return { error: "Student is required." };
  if (!subClassId)       return { error: "Sub-class is required." };
  if (!month || !year)   return { error: "Month and year are required." };
  if (!frequency)        return { error: "Frequency is required." };

  // Duplicate check
  const existing = await prisma.monthlyEnrollment.findUnique({
    where: { studentId_subClassId_month_year: { studentId, subClassId, month, year } },
  });
  if (existing) return { error: "This student is already enrolled in this sub-class for this month." };

  const subClass = await prisma.subClass.findUnique({
    where: { id: subClassId },
    select: { oncePriceMonthly: true, twicePriceMonthly: true, capacity: true },
  });
  if (!subClass) return { error: "Sub-class not found." };

  // Fetch the exact slots the admin selected (by ID), or fall back to
  // day-name matching if no slot IDs provided (e.g. legacy / student path).
  const lastDayOfMonth = new Date(year, month, 0);
  const selectedSchedules = preferredSlotIds.length > 0
    ? await prisma.classSchedule.findMany({
        where: { id: { in: preferredSlotIds }, status: "ACTIVE" },
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, endDate: true, maxCapacity: true },
      })
    : preferredDays.length > 0
    ? await prisma.classSchedule.findMany({
        where: { subClassId, status: "ACTIVE", dayOfWeek: { in: preferredDays as any } },
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, endDate: true, maxCapacity: true },
      })
    : [];

  // Coverage check — all selected slots must cover this month
  if (selectedSchedules.length > 0) {
    const uncovered = selectedSchedules.find(
      (s) => s.endDate != null && new Date(s.endDate) < lastDayOfMonth,
    );
    if (uncovered) {
      const label = new Date(year, month - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      const endLabel = new Date(uncovered.endDate!).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
      return { error: `The ${uncovered.startTime}–${uncovered.endTime} slot does not cover ${label}. Its schedule ends in ${endLabel}.` };
    }
  }

  // Capacity check — per exact slot ID
  for (const schedule of selectedSchedules) {
    const enrolled = await prisma.monthlyEnrollment.count({
      where: {
        scheduleIds: { has: schedule.id },
        month,
        year,
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    });
    if (enrolled >= schedule.maxCapacity) {
      const day = schedule.dayOfWeek.charAt(0) + schedule.dayOfWeek.slice(1).toLowerCase();
      return { error: `The ${day} ${schedule.startTime}–${schedule.endTime} slot is full for this month (${enrolled}/${schedule.maxCapacity}).` };
    }
  }

  const price = frequency === "TWICE_PER_WEEK"
    ? Number(subClass.twicePriceMonthly ?? 0)
    : Number(subClass.oncePriceMonthly  ?? 0);

  const status: BookingStatus = payNow && payAmount ? "CONFIRMED" : "PENDING";

  const enrollment = await prisma.$transaction(async (tx) => {
    const newEnrollment = await tx.monthlyEnrollment.create({
      data: {
        studentId, subClassId, month, year,
        frequency, preferredDays,
        scheduleIds: selectedSchedules.map((s) => s.id),
        status, totalAmount: price, currency: "OMR",
      },
    });

    if (payNow && payAmount && payMethod) {
      await tx.monthlyPayment.create({
        data: {
          enrollmentId: newEnrollment.id,
          amount:   parseFloat(payAmount),
          currency: "OMR",
          status:   "PAID",
          method:   payMethod,
          paidAt:   new Date(),
        },
      });
    }

    return newEnrollment;
  });

  return { success: true, enrollmentId: enrollment.id };
}

// ─────────────────────────────────────────────
// CREATE — multi-month enrollment
// Creates parent MultiMonthEnrollment + N child MonthlyEnrollments
// + optional MultiMonthPayment if paying now
// ─────────────────────────────────────────────

export async function createMultiMonthEnrollment(formData: FormData) {
  const studentId        = formData.get("studentId")     as string;
  const subClassId       = formData.get("subClassId")    as string;
  const startMonth       = parseInt(formData.get("startMonth") as string);
  const startYear        = parseInt(formData.get("startYear")  as string);
  const totalMonths      = parseInt(formData.get("totalMonths") as string);
  const frequency        = formData.get("frequency")     as FrequencyType;
  const preferredDaysRaw = formData.get("preferredDays") as string;
  const preferredDays    = preferredDaysRaw
    ? preferredDaysRaw.split(",").filter(Boolean) as any[]
    : [];
  const preferredSlotIds = ((formData.get("preferredSlotIds") as string) || "")
    .split(",").filter(Boolean);

  const payNow    = formData.get("payNow") === "true";
  const payAmount = formData.get("payAmount") as string | null;
  const payMethod = formData.get("payMethod") as PaymentMethod | null;

  if (!studentId)              return { error: "Student is required." };
  if (!subClassId)             return { error: "Sub-class is required." };
  if (!startMonth || !startYear) return { error: "Start month and year are required." };
  if (!totalMonths || totalMonths < 2) return { error: "Multi-month enrollment requires at least 2 months." };
  if (totalMonths > 12)        return { error: "Maximum 12 months per enrollment." };
  if (!frequency)              return { error: "Frequency is required." };

  const subClass = await prisma.subClass.findUnique({
    where: { id: subClassId },
    select: { oncePriceMonthly: true, twicePriceMonthly: true, capacity: true },
  });
  if (!subClass) return { error: "Sub-class not found." };

  const monthlyPrice = frequency === "TWICE_PER_WEEK"
    ? Number(subClass.twicePriceMonthly ?? 0)
    : Number(subClass.oncePriceMonthly  ?? 0);
  const totalAmount = monthlyPrice * totalMonths;

  // Build month range
  const months = buildMonthRange(startMonth, startYear, totalMonths);
  const endPeriod = months[months.length - 1];

  // Check for duplicates across all months
  const duplicates = await prisma.monthlyEnrollment.findMany({
    where: {
      studentId,
      subClassId,
      OR: months.map(({ month, year }) => ({ month, year })),
      status: { in: ["CONFIRMED", "PENDING"] },
    },
    select: { month: true, year: true },
  });
  if (duplicates.length > 0) {
    const labels = duplicates
      .map(({ month, year }) =>
        new Date(year, month - 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
      )
      .join(", ");
    return { error: `Student already enrolled for: ${labels}.` };
  }

  // Fetch exact slots by ID (admin path) or by day name (student / legacy path)
  const selectedSchedules = preferredSlotIds.length > 0
    ? await prisma.classSchedule.findMany({
        where: { id: { in: preferredSlotIds }, status: "ACTIVE" },
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, endDate: true, maxCapacity: true },
      })
    : await prisma.classSchedule.findMany({
        where: { subClassId, status: "ACTIVE", dayOfWeek: { in: preferredDays as any } },
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, endDate: true, maxCapacity: true },
      });

  // Capacity check — per exact slot ID, per month
  for (const { month, year } of months) {
    for (const schedule of selectedSchedules) {
      const enrolled = await prisma.monthlyEnrollment.count({
        where: {
          scheduleIds: { has: schedule.id },
          month,
          year,
          status: { in: ["CONFIRMED", "PENDING"] },
        },
      });
      if (enrolled >= schedule.maxCapacity) {
        const label = new Date(year, month - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        const day = schedule.dayOfWeek.charAt(0) + schedule.dayOfWeek.slice(1).toLowerCase();
        return { error: `The ${day} ${schedule.startTime}–${schedule.endTime} slot is full for ${label} (${enrolled}/${schedule.maxCapacity}).` };
      }
    }
  }

  // Coverage check — every selected slot must cover every month in the range
  for (const { month, year } of months) {
    const lastDayOfMonth = new Date(year, month, 0);
    for (const schedule of selectedSchedules) {
      if (schedule.endDate != null && new Date(schedule.endDate) < lastDayOfMonth) {
        const label = new Date(year, month - 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        const endLabel = new Date(schedule.endDate).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        return { error: `The ${schedule.startTime}–${schedule.endTime} slot does not cover ${label}. Its schedule ends in ${endLabel}.` };
      }
    }
  }

  const selectedScheduleIds = selectedSchedules.map((s) => s.id);
  const status: BookingStatus = payNow && payAmount ? "CONFIRMED" : "PENDING";

  await prisma.$transaction(async (tx) => {
    // 1. Create parent
    const parent = await tx.multiMonthEnrollment.create({
      data: {
        studentId,
        subClassId,
        frequency,
        preferredDays,
        scheduleIds: selectedScheduleIds,
        startMonth,
        startYear,
        endMonth:    endPeriod.month,
        endYear:     endPeriod.year,
        totalMonths,
        totalAmount,
        currency:    "OMR",
        status,
      },
    });

    // 2. Create N child MonthlyEnrollments — each stores the exact schedule IDs
    for (const { month, year } of months) {
      await tx.monthlyEnrollment.create({
        data: {
          studentId,
          subClassId,
          month,
          year,
          frequency,
          preferredDays,
          scheduleIds: selectedScheduleIds,
          status,
          totalAmount:            monthlyPrice,
          currency:               "OMR",
          multiMonthEnrollmentId: parent.id,
        },
      });
    }

    // 3. Optional payment
    if (payNow && payAmount && payMethod) {
      await tx.multiMonthPayment.create({
        data: {
          multiMonthEnrollmentId: parent.id,
          amount:   parseFloat(payAmount),
          currency: "OMR",
          status:   "PAID",
          method:   payMethod,
          paidAt:   new Date(),
        },
      });
    }
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// UPDATE STATUS — single enrollment
// ─────────────────────────────────────────────

export async function updateEnrollmentStatus(id: string, status: BookingStatus) {
  await prisma.monthlyEnrollment.update({ where: { id }, data: { status } });
  return { success: true };
}

// ─────────────────────────────────────────────
// RECORD PAYMENT — single pending enrollment
// ─────────────────────────────────────────────

export async function recordPayment(enrollmentId: string, formData: FormData) {
  const amount = parseFloat(formData.get("amount") as string);
  const method = formData.get("method") as PaymentMethod;
  const notes  = formData.get("notes")  as string | null;

  if (!amount || isNaN(amount)) return { error: "Valid amount is required." };
  if (!method)                  return { error: "Payment method is required." };

  const enrollment = await prisma.monthlyEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { payment: true },
  });
  if (!enrollment) return { error: "Enrollment not found." };

  await prisma.$transaction(async (tx) => {
    if (enrollment.payment) {
      await tx.monthlyPayment.update({
        where: { id: enrollment.payment.id },
        data:  { amount, method, status: "PAID", paidAt: new Date() },
      });
    } else {
      await tx.monthlyPayment.create({
        data: {
          enrollmentId,
          amount, currency: "OMR",
          status: "PAID", method,
          paidAt: new Date(),
        },
      });
    }
    await tx.monthlyEnrollment.update({
      where: { id: enrollmentId },
      data:  { status: "CONFIRMED" },
    });
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// RECORD PAYMENT — multi-month enrollment
// ─────────────────────────────────────────────

export async function recordMultiMonthPayment(
  multiMonthEnrollmentId: string,
  formData: FormData,
) {
  const amount = parseFloat(formData.get("amount") as string);
  const method = formData.get("method") as PaymentMethod;

  if (!amount || isNaN(amount)) return { error: "Valid amount is required." };
  if (!method)                  return { error: "Payment method is required." };

  const parent = await prisma.multiMonthEnrollment.findUnique({
    where: { id: multiMonthEnrollmentId },
    include: { payment: true },
  });
  if (!parent) return { error: "Multi-month enrollment not found." };

  await prisma.$transaction(async (tx) => {
    if (parent.payment) {
      await tx.multiMonthPayment.update({
        where: { id: parent.payment.id },
        data:  { amount, method, status: "PAID", paidAt: new Date() },
      });
    } else {
      await tx.multiMonthPayment.create({
        data: {
          multiMonthEnrollmentId,
          amount, currency: "OMR",
          status: "PAID", method,
          paidAt: new Date(),
        },
      });
    }

    // Confirm parent + all child months
    await tx.multiMonthEnrollment.update({
      where: { id: multiMonthEnrollmentId },
      data:  { status: "CONFIRMED" },
    });
    await tx.monthlyEnrollment.updateMany({
      where: { multiMonthEnrollmentId },
      data:  { status: "CONFIRMED" },
    });
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// CANCEL — single enrollment
// ─────────────────────────────────────────────

export async function cancelEnrollment(id: string) {
  const enrollment = await prisma.monthlyEnrollment.findUnique({ where: { id } });
  if (!enrollment)                       return { error: "Enrollment not found." };
  if (enrollment.status === "CANCELLED") return { error: "Already cancelled." };

  await prisma.monthlyEnrollment.update({ where: { id }, data: { status: "CANCELLED" } });
  return { success: true };
}

// ─────────────────────────────────────────────
// CANCEL — multi-month enrollment
// Cancels parent + all future child months (past/current month untouched)
// ─────────────────────────────────────────────

export async function cancelMultiMonthEnrollment(id: string) {
  const parent = await prisma.multiMonthEnrollment.findUnique({
    where: { id },
    include: { monthlyEnrollments: true },
  });
  if (!parent)                       return { error: "Multi-month enrollment not found." };
  if (parent.status === "CANCELLED") return { error: "Already cancelled." };

  const now          = new Date();
  const currentMonth = now.getMonth() + 1; // 1-based
  const currentYear  = now.getFullYear();

  // "Future" = month/year strictly after current month
  const futureIds = parent.monthlyEnrollments
    .filter(({ month, year }) =>
      year > currentYear || (year === currentYear && month > currentMonth),
    )
    .map(({ id }) => id);

  await prisma.$transaction(async (tx) => {
    // Cancel future child months
    if (futureIds.length > 0) {
      await tx.monthlyEnrollment.updateMany({
        where: { id: { in: futureIds } },
        data:  { status: "CANCELLED" },
      });
    }

    // Cancel parent
    await tx.multiMonthEnrollment.update({
      where: { id },
      data:  { status: "CANCELLED" },
    });
  });

  return { success: true, cancelledMonths: futureIds.length };
}

// ─────────────────────────────────────────────
// DELETE — single enrollment (admin only)
// Blocks if payment is PAID
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
  // Child months of a multi-month plan CAN be deleted individually —
  // the parent MultiMonthEnrollment remains with the other months intact.
  await prisma.monthlyEnrollment.delete({ where: { id } });
  return { success: true };
}

// ─────────────────────────────────────────────
// DELETE — multi-month enrollment (admin only)
// Only if no months have been paid
// ─────────────────────────────────────────────

export async function deleteMultiMonthEnrollment(id: string) {
  const parent = await prisma.multiMonthEnrollment.findUnique({
    where: { id },
    include: { payment: { select: { status: true } } },
  });
  if (!parent) return { error: "Multi-month enrollment not found." };
  if (parent.payment?.status === "PAID") {
    return { error: "Cannot delete a paid enrollment. Cancel and refund it instead." };
  }

  // Cascade: child MonthlyEnrollments deleted via Prisma relation onDelete
  await prisma.multiMonthEnrollment.delete({ where: { id } });
  return { success: true };
}