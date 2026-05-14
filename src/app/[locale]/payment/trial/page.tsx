// src/app/[locale]/payment/trial/page.tsx
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { TrialPaymentClient } from './_components/TrialPaymentClient';

export const metadata = { title: 'Complete Payment | Royal Academy' };

export default async function TrialPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const authSession = await auth();
  if (!authSession?.user) redirect('/login?redirect=/payment/trial');

  const { trialBookingId } = await searchParams;
  if (!trialBookingId) notFound();

  const trial = await prisma.trialBooking.findUnique({
    where: { id: trialBookingId },
    include: {
      student: { include: { user: { select: { email: true } } } },
      payment: true,
      subClass: {
        include: { class: { select: { name: true } } },
      },
      session: {
        include: {
          schedule: {
            include: {
              teacher: {
                select: { firstName: true, lastName: true, photoUrl: true },
              },
            },
          },
        },
      },
    },
  });

  if (!trial) notFound();

  return (
    <TrialPaymentClient
      data={{
        studentName: `${trial.student.firstName} ${trial.student.lastName}`,
        studentEmail: trial.student.user.email,
        sessionDate: trial.session.sessionDate.toISOString().slice(0, 10),
        startTime: trial.session.startTime,
        endTime: trial.session.endTime,
        amount: Number(trial.payment?.amount ?? trial.subClass.trialPrice),
        currency: trial.payment?.currency ?? trial.subClass.currency,
        subClass: {
          name: trial.subClass.name,
          className: trial.subClass.class.name,
          level: trial.subClass.level,
          durationMinutes: trial.subClass.durationMinutes,
        },
        teacher: trial.session.schedule.teacher,
      }}
    />
  );
}
