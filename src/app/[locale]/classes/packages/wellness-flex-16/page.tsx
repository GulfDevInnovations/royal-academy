import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function WellnessFlex16Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'Wellness Flex 16', ar: 'ويلنس فلكس ١٦' }}
      enrollmentQuery={{ q: 'Wellness Flex 16' }}
      description={{
        en: 'Our most comprehensive wellness package — 16 flexible sessions to deeply establish your wellbeing routine across all disciplines.',
        ar: 'باقتنا الصحية الأكثر شمولاً — ١٦ حصة مرنة لترسيخ روتين صحتك بعمق عبر جميع التخصصات.',
      }}
      highlights={[
        { en: '16 sessions across wellness disciplines', ar: '١٦ حصة عبر تخصصات الصحة' },
        { en: 'Maximum flexibility and variety', ar: 'أقصى مرونة وتنوع' },
        { en: 'Premium value for dedicated students', ar: 'قيمة ممتازة للطلاب المتفانين' },
      ]}
    />
  );
}
