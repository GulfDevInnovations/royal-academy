// src/app/[locale]/payment/page.tsx
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { PaymentPageClient } from './_components/PaymentPageClient';

export const metadata = {
  title: 'Payment | Royal Academy',
};

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const authSession = await auth();
  if (!authSession?.user) redirect('/login?redirect=/payment');

  const { studentId, sessionId, amount, currency } = await searchParams;

  if (!studentId || !sessionId || !amount) notFound();

  const [student, classSession] = await Promise.all([
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

  if (!student || !classSession) notFound();

  return (
    <PaymentPageClient
      data={{
        studentId,
        sessionId,
        amount: Number(amount),
        currency: currency ?? 'OMR',
        studentName: `${student.firstName} ${student.lastName}`,
        studentEmail: student.user.email,
        session: {
          date: classSession.sessionDate.toISOString(),
          startTime: classSession.startTime,
          endTime: classSession.endTime,
        },
        subClass: {
          name: classSession.schedule.subClass.name,
          level: classSession.schedule.subClass.level,
          durationMinutes: classSession.schedule.subClass.durationMinutes,
          className: classSession.schedule.subClass.class.name,
        },
        teacher: classSession.schedule.teacher,
      }}
    />
  );
}
