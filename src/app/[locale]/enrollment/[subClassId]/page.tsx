// src/app/[locale]/enrollment/[subClassId]/page.tsx
import { notFound } from 'next/navigation';
import { getSubClassDetail, getProgramDetail } from '@/lib/actions/classes';
import { SubClassDetailClient } from '../_components/SubClassDetailClient';
import { SubClassPageEmbed } from '../_components/SubClassPageEmbed';

export default async function SubClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ subClassId: string; locale: string }>;
  searchParams: Promise<{ program?: string }>;
}) {
  const { subClassId } = await params;
  const { program: programId } = await searchParams;

  const [subClass, program] = await Promise.all([
    getSubClassDetail(subClassId),
    programId ? getProgramDetail(programId) : Promise.resolve(null),
  ]);

  if (!subClass) notFound();

  return (
    <>
      <SubClassDetailClient subClass={subClass} program={program ?? undefined} />
      <SubClassPageEmbed
        className={subClass.class.name}
        subClassName={program?.name ?? subClass.name}
      />
    </>
  );
}
