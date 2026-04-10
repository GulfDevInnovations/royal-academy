// src/app/[locale]/admin/workshops/page.tsx

import {
  getWorkshops,
  getRooms,
  getTeachersForSelect,
} from "@/lib/actions/admin/Workshops.actions";
import { parseJsonArray } from "@/utils/parseJson";
import WorkshopsClient from "./_components/WorkshopClient";

function serializeWorkshops(
  workshops: Awaited<ReturnType<typeof getWorkshops>>,
) {
  return workshops.map((w) => ({
    ...w,
    imageUrls: parseJsonArray<string>(w.imageUrls),
    videoUrls: parseJsonArray<string>(w.videoUrls),
    price: Number(w.price),
    eventDate:
      w.eventDate instanceof Date
        ? w.eventDate.toISOString()
        : String(w.eventDate),
    createdAt:
      w.createdAt instanceof Date
        ? w.createdAt.toISOString()
        : String(w.createdAt),
    updatedAt:
      w.updatedAt instanceof Date
        ? w.updatedAt.toISOString()
        : String(w.updatedAt),
    bookings: w.bookings.map((b: any) => ({
      ...b,
      bookedAt:
        b.bookedAt instanceof Date
          ? b.bookedAt.toISOString()
          : String(b.bookedAt),
      createdAt:
        b.createdAt instanceof Date
          ? b.createdAt.toISOString()
          : String(b.createdAt),
      updatedAt:
        b.updatedAt instanceof Date
          ? b.updatedAt.toISOString()
          : String(b.updatedAt),
    })),
  }));
}

export type SerializedWorkshop = ReturnType<typeof serializeWorkshops>[number];
export type SerializedBooking = SerializedWorkshop["bookings"][number];

export default async function AdminWorkshopsPage() {
  const [workshops, rooms, teachers] = await Promise.all([
    getWorkshops(),
    getRooms(),
    getTeachersForSelect(),
  ]);

  return (
    <WorkshopsClient
      initialWorkshops={serializeWorkshops(workshops)}
      rooms={rooms}
      teachers={teachers}
    />
  );
}
