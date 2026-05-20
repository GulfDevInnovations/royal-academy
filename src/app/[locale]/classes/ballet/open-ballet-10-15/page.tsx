import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function OpenBallet10To15Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'Ballet Open Class (10–15 Yrs)', ar: 'باليه مفتوح (١٠–١٥ سنة)' }}
      enrollmentQuery={{ q: 'Ballet Open class 10 to15 Yrs' }}
      description={{
        en: 'Open ballet for students aged 10–15 — focused on technique refinement, musicality, and building expressive stage presence.',
        ar: 'باليه مفتوح للطلاب من ١٠ إلى ١٥ عامًا — يركز على تحسين التقنية والموسيقية وبناء الحضور المسرحي.',
      }}
      highlights={[
        { en: 'Barre and centre work', ar: 'تمارين الباريه والوسط' },
        { en: 'Turns, jumps, and adagio', ar: 'لفات وقفزات وأداجيو' },
        { en: 'Musicality and performance quality', ar: 'الموسيقية وجودة الأداء' },
      ]}
    />
  );
}
