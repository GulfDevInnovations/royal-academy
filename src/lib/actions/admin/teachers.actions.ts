"use server";

import { prisma } from "@/lib/prisma";
import { uploadMedia } from "@/lib/media/service";
import { requireUser } from "@/lib/auth";
// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export async function getTeachers() {
  return prisma.teacherProfile.findMany({
    orderBy: { firstName: "asc" },
    include: {
      user: {
        select: { email: true, phone: true, isActive: true, isVerified: true },
      },
      // Junction table — each entry links this teacher to a subclass
      subClassTeachers: {
        include: {
          subClass: {
            select: {
              id: true,
              name: true,
              class: { select: { id: true, name: true } },
            },
          },
        },
      },
      _count: {
        select: { subClassTeachers: true, classSchedules: true },
      },
    },
  });
}

// All classes with subclasses — for the assignment UI.
// Each subclass now includes its current teachers via the junction table.
export async function getSubClassesForAssignment() {
  return prisma.class.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      subClasses: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          teachers: {
            select: {
              teacher: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });
}

// ─────────────────────────────────────────────
// ASSIGN — replaces the old teacherId updateMany
// Syncs the junction table rows for this teacher:
// - Removes rows for subclasses that were deselected
// - Adds rows for newly selected subclasses (upsert — safe to call multiple times)
// ─────────────────────────────────────────────

export async function assignSubClassesToTeacher(
  teacherId: string,
  subClassIds: string[]
): Promise<{ error: string } | { success: true }> {
  // Delete junction rows for subclasses no longer selected
  await prisma.subClassTeacher.deleteMany({
    where: {
      teacherId,
      subClassId: { notIn: subClassIds },
    },
  });

  // Upsert junction rows for selected subclasses
  // createMany with skipDuplicates handles the case where the row already exists
  if (subClassIds.length > 0) {
    await prisma.subClassTeacher.createMany({
      data: subClassIds.map((subClassId) => ({ teacherId, subClassId })),
      skipDuplicates: true,
    });
  }

  return { success: true };
}

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export async function createTeacher(
  formData: FormData
): Promise<{ error: string } | { success: true; teacherId: string }> {
  const firstName   = (formData.get("firstName")   as string).trim();
  const lastName    = (formData.get("lastName")    as string).trim();
  const email       = (formData.get("email")       as string | null)?.trim() || null;
  const phone       = (formData.get("phone")       as string | null)?.trim() || null;
  const bio         = (formData.get("bio")         as string | null) || null;
  const bio_ar         = (formData.get("bio_ar")         as string | null) || null;
  const photoUrl    = (formData.get("photoUrl")    as string | null) || null;
  const specialties = (formData.get("specialties") as string)
    .split(",").map((s) => s.trim()).filter(Boolean);

  if (!firstName) return { error: "First name is required." };
  if (!lastName)  return { error: "Last name is required." };

  let userId: string | undefined;
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "A user with this email already exists." };

    const newUser = await prisma.user.create({
      data: {
        email,
        phone:        phone || null,
        passwordHash: "",
        role:         "TEACHER",
        isActive:     true,
        isVerified:   false,
      },
    });
    userId = newUser.id;
  }

  const teacher = await prisma.teacherProfile.create({
    data: {
      firstName,
      lastName,
      bio,
      bio_ar,
      photoUrl,
      specialties,
      isAvailable: true,
      isActive:    true,
      ...(userId ? { userId } : {}),
    },
  });

  return { success: true, teacherId: teacher.id };
}

// ─────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────

export async function updateTeacher(
  id: string,
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const firstName   = (formData.get("firstName")   as string).trim();
  const lastName    = (formData.get("lastName")    as string).trim();
  const bio         = (formData.get("bio")         as string | null) || null;
  const bio_ar      = (formData.get("bio_ar")      as string | null) || null;
  const photoUrl    = (formData.get("photoUrl")    as string | null) || null;
  const specialties = (formData.get("specialties") as string)
    .split(",").map((s) => s.trim()).filter(Boolean);
  const isAvailable = formData.get("isAvailable") === "true";
  const isActive    = formData.get("isActive")    === "true";

  if (!firstName) return { error: "First name is required." };
  if (!lastName)  return { error: "Last name is required." };

  const profile = await prisma.teacherProfile.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!profile) return { error: "Teacher not found." };

  await prisma.teacherProfile.update({
    where: { id },
    data: { firstName, lastName, bio, bio_ar, photoUrl, specialties, isAvailable, isActive },
  });

  if (profile.userId) {
    await prisma.user.update({
      where: { id: profile.userId },
      data:  { isActive },
    });
  }

  return { success: true };
}


export async function uploadTeacherPhoto(
  formData: FormData
): Promise<{ error: string } | { url: string }> {
  try {
    await requireUser();
    const file = formData.get("file") as File;
    if (!file || file.size === 0) return { error: "No file provided" };
    const result = await uploadMedia({
      file,
      folder: "teachers",
    });
    return { url: result.url };
  } catch (e) {
    console.error(e);
    return { error: "Photo upload failed" };
  }
}
// ─────────────────────────────────────────────
// DELETE
// Junction rows are removed automatically via onDelete: Cascade
// ─────────────────────────────────────────────

export async function deleteTeacher(id: string) {
  const schedules = await prisma.classSchedule.count({ where: { teacherId: id } });

  if (schedules > 0) {
    return {
      error: `Cannot delete: this teacher has ${schedules} schedule${schedules > 1 ? "s" : ""}. Reassign them first.`,
    };
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!profile) return { error: "Teacher not found." };

  try {
    if (profile.userId) {
      await prisma.user.delete({ where: { id: profile.userId } });
    } else {
      await prisma.teacherProfile.delete({ where: { id } });
    }
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2003") {
      return { error: "Cannot delete: teacher is still referenced by other records." };
    }
    throw e;
  }

  return { success: true };
}

// ─────────────────────────────────────────────
// BULK SMS
// ─────────────────────────────────────────────

export async function sendSmsToTeachers(
  teacherProfileIds: string[],
  message: string
) {
  if (!message.trim())                return { error: "Message cannot be empty." };
  if (teacherProfileIds.length === 0) return { error: "No teachers selected." };

  const profiles = await prisma.teacherProfile.findMany({
    where: { id: { in: teacherProfileIds }, userId: { not: null } },
    select: { userId: true },
  });

  if (profiles.length === 0) {
    return { error: "None of the selected teachers have a linked account for SMS." };
  }

  await prisma.notification.createMany({
    data: profiles.map((p) => ({
      userId: p.userId!,
      type:   "SMS"     as const,
      status: "PENDING" as const,
      body:   message,
    })),
  });

  return { success: true, count: profiles.length };
}