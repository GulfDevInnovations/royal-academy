import DanceWellnessSubclassPage from '@/components/DanceWellnessSubclassPage';

export default async function TaiChiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <DanceWellnessSubclassPage
      locale={locale}
      title={{ en: 'Tai Chi', ar: 'تاي تشي' }}
      enrollmentQuery={{ q: 'Tai Chi' }}
      description={{
        en: 'A moving meditation rooted in ancient Chinese tradition — Tai Chi cultivates balance, mental clarity, and graceful strength through slow, flowing forms.',
        ar: 'تأمل متحرك متجذر في التقاليد الصينية القديمة — يزرع تاي تشي التوازن والوضوح الذهني والقوة الرشيقة من خلال الأشكال البطيئة المتدفقة.',
      }}
      highlights={[
        { en: 'Slow, meditative movement sequences', ar: 'تسلسلات حركة بطيئة تأملية' },
        { en: 'Balance, coordination, and focus', ar: 'توازن وتنسيق وتركيز' },
        { en: 'Stress reduction and inner calm', ar: 'تقليل الإجهاد والهدوء الداخلي' },
      ]}
      imgSrc="/images/dance/tai-chi.jpg"
    />
  );
}
