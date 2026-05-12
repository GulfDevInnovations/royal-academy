// src/app/[locale]/enrollment/[subClassId]/page.tsx
import { notFound } from 'next/navigation';
import { getSubClassDetail } from '@/lib/actions/classes';
import { SubClassDetailClient } from '../_components/SubClassDetailClient';
import { SubClassPageEmbed } from '../_components/SubClassPageEmbed';

export default async function SubClassDetailPage({
  params,
}: {
  params: Promise<{ subClassId: string; locale: string }>;
}) {
  const { subClassId } = await params;
  const subClass = await getSubClassDetail(subClassId);

  if (!subClass) notFound();

  return (
    <>
      <SubClassDetailClient subClass={subClass} />
      <SubClassPageEmbed
        className={subClass.class.name}
        subClassName={subClass.name}
      />
    </>
  );
}
