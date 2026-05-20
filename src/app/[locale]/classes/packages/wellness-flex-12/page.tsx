import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function WellnessFlex12Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'Wellness Flex 12', ar: 'ويلنس فلكس ١٢' }}
      enrollmentQuery={{ q: 'Wellness Flex 12' }}
      description={{
        en: 'A flexible 12-session wellness package — greater value for those committed to building a consistent wellness practice.',
        ar: 'باقة ويلنس مرنة من ١٢ حصة — قيمة أكبر لمن يلتزم ببناء ممارسة صحية منتظمة.',
      }}
      highlights={[
        { en: '12 sessions across wellness disciplines', ar: '١٢ حصة عبر تخصصات الصحة' },
        { en: 'Mix and match classes freely', ar: 'اختر حصصك بحرية' },
        { en: 'Best value for regular practitioners', ar: 'أفضل قيمة للممارسين المنتظمين' },
      ]}
    />
  );
}
