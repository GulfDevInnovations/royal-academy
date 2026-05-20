import MusicSubclassPage from '@/components/MusicSubclassPage';

export default async function UkulelePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <MusicSubclassPage
      locale={locale}
      title={{ en: 'Ukulele', ar: 'الأوكليلي' }}
      enrollmentQuery={{ q: 'Ukulele' }}
      description={{
        en: 'A joyful introduction to the ukulele — learning chords, strumming patterns, and songs in a fun and accessible way for all ages.',
        ar: 'مقدمة بهيجة للأوكليلي — تعلّم الأوتار وأنماط العزف والأغاني بطريقة ممتعة وميسّرة لجميع الأعمار.',
      }}
      highlights={[
        { en: 'Core chord shapes and transitions', ar: 'أشكال الأوتار الأساسية والانتقالات' },
        { en: 'Strumming and fingerpicking patterns', ar: 'أنماط الضرب والعزف بالأصابع' },
        { en: 'Songs and repertoire building', ar: 'الأغاني وبناء التشكيلة الموسيقية' },
      ]}
      img="/images/music-hero.jpg"
    />
  );
}
