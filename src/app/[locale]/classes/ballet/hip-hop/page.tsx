'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function HipHopPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Hip-Hop', ar: 'هيب هوب' }}
      enrollmentQuery={{ q: 'Hip-Hop' }}
      description={{
        en: 'High-energy hip-hop classes covering breaking, popping, locking, and freestyle — express yourself through movement and rhythm.',
        ar: 'حصص هيب هوب بطاقة عالية تغطي البريكينج والبوبينج واللوكينج والحر — عبّر عن نفسك من خلال الحركة والإيقاع.',
      }}
      highlights={[
        { en: 'Foundational groove and musicality', ar: 'الإيقاع الأساسي والموسيقية' },
        { en: 'Freestyle and self-expression', ar: 'الارتجال والتعبير الذاتي' },
        { en: 'Breaking, popping, and locking basics', ar: 'أساسيات البريكينج والبوبينج واللوكينج' },
      ]}
      imgSrc="/images/dance/hip-hop.jpg"
    />
  );
}
