import { getComplementaryRequests } from '@/lib/actions/admin/complementaryClass.actions';
import ComplementaryClassesClient from './_components/ComplementaryClassesClient';

export const dynamic = 'force-dynamic';

function serializeRequests(
  rows: Awaited<ReturnType<typeof getComplementaryRequests>>,
) {
  return rows.map((r) => ({
    ...r,
    dateOfBirth: r.dateOfBirth.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    preferredDays: (() => {
      try { return JSON.parse(r.preferredDays as string) as string[]; } catch { return []; }
    })(),
  }));
}

export type SerializedComplementaryRequest = ReturnType<typeof serializeRequests>[number];

export default async function ComplementaryClassesAdminPage() {
  const requests = await getComplementaryRequests();
  return <ComplementaryClassesClient initialRequests={serializeRequests(requests)} />;
}
