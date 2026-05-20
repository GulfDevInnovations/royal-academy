import MusicSubclassPage from '@/components/MusicSubclassPage';

export default async function ElectricGuitarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <MusicSubclassPage
      locale={locale}
      title={{ en: 'Electronic Guitar', ar: 'الجيتار الكهربائي' }}
      enrollmentQuery={{ q: 'Electronic Guitar' }}
      description={{
        en: 'Electric guitar training covering techniques, tone shaping, and styles from rock and blues to metal and beyond.',
        ar: 'تدريب على الجيتار الكهربائي يشمل التقنيات وتشكيل الصوت والأساليب من الروك والبلوز إلى الميتال وما هو أبعد.',
      }}
      highlights={[
        { en: 'Riffs, solos, and power chords', ar: 'الريفات والسولو والأوتار القوية' },
        { en: 'Tone and effects pedal basics', ar: 'أساسيات الصوت وبيدالات التأثير' },
        { en: 'Genre styles: rock, blues, metal', ar: 'أساليب الأنواع: روك وبلوز وميتال' },
      ]}
      img="/images/guitar.png"
    />
  );
}
