import MusicSubclassPage from '@/components/MusicSubclassPage';

export default async function PianoFreelancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <MusicSubclassPage
      locale={locale}
      title={{ en: 'Piano — Freelance', ar: 'بيانو — حر' }}
      enrollmentQuery={{ q: 'Piano - Freelance' }}
      description={{
        en: 'Flexible piano sessions with a freelance instructor — tailored to your personal goals, repertoire, and pace.',
        ar: 'حصص بيانو مرنة مع مدرب حر — مصممة وفق أهدافك الشخصية وتشكيلتك الموسيقية وإيقاعك.',
      }}
      highlights={[
        { en: 'Custom repertoire selection', ar: 'اختيار تشكيلة موسيقية مخصصة' },
        { en: 'Technique and musicianship', ar: 'التقنية والمهارة الموسيقية' },
        { en: 'Flexible scheduling', ar: 'جدول زمني مرن' },
      ]}
      img="/images/music/piano-hero.jpg"
    />
  );
}
