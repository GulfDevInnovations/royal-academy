'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function StretchingPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Stretching & Mobility', ar: 'التمدد والمرونة الحركية' }}
      enrollmentQuery={{ q: 'Stretching & mobility' }}
      description={{
        en: 'Dedicated flexibility and mobility training — improving range of motion, reducing tightness, and supporting overall physical wellbeing.',
        ar: 'تدريب مخصص للمرونة والحركية — تحسين نطاق الحركة وتقليل التصلب ودعم الصحة الجسدية العامة.',
      }}
      highlights={[
        { en: 'Full-body flexibility routines', ar: 'روتينات مرونة الجسم كاملة' },
        { en: 'Joint mobility and injury prevention', ar: 'مرونة المفاصل والوقاية من الإصابات' },
        { en: 'Assisted and active stretching techniques', ar: 'تقنيات التمدد المساعدة والنشطة' },
      ]}
      imgSrc="/images/dance/stretching-mobility.jpg"
    />
  );
}
