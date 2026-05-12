'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function deleteSubscriber(
  id: string,
): Promise<{ error?: string }> {
  try {
    await prisma.newsletterSubscriber.delete({ where: { id } });
    revalidatePath('/admin/newsletter');
    return {};
  } catch {
    return { error: 'Failed to delete subscriber.' };
  }
}

export async function unsubscribeSubscriber(
  id: string,
): Promise<{ error?: string }> {
  try {
    await prisma.newsletterSubscriber.update({
      where: { id },
      data: { status: 'unsubscribed', unsubscribedAt: new Date() },
    });
    revalidatePath('/admin/newsletter');
    return {};
  } catch {
    return { error: 'Failed to unsubscribe.' };
  }
}

export async function reactivateSubscriber(
  id: string,
): Promise<{ error?: string }> {
  try {
    await prisma.newsletterSubscriber.update({
      where: { id },
      data: { status: 'active', unsubscribedAt: null },
    });
    revalidatePath('/admin/newsletter');
    return {};
  } catch {
    return { error: 'Failed to reactivate subscriber.' };
  }
}

export async function exportSubscribersCSV(): Promise<{
  csv?: string;
  error?: string;
}> {
  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: 'active' },
      orderBy: { subscribedAt: 'desc' },
    });

    const header = 'email,source,status,subscribedAt';
    const rows = subscribers.map(
      (s) =>
        `${s.email},${s.source},${s.status},${s.subscribedAt.toISOString()}`,
    );

    return { csv: [header, ...rows].join('\n') };
  } catch {
    return { error: 'Failed to export.' };
  }
}
