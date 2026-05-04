// src/lib/actions/my-classes.ts
"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type EnrolledClass = {
  // The enrollment record
  enrollmentId:   string;
  enrollmentType: "SINGLE" | "MULTI";
  status:         string;
  frequency:      string;
  preferredDays:  string[];
  month:          number | null; // null for multi
  year:           number | null;
  startMonth:     number | null; // for multi
  startYear:      number | null;
  endMonth:       number | null;
  endYear:        number | null;
  totalMonths:    number | null;
  totalAmount:    number;
  currency:       string;
  paymentStatus:  string | null;
  paidAt:         string | null;

  // Resolved schedule slots (specific teacher + time)
  resolvedSlots: {
    dayOfWeek: string;
    startTime: string;
    endTime:   string;
    teacher: { firstName: string; lastName: string } | null;
  }[];

  // The sub-class
  subClass: {
    id:               string;
    name:             string;
    description:      string | null;
    coverUrl:         string | null;
    durationMinutes:  number;
    level:            string | null;
    ageGroup:         string | null;
    isReschedulable:  boolean;
    oncePriceMonthly: number | null;
    twicePriceMonthly: number | null;
    class: { id: string; name: string; iconUrl: string | null };
  };
};

export type SubClassOffer = {
  subClassId:       string;
  subClassName:     string;
  className:        string;
  coverUrl:         string | null;
  offerLabel:       string;
  offerDescription: string | null;
  offerExpiresAt:   string | null; // ISO
  oncePriceMonthly: number | null;
  twicePriceMonthly: number | null;
  currency:         string;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function plain<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function resolveSlots(
  scheduleIds: string[],
  preferredDays: string[],
  classSchedules: any[],
) {
  const filtered = scheduleIds.length > 0
    ? classSchedules.filter((s: any) => scheduleIds.includes(s.id))
    : classSchedules.filter((s: any) => preferredDays.includes(s.dayOfWeek));

  // Dedupe by dayOfWeek (one slot per day)
  const seen = new Set<string>();
  return filtered
    .filter((s: any) => {
      if (seen.has(s.dayOfWeek)) return false;
      seen.add(s.dayOfWeek);
      return true;
    })
    .map((s: any) => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime,
      endTime:   s.endTime,
      teacher:   s.teacher ?? null,
    }));
}

// ─────────────────────────────────────────────
// getMyClasses
// ─────────────────────────────────────────────

export async function getMyClasses(studentId: string): Promise<{
  enrollments: EnrolledClass[];
  offers:      SubClassOffer[];
}> {
  const [singles, multis, rawOffers] = await Promise.all([
    // Single-month enrollments (not part of a multi plan)
    prisma.monthlyEnrollment.findMany({
      where: {
        studentId,
        multiMonthEnrollmentId: null,
        status: { in: ["CONFIRMED"] },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: {
        payment: { select: { status: true, amount: true, paidAt: true } },
        subClass: {
          include: {
            class: { select: { id: true, name: true, iconUrl: true } },
            classSchedules: {
              where: { status: "ACTIVE" },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              select: {
                id: true, dayOfWeek: true, startTime: true, endTime: true,
                teacher: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),

    // Multi-month enrollments (parent records)
    prisma.multiMonthEnrollment.findMany({
      where: {
        studentId,
        status: { in: ["CONFIRMED"] },
      },
      orderBy: [{ startYear: "desc" }, { startMonth: "desc" }],
      include: {
        payment: { select: { status: true, amount: true, paidAt: true } },
        subClass: {
          include: {
            class: { select: { id: true, name: true, iconUrl: true } },
            classSchedules: {
              where: { status: "ACTIVE" },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              select: {
                id: true, dayOfWeek: true, startTime: true, endTime: true,
                teacher: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),

    // Active offers — sub-classes with isOfferActive = true
    // Exclude sub-classes the student is already enrolled in
    prisma.subClass.findMany({
      where: {
        isActive:     true,
        isOfferActive: true,
        OR: [
          { offerExpiresAt: null },
          { offerExpiresAt: { gte: new Date() } },
        ],
      },
      select: {
        id: true, name: true, coverUrl: true,
        offerLabel: true, offerDescription: true, offerExpiresAt: true,
        oncePriceMonthly: true, twicePriceMonthly: true, currency: true,
        class: { select: { name: true } },
      },
    }),
  ]);

  const p = plain({ singles, multis, rawOffers });

  // Enrolled subClass IDs — to exclude from offers
  const enrolledSubClassIds = new Set([
    ...p.singles.map((e: any) => e.subClassId),
    ...p.multis.map(( e: any) => e.subClassId),
  ]);

  const enrollments: EnrolledClass[] = [
    ...p.singles.map((e: any): EnrolledClass => ({
      enrollmentId:   e.id,
      enrollmentType: "SINGLE",
      status:         e.status,
      frequency:      e.frequency,
      preferredDays:  e.preferredDays,
      month:          e.month,
      year:           e.year,
      startMonth:     null,
      startYear:      null,
      endMonth:       null,
      endYear:        null,
      totalMonths:    null,
      totalAmount:    Number(e.totalAmount),
      currency:       e.currency,
      paymentStatus:  e.payment?.status ?? null,
      paidAt:         e.payment?.paidAt ?? null,
      resolvedSlots:  resolveSlots(
        e.scheduleIds ?? [],
        e.preferredDays,
        e.subClass.classSchedules,
      ),
      subClass: {
        id:               e.subClass.id,
        name:             e.subClass.name,
        description:      e.subClass.description,
        coverUrl:         e.subClass.coverUrl,
        durationMinutes:  e.subClass.durationMinutes,
        level:            e.subClass.level,
        ageGroup:         e.subClass.ageGroup,
        isReschedulable:  e.subClass.isReschedulable,
        oncePriceMonthly: e.subClass.oncePriceMonthly != null ? Number(e.subClass.oncePriceMonthly) : null,
        twicePriceMonthly: e.subClass.twicePriceMonthly != null ? Number(e.subClass.twicePriceMonthly) : null,
        class:            e.subClass.class,
      },
    })),

    ...p.multis.map((m: any): EnrolledClass => ({
      enrollmentId:   m.id,
      enrollmentType: "MULTI",
      status:         m.status,
      frequency:      m.frequency,
      preferredDays:  m.preferredDays,
      month:          null,
      year:           null,
      startMonth:     m.startMonth,
      startYear:      m.startYear,
      endMonth:       m.endMonth,
      endYear:        m.endYear,
      totalMonths:    m.totalMonths,
      totalAmount:    Number(m.totalAmount),
      currency:       m.currency,
      paymentStatus:  m.payment?.status ?? null,
      paidAt:         m.payment?.paidAt ?? null,
      resolvedSlots:  resolveSlots(
        m.scheduleIds ?? [],
        m.preferredDays,
        m.subClass.classSchedules,
      ),
      subClass: {
        id:               m.subClass.id,
        name:             m.subClass.name,
        description:      m.subClass.description,
        coverUrl:         m.subClass.coverUrl,
        durationMinutes:  m.subClass.durationMinutes,
        level:            m.subClass.level,
        ageGroup:         m.subClass.ageGroup,
        isReschedulable:  m.subClass.isReschedulable,
        oncePriceMonthly: m.subClass.oncePriceMonthly != null ? Number(m.subClass.oncePriceMonthly) : null,
        twicePriceMonthly: m.subClass.twicePriceMonthly != null ? Number(m.subClass.twicePriceMonthly) : null,
        class:            m.subClass.class,
      },
    })),
  ];

  const offers: SubClassOffer[] = p.rawOffers
    .filter((o: any) => !enrolledSubClassIds.has(o.id))
    .map((o: any): SubClassOffer => ({
      subClassId:       o.id,
      subClassName:     o.name,
      className:        o.class.name,
      coverUrl:         o.coverUrl,
      offerLabel:       o.offerLabel ?? "Special offer",
      offerDescription: o.offerDescription ?? null,
      offerExpiresAt:   o.offerExpiresAt ?? null,
      oncePriceMonthly: o.oncePriceMonthly != null ? Number(o.oncePriceMonthly) : null,
      twicePriceMonthly: o.twicePriceMonthly != null ? Number(o.twicePriceMonthly) : null,
      currency:         o.currency,
    }));

  return { enrollments, offers };
}