'use client';

import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';
import { useParams } from 'next/navigation';

export default function JazzPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Jazz', ar: 'الجاز' }}
      enrollmentQuery={{ q: 'Jazz' }}
      description={{
        en: 'Jazz dance classes combining technique, style, and performance energy — building confidence and stage presence at every level.',
        ar: 'دروس رقص الجاز التي تجمع بين التقنية والأسلوب وطاقة الأداء — لبناء الثقة والحضور على المسرح في كل المستويات.',
      }}
      highlights={[
        { en: 'Isolations, turns, and jumps', ar: 'إيزولايشنز ودورانات وقفزات' },
        { en: 'Musicality and performance quality', ar: 'الموسيقية وجودة الأداء' },
        { en: 'Choreography and style development', ar: 'الكوريوغرافيا وتطوير الأسلوب' },
      ]}
      imgSrc="/images/dance/jazz.jpg"
    />
  );
}
