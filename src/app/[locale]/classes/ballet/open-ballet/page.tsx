import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function OpenBalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'Open Ballet', ar: 'باليه مفتوح' }}
      enrollmentQuery={{ q: 'Open Ballet' }}
      description={{
        en: 'A welcoming ballet class for all levels — refine fundamentals, improve mobility, and enjoy elegant movement.',
        ar: 'صف باليه مرحّب لجميع المستويات — لتحسين الأساسيات والمرونة والاستمتاع بحركة أنيقة.',
      }}
      highlights={[
        {
          en: 'Fundamentals with level-based options',
          ar: 'أساسيات مع خيارات حسب المستوى',
        },
        { en: 'Strength, mobility, and control', ar: 'قوة ومرونة وتحكم' },
        {
          en: 'Center work and short combinations',
          ar: 'تمارين في الوسط وتركيبات قصيرة',
        },
      ]}
      img="/images/dance/open-ballet.jpg"
    />
  );
}
