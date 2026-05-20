import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function PrePrimaryBalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'Pre-Primary Ballet', ar: 'باليه ما قبل الأولية' }}
      enrollmentQuery={{ q: 'Pre-Primary Ballet' }}
      description={{
        en: 'An introductory ballet programme for young children — building fundamental movement skills, body awareness, and a love for dance.',
        ar: 'برنامج باليه تمهيدي للأطفال الصغار — يبني مهارات الحركة الأساسية والوعي بالجسم وحب الرقص.',
      }}
      highlights={[
        { en: 'Basic movement and spatial awareness', ar: 'الحركة الأساسية والوعي بالفضاء' },
        { en: 'Simple ballet positions and steps', ar: 'وضعيات وخطوات باليه بسيطة' },
        { en: 'Rhythm, coordination, and listening skills', ar: 'إيقاع وتناسق ومهارات الاستماع' },
      ]}
    />
  );
}
