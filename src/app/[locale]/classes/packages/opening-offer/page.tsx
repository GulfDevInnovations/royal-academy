import BalletSubclassPage from '@/components/BalletSubclassPage';

export default async function OpeningOfferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <BalletSubclassPage
      locale={locale}
      title={{ en: 'Opening Offer', ar: 'عرض الافتتاح' }}
      enrollmentQuery={{ q: 'Opening Offer' }}
      description={{
        en: 'A special introductory offer to welcome new students to Royal Academy — experience our classes at an exclusive rate and find your passion.',
        ar: 'عرض تعريفي خاص لاستقبال الطلاب الجدد في الأكاديمية الملكية — جرّب حصصنا بسعر حصري واكتشف شغفك.',
      }}
      highlights={[
        { en: 'Exclusive introductory pricing', ar: 'أسعار تعريفية حصرية' },
        { en: 'Access across all disciplines', ar: 'وصول لجميع التخصصات' },
        { en: 'Perfect first step into the academy', ar: 'الخطوة الأولى المثالية في الأكاديمية' },
      ]}
    />
  );
}
