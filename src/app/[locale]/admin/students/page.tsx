// src/app/[locale]/admin/students/page.tsx

import {
  getStudents,
  getStudentFilterOptions,
} from "@/lib/actions/admin/students.actions";
import StudentsClient from "./_components/StudentsClient";

function serializeStudents(students: Awaited<ReturnType<typeof getStudents>>) {
  return students.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    dateOfBirth: s.dateOfBirth ? s.dateOfBirth.toISOString() : null,
    user: {
      ...s.user,
      createdAt: s.user.createdAt.toISOString(),
    },
    monthlyEnrollments: s.monthlyEnrollments.map((e) => ({
      ...e,
      bookedAt: e.bookedAt.toISOString(),
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      totalAmount: Number(e.totalAmount),
      subClass: {
        ...e.subClass,
        createdAt: e.subClass.createdAt.toISOString(),
        updatedAt: e.subClass.updatedAt.toISOString(),
        price: Number(e.subClass.price),
        trialPrice: Number(e.subClass.trialPrice),
        oncePriceMonthly:
          e.subClass.oncePriceMonthly != null
            ? Number(e.subClass.oncePriceMonthly)
            : null,
        twicePriceMonthly:
          e.subClass.twicePriceMonthly != null
            ? Number(e.subClass.twicePriceMonthly)
            : null,
      },
    })),
  }));
}

export type SerializedStudents = ReturnType<typeof serializeStudents>;
export type SerializedStudent = SerializedStudents[number];

export default async function AdminStudentsPage() {
  const [raw, filterOptions] = await Promise.all([
    getStudents(),
    getStudentFilterOptions(),
  ]);

  return (
    <StudentsClient
      initialStudents={serializeStudents(raw)}
      filterOptions={filterOptions}
    />
  );
}
