'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function ContemporaryDancePage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Contemporary Dance' }}
      enrollmentQuery={{ q: 'Contemporary Dance' }}
      description={{
        en: 'Contemporary dance sessions that build control, fluidity, and expression — with technique-focused progressions for every level.',
      }}
      highlights={[
        { en: 'Floorwork, flow, and body awareness' },
        { en: 'Strength, mobility, and alignment' },
        { en: 'Musicality and movement quality' },
        { en: 'Choreography and creative exploration' },
      ]}
      imgSrc="/images/dance/contemporary.jpg"
    />
  );
}
