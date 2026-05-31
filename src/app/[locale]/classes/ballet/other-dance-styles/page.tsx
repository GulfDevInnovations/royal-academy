'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function OtherDanceStylesPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Other Dance Styles', ar: 'أنماط رقص أخرى' }}
      enrollmentQuery={{ q: 'Other Dance Styles' }}
      description={{
        en: 'Explore a variety of dance disciplines beyond the core syllabus — from Latin rhythms to fusion styles and seasonal workshops.',
        ar: 'استكشف مجموعة متنوعة من فنون الرقص خارج المنهج الأساسي — من الإيقاعات اللاتينية إلى أساليب الفيوجن وورش العمل الموسمية.',
      }}
      highlights={[
        { en: 'Diverse styles and rhythms', ar: 'أساليب وإيقاعات متنوعة' },
        { en: 'Seasonal workshops and special classes', ar: 'ورش عمل موسمية وحصص خاصة' },
        { en: 'Open to all levels', ar: 'مفتوح لجميع المستويات' },
      ]}
      imgSrc="/images/dance/contemporary.jpg"
    />
  );
}
