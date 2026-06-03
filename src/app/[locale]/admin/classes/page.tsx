// src/app/[locale]/admin/classes/page.tsx
// Server component — fetches data and serializes before passing to client.
// Prisma returns Decimal and Date objects which can't cross the
// server → client boundary as props. Everything must be plain JS.

import {
  getClasses,
  getTeachersForSelect,
} from '@/lib/actions/admin/classes.actions';
import ClassesClient from './_components/ClassesClient';

function serializeClasses(classes: Awaited<ReturnType<typeof getClasses>>) {
  return classes.map((cls) => ({
    ...cls,
    createdAt: cls.createdAt.toISOString(),
    updatedAt: cls.updatedAt.toISOString(),
    subClasses: cls.subClasses.map((sub) => ({
      ...sub,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
      price: Number(sub.price),
      trialPrice: Number(sub.trialPrice),
      oncePriceMonthly:
        sub.oncePriceMonthly != null ? Number(sub.oncePriceMonthly) : null,
      twicePriceMonthly:
        sub.twicePriceMonthly != null ? Number(sub.twicePriceMonthly) : null,
      programs: sub.programs.map((prog) => ({
        ...prog,
        createdAt: prog.createdAt.toISOString(),
        updatedAt: prog.updatedAt.toISOString(),
        offerExpiresAt: prog.offerExpiresAt?.toISOString() ?? null,
        price: Number(prog.price),
        trialPrice: Number(prog.trialPrice),
        oncePriceMonthly:
          prog.oncePriceMonthly != null ? Number(prog.oncePriceMonthly) : null,
        twicePriceMonthly:
          prog.twicePriceMonthly != null ? Number(prog.twicePriceMonthly) : null,
      })),
    })),
  }));
}

export type SerializedClasses = ReturnType<typeof serializeClasses>;
export type SerializedClass = SerializedClasses[number];
export type SerializedSubClass = SerializedClass['subClasses'][number];
export type SerializedProgram = SerializedSubClass['programs'][number];

export default async function AdminClassesPage() {
  const [rawClasses, teachers] = await Promise.all([
    getClasses(),
    getTeachersForSelect(),
  ]);

  return (
    <ClassesClient
      initialClasses={serializeClasses(rawClasses)}
      teachers={teachers}
    />
  );
}
