'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function KidsGymnasticsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Kids Gymnastics', ar: 'جمباز الأطفال' }}
      enrollmentQuery={{ q: 'Kids Gymnastics' }}
      description={{
        en: 'Gymnastics classes that build strength, flexibility, and coordination — with progressions for beginners through advanced students.',
        ar: 'حصص جمباز تبني القوة والمرونة والتنسيق — مع تقدم تدريجي للمبتدئين وحتى الطلاب المتقدمين.',
      }}
      highlights={[
        { en: 'Rolls, cartwheels, and handstands', ar: 'لفات وعجلات ووقوف على اليدين' },
        { en: 'Core strength and body control', ar: 'قوة الجذع والتحكم في الجسم' },
        { en: 'Balance, agility, and flexibility', ar: 'توازن ورشاقة ومرونة' },
      ]}
      imgSrc="/images/dance/gymnastics.jpg"
    />
  );
}
