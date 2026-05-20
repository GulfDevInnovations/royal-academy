import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';

export default async function IyengarYogaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Aligned — Iyengar Inspired Hatha Yoga', ar: 'محاذاة — يوغا هاتا مستوحاة من إيينغار' }}
      enrollmentQuery={{ q: 'Aligned - Iyengar Inspired Hatha Yoga' }}
      description={{
        en: 'Precision-based Hatha yoga inspired by the Iyengar method — emphasising alignment, structural integrity, and mindful breathing in every pose.',
        ar: 'يوغا هاتا دقيقة مستوحاة من أسلوب إيينغار — تؤكد على المحاذاة والسلامة الهيكلية والتنفس الواعي في كل وضعية.',
      }}
      highlights={[
        { en: 'Precise postural alignment', ar: 'محاذاة دقيقة للوضعيات' },
        { en: 'Prop-supported poses for all bodies', ar: 'وضعيات مدعومة بالأدوات لجميع الأجسام' },
        { en: 'Breath awareness and mindfulness', ar: 'الوعي بالتنفس واليقظة الذهنية' },
      ]}
      imgSrc="/images/dance/iyengar-yoga.jpg"
    />
  );
}
