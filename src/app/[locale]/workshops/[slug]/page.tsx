// src/app/[locale]/workshops/[slug]/page.tsx

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WorkshopDetailClient from "./_components/WorkshopDetailClient";
import { parseJsonArray } from "@/utils/parseJson";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const workshop = await prisma.workshop.findUnique({
    where: { slug },
    select: { title: true, description: true, coverUrl: true },
  });
  if (!workshop) return { title: "Workshop Not Found" };
  return {
    title: workshop.title,
    description: workshop.description ?? undefined,
    openGraph: { images: workshop.coverUrl ? [workshop.coverUrl] : [] },
  };
}

export default async function WorkshopPage({ params }: Props) {
  const { slug } = await params;

  const workshop = await prisma.workshop.findUnique({
    where: { slug },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          bio: true,
          photoUrl: true,
          specialties: true,
        },
      },
      room: {
        select: { id: true, name: true, location: true, capacity: true },
      },
      bookings: {
        where: { status: "CONFIRMED" },
        select: { id: true },
      },
    },
  });

  if (!workshop) notFound();

  // Serialize for client
  const serialized = {
    id: workshop.id,
    slug: workshop.slug ?? slug, // slug param is what we queried by, so always valid
    title: workshop.title,
    description: workshop.description,
    coverUrl: workshop.coverUrl,
    imageUrls: parseJsonArray<string>(workshop.imageUrls),
    videoUrls: parseJsonArray<string>(workshop.videoUrls),
    startTime: workshop.startTime,
    endTime: workshop.endTime,
    eventDate: workshop.eventDate.toISOString(),
    capacity: workshop.capacity,
    enrolledCount: workshop.bookings.length,
    price: Number(workshop.price),
    currency: workshop.currency,
    isOnline: workshop.isOnline,
    onlineLink: workshop.onlineLink,
    isActive: workshop.isActive,
    teacher: workshop.teacher
      ? {
          id: workshop.teacher.id,
          firstName: workshop.teacher.firstName,
          lastName: workshop.teacher.lastName,
          bio: workshop.teacher.bio ?? null,
          photoUrl: workshop.teacher.photoUrl ?? null,
          specialties: parseJsonArray<string>(workshop.teacher.specialties),
        }
      : null,
    room: workshop.room
      ? {
          id: workshop.room.id,
          name: workshop.room.name,
          location: workshop.room.location ?? null,
          capacity: workshop.room.capacity,
        }
      : null,
  };

  return <WorkshopDetailClient workshop={serialized} />;
}
