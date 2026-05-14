"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { BookingStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { uploadMedia } from "@/lib/media/service";
import { requireUser } from "@/lib/auth";

function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// Uploads an array of Files — replaces the missing uploadMediaUrls helper
async function uploadFiles(files: File[], userId: string, folder: string) {
  return Promise.all(files.map((file) => uploadMedia({ file, userId, folder })));
}

// Generates a URL-safe slug: "watercolour-basics-12-apr-2026"
function generateWorkshopSlug(title: string, eventDate: Date): string {
  const datePart = eventDate.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  }).toLowerCase().replace(/ /g, "-");   // "12-apr-2026"
  const titlePart = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")        // strip special chars
    .trim()
    .replace(/\s+/g, "-")                // spaces → hyphens
    .slice(0, 50);                        // cap length
  return `${titlePart}-${datePart}`;
}

// Makes a slug unique by appending -2, -3 etc if already taken
async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 2;
  while (await prisma.workshop.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

// ─── GET ALL ───────────────────────────────────────────────
export async function getWorkshops(filters?: {
  isActive?: boolean; teacherId?: string; roomId?: string; upcoming?: boolean;
}) {
  const now = new Date();
  const raw = plain(await prisma.workshop.findMany({
    where: {
      ...(filters?.isActive  !== undefined ? { isActive:  filters.isActive }  : {}),
      ...(filters?.teacherId               ? { teacherId: filters.teacherId }  : {}),
      ...(filters?.roomId                  ? { roomId:    filters.roomId }     : {}),
      ...(filters?.upcoming                ? { eventDate: { gte: now } }       : {}),
    },
    orderBy: { eventDate: "asc" },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      room:    { select: { id: true, name: true, capacity: true, location: true } },
      bookings:{ select: { id: true, status: true } },
    },
  }));
  return raw.map((w: any) => ({
    ...w,
    price:          Number(w.price),
    enrolledCount:  w.bookings.filter((b: any) => b.status === "CONFIRMED").length,
    availableSeats: w.capacity - w.enrolledCount,
  }));
}

// ─── GET ONE ───────────────────────────────────────────────
export async function getWorkshopById(id: string) {
  const raw = plain(await prisma.workshop.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true } },
      room:    { select: { id: true, name: true, capacity: true, location: true } },
      bookings: {
        orderBy: { bookedAt: "desc" },
        include: {
          student: {
            select: {
              id: true, firstName: true, lastName: true,
              user: { select: { email: true, phone: true } },
            },
          },
          payment: {
            select: { id: true, amount: true, status: true, method: true, paidAt: true, currency: true },
          },
        },
      },
    },
  }));
  if (!raw) return null;
  return {
    ...raw,
    price: Number(raw.price),
    bookings: raw.bookings.map((b: any) => ({
      ...b,
      payment: b.payment ? { ...b.payment, amount: Number(b.payment.amount) } : null,
    })),
  };
}

// ─── CREATE ─────────────────────────────────────────────────
// Accepts FormData with imageFiles[] and videoFiles[].
// Auto-creates a DRAFT Upcoming card after workshop is saved.
export async function createWorkshop(
  formData: FormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const user = await requireUser();

    const imageFiles = (formData.getAll("imageFiles") as File[]).filter((f) => f.size > 0);
    const videoFiles = (formData.getAll("videoFiles") as File[]).filter((f) => f.size > 0);

    const uploadedImages = imageFiles.length > 0
      ? await uploadFiles(imageFiles, user.id, "workshops/images") : [];
    const uploadedVideos = videoFiles.length > 0
      ? await uploadFiles(videoFiles, user.id, "workshops/videos") : [];

    const imageUrls = uploadedImages.map((m) => m.url);
    const videoUrls = uploadedVideos.map((v) => v.url);
    const coverUrl  = imageUrls[0] ?? null;

    const eventDateRaw = formData.get("eventDate") as string | null;
    const isOnline     = formData.get("isOnline") === "true";
    const isActive     = formData.get("isActive") !== "false";

    const eventDate = eventDateRaw ? new Date(eventDateRaw) : new Date();
    const slugBase  = generateWorkshopSlug(
      (formData.get("title") as string).trim(),
      eventDate
    );
    const slug = await uniqueSlug(slugBase);

    const [workshop] = await prisma.$transaction(async (tx) => {
      const w = await tx.workshop.create({
        data: {
          title:       (formData.get("title") as string).trim(),
          title_ar:    (formData.get("title_ar") as string).trim(),
          description: (formData.get("description") as string | null) || null,
          description_ar: (formData.get("description_ar") as string | null) || null,
          coverUrl,
          imageUrls,
          videoUrls,
          teacherId:   (formData.get("teacherId") as string | null) || null,
          roomId:      (formData.get("roomId")    as string | null) || null,
          eventDate:   eventDate,
          startTime:   formData.get("startTime") as string,
          endTime:     formData.get("endTime")   as string,
          capacity:    parseInt(formData.get("capacity") as string) || 1,
          price:       parseFloat(formData.get("price")  as string) || 0,
          currency:    (formData.get("currency") as string) || "OMR",
          isOnline,
          onlineLink:  (formData.get("onlineLink") as string | null) || null,
          isActive,
          slug,
        },
      });

      // Auto-create a DRAFT upcoming card linked to this workshop
      await tx.upcoming.create({
        data: {
          title:        w.title,
          title_ar:     w.title_ar,
          description:  w.description,
          description_ar: w.description_ar,
          mediaUrls:    imageUrls,
          videoUrls,
          thumbnailUrl: coverUrl,
          eventDate:    w.eventDate,
          badgeLabel:   "Workshop",
          linkUrl:      `/workshops/${slug}`,
          linkLabel:    "Register",
          status:       "DRAFT",
          isActive:     false,
          sortOrder:    0,
          createdBy:    user.id,
          workshopId:   w.id,
        },
      });

      return [w];
    });

    // Send in-app notification to all active students
    const students = await prisma.studentProfile.findMany({
      where:  { user: { isActive: true } },
      select: { userId: true },
    });
    if (students.length > 0) {
      await prisma.notification.createMany({
        data: students.map(({ userId }) => ({
          userId,
          type:    "INAPP" as const,
          status:  "PENDING" as const,
          subject: workshop.title,
          body:    `A new workshop is available: "${workshop.title}"`,
          linkUrl: `/workshops/${slug}`,
        })),
        skipDuplicates: false,
      });
    }

    revalidatePath("/[locale]/admin/workshops", "page");
    revalidatePath("/[locale]/admin/upcoming",  "page");
    return { success: true, id: workshop.id };
  } catch (err: any) {
    console.error("[createWorkshop]", err);
    return { success: false, error: err.message ?? "Failed to create workshop" };
  }
}

// ─── UPDATE ─────────────────────────────────────────────────
// Merges existingImageUrls/existingVideoUrls (kept by form) with new uploads.
export async function updateWorkshop(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireUser();

    const existingImageUrls = formData.getAll("existingImageUrls") as string[];
    const existingVideoUrls = formData.getAll("existingVideoUrls") as string[];

    const newImageFiles = (formData.getAll("imageFiles") as File[]).filter((f) => f.size > 0);
    const newVideoFiles = (formData.getAll("videoFiles") as File[]).filter((f) => f.size > 0);

    const newImages = newImageFiles.length > 0
      ? await uploadFiles(newImageFiles, user.id, "workshops/images") : [];
    const newVideos = newVideoFiles.length > 0
      ? await uploadFiles(newVideoFiles, user.id, "workshops/videos") : [];

    const imageUrls = [...existingImageUrls, ...newImages.map((m) => m.url)];
    const videoUrls = [...existingVideoUrls, ...newVideos.map((v) => v.url)];
    const coverUrl  = imageUrls[0] ?? null;

    const eventDateRaw = formData.get("eventDate") as string | null;
    const isOnline     = formData.get("isOnline") === "true";
    const isActive     = formData.get("isActive") !== "false";

    await prisma.workshop.update({
      where: { id },
      data: {
        title:       (formData.get("title") as string).trim(),
        title_ar:    (formData.get("title_ar") as string).trim(),
        description: (formData.get("description") as string | null) || null,
        description_ar: (formData.get("description_ar") as string | null) || null,
        coverUrl,
        imageUrls,
        videoUrls,
        teacherId:   (formData.get("teacherId") as string | null) || null,
        roomId:      (formData.get("roomId")    as string | null) || null,
        eventDate:   eventDateRaw ? new Date(eventDateRaw) : undefined,
        startTime:   formData.get("startTime") as string,
        endTime:     formData.get("endTime")   as string,
        capacity:    parseInt(formData.get("capacity") as string) || 1,
        price:       parseFloat(formData.get("price")  as string) || 0,
        currency:    (formData.get("currency") as string) || "OMR",
        isOnline,
        onlineLink:  (formData.get("onlineLink") as string | null) || null,
        isActive,
      },
    });

    revalidatePath("/[locale]/admin/workshops", "page");
    return { success: true };
  } catch (err: any) {
    console.error("[updateWorkshop]", err);
    return { success: false, error: err.message ?? "Failed to update workshop" };
  }
}

// ─── TOGGLE ACTIVE ──────────────────────────────────────────
// Syncs isActive on both Workshop and its linked Upcoming row atomically.
export async function toggleWorkshopActive(id: string, isActive: boolean) {
  try {
    await prisma.$transaction([
      prisma.workshop.update({ where: { id }, data: { isActive } }),
      prisma.upcoming.updateMany({ where: { workshopId: id }, data: { isActive } }),
    ]);
    revalidatePath("/[locale]/admin/workshops", "page");
    revalidatePath("/[locale]/admin/upcoming",  "page");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── DELETE ─────────────────────────────────────────────────
// Also deletes the linked Upcoming card (workshopId is a plain field,
// no cascade — we handle it manually here).
export async function deleteWorkshop(id: string) {
  try {
    const confirmedCount = await prisma.workshopBooking.count({
      where: { workshopId: id, status: "CONFIRMED" },
    });
    if (confirmedCount > 0) {
      return { success: false, error: `Cannot delete: ${confirmedCount} confirmed booking(s) exist.` };
    }
    await prisma.$transaction([
      prisma.upcoming.deleteMany({ where: { workshopId: id } }),
      prisma.workshop.delete({ where: { id } }),
    ]);
    revalidatePath("/[locale]/admin/workshops", "page");
    revalidatePath("/[locale]/admin/upcoming",  "page");
    return { success: true };
  } catch (err: any) {
    console.error("[deleteWorkshop]", err);
    return { success: false, error: err.message ?? "Failed to delete workshop" };
  }
}

// ─── ENROLL STUDENT ─────────────────────────────────────────
export async function enrollStudentInWorkshop(data: {
  workshopId: string; studentId: string; amount: number;
  currency: string; method: PaymentMethod; status: BookingStatus; paidAt?: Date;
}) {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: data.workshopId },
      select: { capacity: true, enrolledCount: true, reservedCount: true },
    });
    if (!workshop) return { success: false, error: "Workshop not found" };
    if (workshop.enrolledCount + workshop.reservedCount >= workshop.capacity) {
      return { success: false, error: "Workshop is at full capacity" };
    }
    const existing = await prisma.workshopBooking.findUnique({
      where: { workshopId_studentId: { workshopId: data.workshopId, studentId: data.studentId } },
    });
    if (existing) return { success: false, error: "Student is already enrolled in this workshop" };

    const isPaid = data.status === "CONFIRMED";
    await prisma.$transaction(async (tx) => {
      const booking = await tx.workshopBooking.create({
        data: { workshopId: data.workshopId, studentId: data.studentId, status: data.status },
      });
      await tx.payment.create({
        data: {
          workshopBookingId: booking.id,
          amount:   data.amount,
          currency: data.currency,
          status:   isPaid ? PaymentStatus.PAID : PaymentStatus.FAILED,
          method:   data.method,
          paidAt:   isPaid ? (data.paidAt ?? new Date()) : null,
        },
      });
      if (isPaid) {
        await tx.workshop.update({
          where: { id: data.workshopId },
          data:  { enrolledCount: { increment: 1 } },
        });
      }
    });

    revalidatePath("/[locale]/admin/workshops", "page");
    return { success: true };
  } catch (err: any) {
    console.error("[enrollStudentInWorkshop]", err);
    return { success: false, error: err.message ?? "Failed to enroll student" };
  }
}

// ─── CANCEL BOOKING ─────────────────────────────────────────
export async function cancelWorkshopBooking(bookingId: string) {
  try {
    const booking = await prisma.workshopBooking.findUnique({
      where:  { id: bookingId },
      select: { status: true, workshopId: true },
    });
    if (!booking) return { success: false, error: "Booking not found" };

    await prisma.$transaction(async (tx) => {
      await tx.workshopBooking.update({
        where: { id: bookingId },
        data:  { status: BookingStatus.CANCELLED },
      });
      if (booking.status === "CONFIRMED") {
        await tx.workshop.update({
          where: { id: booking.workshopId },
          data:  { enrolledCount: { decrement: 1 } },
        });
      }
    });

    revalidatePath("/[locale]/admin/workshops", "page");
    return { success: true };
  } catch (err: any) {
    console.error("[cancelWorkshopBooking]", err);
    return { success: false, error: err.message ?? "Failed to cancel booking" };
  }
}

// ─── SELECTS FOR DROPDOWNS ──────────────────────────────────
export async function getRooms() {
  return plain(await prisma.room.findMany({
    where: { isActive: true }, orderBy: { name: "asc" },
    select: { id: true, name: true, capacity: true, location: true },
  }));
}

export async function getTeachersForSelect() {
  return plain(await prisma.teacherProfile.findMany({
    orderBy: { firstName: "asc" },
    select:  { id: true, firstName: true, lastName: true },
  }));
}

export async function getStudentsForSelect() {
  return plain(await prisma.studentProfile.findMany({
    orderBy: { firstName: "asc" },
    select: {
      id: true, firstName: true, lastName: true,
      user: { select: { email: true } },
    },
  }));
}

// ─── GET WORKSHOPS FOR ENROLLMENT DROPDOWN ──────────────────
export async function getWorkshopsForSelect() {
  return plain(
    await prisma.workshop.findMany({
      where:   { isActive: true },
      orderBy: { eventDate: "asc" },
      select: {
        id: true, title: true, eventDate: true,
        price: true, currency: true, capacity: true,
        enrolledCount: true, reservedCount: true,
      },
    })
  );
}