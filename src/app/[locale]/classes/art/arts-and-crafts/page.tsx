'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function ArtsAndCraftsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Arts & Crafts', ar: 'الفنون والأشغال اليدوية' }}
      enrollmentQuery={{ q: 'Arts & Crafts' }}
      description={{
        en: 'Hands-on arts and crafts sessions exploring a wide range of materials and techniques — creative and fun for all ages.',
        ar: 'جلسات فنون وأشغال يدوية عملية تستكشف مجموعة واسعة من المواد والتقنيات — إبداعية وممتعة لجميع الأعمار.',
      }}
      highlights={[
        { en: 'Paper art, collage, and mixed media', ar: 'فن الورق والكولاج والوسائط المختلطة' },
        { en: 'Handmade cards and decorative crafts', ar: 'البطاقات اليدوية والحرف الزخرفية' },
        { en: 'Seasonal projects and themed workshops', ar: 'مشاريع موسمية وورش عمل موضوعية' },
      ]}
      imgSrc="/images/arts&crafts.png"
    />
  );
}
