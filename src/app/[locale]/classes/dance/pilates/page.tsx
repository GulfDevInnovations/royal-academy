import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';

export default async function PilatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'The Art of Pilates', ar: 'فن البيلاتس' }}
      enrollmentQuery={{ q: 'The Art Of Pilates' }}
      description={{
        en: 'Classical Pilates focusing on core strength, postural alignment, and controlled movement — building a strong and balanced body from the inside out.',
        ar: 'بيلاتس كلاسيكي يركز على قوة الجذع ومحاذاة الوضعية والحركة المتحكم بها — يبني جسمًا قويًا ومتوازنًا من الداخل للخارج.',
      }}
      highlights={[
        { en: 'Core stability and deep muscle activation', ar: 'استقرار الجذع وتفعيل العضلات العميقة' },
        { en: 'Spinal health and postural correction', ar: 'صحة العمود الفقري وتصحيح الوضعية' },
        { en: 'Breath coordination with movement', ar: 'تنسيق التنفس مع الحركة' },
      ]}
      imgSrc="/images/dance/pilates.jpg"
    />
  );
}
