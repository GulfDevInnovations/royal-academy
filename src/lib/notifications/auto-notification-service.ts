// src/lib/notifications/auto-notification-service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Royal Academy — Automated Notification Service
//
// Handles:
//   1. 24-hour session reminders (email + SMS)
//   2. Birthday greetings (email + SMS)
//
// Called by the cron API route. Each run is idempotent — NotificationLog
// prevents the same notification from being sent twice.
// ─────────────────────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";
import { dispatchSms } from "@/lib/sms/sms-dispatcher";
import {
  buildSessionReminderHtml,
  buildSessionReminderSms,
  buildBirthdayHtml,
  buildBirthdaySms,
} from "@/lib/emails/auto-notification-emails";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY!);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Royal Academy <no-reply@royalacademy.om>";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(startTime: string, endTime: string): string {
  return `${startTime} – ${endTime}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Send 24-hour session reminders
// ─────────────────────────────────────────────────────────────────────────────

export async function sendSessionReminders(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  errors: string[];
}> {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23h from now
  const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25h from now

  // Find all confirmed bookings whose session falls in the 24h window
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      session: {
        sessionDate: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
    },
    include: {
      student: {
        include: {
          user: true,
        },
      },
      session: {
        include: {
          schedule: {
            include: {
              subClass: {
                include: { class: true },
              },
              teacher: true,
            },
          },
        },
      },
    },
  });

  const results = { processed: bookings.length, sent: 0, skipped: 0, errors: [] as string[] };

  for (const booking of bookings) {
    const userId    = booking.student.userId;
    const sessionId = booking.sessionId;

    // Idempotency check — skip if already sent for this session
    const alreadySent = await prisma.notificationLog.findUnique({
      where: {
        userId_type_referenceId: {
          userId,
          type:        "SESSION_REMINDER_24H",
          referenceId: sessionId,
        },
      },
    });

    if (alreadySent) {
      results.skipped++;
      continue;
    }

    const studentName = `${booking.student.firstName} ${booking.student.lastName}`;
    const email       = booking.student.user.email;
    const phone       = booking.student.user.phone ?? null;
    const className   = `${booking.session.schedule.subClass.class.name} – ${booking.session.schedule.subClass.name}`;
    const teacherName = `${booking.session.schedule.teacher.firstName} ${booking.session.schedule.teacher.lastName}`;
    const sessionDate = formatDate(booking.session.sessionDate);
    const sessionTime = formatTime(booking.session.startTime, booking.session.endTime);

    let emailOk = false;
    let smsOk   = false;

    // Send email
    try {
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      email,
        subject: `Reminder: Your ${className} class is tomorrow — Royal Academy`,
        html:    buildSessionReminderHtml({
          studentName,
          className,
          teacherName,
          sessionDate,
          sessionTime,
        }),
      });
      emailOk = true;
    } catch (err) {
      results.errors.push(`Email failed for booking ${booking.id}: ${err}`);
    }

    // Send SMS (if phone number exists)
    if (phone) {
      try {
        const smsResult = await dispatchSms({
          to:      phone,
          message: buildSessionReminderSms({ studentName, className, sessionDate, sessionTime }),
        });
        if (smsResult.success) smsOk = true;
        else results.errors.push(`SMS failed for booking ${booking.id}: ${smsResult.error}`);
      } catch (err) {
        results.errors.push(`SMS error for booking ${booking.id}: ${err}`);
      }
    } else {
      smsOk = true; // no phone → treat as OK, nothing to send
    }

    // Queue in-app Notification records (matches your existing pattern)
    await prisma.notification.createMany({
      data: [
        ...(emailOk
          ? [{ userId, type: "EMAIL" as const, status: "SENT" as const,    body: `Session reminder sent for ${className} on ${sessionDate}` }]
          : [{ userId, type: "EMAIL" as const, status: "FAILED" as const,  body: `Failed to send session reminder for ${className}` }]),
        ...(phone
          ? [smsOk
              ? { userId, type: "SMS" as const, status: "SENT" as const,   body: `SMS reminder sent for ${className} on ${sessionDate}` }
              : { userId, type: "SMS" as const, status: "FAILED" as const, body: `Failed to send SMS reminder for ${className}` }]
          : []),
      ],
    });

    // Mark as sent to prevent duplicates
    if (emailOk) {
      await prisma.notificationLog.create({
        data: {
          userId,
          type:        "SESSION_REMINDER_24H",
          referenceId: sessionId,
        },
      });
      results.sent++;
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Send birthday greetings
// ─────────────────────────────────────────────────────────────────────────────

export async function sendBirthdayGreetings(): Promise<{
  processed: number;
  sent: number;
  skipped: number;
  errors: string[];
}> {
  const today     = new Date();
  const todayMonth = today.getMonth() + 1; // 1-indexed
  const todayDay   = today.getDate();
  // Reference key to prevent double-sending on the same calendar day
  const dateKey    = `${today.getFullYear()}-${String(todayMonth).padStart(2, "0")}-${String(todayDay).padStart(2, "0")}`;

  // Find students whose birthday is today (month + day match, year ignored)
  // Prisma doesn't support month/day extraction natively, so we use a raw query
  const students = await prisma.$queryRaw<
    Array<{
      id: string;
      userId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
    }>
  >`
    SELECT
    sp.id,
    sp.userId,
    sp.firstName,
    sp.lastName,
    u.email,
    u.phone
  FROM student_profiles sp
  JOIN users u ON u.id = sp.userId
  WHERE u.isActive = true
    AND sp.dateOfBirth IS NOT NULL
    AND MONTH(sp.dateOfBirth) = ${todayMonth}
    AND DAY(sp.dateOfBirth)   = ${todayDay}
`;

  const results = { processed: students.length, sent: 0, skipped: 0, errors: [] as string[] };

  for (const student of students) {
    // Idempotency check
    const alreadySent = await prisma.notificationLog.findUnique({
      where: {
        userId_type_referenceId: {
          userId:      student.userId,
          type:        "BIRTHDAY",
          referenceId: dateKey,
        },
      },
    });

    if (alreadySent) {
      results.skipped++;
      continue;
    }

    const studentName = `${student.firstName} ${student.lastName}`;
    let emailOk = false;
    let smsOk   = false;

    // Send email
    try {
      await resend.emails.send({
        from:    FROM_EMAIL,
        to:      student.email,
        subject: `Happy Birthday, ${student.firstName}! 🎂 — Royal Academy`,
        html:    buildBirthdayHtml({ studentName }),
      });
      emailOk = true;
    } catch (err) {
      results.errors.push(`Birthday email failed for ${student.id}: ${err}`);
    }

    // Send SMS
    if (student.phone) {
      try {
        const smsResult = await dispatchSms({
          to:      student.phone,
          message: buildBirthdaySms({ studentName }),
        });
        if (smsResult.success) smsOk = true;
        else results.errors.push(`Birthday SMS failed for ${student.id}: ${smsResult.error}`);
      } catch (err) {
        results.errors.push(`Birthday SMS error for ${student.id}: ${err}`);
      }
    } else {
      smsOk = true;
    }

    // Queue in-app Notification
    await prisma.notification.createMany({
      data: [
        ...(emailOk
          ? [{ userId: student.userId, type: "EMAIL" as const, status: "SENT" as const,   body: `Birthday greeting sent` }]
          : [{ userId: student.userId, type: "EMAIL" as const, status: "FAILED" as const, body: `Failed to send birthday greeting` }]),
        ...(student.phone
          ? [smsOk
              ? { userId: student.userId, type: "SMS" as const, status: "SENT" as const,   body: `Birthday SMS sent` }
              : { userId: student.userId, type: "SMS" as const, status: "FAILED" as const, body: `Birthday SMS failed` }]
          : []),
      ],
    });

    // Mark as sent
    if (emailOk) {
      await prisma.notificationLog.create({
        data: {
          userId:      student.userId,
          type:        "BIRTHDAY",
          referenceId: dateKey,
        },
      });
      results.sent++;
    }
  }

  return results;
}