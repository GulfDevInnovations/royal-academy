// src/app/[locale]/workshops/page.tsx

import { prisma } from "@/lib/prisma";
import WorkshopsCalendarClient from "./_components/WorkshopsCalendarClient";

export const metadata = { title: "Workshops | Royal Academy" };

export default async function WorkshopsPage() {
  const workshops = await prisma.workshop.findMany({
    where: { isActive: true },
    orderBy: { eventDate: "asc" },
    include: {
      teacher: { select: { firstName: true, lastName: true, photoUrl: true } },
      room: { select: { name: true, location: true } },
      bookings: { where: { status: "CONFIRMED" }, select: { id: true } },
    },
  });

  const serialized = workshops.map((w) => ({
    id: w.id,
    slug: w.slug ?? w.id,
    title: w.title,
    description: w.description,
    coverUrl: w.coverUrl,
    imageUrls: w.imageUrls,
    videoUrls: w.videoUrls,
    eventDate: w.eventDate.toISOString(),
    startTime: w.startTime,
    endTime: w.endTime,
    capacity: w.capacity,
    enrolledCount: w.bookings.length,
    price: Number(w.price),
    currency: w.currency,
    isOnline: w.isOnline,
    teacher: w.teacher
      ? {
          firstName: w.teacher.firstName,
          lastName: w.teacher.lastName,
          photoUrl: w.teacher.photoUrl ?? null,
        }
      : null,
    room: w.room
      ? { name: w.room.name, location: w.room.location ?? null }
      : null,
  }));

  return <WorkshopsCalendarClient workshops={serialized} />;
}
