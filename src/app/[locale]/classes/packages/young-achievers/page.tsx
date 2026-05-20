import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function YoungAchieversPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'A Young Achievers Package', ar: 'باقة المنجزون الصغار' }}
      enrollmentQuery={{ q: 'Ayoung Achievers Package' }}
      description={{
        en: 'A curated package designed for young students — combining multiple disciplines to inspire creativity, build confidence, and develop well-rounded talent.',
        ar: 'باقة مختارة مصممة للطلاب الصغار — تجمع تخصصات متعددة لإلهام الإبداع وبناء الثقة وتطوير الموهبة المتكاملة.',
      }}
      highlights={[
        { en: 'Multi-discipline exploration', ar: 'استكشاف متعدد التخصصات' },
        { en: 'Confidence and performance skills', ar: 'مهارات الثقة والأداء' },
        { en: 'Designed for young growing talent', ar: 'مصممة للمواهب الشابة النامية' },
      ]}
    />
  );
}
