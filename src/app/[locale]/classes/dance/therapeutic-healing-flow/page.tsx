import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';

export default async function TherapeuticHealingFlowPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Therapeutic Healing Flow', ar: 'التدفق العلاجي الشافي' }}
      enrollmentQuery={{ q: 'Therapeutic Healing Flow' }}
      description={{
        en: 'A gentle, mindful movement practice combining somatic awareness and flowing sequences — designed to restore balance and ease tension.',
        ar: 'ممارسة حركة لطيفة وواعية تجمع بين الوعي الجسدي والتسلسلات المتدفقة — مصممة لاستعادة التوازن وتخفيف التوتر.',
      }}
      highlights={[
        { en: 'Somatic movement and body listening', ar: 'الحركة الجسدية والاستماع للجسم' },
        { en: 'Breath-led flowing sequences', ar: 'تسلسلات متدفقة بقيادة التنفس' },
        { en: 'Stress release and nervous system calm', ar: 'تحرير الإجهاد وتهدئة الجهاز العصبي' },
      ]}
      imgSrc="/images/dance/therapeutic-healing-flow.jpg"
    />
  );
}
