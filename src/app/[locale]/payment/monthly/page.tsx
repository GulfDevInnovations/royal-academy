// src/app/[locale]/payment/monthly/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { MonthlyPaymentClient } from "./_components/MonthlyPaymentClient";

export const metadata = { title: "Complete Payment | Royal Academy" };

export default async function MonthlyPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/payment/monthly");

  const { enrollmentId } = await searchParams;
  if (!enrollmentId) notFound();

  const enrollment = await prisma.monthlyEnrollment.findUnique({
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

  const teacher = enrollment.subClass.classSchedules[0]?.teacher ?? null;

  return (
    <MonthlyPaymentClient
      data={{
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        studentEmail: enrollment.student.user.email,
        month: enrollment.month,
        year: enrollment.year,
        frequency: enrollment.frequency,
        preferredDays: enrollment.preferredDays,
        amount: Number(enrollment.totalAmount),
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
