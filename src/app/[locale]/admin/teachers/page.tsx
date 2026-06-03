// src/app/[locale]/admin/teachers/page.tsx

import {
  getTeachers,
  getSubClassesForAssignment,
  getProgramsForAssignment,
} from '@/lib/actions/admin/teachers.actions';
import { parseJsonArray } from '@/utils/parseJson';
import TeachersClient from './_components/TeachersClient';

function serializeTeachers(teachers: Awaited<ReturnType<typeof getTeachers>>) {
  return teachers.map((t) => ({
    ...t,
    specialties: parseJsonArray<string>(t.specialties),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    user: t.user ? { ...t.user } : null,
    subClasses: t.subClassTeachers.map((jt) => ({
      id: jt.subClass.id,
      name: jt.subClass.name,
      class: jt.subClass.class,
    })),
    programs: t.programTeachers.map((jt) => ({
      id: jt.program.id,
      name: jt.program.name,
      subClass: jt.program.subClass,
    })),
    subClassTeachers: t.subClassTeachers,
    programTeachers: t.programTeachers,
  }));
}

export type SerializedTeachers = ReturnType<typeof serializeTeachers>;
export type SerializedTeacher = SerializedTeachers[number];
export type ClassWithSubsForAssignment = Awaited<
  ReturnType<typeof getSubClassesForAssignment>
>[number];
export type ClassWithProgramsForAssignment = Awaited<
  ReturnType<typeof getProgramsForAssignment>
>[number];

export default async function AdminTeachersPage() {
  const [raw, allClasses, allPrograms] = await Promise.all([
    getTeachers(),
    getSubClassesForAssignment(),
    getProgramsForAssignment(),
  ]);

  return (
    <TeachersClient
      initialTeachers={serializeTeachers(raw)}
      allClasses={allClasses}
      allPrograms={allPrograms}
    />
  );
}
