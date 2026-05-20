import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function WellnessFlex8Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'Wellness Flex 8', ar: 'ويلنس فلكس ٨' }}
      enrollmentQuery={{ q: 'Wellness Flex 8' }}
      description={{
        en: 'A flexible 8-session wellness package — choose from our range of yoga, pilates, stretching, and mindful movement classes.',
        ar: 'باقة ويلنس مرنة من ٨ حصص — اختر من مجموعتنا من اليوغا والبيلاتس والتمدد وحصص الحركة الواعية.',
      }}
      highlights={[
        { en: '8 sessions across wellness disciplines', ar: '٨ حصص عبر تخصصات الصحة' },
        { en: 'Mix and match classes freely', ar: 'اختر حصصك بحرية' },
        { en: 'Valid across all wellness offerings', ar: 'صالح لجميع عروض الصحة' },
      ]}
    />
  );
}
