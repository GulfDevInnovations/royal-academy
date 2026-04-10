// src/app/[locale]/admin/teachers/page.tsx

import {
  getTeachers,
  getSubClassesForAssignment,
} from "@/lib/actions/admin/teachers.actions";
import { parseJsonArray } from "@/utils/parseJson";
import TeachersClient from "./_components/TeachersClient";

function serializeTeachers(teachers: Awaited<ReturnType<typeof getTeachers>>) {
  return teachers.map((t) => ({
    ...t,
    specialties: parseJsonArray<string>(t.specialties),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    user: t.user ? { ...t.user } : null,
    // Flatten junction table into a simple subClasses array for the UI
    subClasses: t.subClassTeachers.map((jt) => ({
      id: jt.subClass.id,
      name: jt.subClass.name,
      class: jt.subClass.class,
    })),
    subClassTeachers: t.subClassTeachers,
  }));
}

export type SerializedTeachers = ReturnType<typeof serializeTeachers>;
export type SerializedTeacher = SerializedTeachers[number];
export type ClassWithSubsForAssignment = Awaited<
  ReturnType<typeof getSubClassesForAssignment>
>[number];

export default async function AdminTeachersPage() {
  const [raw, allClasses] = await Promise.all([
    getTeachers(),
    getSubClassesForAssignment(),
  ]);

  return (
    <TeachersClient
      initialTeachers={serializeTeachers(raw)}
      allClasses={allClasses}
    />
  );
}
