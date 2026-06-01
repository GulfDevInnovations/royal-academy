'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function VisualArtsWorkshopsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Visual Arts Workshops', ar: 'ورش الفنون البصرية' }}
      enrollmentQuery={{ q: 'Visual Arts Workshops' }}
      description={{
        en: 'Specialized visual arts workshops for children and teens — exploring painting, mixed media, and creative expression across disciplines.',
        ar: 'ورش فنون بصرية متخصصة للأطفال والمراهقين — تستكشف الرسم والوسائط المختلطة والتعبير الإبداعي عبر التخصصات.',
      }}
      highlights={[
        { en: 'Acrylic, watercolor, and oil painting', ar: 'الأكريليك والألوان المائية والزيتية' },
        { en: 'Experimental and mixed-media techniques', ar: 'التقنيات التجريبية ومتعددة الوسائط' },
        { en: 'Age-appropriate curriculum for kids and teens', ar: 'منهج مناسب للأعمار للأطفال والمراهقين' },
      ]}
      imgSrc="/images/watercolorsample.png"
    />
  );
}
