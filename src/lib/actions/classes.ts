// src/lib/actions/classes.ts
"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type SubClassTeacherInfo = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  bio: string | null;
  specialties: string[];
  availableDays: string[]; // days THIS teacher teaches THIS subclass
};

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
  teachers: SubClassTeacherInfo[];
};

export type SubClassDetail = SubClassCard;

export async function getSubClassCards(): Promise<SubClassCard[]> {
  const subClasses = await prisma.subClass.findMany({
    where: { isActive: true },
    include: {
      class: true,
      teachers: {
        include: {
          teacher: true,
        },
      },
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
    teachers: s.teachers.map((t) => ({
      id: t.teacher.id,
      firstName: t.teacher.firstName,
      lastName: t.teacher.lastName,
      photoUrl: t.teacher.photoUrl,
      bio: t.teacher.bio,
      specialties: t.teacher.specialties,
      availableDays: [], // not needed on cards page
    })),
  }));
}

export async function getSubClassDetail(
  id: string
): Promise<SubClassDetail | null> {
  const s = await prisma.subClass.findUnique({
    where: { id, isActive: true },
    include: {
      class: true,
      teachers: {
        include: {
          teacher: {
            include: {
              // Get schedules for THIS subclass only
              classSchedules: {
                where: {
                  subClassId: id,
                  status: "ACTIVE",
                },
                select: { dayOfWeek: true },
              },
            },
          },
        },
      },
    },
  });

  if (!s) return null;

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
    teachers: s.teachers.map((t) => ({
      id: t.teacher.id,
      firstName: t.teacher.firstName,
      lastName: t.teacher.lastName,
      photoUrl: t.teacher.photoUrl,
      bio: t.teacher.bio,
      specialties: t.teacher.specialties,
      // Days THIS teacher teaches THIS subclass
      availableDays: [
        ...new Set(
          t.teacher.classSchedules.map((cs) => cs.dayOfWeek)
        ),
      ],
    })),
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
    return {
      eligible: false,
      reason: "You have already taken a trial for this class.",
    };
  }

  return { eligible: true };
}