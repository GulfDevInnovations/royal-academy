import MusicSubclassPage from '@/components/MusicSubclassPage';

export default async function SongwritingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <MusicSubclassPage
      locale={locale}
      title={{ en: 'Song Writing', ar: 'كتابة الأغاني' }}
      enrollmentQuery={{ q: 'Song Writing' }}
      description={{
        en: 'Learn the craft of songwriting — from melody and lyrics to song structure and arrangement — and bring your musical ideas to life.',
        ar: 'تعلّم فن كتابة الأغاني — من اللحن والكلمات إلى بنية الأغنية والتوزيع الموسيقي — وأحيِ أفكارك الموسيقية.',
      }}
      highlights={[
        { en: 'Melody writing and hooks', ar: 'كتابة اللحن والخطافات الموسيقية' },
        { en: 'Lyric writing and storytelling', ar: 'كتابة الكلمات وسرد القصص' },
        { en: 'Song structure and arrangement basics', ar: 'أساسيات بنية الأغنية والتوزيع' },
      ]}
      img="/images/music-hero.jpg"
    />
  );
}
