// src/lib/actions/classes.ts
"use server";

import { PrismaClient } from "@prisma/client";
import { parseJsonArray } from "@/utils/parseJson";

const prisma = new PrismaClient();

export type SubClassTeacherSchedule = {
  id:        string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  endDate: string | null; // ISO string — null means schedule runs indefinitely
};

export type SubClassTeacherInfo = {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  bio: string | null;
  specialties: string[];
  availableDays: string[];       // days THIS teacher teaches THIS subclass
  schedules: SubClassTeacherSchedule[]; // full slot info per day
  // Max months a student can enroll starting from today, capped by the
  // earliest endDate across this teacher's schedules for this subclass.
  // null = no limit (schedules run indefinitely).
  maxBookableMonths: number | null;
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
        include: { teacher: true },
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
      specialties: parseJsonArray<string>(t.teacher.specialties),
      availableDays: [],
      schedules: [],
      maxBookableMonths: null,
    })),
  }));
}

export async function getSubClassDetail(
  id: string,
): Promise<SubClassDetail | null> {
  const s = await prisma.subClass.findUnique({
    where: { id, isActive: true },
    include: {
      class: true,
      teachers: {
        include: {
          teacher: {
            include: {
              classSchedules: {
                where: { subClassId: id, status: "ACTIVE" },
                select: {
                  id:        true,
                  dayOfWeek: true,
                  startTime: true,
                  endTime: true,
                  endDate: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!s) return null;

  const now = new Date();
  // Start of the current month, used to compute max bookable months
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
    teachers: s.teachers.map((t) => {
      const teacherSchedules = t.teacher.classSchedules;

      const schedules: SubClassTeacherSchedule[] = teacherSchedules.map(
        (cs) => ({
          id:        cs.id,
          dayOfWeek: cs.dayOfWeek,
          startTime: cs.startTime,
          endTime: cs.endTime,
          endDate: cs.endDate ? cs.endDate.toISOString() : null,
        }),
      );

      // Compute maxBookableMonths: find the earliest endDate across all
      // this teacher's schedules for this subclass. If any schedule has
      // no endDate (null), it doesn't cap the range — only finite endDates
      // cap it. If ALL schedules have no endDate, maxBookableMonths = null.
      const finiteEndDates = teacherSchedules
        .map((cs) => cs.endDate)
        .filter((d): d is Date => d != null);

      let maxBookableMonths: number | null = null;
      if (finiteEndDates.length > 0) {
        // Use the earliest end date as the cap
        const earliestEnd = new Date(
          Math.min(...finiteEndDates.map((d) => d.getTime())),
        );
        // How many full months from start of current month to earliestEnd?
        const endYear = earliestEnd.getFullYear();
        const endMonth = earliestEnd.getMonth(); // 0-based
        const startYear = startOfCurrentMonth.getFullYear();
        const startMonth = startOfCurrentMonth.getMonth(); // 0-based
        const monthDiff =
          (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
        // Cap between 1 and 12
        maxBookableMonths = Math.max(1, Math.min(12, monthDiff));
      }

      return {
        id: t.teacher.id,
        firstName: t.teacher.firstName,
        lastName: t.teacher.lastName,
        photoUrl: t.teacher.photoUrl,
        bio: t.teacher.bio,
        specialties: parseJsonArray<string>(t.teacher.specialties),
        availableDays: [...new Set(teacherSchedules.map((cs) => cs.dayOfWeek))],
        schedules,
        maxBookableMonths,
      };
    }),
  };
}

export async function checkTrialEligibility(
  studentId: string,
  subClassId: string,
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