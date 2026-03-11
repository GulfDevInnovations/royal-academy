// src/app/[locale]/admin/notifications/page.tsx

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getNotifications,
  getNotificationStats,
  getAudienceOptions,
  getTickets,
  getTicketStats,
} from "@/lib/actions/admin/Notifications.actions";
import NotificationsClient from "./_components/NotificationsClient";

function serializeNotifications(
  notifs: Awaited<ReturnType<typeof getNotifications>>,
) {
  return notifs.map((n) => ({
    ...n,
    sentAt: n.sentAt ? n.sentAt.toISOString() : null,
    scheduledFor: n.scheduledFor ? n.scheduledFor.toISOString() : null,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));
}

function serializeTickets(tickets: Awaited<ReturnType<typeof getTickets>>) {
  return tickets.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    replies: t.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  }));
}

export type SerializedNotifications = ReturnType<typeof serializeNotifications>;
export type SerializedNotification = SerializedNotifications[number];
export type SerializedTickets = ReturnType<typeof serializeTickets>;
export type SerializedTicket = SerializedTickets[number];
export type AudienceOptions = Awaited<ReturnType<typeof getAudienceOptions>>;
export type NotifStats = Awaited<ReturnType<typeof getNotificationStats>>;
export type TicketStats = Awaited<ReturnType<typeof getTicketStats>>;

export default async function AdminNotificationsPage() {
  // Get the current admin's Prisma userId from Supabase session
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { prisma } = await import("@/lib/prisma");
  const adminUser = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true },
      })
    : null;

  const [notifications, notifStats, audienceOptions, tickets, ticketStats] =
    await Promise.all([
      getNotifications({ limit: 100 }),
      getNotificationStats(),
      getAudienceOptions(),
      getTickets(),
      getTicketStats(),
    ]);

  return (
    <NotificationsClient
      initialNotifications={serializeNotifications(notifications)}
      initialNotifStats={notifStats}
      audienceOptions={audienceOptions}
      initialTickets={serializeTickets(tickets)}
      initialTicketStats={ticketStats}
      adminUserId={adminUser?.id ?? ""}
    />
  );
}
