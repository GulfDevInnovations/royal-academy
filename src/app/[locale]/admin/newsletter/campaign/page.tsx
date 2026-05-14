// src/app/[locale]/admin/newsletter/campaign/page.tsx

import { prisma } from '@/lib/prisma';
import CampaignClient from '../_components/CampainClient';

export const dynamic = 'force-dynamic';

export default async function CampaignPage() {
  const totalActive = await prisma.newsletterSubscriber.count({
    where: { status: 'active' },
  });

  const bySidebar = await prisma.newsletterSubscriber.count({
    where: { status: 'active', source: 'sidebar' },
  });

  const byFooter = await prisma.newsletterSubscriber.count({
    where: { status: 'active', source: 'footer' },
  });

  return <CampaignClient stats={{ totalActive, bySidebar, byFooter }} />;
}
