import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function BalletPrivatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'Ballet Private Lesson', ar: 'درس باليه خاص' }}
      enrollmentQuery={{ q: 'Ballet Private lesson' }}
      description={{
        en: 'One-on-one ballet instruction tailored entirely to your level and goals — ideal for accelerated progress at any age.',
        ar: 'تعليم باليه فردي مصمم بالكامل وفق مستواك وأهدافك — مثالي للتقدم المتسارع في أي عمر.',
      }}
      highlights={[
        { en: 'Personalised technique correction', ar: 'تصحيح التقنية بشكل شخصي' },
        { en: 'Flexible scheduling and pace', ar: 'جدول ووتيرة مرنة' },
        { en: 'Goal-oriented curriculum', ar: 'منهج موجه نحو الأهداف' },
      ]}
    />
  );
}
