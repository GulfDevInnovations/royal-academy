'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function YogaPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Yoga', ar: 'يوغا' }}
      enrollmentQuery={{ q: 'Yoga' }}
      description={{
        en: 'Yoga classes blending breathwork, mindful movement, and relaxation — building strength, flexibility, and inner balance for all levels.',
        ar: 'دروس يوغا تمزج بين تقنيات التنفس والحركة الواعية والاسترخاء — لبناء القوة والمرونة والتوازن الداخلي لجميع المستويات.',
      }}
      highlights={[
        { en: 'Breath awareness and pranayama', ar: 'الوعي بالتنفس والبراناياما' },
        { en: 'Posture alignment and balance', ar: 'محاذاة الوضعية والتوازن' },
        { en: 'Stress relief and mindfulness', ar: 'تخفيف التوتر واليقظة الذهنية' },
      ]}
      imgSrc="/images/dance/iyengar-yoga.jpg"
    />
  );
}
