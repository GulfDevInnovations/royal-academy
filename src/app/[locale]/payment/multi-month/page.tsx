// src/app/[locale]/payment/multi-month/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { MultiMonthPaymentClient } from "./_components/MultiMonthPaymentClient";

export const metadata = { title: "Complete Payment | Royal Academy" };

export default async function MultiMonthPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/payment/multi-month");

  const { enrollmentId } = await searchParams;
  if (!enrollmentId) notFound();

  const enrollment = await prisma.multiMonthEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      student: { include: { user: { select: { email: true } } } },
      payment: true,
      subClass: {
        include: {
          class: { select: { name: true } },
          classSchedules: {
            where: { status: "ACTIVE" },
            select: {
              dayOfWeek: true,
              teacher: {
                select: { firstName: true, lastName: true, photoUrl: true },
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!enrollment) notFound();

  const preferredDays = enrollment.preferredDays as string[];
  const teacher =
    enrollment.subClass.classSchedules.find((s) =>
      preferredDays.includes(s.dayOfWeek),
    )?.teacher ??
    enrollment.subClass.classSchedules[0]?.teacher ??
    null;

  return (
    <MultiMonthPaymentClient
      data={{
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        studentEmail: enrollment.student.user.email,
        startMonth: enrollment.startMonth,
        startYear: enrollment.startYear,
        endMonth: enrollment.endMonth,
        endYear: enrollment.endYear,
        totalMonths: enrollment.totalMonths,
        frequency: enrollment.frequency,
        preferredDays: enrollment.preferredDays,
        monthlyPrice: Number(enrollment.totalAmount) / enrollment.totalMonths,
        totalAmount: Number(enrollment.totalAmount),
        currency: enrollment.currency,
        subClass: {
          name: enrollment.subClass.name,
          className: enrollment.subClass.class.name,
          level: enrollment.subClass.level,
          durationMinutes: enrollment.subClass.durationMinutes,
        },
        teacher,
      }}
    />
  );
}
