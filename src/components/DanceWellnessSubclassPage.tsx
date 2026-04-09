import Image from "next/image";
import Link from "next/link";

type LocalizedText = {
  en: string;
  ar?: string;
};

function pickText(locale: string, value: LocalizedText) {
  if (locale === "ar") return value.ar ?? value.en;
  return value.en;
}

export default function DanceWellnessSubclassPage({
  locale,
  title,
  description,
  highlights,
  imgSrc,
  reservationQuery,
}: {
  locale: string;
  title: LocalizedText;
  description: LocalizedText;
  highlights: LocalizedText[];
  imgSrc: string;
  reservationQuery?: {
    q?: string;
  };
}) {
  const isArabic = locale === "ar";
  const titleText = pickText(locale, title);
  const descriptionText = pickText(locale, description);

  const reservationHref = (() => {
    const params = new URLSearchParams();
    params.set("dept", "dance");
    if (reservationQuery?.q) params.set("q", reservationQuery.q);
    const queryString = params.toString();
    return queryString
      ? `/${locale}/reservation?${queryString}`
      : `/${locale}/reservation`;
  })();
  const contactHref = `/${locale}/contact`;
  const rootHref = `/${locale}`;

  return (
    <main dir={isArabic ? "rtl" : "ltr"} className="min-h-screen bg-royal-purple">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={imgSrc}
            alt={`${titleText} — Dance & Wellness`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-linear-to-t from-royal-purple/90 via-royal-purple/40 to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-24 pb-14 sm:px-6 sm:pt-28 sm:pb-16 md:pt-32 md:pb-20">
          <div className={isArabic ? "text-right" : "text-left"}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-royal-gold/75">
              {isArabic ? "الرقص والعافية" : "Dance & Wellness"}
            </p>
            <h1 className="mt-4 font-goudy text-4xl leading-[1.05] text-royal-cream sm:text-5xl md:text-6xl">
              {titleText}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-royal-cream/80 sm:text-base">
              {descriptionText}
            </p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={reservationHref}
                className="liquid-glass-gold shimmer inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] sm:w-auto sm:py-2.5"
              >
                {isArabic ? "التسجيل" : "Enrollment"}
              </Link>
              <Link
                href={contactHref}
                className="liquid-glass shimmer inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-royal-cream/85 transition-transform duration-300 hover:scale-[1.03] sm:w-auto sm:py-2.5"
              >
                {isArabic ? "تواصل معنا" : "Contact"}
              </Link>
              <Link
                href={rootHref}
                className="mt-1 w-full text-center text-[11px] font-medium uppercase tracking-[0.22em] text-royal-gold/70 underline decoration-royal-gold/40 underline-offset-4 hover:text-royal-gold sm:mt-0 sm:w-auto sm:text-left"
              >
                {isArabic ? "العودة للرئيسية" : "Back to Home"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch">
          <div className="liquid-glass h-full rounded-2xl border border-royal-cream/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-gold/70">
              {isArabic ? "نظرة عامة" : "Overview"}
            </p>
            <p className="mt-3 text-sm leading-7 text-royal-cream/85 sm:text-[15px]">
              {isArabic
                ? "جلسات تركز على التقنية، اللياقة، والإحساس بالحركة — مع مسارات تناسب جميع المستويات."
                : "Sessions focused on technique, fitness, and mindful movement — with pathways for all levels."}
            </p>
          </div>

          <div className="liquid-glass h-full rounded-2xl border border-royal-cream/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-gold/70">
              {isArabic ? "ماذا ستتعلم" : "What You'll Learn"}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-royal-cream/85 sm:text-[15px]">
              {highlights.map((item) => (
                <li key={item.en} className="flex items-start gap-2">
                  <span className="mt-1.75 h-1 w-1 rotate-45 bg-royal-gold/70" />
                  <span>{pickText(locale, item)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="liquid-glass h-full rounded-2xl border border-royal-cream/10 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-gold/70">
              {isArabic ? "الحجز" : "Booking"}
            </p>
            <p className="mt-3 text-sm leading-7 text-royal-cream/85 sm:text-[15px]">
              {isArabic
                ? "يمكنك حجز صف تجريبي أو اشتراك شهري من صفحة الحجز."
                : "You can book a trial class or monthly enrollment from the reservation page."}
            </p>
            <Link
              href={reservationHref}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-royal-gold/90 hover:text-royal-gold"
            >
              {isArabic ? "التسجيل" : "Enrollment"}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-royal-cream/10 pt-10">
          <p className="text-xs uppercase tracking-[0.28em] text-royal-gold/60">
            {isArabic ? "ملاحظة" : "Note"}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-royal-cream/70">
            {isArabic
              ? "سيتم تحديث تفاصيل المحتوى والمستويات والجدول قريباً."
              : "Class details, levels, and scheduling notes will be updated soon."}
          </p>
        </div>
      </section>
    </main>
  );
}
