"use server";

import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationStatus, TicketStatus, TicketPriority } from "@prisma/client";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type AudienceTarget =
  | "ALL_STUDENTS"
  | "ALL_TEACHERS"
  | "SUBCLASS_STUDENTS"   // students enrolled in a specific subclass this month
  | "UNPAID_STUDENTS"     // students with pending payment this month
  | "CUSTOM";             // manually selected user ids

// ─────────────────────────────────────────────
// AUDIENCE RESOLUTION
// Resolves a target to a list of userIds
// ─────────────────────────────────────────────

async function resolveAudience(
  target:     AudienceTarget,
  subClassId?: string,
  month?:     number,
  year?:      number,
  customIds?: string[],  // studentProfile ids or teacherProfile ids
): Promise<string[]> {
  switch (target) {
    case "ALL_STUDENTS": {
      const students = await prisma.studentProfile.findMany({
        where:  { user: { isActive: true } },
        select: { userId: true },
      });
      return students.map((s) => s.userId);
    }

    case "ALL_TEACHERS": {
      const teachers = await prisma.teacherProfile.findMany({
        where:  { isActive: true, userId: { not: null } },
        select: { userId: true },
      });
      return teachers.map((t) => t.userId!);
    }

    case "SUBCLASS_STUDENTS": {
      if (!subClassId || !month || !year) return [];
      const enrollments = await prisma.monthlyEnrollment.findMany({
        where: {
          subClassId,
          month,
          year,
          status: { in: ["CONFIRMED"] },
        },
        include: { student: { select: { userId: true } } },
      });
      return enrollments.map((e) => e.student.userId);
    }

    case "UNPAID_STUDENTS": {
      if (!month || !year) return [];
      const enrollments = await prisma.monthlyEnrollment.findMany({
        where: {
          month,
          year,
          status:  "CANCELLED",
          payment: { is: null },
        },
        include: { student: { select: { userId: true } } },
      });
      return enrollments.map((e) => e.student.userId);
    }

    case "CUSTOM": {
      return customIds ?? [];
    }

    default:
      return [];
  }
}

// ─────────────────────────────────────────────
// SEND / SCHEDULE NOTIFICATION
// ─────────────────────────────────────────────

export async function sendNotification(formData: FormData) {
  const target       = formData.get("target")       as AudienceTarget;
  const type         = formData.get("type")         as NotificationType;
  const subject      = (formData.get("subject")     as string | null) || null;
  const body         = (formData.get("body")        as string).trim();
  const subClassId   = (formData.get("subClassId")  as string | null) || undefined;
  const monthStr     = formData.get("month")        as string | null;
  const yearStr      = formData.get("year")         as string | null;
  const scheduledFor = formData.get("scheduledFor") as string | null;
  const customIdsRaw = formData.get("customIds")    as string | null;
  const customIds    = customIdsRaw ? customIdsRaw.split(",").filter(Boolean) : [];
  const imageUrl = (formData.get("imageUrl") as string | null) || null;
  const linkUrl  = (formData.get("linkUrl")  as string | null) || null;

  if (!body)   return { error: "Message body is required." };
  if (!target) return { error: "Audience target is required." };
  if (!type)   return { error: "Notification type is required." };

  const month = monthStr ? parseInt(monthStr) : undefined;
  const year  = yearStr  ? parseInt(yearStr)  : undefined;

  const userIds = await resolveAudience(target, subClassId, month, year, customIds);
  if (userIds.length === 0) {
    return { error: "No recipients found for the selected audience." };
  }

  const scheduledAt = scheduledFor ? new Date(scheduledFor) : null;
  const status: NotificationStatus = scheduledAt ? "PENDING" : "PENDING"; // worker handles actual sending

  await prisma.notification.createMany({
  data: userIds.map((userId) => ({
    userId,
    type,
    status,
    subject,
    body,
    imageUrl,   // ← add this
    linkUrl,    // ← add this
    scheduledFor: scheduledAt,
  })),
  skipDuplicates: false,
});

  return { success: true, count: userIds.length };
}

// ─────────────────────────────────────────────
// NOTIFICATION HISTORY
// ─────────────────────────────────────────────

export async function getNotifications(filters?: {
  status?: NotificationStatus;
  type?:   NotificationType;
  limit?:  number;
  offset?: number;
}) {
  return prisma.notification.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.type   ? { type:   filters.type   } : {}),
    },
    orderBy: { createdAt: "desc" },
    take:    filters?.limit  ?? 50,
    skip:    filters?.offset ?? 0,
    include: {
      user: {
        select: {
          id: true, email: true, phone: true, role: true,
          studentProfile: { select: { firstName: true, lastName: true } },
          teacherProfile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
}

export async function getNotificationStats() {
  const [total, pending, sent, failed] = await Promise.all([
    prisma.notification.count(),
    prisma.notification.count({ where: { status: "PENDING"  } }),
    prisma.notification.count({ where: { status: "SENT"     } }),
    prisma.notification.count({ where: { status: "FAILED"   } }),
  ]);
  return { total, pending, sent, failed };
}

// Retry a failed notification
export async function retryNotification(id: string) {
  const notif = await prisma.notification.findUnique({ where: { id } });
  if (!notif)                    return { error: "Notification not found." };
  if (notif.status !== "FAILED") return { error: "Only failed notifications can be retried." };

  await prisma.notification.update({
    where: { id },
    data:  { status: "PENDING", failReason: null },
  });
  return { success: true };
}

// Delete a notification
export async function deleteNotification(id: string) {
  await prisma.notification.delete({ where: { id } });
  return { success: true };
}

// ─────────────────────────────────────────────
// AUDIENCE OPTIONS — for the compose form
// ─────────────────────────────────────────────

export async function getAudienceOptions() {
  const [subClasses, students, teachers] = await Promise.all([
    prisma.subClass.findMany({
      where:   { isActive: true },
      orderBy: { name: "asc" },
      select:  {
        id: true, name: true,
        class: { select: { name: true } },
      },
    }),
    prisma.studentProfile.findMany({
      where:   { user: { isActive: true } },
      orderBy: { firstName: "asc" },
      select:  {
        id: true, firstName: true, lastName: true,
        userId: true,
        user: { select: { email: true, phone: true } },
      },
    }),
    prisma.teacherProfile.findMany({
      where:   { isActive: true },
      orderBy: { firstName: "asc" },
      select:  {
        id: true, firstName: true, lastName: true,
        userId: true,
        user: { select: { email: true, phone: true } },
      },
    }),
  ]);
  return { subClasses, students, teachers };
}

// ─────────────────────────────────────────────
// TICKETS
// ─────────────────────────────────────────────

export async function getTickets(filters?: {
  status?:   TicketStatus;
  priority?: TicketPriority;
}) {
  return prisma.supportTicket.findMany({
    where: {
      ...(filters?.status   ? { status:   filters.status   } : {}),
      ...(filters?.priority ? { priority: filters.priority } : {}),
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      user: {
        select: {
          id: true, email: true, phone: true, role: true,
          studentProfile: { select: { firstName: true, lastName: true } },
          teacherProfile: { select: { firstName: true, lastName: true } },
        },
      },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true, role: true,
              studentProfile: { select: { firstName: true, lastName: true } },
              teacherProfile: { select: { firstName: true, lastName: true } },
              adminProfile:   { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });
}

export async function updateTicketStatus(id: string, status: TicketStatus) {
  await prisma.supportTicket.update({ where: { id }, data: { status } });
  return { success: true };
}

export async function updateTicketPriority(id: string, priority: TicketPriority) {
  await prisma.supportTicket.update({ where: { id }, data: { priority } });
  return { success: true };
}


export async function getTicketStats() {
  const [open, inProgress, resolved] = await Promise.all([
    prisma.supportTicket.count({ where: { status: "OPEN"        } }),
    prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.supportTicket.count({ where: { status: "RESOLVED"    } }),
  ]);
  return { open, inProgress, resolved };
}
