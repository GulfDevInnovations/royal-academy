'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function AerialHoopPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Aerial Hoop' }}
      enrollmentQuery={{ q: 'Aerial Hoop' }}
      description={{
        en: 'Aerial hoop sessions focused on strength, control, and graceful transitions — with progressions designed for safe skill-building.',
      }}
      highlights={[
        { en: 'Grip, core, and upper-body strength' },
        { en: 'Spins, poses, and transitions' },
        { en: 'Flexibility and body alignment' },
        { en: 'Safe technique + conditioning drills' },
      ]}
      imgSrc="/images/dance/aerial-hoop.jpg"
    />
  );
}
