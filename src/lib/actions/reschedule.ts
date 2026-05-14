// src/lib/actions/reschedule.ts
'use server';

import { notifySessionRescheduled } from '@/lib/actions/notifications/student-events';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type RescheduleResult =
  | { success: true; newBookingId: string; wasLost: false }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// performReschedule
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reschedules a student's session.
 *
 * Accepts EITHER:
 *  - oldBookingId  — an existing Booking row to cancel+replace, OR
 *  - oldSessionId  — a ClassSession the student is enrolled in but has no
 *                    explicit Booking row for yet (monthly enrollment model)
 *
 * In the "no pre-existing booking" path we create the old booking as
 * RESCHEDULED immediately, then create the new booking as CONFIRMED.
 */
export async function performReschedule(
  /** Existing booking ID, or null if the session has no booking row yet */
  oldBookingId: string | null,
  newSessionId: string,
  /** Required when oldBookingId is null */
  oldSessionId?: string,
): Promise<RescheduleResult> {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  const user = session?.user;
  if (!user) return { success: false, error: 'Not authenticated' };

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!studentProfile)
    return { success: false, error: 'Student profile not found' };

  const now = new Date();

  // ── Resolve the "old" booking / session ──────────────────────────────────
  let resolvedOldBookingId: string | null = oldBookingId;
  let oldSession: {
    id: string;
    sessionDatetime: Date;
    scheduleId: string;
    schedule: {
      subClassId: string;
      teacherId: string;
      subClass: { isReschedulable: boolean };
    };
  };

  if (oldBookingId) {
    // Path A: booking row already exists
    const booking = await prisma.booking.findUnique({
      where: { id: oldBookingId },
      select: {
        studentId: true,
        status: true,
        session: {
          select: {
            id: true,
            sessionDatetime: true,
            scheduleId: true,
            schedule: {
              select: {
                subClassId: true,
                teacherId: true,
                subClass: { select: { isReschedulable: true } },
              },
            },
          },
        },
      },
    });
    if (!booking) return { success: false, error: 'Booking not found' };
    if (booking.studentId !== studentProfile.id)
      return { success: false, error: 'You do not own this booking' };
    if (booking.status === 'CANCELLED' || booking.status === 'RESCHEDULED')
      return {
        success: false,
        error: 'This booking has already been cancelled or rescheduled',
      };
    if (!booking.session.schedule.subClass.isReschedulable)
      return {
        success: false,
        error: 'This class does not support rescheduling',
      };

    oldSession = booking.session;
  } else {
    // Path B: no booking row — student is enrolled via monthly/multi-month
    // enrollment but individual session bookings weren't pre-created.
    if (!oldSessionId)
      return {
        success: false,
        error: 'oldSessionId is required when no booking exists',
      };

    const session = await prisma.classSession.findUnique({
      where: { id: oldSessionId },
      select: {
        id: true,
        sessionDatetime: true,
        scheduleId: true,
        schedule: {
          select: {
            subClassId: true,
            teacherId: true,
            subClass: { select: { isReschedulable: true } },
          },
        },
      },
    });
    if (!session) return { success: false, error: 'Session not found' };
    if (!session.schedule.subClass.isReschedulable)
      return {
        success: false,
        error: 'This class does not support rescheduling',
      };

    oldSession = session;
    resolvedOldBookingId = null; // will be created inside the transaction
  }

  // ── 24-hour gate on the OLD session ──────────────────────────────────────
  const hoursUntilOld =
    (oldSession.sessionDatetime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilOld < 24)
    return {
      success: false,
      error: 'Sessions can only be rescheduled at least 24 hours in advance',
    };

  // ── Validate new session ──────────────────────────────────────────────────
  const newSession = await prisma.classSession.findUnique({
    where: { id: newSessionId },
    select: {
      id: true,
      sessionDatetime: true,
      status: true,
      scheduleId: true,
      schedule: {
        select: { subClassId: true, teacherId: true, maxCapacity: true },
      },
    },
  });

  if (!newSession) return { success: false, error: 'Target session not found' };
  if (newSession.status !== 'ACTIVE')
    return { success: false, error: 'Target session is not active' };
  if (newSession.schedule.subClassId !== oldSession.schedule.subClassId)
    return { success: false, error: 'Cannot reschedule to a different class' };
  if (newSession.schedule.teacherId !== oldSession.schedule.teacherId)
    return {
      success: false,
      error: 'Cannot reschedule to a different teacher',
    };

  // 24-hour gate on the NEW session
  const hoursUntilNew =
    (newSession.sessionDatetime.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursUntilNew < 24)
    return {
      success: false,
      error: 'Cannot reschedule to a session starting in less than 24 hours',
    };

  // Capacity check — count real CONFIRMED bookings for this specific session.
  // Do NOT use ClassSchedule.currentEnrolled — it's a schedule-level counter
  // that drifts after reschedules and does not reflect per-session occupancy.
  const confirmedBookingCount = await prisma.booking.count({
    where: { sessionId: newSessionId, status: 'CONFIRMED' },
  });
  if (confirmedBookingCount >= newSession.schedule.maxCapacity)
    return { success: false, error: 'That session is fully booked' };

  // Duplicate check
  const dupBooking = await prisma.booking.findUnique({
    where: {
      studentId_sessionId: {
        studentId: studentProfile.id,
        sessionId: newSessionId,
      },
    },
  });
  if (dupBooking && dupBooking.status !== 'CANCELLED')
    return {
      success: false,
      error: 'You already have a booking for that session',
    };

  // ── Transaction ───────────────────────────────────────────────────────────
  try {
    const newBookingId = await prisma.$transaction(async (tx) => {
      // a. Handle old booking
      let finalOldBookingId: string;

      if (resolvedOldBookingId) {
        // Update existing booking
        await tx.booking.update({
          where: { id: resolvedOldBookingId },
          data: { status: 'RESCHEDULED', cancelledAt: now },
        });
        finalOldBookingId = resolvedOldBookingId;
      } else {
        // Create a RESCHEDULED booking record for the old session (audit trail)
        const created = await tx.booking.create({
          data: {
            studentId: studentProfile.id,
            sessionId: oldSession.id,
            status: 'RESCHEDULED',
            bookedAt: now,
            cancelledAt: now,
          },
        });
        finalOldBookingId = created.id;
      }

      // b. Create (or reinstate) new booking
      let newBooking;
      if (dupBooking) {
        newBooking = await tx.booking.update({
          where: { id: dupBooking.id },
          data: {
            status: 'CONFIRMED',
            cancelledAt: null,
            cancelledReason: null,
            rescheduledFrom: finalOldBookingId,
          },
        });
      } else {
        newBooking = await tx.booking.create({
          data: {
            studentId: studentProfile.id,
            sessionId: newSessionId,
            status: 'CONFIRMED',
            rescheduledFrom: finalOldBookingId,
          },
        });
      }

      // c. Audit log
      await tx.rescheduleLog.create({
        data: {
          studentId: studentProfile.id,
          oldBookingId: finalOldBookingId,
          newBookingId: newBooking.id,
          oldSessionId: oldSession.id,
          newSessionId: newSessionId,
          wasLost: false,
        },
      });

      return newBooking.id;
    });
    await notifySessionRescheduled({
      studentId: studentProfile.id,
      subClassId: oldSession.schedule.subClassId,
      oldSessionId: oldSession.id,
      newSessionId,
      wasLost: false,
    });
    revalidatePath('/my-classes');
    return { success: true, newBookingId, wasLost: false };
  } catch (err: any) {
    console.error('[performReschedule]', err);
    return { success: false, error: err?.message ?? 'Reschedule failed' };
  }
}
