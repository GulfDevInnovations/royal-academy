"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

const KIDS_MOVEMENT_SLIDES = [
  "/images/babyballet.png",
  "/images/babyballet02.png",
  "/images/babyballet03.png",
  "/images/babygymnastics.png",
  "/images/babygymnastics02.png",
  "/images/babygymnastics03.png",
  "/images/contemporarydance.png",
  "/images/contemporarydance01.png",
  "/images/hiphop01.png",
  "/images/hiphop02.png",
  "/images/hiphop03.png",
  "/images/hiphop04.png",
  "/images/jazzdance.png",
  "/images/jazzdance01.png",
  "/images/jazzdance02.png",
] as const;

const SLIDE_INTERVAL_MS = 7_000;
const IMAGES_PER_VIEW = 3;
export default function KidsMovementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = "en" } = use(params);
  const isArabic = locale === "ar";

  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const imagesPerView = isMobile ? 1 : IMAGES_PER_VIEW;
  const slideGroups = useMemo(
    () =>
      Array.from(
        { length: Math.ceil(KIDS_MOVEMENT_SLIDES.length / imagesPerView) },
        (_, groupIndex) =>
          KIDS_MOVEMENT_SLIDES.slice(
            groupIndex * imagesPerView,
            groupIndex * imagesPerView + imagesPerView,
          ),
      ),
    [imagesPerView],
  );
  const content = isArabic
    ? {
        slideAltPrefix: "شريحة حركة الأطفال",
        dotsLabelPrefix: "الانتقال إلى مجموعة حركة الأطفال",
        enrollment: "التسجيل",
        cardTitle: "برامج حركة الأطفال",
        cardDescription:
          "مصممة لبناء التناسق، والإيقاع، والانضباط، والثقة من خلال تدرج مناسب لكل مرحلة عمرية.",
        cardBullets: [
          "بيبي باليه (الأعمار 3–5)",
          "بيبي جمباز (3.5–4 سنوات)",
          "الجمباز للأطفال (4–6 سنوات)",
          "أساسيات الجمباز (6–8 سنوات)",
          "جونيور جاز دانس (8–16 سنة)",
          "الرقص المعاصر (8–16 سنة)",
          "هيب هوب (8–16 سنة)",
        ],
        cardFooter:
          "تركز هذه البرامج على المهارات الحركية الأساسية، والإحساس الموسيقي، والمرونة، والحركة التعبيرية ضمن بيئة منظمة وداعمة.",
      }
    : {
        slideAltPrefix: "Kids movement slide",
        dotsLabelPrefix: "Go to kids movement group",
        enrollment: "Enrollment",
        cardTitle: "Children’s Movement Programs",
        cardDescription:
          "Designed to build coordination, rhythm, discipline, and confidence through age-appropriate progression.",
        cardBullets: [
          "Baby Ballet (Ages 3–5)",
          "Baby Gymnastics (3.5–4 yrs)",
          "Gymnastics for Kids (4–6 yrs)",
          "Basics of Gymnastics (6–8 yrs)",
          "Junior Jazz Dance (8–16 yrs)",
          "Contemporary Dance (8–16 yrs)",
          "Hip-Hop (8–16 yrs)",
        ],
        cardFooter:
          "These programs focus on foundational motor skills, musicality, flexibility, and expressive movement within a structured and supportive environment.",
      };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slideGroups.length);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [slideGroups.length]);

  useEffect(() => {
    setActiveSlide((current) => current % slideGroups.length);
  }, [slideGroups.length]);

  const previousLabel = isArabic ? "السابق" : "Previous";
  const nextLabel = isArabic ? "التالي" : "Next";
  const totalGroups = slideGroups.length;
  const goPrevious = () => {
    setActiveSlide((current) => (current - 1 + totalGroups) % totalGroups);
  };
  const goNext = () => {
    setActiveSlide((current) => (current + 1) % totalGroups);
  };

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
       className="min-h-screen pt-20 md:pt-30 bg-royal-purple"
      onWheelCapture={(event) => event.stopPropagation()}
      onTouchMoveCapture={(event) => event.stopPropagation()}
    >
      <section className="relative h-[44vh] min-h-88 overflow-hidden">
        <div className="absolute inset-0">
          {slideGroups.map((group, index) => (
            <div
              key={`kids-movement-group-${index}`}
              className={`absolute inset-0 transition-opacity duration-1400 ${
                index === activeSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <div
                className={`grid h-full px-4 py-10 sm:px-6 md:px-8 ${
                  isMobile
                    ? "mx-auto max-w-88 grid-cols-1 gap-3"
                    : "mx-auto max-w-6xl grid-cols-3 gap-3"
                }`}
              >
                {group.map((slide, imageIndex) => (
                  <div
                    key={slide}
                    className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm"
                  >
                    <Image
                      src={slide}
                      alt={`${content.slideAltPrefix} ${index * imagesPerView + imageIndex + 1}`}
                      fill
                      priority={index === 0}
                      className="object-contain"
                      sizes={isMobile ? "100vw" : "33vw"}
                    />
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.22)_100%)]" />
            </div>
          ))}

          <div className="absolute inset-0 bg-black/15" />
        </div>

        <div
          dir="ltr"
          className="absolute left-1/2 top-75 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur-sm md:top-0"
        >
          <button
            type="button"
            onClick={goPrevious}
            aria-label={previousLabel}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/10 text-royal-cream/80 transition hover:bg-black/20 hover:text-royal-cream"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          {slideGroups.map((_, index) => (
            <button
              key={`kids-movement-group-dot-${index}`}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`${content.dotsLabelPrefix} ${index + 1}`}
              className={`h-2.5 w-2.5 rounded-full border border-white/30 transition ${
                index === activeSlide ? "bg-white" : "bg-white/25"
              }`}
            />
          ))}
          <button
            type="button"
            onClick={goNext}
            aria-label={nextLabel}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/10 text-royal-cream/80 transition hover:bg-black/20 hover:text-royal-cream"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-10 sm:px-6">
        <div className={isArabic ? "text-right" : "text-left"}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-royal-gold/75">
            {isArabic ? "الرقص والعافية" : "Dance & Wellness"}
          </p>
          <h1 className="mt-4 font-goudy text-4xl leading-[1.05] text-royal-cream sm:text-5xl md:text-6xl">
            {content.cardTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-royal-cream/80 sm:text-base">
            {content.cardDescription}
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={`/${locale}/reservation?${new URLSearchParams({ dept: "dance", q: "Kids Movements" }).toString()}`}
              className="liquid-glass-gold shimmer inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-[11px] font-medium uppercase tracking-[0.22em] text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] sm:w-auto sm:py-2.5"
            >
              {content.enrollment}
            </Link>
            <Link
              href={`/${locale}`}
              className="mt-1 w-full text-center text-[11px] font-medium uppercase tracking-[0.22em] text-royal-gold/70 underline decoration-royal-gold/40 underline-offset-4 hover:text-royal-gold sm:mt-0 sm:w-auto sm:text-left"
            >
              {isArabic ? "العودة للرئيسية" : "Back to Home"}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <div className="liquid-glass rounded-2xl border border-royal-cream/10 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-gold/70">
            {isArabic ? "ماذا ستتعلم" : "What You'll Learn"}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-royal-cream/85 sm:text-[15px]">
            {content.cardBullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2">
                <span className="mt-1.75 h-1 w-1 rotate-45 bg-royal-gold/70" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm leading-7 text-royal-cream/70">
            {content.cardFooter}
          </p>
        </div>
      </section>
    </main>
  );
}
