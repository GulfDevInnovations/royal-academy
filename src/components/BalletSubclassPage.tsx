import Image from 'next/image';
import Link from 'next/link';

type LocalizedText = {
  en: string;
  ar?: string;
};

function pickText(locale: string, value: LocalizedText) {
  const isArabic = locale === 'ar';
  return isArabic ? (value.ar ?? value.en) : value.en;
}

export default function BalletSubclassPage({
  locale,
  title,
  description,
  highlights,
  img,
  enrollmentQuery,
}: {
  locale: string;
  title: LocalizedText;
  description: LocalizedText;
  highlights: LocalizedText[];
  img?: string;
  enrollmentQuery?: {
    q?: string;
  };
}) {
  const isArabic = locale === 'ar';
  const titleText = pickText(locale, title);
  const descriptionText = pickText(locale, description);

  const enrollmentHref = (() => {
    const params = new URLSearchParams();
    params.set('dept', 'ballet');
    if (enrollmentQuery?.q) params.set('q', enrollmentQuery.q);
    const queryString = params.toString();
    return queryString
      ? `/${locale}/enrollment?${queryString}`
      : `/${locale}/enrollment`;
  })();
  const contactHref = `/${locale}/contact`;
  const rootHref = `/${locale}`;

  return (
    <main
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen bg-royal-purple"
    >
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={img ?? '/images/ballet-hero.jpg'}
            alt="Ballet"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-linear-to-t from-royal-purple/90 via-royal-purple/40 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pb-14 pt-24 sm:px-6 sm:pb-16 sm:pt-28 md:pb-20 md:pt-32">
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-royal-gold/75">
              {isArabic ? 'الباليه' : 'Ballet'}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-royal-cream sm:text-4xl md:text-5xl">
              {titleText}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-royal-cream/80 sm:text-[15px] sm:leading-8">
              {descriptionText}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={enrollmentHref}
                className="liquid-glass shimmer inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-royal-cream/85 transition-transform duration-300 hover:scale-[1.03] sm:w-auto sm:py-2.5"
              >
                {isArabic ? 'التسجيل' : 'Enrollment'}
              </Link>
              <Link
                href={contactHref}
                className="liquid-glass shimmer inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-royal-cream/85 transition-transform duration-300 hover:scale-[1.03] sm:w-auto sm:py-2.5"
              >
                {isArabic ? 'تواصل معنا' : 'Contact'}
              </Link>
              <Link
                href={rootHref}
                className="mt-1 w-full text-center text-[11px] font-medium uppercase tracking-[0.22em] text-royal-gold/70 underline decoration-royal-gold/40 underline-offset-4 hover:text-royal-gold sm:mt-0 sm:w-auto sm:text-left"
              >
                {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch">
          <div className="liquid-glass h-full rounded-2xl border border-royal-cream/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-gold/70">
              {isArabic ? 'نظرة عامة' : 'Overview'}
            </p>
            <p className="mt-3 text-sm leading-7 text-royal-cream/85 sm:text-[15px]">
              {isArabic
                ? 'تدريب باليه راقٍ يطوّر الوقفة، المرونة، والقوة — مع مسار مناسب لكل مستوى.'
                : 'Refined ballet training that develops posture, flexibility, and strength — with a path for every level.'}
            </p>
          </div>

          <div className="liquid-glass h-full rounded-2xl border border-royal-cream/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-gold/70">
              {isArabic ? 'ما ستتعلمه' : 'What You’ll Learn'}
            </p>
            <ul className="mt-4 space-y-3 text-sm text-royal-cream/85">
              {highlights.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="mt-1.5 h-1 w-1 rotate-45 bg-royal-gold/70" />
                  <span>{pickText(locale, item)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="liquid-glass h-full rounded-2xl border border-royal-cream/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-gold/70">
              {isArabic ? 'الحجز' : 'Booking'}
            </p>
            <p className="mt-3 text-sm leading-7 text-royal-cream/85 sm:text-[15px]">
              {isArabic
                ? 'اختر الوقت المناسب لك من صفحة الحجز، وسيقوم فريقنا بتأكيد تفاصيل الحصة.'
                : 'Choose a suitable time from the enrollment page and our team will confirm your class details.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
