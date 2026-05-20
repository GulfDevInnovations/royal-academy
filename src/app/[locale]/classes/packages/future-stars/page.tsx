import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function FutureStarsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'Future Stars Package', ar: 'باقة نجوم المستقبل' }}
      enrollmentQuery={{ q: 'Future Stars Package' }}
      description={{
        en: 'An intensive package for aspiring performers — combining advanced classes across dance, music, and arts to nurture the next generation of artists.',
        ar: 'باقة مكثفة للطموحين في الأداء — تجمع حصصًا متقدمة في الرقص والموسيقى والفنون لرعاية الجيل القادم من الفنانين.',
      }}
      highlights={[
        { en: 'Advanced multi-discipline training', ar: 'تدريب متقدم متعدد التخصصات' },
        { en: 'Performance and stage preparation', ar: 'الأداء والتحضير للمسرح' },
        { en: 'Mentorship and artistic growth', ar: 'الإرشاد والنمو الفني' },
      ]}
    />
  );
}
