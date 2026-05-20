import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';

export default async function RestorativeYogaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Restorative Yoga & Nervous System Balance', ar: 'يوغا التعافي وتوازن الجهاز العصبي' }}
      enrollmentQuery={{ q: 'Restorative Yoga & Nervous System Balance' }}
      description={{
        en: 'A deeply supportive yoga practice using long-held poses and props to activate the parasympathetic nervous system and restore deep rest.',
        ar: 'ممارسة يوغا داعمة بعمق تستخدم وضعيات مطولة وأدوات مساعدة لتفعيل الجهاز العصبي السمبثاوي واستعادة الراحة العميقة.',
      }}
      highlights={[
        { en: 'Long-held supported postures', ar: 'وضعيات مطولة ومدعومة' },
        { en: 'Parasympathetic activation and deep rest', ar: 'تفعيل السمبثاوي والراحة العميقة' },
        { en: 'Guided relaxation and breathwork', ar: 'استرخاء موجه وتمارين التنفس' },
      ]}
      imgSrc="/images/dance/restorative-yoga.jpg"
    />
  );
}
