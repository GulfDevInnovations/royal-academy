"use server";

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type StudentRow = Awaited<ReturnType<typeof getStudents>>[number];

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export async function getStudents() {
  return prisma.studentProfile.findMany({
    orderBy: { firstName: "asc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
        },
      },
      monthlyEnrollments: {
        where: { status: { in: ["CONFIRMED"] } },
        include: {
          subClass: {
            include: {
              class: { select: { name: true } },
              classSchedules: {
                select: { dayOfWeek: true, startTime: true, endTime: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function getStudentFilterOptions() {
  const [classes, subClasses] = await Promise.all([
    prisma.class.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.subClass.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        classId: true,
        classSchedules: {
          select: { dayOfWeek: true, startTime: true, endTime: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);
  return { classes, subClasses };
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updateStudent(id: string, formData: FormData) {
  const firstName        = (formData.get("firstName")        as string).trim();
  const lastName         = (formData.get("lastName")         as string).trim();
  const phone            = (formData.get("phone")            as string).trim();
  const address          = formData.get("address")          as string | null;
  const city             = formData.get("city")             as string | null;
  const emergencyContactName  = formData.get("emergencyContactName")  as string | null;
  const emergencyContactPhone = formData.get("emergencyContactPhone") as string | null;
  const emergencyRelationship = formData.get("emergencyRelationship") as string | null;
  const notes                 = formData.get("notes")                 as string | null;
  const dateOfBirth           = formData.get("dateOfBirth")           as string | null;
  const gender                = formData.get("gender")                as string | null;

  if (!firstName) return { error: "First name is required." };
  if (!lastName)  return { error: "Last name is required." };

  const profile = await prisma.studentProfile.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!profile) return { error: "Student not found." };

  await prisma.$transaction([
    prisma.studentProfile.update({
      where: { id },
      data: {
        firstName,
        lastName,
        address:          address          || null,
        city:             city             || null,
        emergencyContactName:  emergencyContactName  || null,
        emergencyContactPhone: emergencyContactPhone || null,
        emergencyRelationship: emergencyRelationship || null,
        notes:                 notes                 || null,
        dateOfBirth:      dateOfBirth      ? new Date(dateOfBirth) : null,
        gender:           (gender as "MALE" | "FEMALE" | "OTHER" | null) || null,
      },
    }),
    prisma.user.update({
      where: { id: profile.userId },
      data: { phone: phone || null },
    }),
  ]);

  return { success: true };
}

// ─────────────────────────────────────────────
// BULK ACTIVATE / DEACTIVATE
// ─────────────────────────────────────────────

export async function setStudentsActive(ids: string[], isActive: boolean) {
  const profiles = await prisma.studentProfile.findMany({
    where: { id: { in: ids } },
    select: { userId: true },
  });
  const userIds = profiles.map((p) => p.userId);

  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { isActive },
  });

  return { success: true };
}

// ─────────────────────────────────────────────
// BULK SMS — creates Notification records
// Actual delivery handled by your Twilio worker
// ─────────────────────────────────────────────

export async function sendSmsToStudents(
  studentProfileIds: string[],
  message: string
) {
  if (!message.trim())              return { error: "Message cannot be empty." };
  if (studentProfileIds.length === 0) return { error: "No students selected." };

  const profiles = await prisma.studentProfile.findMany({
    where: { id: { in: studentProfileIds } },
    select: { userId: true },
  });

  await prisma.notification.createMany({
    data: profiles.map((p) => ({
      userId: p.userId,
      type:   "SMS" as const,
      status: "PENDING" as const,
      body:   message,
    })),
  });

  return { success: true, count: profiles.length };
}