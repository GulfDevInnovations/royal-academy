// src/app/[locale]/payment/page.tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { PaymentPageClient } from "./_components/PaymentPageClient";

export const metadata = {
  title: "Payment | Royal Academy",
};

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/payment");

  const { studentId, sessionId, amount, currency } = await searchParams;

  if (!studentId || !sessionId || !amount) notFound();

  // Resolve display data — read-only, no DB writes
  const [student, session] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: {
        firstName: true,
        lastName: true,
        user: { select: { email: true } },
      },
    }),
    prisma.classSession.findUnique({
      where: { id: sessionId },
      select: {
        sessionDate: true,
        startTime: true,
        endTime: true,
        schedule: {
          select: {
            teacher: {
              select: { firstName: true, lastName: true, photoUrl: true },
            },
            subClass: {
              select: {
                name: true,
                level: true,
                durationMinutes: true,
                class: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!student || !session) notFound();

  return (
    <PaymentPageClient
      data={{
        studentId,
        sessionId,
        amount: Number(amount),
        currency: currency ?? "OMR",
        studentName: `${student.firstName} ${student.lastName}`,
        studentEmail: student.user.email,
        session: {
          date: session.sessionDate.toISOString(),
          startTime: session.startTime,
          endTime: session.endTime,
        },
        subClass: {
          name: session.schedule.subClass.name,
          level: session.schedule.subClass.level,
          durationMinutes: session.schedule.subClass.durationMinutes,
          className: session.schedule.subClass.class.name,
        },
        teacher: session.schedule.teacher,
      }}
    />
  );
}
