import MusicSubclassPage from '@/components/MusicSubclassPage';

export default async function PianoEarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <MusicSubclassPage
      locale={locale}
      title={{ en: 'Piano — Ear Training', ar: 'بيانو — التدريب على الأذن' }}
      enrollmentQuery={{ q: 'Piano - Ear learning' }}
      description={{
        en: 'Piano learning through listening — developing the ability to play by ear, transcribe melodies, and build a strong musical inner sense.',
        ar: 'تعلّم البيانو عبر الاستماع — تطوير القدرة على العزف بالأذن ونسخ الألحان وبناء حس موسيقي داخلي قوي.',
      }}
      highlights={[
        { en: 'Interval and chord recognition', ar: 'التعرف على الفترات والأوتار' },
        { en: 'Melody transcription and playback', ar: 'نسخ الألحان وإعادة عزفها' },
        { en: 'Improvisation by ear', ar: 'الارتجال بالأذن' },
      ]}
      img="/images/music/piano-hero.jpg"
    />
  );
}
