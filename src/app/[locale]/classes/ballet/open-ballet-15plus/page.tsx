import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function OpenBallet15PlusPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'Ballet Open Class (15+)', ar: 'باليه مفتوح (+١٥ سنة)' }}
      enrollmentQuery={{ q: 'Ballet Open class +15' }}
      description={{
        en: 'Open ballet for students 15 and above — exploring advanced technique, artistry, and the full vocabulary of classical ballet.',
        ar: 'باليه مفتوح للطلاب من سن ١٥ فأكثر — استكشاف التقنية المتقدمة والفنون وكامل مفردات الباليه الكلاسيكي.',
      }}
      highlights={[
        { en: 'Advanced barre and centre combinations', ar: 'تركيبات متقدمة على البار وفي الوسط' },
        { en: 'Pointe preparation and variations', ar: 'الإعداد للبوانت والتنويعات' },
        { en: 'Artistic expression and performance', ar: 'التعبير الفني والأداء' },
      ]}
    />
  );
}
