import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';

export default async function GymnasticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Gymnastics', ar: 'الجمباز' }}
      enrollmentQuery={{ q: 'Gymnastics' }}
      description={{
        en: 'Gymnastics classes that build strength, flexibility, and coordination — with progressions for beginners through advanced students.',
        ar: 'حصص جمباز تبني القوة والمرونة والتنسيق — مع تقدم تدريجي للمبتدئين وحتى الطلاب المتقدمين.',
      }}
      highlights={[
        { en: 'Rolls, cartwheels, and handstands', ar: 'لفات وعجلات ووقوف على اليدين' },
        { en: 'Core strength and body control', ar: 'قوة الجذع والتحكم في الجسم' },
        { en: 'Balance, agility, and flexibility', ar: 'توازن ورشاقة ومرونة' },
      ]}
      imgSrc="/images/dance/gymnastics.jpg"
    />
  );
}
