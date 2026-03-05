// src/app/[locale]/admin/enrollments/page.tsx

import {
  getEnrollments,
  getCapacitySummary,
  getEnrollmentFormOptions,
} from "@/lib/actions/admin/Enrollments.actions";
import EnrollmentsClient from "./_components/EnrollmentsClient";

const now = new Date();

function serializeEnrollments(
  enrollments: Awaited<ReturnType<typeof getEnrollments>>,
) {
  return enrollments.map((e) => ({
    ...e,
    bookedAt: e.bookedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    totalAmount: Number(e.totalAmount),
    subClass: {
      ...e.subClass,
      oncePriceMonthly:
        e.subClass.oncePriceMonthly != null
          ? Number(e.subClass.oncePriceMonthly)
          : null,
      twicePriceMonthly:
        e.subClass.twicePriceMonthly != null
          ? Number(e.subClass.twicePriceMonthly)
          : null,
    },
    payment: e.payment
      ? {
          ...e.payment,
          amount: Number(e.payment.amount),
          paidAt: e.payment.paidAt?.toISOString() ?? null,
        }
      : null,
  }));
}

function serializeCapacity(
  data: Awaited<ReturnType<typeof getCapacitySummary>>,
) {
  return data.map((sc) => ({
    ...sc,
    oncePriceMonthly:
      sc.oncePriceMonthly != null ? Number(sc.oncePriceMonthly) : null,
    twicePriceMonthly:
      sc.twicePriceMonthly != null ? Number(sc.twicePriceMonthly) : null,
    monthlyEnrollments: sc.monthlyEnrollments.map((e) => ({
      ...e,
      bookedAt: e.bookedAt.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      totalAmount: Number(e.totalAmount),
      payment: e.payment
        ? {
            ...e.payment,
            amount: Number(e.payment.amount),
            paidAt: e.payment.paidAt?.toISOString() ?? null,
          }
        : null,
    })),
  }));
}

function serializeFormOptions(
  opts: Awaited<ReturnType<typeof getEnrollmentFormOptions>>,
) {
  return {
    students: opts.students,
    subClasses: opts.subClasses.map((s) => ({
      ...s,
      oncePriceMonthly:
        s.oncePriceMonthly != null ? Number(s.oncePriceMonthly) : null,
      twicePriceMonthly:
        s.twicePriceMonthly != null ? Number(s.twicePriceMonthly) : null,
      trialPrice: Number(s.trialPrice),
    })),
  };
}

export type SerializedEnrollments = ReturnType<typeof serializeEnrollments>;
export type SerializedEnrollment = SerializedEnrollments[number];
export type SerializedCapacity = ReturnType<typeof serializeCapacity>;
export type SerializedCapacityItem = SerializedCapacity[number];
export type SerializedFormOptions = ReturnType<typeof serializeFormOptions>;

export default async function AdminEnrollmentsPage() {
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const [enrollments, capacity, formOptions] = await Promise.all([
    getEnrollments({ month: defaultMonth, year: defaultYear }),
    getCapacitySummary(defaultMonth, defaultYear),
    getEnrollmentFormOptions(),
  ]);

  return (
    <EnrollmentsClient
      initialEnrollments={serializeEnrollments(enrollments)}
      initialCapacity={serializeCapacity(capacity)}
      formOptions={serializeFormOptions(formOptions)}
      defaultMonth={defaultMonth}
      defaultYear={defaultYear}
    />
  );
}
