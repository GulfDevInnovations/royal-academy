import MusicSubclassPage from '@/components/MusicSubclassPage';

export default async function AccordionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <MusicSubclassPage
      locale={locale}
      title={{ en: 'Accordion', ar: 'الأكورديون' }}
      enrollmentQuery={{ q: 'Accordion' }}
      description={{
        en: 'Learn the accordion from the ground up — mastering bellows control, both hands independently, and a range of musical styles.',
        ar: 'تعلّم الأكورديون من الصفر — إتقان التحكم في المنفاخ، واليدين بشكل مستقل، ومجموعة من الأساليب الموسيقية.',
      }}
      highlights={[
        { en: 'Bellows control and breathing', ar: 'التحكم في المنفاخ والتنفس' },
        { en: 'Right-hand melody and left-hand bass', ar: 'لحن اليد اليمنى وباس اليد اليسرى' },
        { en: 'Folk, classical, and world music styles', ar: 'أساليب الفولك والكلاسيك والموسيقى العالمية' },
      ]}
      img="/images/music-hero.jpg"
    />
  );
}
