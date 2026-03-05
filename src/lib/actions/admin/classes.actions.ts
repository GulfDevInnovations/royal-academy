"use server";

import { prisma } from "@/lib/prisma";
import { SessionType } from "@prisma/client";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ClassWithSubs = Awaited<ReturnType<typeof getClasses>>[number];
export type SubClassWithRelations = ClassWithSubs["subClasses"][number];

// ─────────────────────────────────────────────
// READ
// ─────────────────────────────────────────────

export async function getClasses() {
  return prisma.class.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      subClasses: {
        orderBy: { createdAt: "asc" },
        include: {
          teachers: {
            include: {
              teacher: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });
}

export async function getTeachersForSelect() {
  return prisma.teacherProfile.findMany({
    where: { isAvailable: true },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  });
}

// ─────────────────────────────────────────────
// CLASS ACTIONS
// ─────────────────────────────────────────────

export async function createClass(formData: FormData) {
  const name      = (formData.get("name")      as string).trim();
  const description = formData.get("description") as string | null;
  const sortOrder = parseInt(formData.get("sortOrder") as string) || 0;

  if (!name) return { error: "Name is required." };

  await prisma.class.create({
    data: { name, description: description || null, sortOrder },
  });
  return { success: true };
}

export async function updateClass(id: string, formData: FormData) {
  const name        = (formData.get("name")        as string).trim();
  const description = formData.get("description")  as string | null;
  const sortOrder   = parseInt(formData.get("sortOrder") as string) || 0;
  const isActive    = formData.get("isActive") === "true";

  if (!name) return { error: "Name is required." };

  await prisma.class.update({
    where: { id },
    data: { name, description: description || null, sortOrder, isActive },
  });
  return { success: true };
}

export async function deleteClass(id: string) {
  // Check if any subclasses exist
  const subCount = await prisma.subClass.count({ where: { classId: id } });
  if (subCount > 0) {
    return {
      error: `Cannot delete: this class has ${subCount} sub-class${subCount > 1 ? "es" : ""}. Remove them first.`,
    };
  }

  await prisma.class.delete({ where: { id } });
  return { success: true };
}

// ─────────────────────────────────────────────
// SUBCLASS ACTIONS
// ─────────────────────────────────────────────

export async function createSubClass(classId: string, formData: FormData) {
  const name              = (formData.get("name") as string).trim();
  const description       = formData.get("description")       as string | null;
  const capacity          = parseInt(formData.get("capacity")          as string) || 10;
  const durationMinutes   = parseInt(formData.get("durationMinutes")   as string) || 60;
  const price             = parseFloat(formData.get("price")           as string) || 0;
  const oncePriceMonthly  = parseFloat(formData.get("oncePriceMonthly")  as string) || 0;
  const twicePriceMonthly = parseFloat(formData.get("twicePriceMonthly") as string) || 0;
  const trialPrice        = parseFloat(formData.get("trialPrice")       as string) || 10;
  const sessionType       = (formData.get("sessionType") as SessionType) || "PUBLIC";
  const level             = formData.get("level")    as string | null;
  const ageGroup          = formData.get("ageGroup") as string | null;
  const isTrialAvailable  = formData.get("isTrialAvailable") === "true";

  if (!name) return { error: "Name is required." };

  await prisma.subClass.create({
    data: {
      classId,
      name,
      description:       description || null,
      capacity,
      durationMinutes,
      price,
      oncePriceMonthly:  oncePriceMonthly  || null,
      twicePriceMonthly: twicePriceMonthly || null,
      trialPrice,
      sessionType,
      level:    level    || null,
      ageGroup: ageGroup || null,
      isTrialAvailable,
    },
  });
  return { success: true };
}

export async function updateSubClass(id: string, formData: FormData) {
  const name              = (formData.get("name") as string).trim();
  const description       = formData.get("description")       as string | null;
  const capacity          = parseInt(formData.get("capacity")          as string) || 10;
  const durationMinutes   = parseInt(formData.get("durationMinutes")   as string) || 60;
  const price             = parseFloat(formData.get("price")           as string) || 0;
  const oncePriceMonthly  = parseFloat(formData.get("oncePriceMonthly")  as string) || 0;
  const twicePriceMonthly = parseFloat(formData.get("twicePriceMonthly") as string) || 0;
  const trialPrice        = parseFloat(formData.get("trialPrice")       as string) || 10;
  const sessionType       = (formData.get("sessionType") as SessionType) || "PUBLIC";
  const level             = formData.get("level")    as string | null;
  const ageGroup          = formData.get("ageGroup") as string | null;
  const isTrialAvailable  = formData.get("isTrialAvailable") === "true";
  const isActive          = formData.get("isActive") === "true";

  if (!name) return { error: "Name is required." };

  await prisma.subClass.update({
    where: { id },
    data: {
      name,
      description:       description || null,
      capacity,
      durationMinutes,
      price,
      oncePriceMonthly:  oncePriceMonthly  || null,
      twicePriceMonthly: twicePriceMonthly || null,
      trialPrice,
      sessionType,
      level:    level    || null,
      ageGroup: ageGroup || null,
      isTrialAvailable,
      isActive,
    },
  });
  return { success: true };
}

export async function deleteSubClass(id: string) {
  // Check every table that has a FK pointing at SubClass
  const [enrollments, schedules, trials] = await Promise.all([
    prisma.monthlyEnrollment.count({ where: { subClassId: id } }),
    prisma.classSchedule.count({    where: { subClassId: id } }),
    prisma.trialBooking.count({     where: { subClassId: id } }),
  ]);

  const reasons: string[] = [];
  if (schedules   > 0) reasons.push(`${schedules} schedule${schedules     > 1 ? "s" : ""}`);
  if (enrollments > 0) reasons.push(`${enrollments} enrollment${enrollments > 1 ? "s" : ""}`);
  if (trials      > 0) reasons.push(`${trials} trial booking${trials       > 1 ? "s" : ""}`);

  if (reasons.length > 0) {
    return {
      error: `Cannot delete: this sub-class has ${reasons.join(", ")}. Remove them first or deactivate it instead.`,
    };
  }

  try {
    await prisma.subClass.delete({ where: { id } });
  } catch (e: unknown) {
    // Catch any FK violation we may have missed
    const code = (e as { code?: string })?.code;
    if (code === "P2003") {
      return { error: "Cannot delete: this sub-class is still referenced by other records." };
    }
    throw e;
  }
  return { success: true };
}