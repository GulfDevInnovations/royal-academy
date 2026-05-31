'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function DrawingPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Drawing', ar: 'الرسم' }}
      enrollmentQuery={{ q: 'Drawing' }}
      description={{
        en: 'Drawing classes covering pencil techniques, shading, perspective, and composition — for beginners to advanced students.',
        ar: 'دروس رسم تغطي تقنيات القلم والتظليل والمنظور والتكوين — للمبتدئين وحتى الطلاب المتقدمين.',
      }}
      highlights={[
        { en: 'Pencil basics and line control', ar: 'أساسيات الرصاص والتحكم في الخطوط' },
        { en: 'Shading, texture, and depth', ar: 'التظليل والملمس والعمق' },
        { en: 'Portrait, still life, and illustration', ar: 'البورتريه والطبيعة الصامتة والرسم التوضيحي' },
      ]}
      imgSrc="/images/acrylicsample.png"
    />
  );
}
