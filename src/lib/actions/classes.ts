// src/lib/actions/classes.ts
"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseJsonArray } from "@/utils/parseJson";

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
  id: string;           // always the subClassId (used as route param)
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
  // When this card represents a Program under the subClass:
  programId?: string;
  programName?: string;
};

export type SubClassDetail = SubClassCard;

// Minimal program info passed to the detail client when a programId is in the URL
export type ProgramInfo = {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  description_ar: string | null;
  price: string;
  trialPrice: string;
  oncePriceMonthly: string | null;
  twicePriceMonthly: string | null;
  currency: string;
  durationMinutes: number;
  isTrialAvailable: boolean;
  level: string | null;
  ageGroup: string | null;
  sessionType: string;
};

export async function getSubClassCards(): Promise<SubClassCard[]> {
  // Query 1: active programs (for subClasses that have programs)
  const programRows = await prisma.program.findMany({
    where: { isActive: true, subClass: { isActive: true } },
    include: {
      subClass: {
        include: {
          class: true,
          teachers: { include: { teacher: true } },
        },
      },
    },
    orderBy: [
      { subClass: { class: { sortOrder: "asc" } } },
      { subClass: { name: "asc" } },
      { sortOrder: "asc" },
    ],
  });

  // Query 2: subClasses with no active programs
  const bareSubClasses = await prisma.subClass.findMany({
    where: { isActive: true, programs: { none: { isActive: true } } },
    include: {
      class: true,
      teachers: { include: { teacher: true } },
    },
    orderBy: [{ class: { sortOrder: "asc" } }, { name: "asc" }],
  });

  function toTeachers(
    teachers: Array<{ teacher: { id: string; firstName: string; lastName: string; photoUrl: string | null; bio: string | null; specialties: Prisma.JsonValue } }>,
  ): SubClassTeacherInfo[] {
    return teachers.map((t) => ({
      id: t.teacher.id,
      firstName: t.teacher.firstName,
      lastName: t.teacher.lastName,
      photoUrl: t.teacher.photoUrl,
      bio: t.teacher.bio,
      specialties: parseJsonArray<string>(t.teacher.specialties),
      availableDays: [],
      schedules: [],
      maxBookableMonths: null,
    }));
  }

  const cards: SubClassCard[] = [];

  // One card per program
  for (const p of programRows) {
    const s = p.subClass;
    cards.push({
      id: s.id,
      name: s.name,
      description: p.description,
      coverUrl: p.coverUrl ?? s.coverUrl,
      level: p.level,
      ageGroup: p.ageGroup,
      sessionType: p.sessionType,
      trialPrice: p.trialPrice.toString(),
      isTrialAvailable: p.isTrialAvailable,
      oncePriceMonthly: p.oncePriceMonthly?.toString() ?? null,
      twicePriceMonthly: p.twicePriceMonthly?.toString() ?? null,
      currency: p.currency,
      durationMinutes: p.durationMinutes,
      class: { id: s.class.id, name: s.class.name, iconUrl: s.class.iconUrl },
      teachers: toTeachers(s.teachers),
      programId: p.id,
      programName: p.name,
    });
  }

  // One card per bare subClass
  for (const s of bareSubClasses) {
    cards.push({
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
      class: { id: s.class.id, name: s.class.name, iconUrl: s.class.iconUrl },
      teachers: toTeachers(s.teachers),
    });
  }

  return cards;
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

export async function getProgramDetail(
  programId: string,
): Promise<ProgramInfo | null> {
  const p = await prisma.program.findUnique({
    where: { id: programId, isActive: true },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    name_ar: p.name_ar,
    description: p.description,
    description_ar: p.description_ar,
    price: p.price.toString(),
    trialPrice: p.trialPrice.toString(),
    oncePriceMonthly: p.oncePriceMonthly?.toString() ?? null,
    twicePriceMonthly: p.twicePriceMonthly?.toString() ?? null,
    currency: p.currency,
    durationMinutes: p.durationMinutes,
    isTrialAvailable: p.isTrialAvailable,
    level: p.level,
    ageGroup: p.ageGroup,
    sessionType: p.sessionType,
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