"use server";

import { prisma } from "@/lib/prisma";
import { sendTicketReplyEmail } from "@/lib/emails/email";
import { dispatchSms } from "@/lib/sms/sms-dispatcher";
// ─────────────────────────────────────────────
// GET notifications for a logged-in user
// Only returns INAPP notifications
// ─────────────────────────────────────────────

export async function getMyNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
      type: "INAPP",
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id:          true,
      subject:     true,
      body:        true,
      imageUrl:    true,
      linkUrl:     true,
      readAt:      true,
      createdAt:   true,
    },
  });
}

// ─────────────────────────────────────────────
// MARK one notification as read
// ─────────────────────────────────────────────

export async function markNotificationRead(id: string, userId: string) {
  await prisma.notification.updateMany({
    where: { id, userId, readAt: null },
    data:  { readAt: new Date() },
  });
  return { success: true };
}

// ─────────────────────────────────────────────
// MARK ALL as read for a user
// ─────────────────────────────────────────────

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, type: "INAPP", readAt: null },
    data:  { readAt: new Date() },
  });
  return { success: true };
}

// ─────────────────────────────────────────────
// UNREAD COUNT — lightweight, for the badge
// ─────────────────────────────────────────────

export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: { userId, type: "INAPP", readAt: null },
  });
  return count;
}




export async function replyToTicket(
  ticketId: string,
  adminUserId: string,
  body: string,
  ticketOwnerUserId: string,   // ← pass ticket.user.id from TicketDetail
) {
  if (!body.trim()) return { error: "Reply cannot be empty." };

  // ── 1. Fetch the ticket owner's contact details ───────────────────────────
  const owner = await prisma.user.findUnique({
    where: { id: ticketOwnerUserId },
    select: {
      email: true,
      phone: true,
      studentProfile: { select: { firstName: true, lastName: true } },
      teacherProfile: { select: { firstName: true, lastName: true } },
    },
  });

  // ── 2. Fetch the ticket subject for the email/SMS copy ────────────────────
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { subject: true },
  });

  const ownerName = owner?.studentProfile
    ? `${owner.studentProfile.firstName} ${owner.studentProfile.lastName}`
    : owner?.teacherProfile
    ? `${owner.teacherProfile.firstName} ${owner.teacherProfile.lastName}`
    : "there";

  const ticketSubject = ticket?.subject ?? "Your support ticket";

  // ── 3. DB writes in a single transaction ─────────────────────────────────
  await prisma.$transaction([
    // Reply record
    prisma.ticketReply.create({
  data: {
    ticketId,
    userId: adminUserId,
    body: body.trim(),
  },
}),

    // Move ticket to IN_PROGRESS
    prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS", updatedAt: new Date() },
    }),

    // InApp notification — picked up by NotificationBell polling
    prisma.notification.create({
      data: {
        userId:  ticketOwnerUserId,
        type:    "INAPP",
        status:  "SENT",
        subject: "Support reply received",
        body:    body.trim().length > 120
          ? body.trim().slice(0, 117) + "…"
          : body.trim(),
        linkUrl: "/support",
        sentAt:  new Date(),
      },
    }),
  ]);

  // ── 4. Email (outside transaction — network call, non-blocking on failure) ─
  if (owner?.email) {
    const emailResult = await sendTicketReplyEmail({
      toEmail:       owner.email,
      toName:        ownerName,
      ticketSubject,
      replyBody:     body.trim(),
    });
    if (!emailResult.success) {
      // Log but don't fail the whole action — reply is already saved
      console.error("Ticket reply email failed:", emailResult.error);
    }
  }

  // ── 5. SMS (outside transaction — scaffolded, logs until provider is wired) ─
  if (owner?.phone) {
    const smsBody =
      `Royal Academy Support: Your ticket "${ticketSubject.slice(0, 40)}${ticketSubject.length > 40 ? "…" : ""}" has a new reply. ` +
      `Visit royalacademy.om/support to read it.`;

    const smsResult = await dispatchSms({ to: owner.phone, message: smsBody });
    if (!smsResult.success) {
      console.error("Ticket reply SMS failed:", smsResult.error);
    }
  }

  return { success: true };
}