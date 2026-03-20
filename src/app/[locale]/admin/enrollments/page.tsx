// src/app/[locale]/admin/enrollments/page.tsx
import {
  getEnrollments,
  getCapacitySummary,
  getEnrollmentFormOptions,
  getMultiMonthEnrollments,
} from "@/lib/actions/admin/Enrollments.actions";
import EnrollmentsClient from "./_components/EnrollmentsClient";

const now = new Date();

// ─────────────────────────────────────────────
// Serialized shape types
// Defined explicitly here so they are never inferred as `any`.
// ─────────────────────────────────────────────

export interface SerializedScheduleSlot {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  endDate: string | null; // ISO string — null means schedule runs indefinitely
  teacher: { firstName: string; lastName: string } | null;
}

export interface SerializedSubClass {
  id: string;
  name: string;
  capacity: number;
  isReschedulable: boolean;
  sessionType: string;
  oncePriceMonthly: number | null;
  twicePriceMonthly: number | null;
  class: { id: string; name: string };
  classSchedules: SerializedScheduleSlot[];
}

export interface SerializedPayment {
  id: string;
  amount: number;
  status: string;
  method: string;
  paidAt: string | null;
  currency: string;
}

export interface SerializedMultiMonthLink {
  id: string;
  totalMonths: number;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  status: string;
  totalAmount: number;
  payment: {
    id: string;
    status: string;
    amount: number;
    paidAt: string | null;
  } | null;
}

export interface SerializedEnrollment {
  id: string;
  studentId: string;
  subClassId: string;
  month: number;
  year: number;
  frequency: string;
  preferredDays: string[];
  status: string;
  totalAmount: number;
  currency: string;
  bookedAt: string;
  createdAt: string;
  updatedAt: string;
  multiMonthEnrollmentId: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    user: { email: string | null; phone: string | null };
  };
  subClass: SerializedSubClass;
  payment: SerializedPayment | null;
  multiMonthEnrollment: SerializedMultiMonthLink | null;
  resolvedSlots: SerializedResolvedSlot[];
}

export interface SerializedCapacityEnrollment {
  id: string;
  studentId: string;
  status: string;
  frequency: string;
  preferredDays: string[];
  totalAmount: number;
  bookedAt: string;
  createdAt: string;
  updatedAt: string;
  student: { id: string; firstName: string; lastName: string };
  payment: {
    id: string;
    status: string;
    amount: number;
    paidAt: string | null;
  } | null;
}

export interface SerializedCapacityItem {
  id: string;
  name: string;
  capacity: number;
  isReschedulable: boolean;
  sessionType: string;
  oncePriceMonthly: number | null;
  twicePriceMonthly: number | null;
  class: { id: string; name: string };
  classSchedules: SerializedScheduleSlot[];
  monthlyEnrollments: SerializedCapacityEnrollment[];
}

export interface SerializedResolvedSlot {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  teacher: { firstName: string; lastName: string } | null;
}

export interface SerializedChildMonth {
  id: string;
  month: number;
  year: number;
  status: string;
  preferredDays: string[];
  payment: { status: string; amount: number } | null;
  // Resolved from the matching schedule slot via preferredDays
  resolvedTeacher: { firstName: string; lastName: string } | null;
  resolvedStartTime: string | null;
  resolvedEndTime: string | null;
  resolvedDayOfWeek: string | null;
  resolvedSlots: SerializedResolvedSlot[];
}

export interface SerializedMultiMonthEnrollment {
  id: string;
  studentId: string;
  subClassId: string;
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
  totalMonths: number;
  frequency: string;
  status: string;
  totalAmount: number;
  currency: string;
  bookedAt: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    user: { email: string | null; phone: string | null };
  };
  subClass: {
    id: string;
    name: string;
    isReschedulable: boolean;
    sessionType: string;
    class: { id: string; name: string };
  };
  payment: SerializedPayment | null;
  monthlyEnrollments: SerializedChildMonth[];
}

export interface SerializedFormSubClass {
  id: string;
  name: string;
  capacity: number;
  isReschedulable: boolean;
  sessionType: string;
  oncePriceMonthly: number | null;
  twicePriceMonthly: number | null;
  trialPrice: number | null;
  class: { id: string; name: string };
  classSchedules: SerializedScheduleSlot[];
}

export interface SerializedFormOptions {
  students: {
    id: string;
    firstName: string;
    lastName: string;
    user: { email: string | null; phone: string | null };
  }[];
  subClasses: SerializedFormSubClass[];
}

// Legacy array type aliases
export type SerializedEnrollments = SerializedEnrollment[];
export type SerializedMultiMonthEnrollments = SerializedMultiMonthEnrollment[];
export type SerializedCapacity = SerializedCapacityItem[];

// ─────────────────────────────────────────────
// Serializers
// plain() strips Prisma Decimal/Date prototypes.
// Decimals become numeric strings — we cast to number explicitly.
// ─────────────────────────────────────────────

function serializeEnrollments(
  enrollments: Awaited<ReturnType<typeof getEnrollments>>,
): SerializedEnrollment[] {
  // Actions already convert Decimals to numbers via plain() + Number().
  // This cast is safe — shape matches SerializedEnrollment exactly.
  return enrollments as unknown as SerializedEnrollment[];
}

function serializeMultiMonthEnrollments(
  data: Awaited<ReturnType<typeof getMultiMonthEnrollments>>,
): SerializedMultiMonthEnrollment[] {
  return data as unknown as SerializedMultiMonthEnrollment[];
}

function serializeCapacity(
  data: Awaited<ReturnType<typeof getCapacitySummary>>,
): SerializedCapacityItem[] {
  return data as unknown as SerializedCapacityItem[];
}

function serializeFormOptions(
  opts: Awaited<ReturnType<typeof getEnrollmentFormOptions>>,
): SerializedFormOptions {
  return opts as unknown as SerializedFormOptions;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default async function AdminEnrollmentsPage() {
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const [enrollments, multiMonthEnrollments, capacity, formOptions] =
    await Promise.all([
      getEnrollments({ month: defaultMonth, year: defaultYear }),
      getMultiMonthEnrollments(),
      getCapacitySummary(defaultMonth, defaultYear),
      getEnrollmentFormOptions(),
    ]);

  return (
    <EnrollmentsClient
      initialEnrollments={serializeEnrollments(enrollments)}
      initialMultiMonthEnrollments={serializeMultiMonthEnrollments(
        multiMonthEnrollments,
      )}
      initialCapacity={serializeCapacity(capacity)}
      formOptions={serializeFormOptions(formOptions)}
      defaultMonth={defaultMonth}
      defaultYear={defaultYear}
    />
  );
}
