// src/lib/actions/classes.ts
"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type SubClassCard = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  level: string | null;
  ageGroup: string | null;
  sessionType: string;
  trialPrice: string;
  isTrialAvailable: boolean;
  oncePriceMonthly: string | null;
  twicePriceMonthly: string | null;
  currency: string;
  durationMinutes: number;
  class: {
    id: string;
    name: string;
    iconUrl: string | null;
  };
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    specialties: string[];
  } | null;
};

export type SubClassDetail = SubClassCard & {
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    bio: string | null;
    specialties: string[];
  } | null;
  availableDays: string[]; // DayOfWeek values from active schedules
};

export async function getSubClassCards(): Promise<SubClassCard[]> {
  const subClasses = await prisma.subClass.findMany({
    where: { isActive: true },
    include: {
      class: true,
      teacher: true,
    },
    orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
  });

  return subClasses.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    coverUrl: s.coverUrl,
    level: s.level,
    ageGroup: s.ageGroup,
    sessionType: s.sessionType,
    trialPrice: s.trialPrice.toString(),
    isTrialAvailable: s.isTrialAvailable,
    oncePriceMonthly: s.oncePriceMonthly?.toString() ?? null,
    twicePriceMonthly: s.twicePriceMonthly?.toString() ?? null,
    currency: s.currency,
    durationMinutes: s.durationMinutes,
    class: {
      id: s.class.id,
      name: s.class.name,
      iconUrl: s.class.iconUrl,
    },
    teacher: s.teacher
      ? {
          id: s.teacher.id,
          firstName: s.teacher.firstName,
          lastName: s.teacher.lastName,
          photoUrl: s.teacher.photoUrl,
          specialties: s.teacher.specialties,
        }
      : null,
  }));
}

export async function getSubClassDetail(id: string): Promise<SubClassDetail | null> {
  const s = await prisma.subClass.findUnique({
    where: { id, isActive: true },
    include: {
      class: true,
      teacher: true,
      classSchedules: {
        where: { status: "ACTIVE" },
        select: { dayOfWeek: true },
      },
    },
  });

  if (!s) return null;

  const availableDays = [...new Set(s.classSchedules.map((cs) => cs.dayOfWeek))];

  return {
    id: s.id,
    name: s.name,
    description: s.description,
    coverUrl: s.coverUrl,
    level: s.level,
    ageGroup: s.ageGroup,
    sessionType: s.sessionType,
    trialPrice: s.trialPrice.toString(),
    isTrialAvailable: s.isTrialAvailable,
    oncePriceMonthly: s.oncePriceMonthly?.toString() ?? null,
    twicePriceMonthly: s.twicePriceMonthly?.toString() ?? null,
    currency: s.currency,
    durationMinutes: s.durationMinutes,
    class: {
      id: s.class.id,
      name: s.class.name,
      iconUrl: s.class.iconUrl,
    },
    teacher: s.teacher
      ? {
          id: s.teacher.id,
          firstName: s.teacher.firstName,
          lastName: s.teacher.lastName,
          photoUrl: s.teacher.photoUrl,
          bio: s.teacher.bio,
          specialties: s.teacher.specialties,
        }
      : null,
    availableDays,
  };
}

export async function checkTrialEligibility(
  studentId: string,
  subClassId: string
): Promise<{ eligible: boolean; reason?: string }> {
  const existing = await prisma.trialBooking.findUnique({
    where: { studentId_subClassId: { studentId, subClassId } },
  });

  if (existing) {
    return { eligible: false, reason: "You have already taken a trial for this class." };
  }

  return { eligible: true };
}