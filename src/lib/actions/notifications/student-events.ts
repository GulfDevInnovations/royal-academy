// src/lib/actions/notifications/student-events.ts
"use server";

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/** Resolve a studentId → userId for writing a Notification row. */
async function getUserIdFromStudent(studentId: string): Promise<string | null> {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });
  return profile?.userId ?? null;
}

/**
 * Low-level writer — all student notification helpers funnel through here.
 * We never throw; a failed notification must never break the main flow.
 */
async function createInAppNotification({
  userId,
  subject,
  body,
  linkUrl,
  imageUrl,
  bookingId,
}: {
  userId:    string;
  subject:   string;
  body:      string;
  linkUrl?:  string;
  imageUrl?: string;
  bookingId?: string;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type:    "INAPP",
        status:  "SENT",
        subject,
        body,
        linkUrl:   linkUrl   ?? "/",
        imageUrl:  imageUrl  ?? null,
        bookingId: bookingId ?? null,
        sentAt:    new Date(),
      },
    });
  } catch (err) {
    // Log but never surface — notifications are non-critical
    console.error("[student-notifications] createInAppNotification failed:", err);
  }
}

// ─────────────────────────────────────────────────────────────────
// 1. MONTHLY ENROLLMENT CONFIRMED
// ─────────────────────────────────────────────────────────────────

/**
 * Call this inside (or just after) confirmMonthlyPayment once the
 * MonthlyEnrollment row has been committed.
 *
 * Example placement in confirm-payment.ts:
 *   await notifyMonthlyEnrollmentConfirmed({ studentId, subClassId, month, year });
 */
export async function notifyMonthlyEnrollmentConfirmed({
  studentId,
  subClassId,
  month,
  year,
}: {
  studentId:  string;
  subClassId: string;
  month:      number;
  year:       number;
}): Promise<void> {
  const userId = await getUserIdFromStudent(studentId);
  if (!userId) return;

  // Pull the class name for a human-readable message
  const subClass = await prisma.subClass.findUnique({
    where:  { id: subClassId },
    select: { name: true, class: { select: { name: true } } },
  });

  const className = subClass
    ? `${subClass.class.name} – ${subClass.name}`
    : "your class";

  const monthLabel = new Date(year, month - 1).toLocaleString("en-US", {
    month: "long",
    year:  "numeric",
  });

  await createInAppNotification({
    userId,
    subject: "Enrollment confirmed 🎉",
    body:    `You're enrolled in ${className} for ${monthLabel}. See you there!`,
    linkUrl: "/my-classes",
  });
}

// ─────────────────────────────────────────────────────────────────
// 2. MULTI-MONTH ENROLLMENT CONFIRMED
// ─────────────────────────────────────────────────────────────────

/**
 * Call this inside (or just after) confirmMultiMonthPayment once the
 * MultiMonthEnrollment + child MonthlyEnrollment rows have been committed.
 */
export async function notifyMultiMonthEnrollmentConfirmed({
  studentId,
  subClassId,
  startMonth,
  startYear,
  totalMonths,
}: {
  studentId:   string;
  subClassId:  string;
  startMonth:  number;
  startYear:   number;
  totalMonths: number;
}): Promise<void> {
  const userId = await getUserIdFromStudent(studentId);
  if (!userId) return;

  const subClass = await prisma.subClass.findUnique({
    where:  { id: subClassId },
    select: { name: true, class: { select: { name: true } } },
  });

  const className = subClass
    ? `${subClass.class.name} – ${subClass.name}`
    : "your class";

  const startLabel = new Date(startYear, startMonth - 1).toLocaleString("en-US", {
    month: "long",
    year:  "numeric",
  });

  await createInAppNotification({
    userId,
    subject: "Multi-month enrollment confirmed 🎉",
    body:    `You're enrolled in ${className} for ${totalMonths} months starting ${startLabel}. We look forward to seeing you!`,
    linkUrl: "/my-classes",
  });
}

// ─────────────────────────────────────────────────────────────────
// 3. TRIAL BOOKING CONFIRMED
// ─────────────────────────────────────────────────────────────────

/**
 * Call this inside (or just after) confirmTrialPayment.
 */
export async function notifyTrialBookingConfirmed({
  studentId,
  subClassId,
  sessionId,
}: {
  studentId:  string;
  subClassId: string;
  sessionId:  string;
}): Promise<void> {
  const userId = await getUserIdFromStudent(studentId);
  if (!userId) return;

  const subClass = await prisma.subClass.findUnique({
    where:  { id: subClassId },
    select: { name: true, class: { select: { name: true } } },
  });

  const session = await prisma.classSession.findUnique({
    where:  { id: sessionId },
    select: { sessionDate: true, startTime: true },
  });

  const className = subClass
    ? `${subClass.class.name} – ${subClass.name}`
    : "your trial class";

  const dateLabel = session
    ? new Date(session.sessionDate).toLocaleDateString("en-US", {
        weekday: "long",
        month:   "long",
        day:     "numeric",
      }) + ` at ${session.startTime}`
    : "";

  await createInAppNotification({
    userId,
    subject: "Trial class booked ✅",
    body:    `Your trial for ${className} is confirmed${dateLabel ? ` — ${dateLabel}` : ""}. See you soon!`,
    linkUrl: "/my-classes",
  });
}

// ─────────────────────────────────────────────────────────────────
// 4. SESSION RESCHEDULED
// ─────────────────────────────────────────────────────────────────

/**
 * Call this after a RescheduleLog row has been written and the
 * new Booking has been created.
 *
 * Pass wasLost = true when no free slot was found (session is lost).
 */
export async function notifySessionRescheduled({
  studentId,
  subClassId,
  oldSessionId,
  newSessionId,
  wasLost,
  lostReason,
}: {
  studentId:    string;
  subClassId:   string;
  oldSessionId: string;
  newSessionId?: string;
  wasLost:      boolean;
  lostReason?:  string;
}): Promise<void> {
  const userId = await getUserIdFromStudent(studentId);
  if (!userId) return;

  const subClass = await prisma.subClass.findUnique({
    where:  { id: subClassId },
    select: { name: true, class: { select: { name: true } } },
  });

  const className = subClass
    ? `${subClass.class.name} – ${subClass.name}`
    : "your class";

  if (wasLost) {
    await createInAppNotification({
      userId,
      subject: "Session could not be rescheduled",
      body:    lostReason
        ? `Your ${className} session could not be rescheduled: ${lostReason}.`
        : `We couldn't find an available slot to reschedule your ${className} session this month.`,
      linkUrl: "/my-classes",
    });
    return;
  }

  // Happy path — fetch the new session date/time for the message
  const newSession = newSessionId
    ? await prisma.classSession.findUnique({
        where:  { id: newSessionId },
        select: { sessionDate: true, startTime: true },
      })
    : null;

  const dateLabel = newSession
    ? new Date(newSession.sessionDate).toLocaleDateString("en-US", {
        weekday: "long",
        month:   "long",
        day:     "numeric",
      }) + ` at ${newSession.startTime}`
    : "";

  await createInAppNotification({
    userId,
    subject: "Session rescheduled ✅",
    body:    `Your ${className} session has been rescheduled${dateLabel ? ` to ${dateLabel}` : ""}. See you then!`,
    linkUrl: "/dashboard/my-classes",
  });
}

// ─────────────────────────────────────────────────────────────────
// 5. BOOKING CANCELLED
// ─────────────────────────────────────────────────────────────────

/**
 * Call this after a Booking row has been moved to CANCELLED status.
 * cancelledBy: "student" | "admin" — affects the message tone.
 */
export async function notifyBookingCancelled({
  studentId,
  subClassId,
  sessionId,
  cancelledBy,
  reason,
}: {
  studentId:   string;
  subClassId:  string;
  sessionId:   string;
  cancelledBy: "student" | "admin";
  reason?:     string;
}): Promise<void> {
  const userId = await getUserIdFromStudent(studentId);
  if (!userId) return;

  const subClass = await prisma.subClass.findUnique({
    where:  { id: subClassId },
    select: { name: true, class: { select: { name: true } } },
  });

  const session = await prisma.classSession.findUnique({
    where:  { id: sessionId },
    select: { sessionDate: true, startTime: true },
  });

  const className = subClass
    ? `${subClass.class.name} – ${subClass.name}`
    : "your class";

  const dateLabel = session
    ? new Date(session.sessionDate).toLocaleDateString("en-US", {
        weekday: "long",
        month:   "long",
        day:     "numeric",
      }) + ` at ${session.startTime}`
    : "";

  const body =
    cancelledBy === "admin"
      ? `Your ${className} session${dateLabel ? ` on ${dateLabel}` : ""} has been cancelled by the academy${reason ? `: ${reason}` : "."}${" "}We apologise for any inconvenience.`
      : `Your booking for ${className}${dateLabel ? ` on ${dateLabel}` : ""} has been cancelled.`;

  await createInAppNotification({
    userId,
    subject: cancelledBy === "admin" ? "Class cancelled by academy" : "Booking cancelled",
    body,
    linkUrl: "/dashboard/my-classes",
  });
}

// ─────────────────────────────────────────────────────────────────
// 6. WORKSHOP BOOKING CONFIRMED
// ─────────────────────────────────────────────────────────────────

/**
 * Call this inside (or just after) the workshop payment confirmation.
 */
export async function notifyWorkshopBookingConfirmed({
  studentId,
  workshopId,
}: {
  studentId:  string;
  workshopId: string;
}): Promise<void> {
  const userId = await getUserIdFromStudent(studentId);
  if (!userId) return;

  const workshop = await prisma.workshop.findUnique({
    where:  { id: workshopId },
    select: { title: true, eventDate: true, startTime: true },
  });

  const title = workshop?.title ?? "the workshop";

  const dateLabel = workshop
    ? new Date(workshop.eventDate).toLocaleDateString("en-US", {
        weekday: "long",
        month:   "long",
        day:     "numeric",
      }) + ` at ${workshop.startTime}`
    : "";

  await createInAppNotification({
    userId,
    subject: "Workshop booking confirmed 🎉",
    body:    `You're booked for ${title}${dateLabel ? ` on ${dateLabel}` : ""}. Can't wait to see you there!`,
    linkUrl: "/my-classes",
  });
}