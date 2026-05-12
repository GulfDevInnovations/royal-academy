import { prisma } from '@/lib/prisma';
import NewsletterClient from './_components/NewsletterClient';

export const dynamic = 'force-dynamic';

export default async function NewsletterAdminPage() {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: 'desc' },
  });

  const serialized = subscribers.map((s) => ({
    ...s,
    subscribedAt: s.subscribedAt.toISOString(),
    unsubscribedAt: s.unsubscribedAt?.toISOString() ?? null,
  }));

  return <NewsletterClient initialItems={serialized} />;
}
