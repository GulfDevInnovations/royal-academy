// src/app/[locale]/payment/page.tsx
import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { PaymentPageClient } from "./_components/PaymentPageClient";

const prisma = new PrismaClient();

export const metadata = {
  title: "Payment | Royal Academy",
};

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { bookingId } = await searchParams;

  if (!bookingId) notFound();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      session: {
        include: {
          schedule: {
            include: {
              subClass: {
                include: { class: true },
              },
              teacher: true,
            },
          },
        },
      },
      student: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!booking) notFound();

  // Serialize for client (Decimal → string, Date → string)
  const data = {
    bookingId: booking.id,
    status: booking.status,
    studentName: `${booking.student.firstName} ${booking.student.lastName}`,
    studentEmail: booking.student.user.email,
    session: {
      date: booking.session.sessionDate.toISOString(),
      startTime: booking.session.startTime,
      endTime: booking.session.endTime,
    },
    subClass: {
      name: booking.session.schedule.subClass.name,
      level: booking.session.schedule.subClass.level,
      durationMinutes: booking.session.schedule.subClass.durationMinutes,
      className: booking.session.schedule.subClass.class.name,
    },
    teacher: {
      firstName: booking.session.schedule.teacher.firstName,
      lastName: booking.session.schedule.teacher.lastName,
      photoUrl: booking.session.schedule.teacher.photoUrl,
    },
    payment: {
      id: booking.payment?.id ?? null,
      amount: booking.payment?.amount.toString() ?? "0",
      currency: booking.payment?.currency ?? "OMR",
      status: booking.payment?.status ?? "PENDING",
    },
  };

  return <PaymentPageClient data={data} />;
}
