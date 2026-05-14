"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [totalStudents, workshopsThisMonth, upcomingSessions, activeClasses] =
    await Promise.all([
      prisma.studentProfile.count(),
      prisma.workshop.count({
        where: {
          isActive: true,
          eventDate: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      prisma.classSession.count({
        where: {
          status: "ACTIVE",
          sessionDate: { gte: now, lte: in7Days },
        },
      }),
      prisma.subClass.count({ where: { isActive: true } }),
    ]);

  return { totalStudents, workshopsThisMonth, upcomingSessions, activeClasses };
}

export async function getRecentBookings() {
  const bookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { firstName: true, lastName: true } },
      session: {
        include: {
          schedule: {
            include: {
              subClass: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  return bookings.map((b) => ({
    id: b.id,
    studentName: `${b.student.firstName} ${b.student.lastName}`,
    subClass: b.session.schedule.subClass.name,
    sessionDate: b.session.sessionDate,
    startTime: b.session.startTime,
    endTime: b.session.endTime,
    status: b.status,
  }));
}

export async function getUpcomingSessionsToday() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0);

  const sessions = await prisma.classSession.findMany({
    where: {
      status: "ACTIVE",
      sessionDate: { gte: todayStart, lt: tomorrowEnd },
    },
    orderBy: { sessionDatetime: "asc" },
    include: {
      schedule: {
        include: {
          subClass: { select: { name: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    subClass: s.schedule.subClass.name,
    teacher: `${s.schedule.teacher.firstName} ${s.schedule.teacher.lastName}`,
    startTime: s.startTime,
    endTime: s.endTime,
    sessionDate: s.sessionDate,
  }));
}

export async function getLatestSignups() {
  const users = await prisma.user.findMany({
    where: { role: "STUDENT" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      studentProfile: { select: { firstName: true, lastName: true } },
    },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.studentProfile
      ? `${u.studentProfile.firstName} ${u.studentProfile.lastName}`
      : "—",
    email: u.email,
    phone: u.phone ?? "—",
    createdAt: u.createdAt,
  }));
}

export async function getLatestTickets() {
  const tickets = await prisma.supportTicket.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
          studentProfile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return tickets.map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt,
    userName: t.user.studentProfile
      ? `${t.user.studentProfile.firstName} ${t.user.studentProfile.lastName}`
      : t.user.email,
  }));
}
