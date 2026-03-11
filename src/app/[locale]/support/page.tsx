// src/app/[locale]/support/page.tsx
import { getMyTickets } from "@/lib/actions/student-tickets";
import SupportClient from "./_components/SupportClient";

export default async function SupportPage() {
  const { data: tickets } = await getMyTickets();

  // Serialize dates to ISO strings for client component
  const serialized = tickets.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    replies: t.replies.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  }));

  return <SupportClient myTickets={serialized} />;
}
