"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

const MOVEMENT_SLIDES = [
  "/images/movement01.png",
  "/images/movement02.png",
  "/images/movement03.png",
  "/images/movement04.png",
  "/images/movement05.png",
  "/images/movement06.png",
  "/images/movement07.png",
  "/images/movement08.png",
  "/images/movement09.png",
] as const;

const SLIDE_INTERVAL_MS = 7_000;
const IMAGES_PER_VIEW = 3;

export default function BodyFlexibilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale = "en" } = use(params);
  const isArabic = locale === "ar";

  const [activeSlide, setActiveSlide] = useState(0);
  const [activeCard, setActiveCard] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const imagesPerView = isMobile ? 1 : IMAGES_PER_VIEW;
  const slideGroups = useMemo(
    () =>
      Array.from(
        { length: Math.ceil(MOVEMENT_SLIDES.length / imagesPerView) },
        (_, groupIndex) =>
          MOVEMENT_SLIDES.slice(
            groupIndex * imagesPerView,
            groupIndex * imagesPerView + imagesPerView,
          ),
      ),
    [imagesPerView],
  );
  const content = isArabic
    ? {
        slideAltPrefix: "شريحة الحركة",
        dotsLabelPrefix: "الانتقال إلى مجموعة الحركة",
        enrollment: "التسجيل",
        cards: [
          {
            title: "برامج الجسم والمرونة",
            description:
              "جلسات تدريبية مركزة تهدف إلى تحسين الأداء البدني، ووضعية الجسم، والمرونة الحركية.",
            bullets: [
              "مرونة الجسم",
              "الإطالة والتهيئة البدنية",
              "الوضعية والحركة",
            ],
            footer:
              "مثالية للطلاب الذين يسعون إلى تحسين المحاذاة الجسدية، وتوازن القوة، وتطوير المرونة.",
          },
          {
            title: "الحركة الواعية والعافية",
            description:
              "منهج شمولي للحركة يربط بين التنفس، ووعي الجسد، والانسياب المتحكم به.",
            bullets: [
              "يوغا",
              "التنفس والتوازن",
              "الحركة واليقظة الذهنية",
            ],
            footer:
              "تعزز هذه الجلسات تقليل التوتر، والتحكم بالجسم، والوعي البدني المستدام.",
          },
          {
            title: "البرامج الخاصة والخلوات",
            description:
              "برامج منتقاة بعناية لتعميق العافية الجسدية والحركة الاستشفائية.",
            bullets: [
              "خلوات الحركة",
              "الحركة الخالدة",
              "(صف لطيف يركز على مرونة المفاصل، والمرونة الجسدية، وسهولة الحركة للبالغين +50)",
            ],
          },
        ],
      }
    : {
        slideAltPrefix: "Movement slide",
        dotsLabelPrefix: "Go to movement group",
        enrollment: "Enrollment",
        cards: [
          {
            title: "Body & Flexibility Programs",
            description:
              "Targeted conditioning sessions designed to enhance physical performance, posture, and mobility.",
            bullets: [
              "Body Flexibility",
              "Stretch & Conditioning",
              "Posture & Mobility",
            ],
            footer:
              "Ideal for students seeking improved alignment, strength balance, and flexibility development.",
          },
          {
            title: "Mindful Movement & Wellness",
            description:
              "A holistic approach to movement connecting breath, body awareness, and controlled flow.",
            bullets: ["Yoga", "Breath & Balance", "Movement & Mindfulness"],
            footer:
              "These sessions promote stress reduction, body control, and sustainable physical awareness.",
          },
          {
            title: "Special Programs & Retreats",
            description:
              "Curated programs designed to deepen physical wellbeing and restorative movement.",
            bullets: [
              "Movement Retreats",
              "Timeless Movement",
              "(A gentle class focused on joint mobility, flexibility, and ease of movement for adults 50+)",
            ],
          },
        ],
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

  useEffect(() => {
    setActiveCard((current) => current % content.cards.length);
  }, [content.cards.length]);

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
      className="h-[calc(100svh-8.9rem)] min-h-0 overflow-hidden bg-royal-purple pt-16 sm:h-[calc(100svh-7.5rem)] md:h-[calc(100svh-3.1rem)] md:pt-20"
      onWheelCapture={(event) => event.stopPropagation()}
      onTouchMoveCapture={(event) => event.stopPropagation()}
    >
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5 md:grid md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-start md:gap-6 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-8">
        <div className={`order-2 md:order-1 ${isArabic ? "text-right" : "text-left"}`}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-royal-gold/75">
            {isArabic ? "الرقص والعافية" : "Dance & Wellness"}
          </p>
          <h1 className="mt-2.5 font-goudy text-[1.9rem] leading-[1.02] text-royal-cream sm:text-[2.3rem] md:text-[2.5rem] lg:text-[2.8rem]">
            {content.cards[0].title}
          </h1>
          <p className="mt-2.5 max-w-2xl text-[0.82rem] leading-5 text-royal-cream/80 sm:text-[0.9rem] sm:leading-6">
            {content.cards[0].description}
          </p>

          <div className="mt-4 flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center md:flex-col md:items-start">
            <Link
              href={`/${locale}/reservation?${new URLSearchParams({ dept: "dance", q: "Body & Flexibility" }).toString()}`}
              className="liquid-glass-gold shimmer inline-flex w-full items-center justify-center rounded-full px-5 py-2.5 text-[10px] font-medium uppercase tracking-[0.22em] text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] sm:w-auto sm:py-2.5"
            >
              {content.enrollment}
            </Link>
            <Link
              href={`/${locale}`}
              className="w-full text-center text-[10px] font-medium uppercase tracking-[0.22em] text-royal-gold/70 underline decoration-royal-gold/40 underline-offset-4 hover:text-royal-gold sm:w-auto sm:text-left"
            >
              {isArabic ? "العودة للرئيسية" : "Back to Home"}
            </Link>
          </div>
        </div>

        <div className="order-1 w-full md:order-2 md:w-full md:justify-self-end md:pl-3 lg:pl-6">
          <section className="relative h-[30.5vh] min-h-[13rem] w-full overflow-hidden sm:h-[32.5vh] md:h-[43vh] md:min-h-[19rem] lg:h-[45vh]">
            <div className="absolute inset-0">
              {slideGroups.map((group, index) => (
                <div
                  key={`movement-group-${index}`}
                  className={`absolute inset-0 transition-opacity duration-1400 ${
                    index === activeSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div
                    className={`grid h-full px-4 py-6 sm:px-6 md:px-5 md:py-7 lg:px-6 ${
                      isMobile
                        ? "mx-auto max-w-88 grid-cols-1 gap-3"
                        : "mx-auto max-w-full grid-cols-3 gap-3"
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
                </div>
              ))}

            </div>

            <div
              dir="ltr"
              className="absolute left-1/2 top-[calc(100%-2.3rem)] z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur-sm md:top-4"
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
                  key={`movement-group-dot-${index}`}
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
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl flex-1 px-4 pb-5 pt-2 sm:px-6 sm:pb-6">
        <div className="grid h-full grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch">
          <div className="flex flex-col gap-3 md:hidden">
            <div
              key={content.cards[activeCard].title}
              className="liquid-glass h-full rounded-2xl border border-royal-cream/10 p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-royal-gold/70">
                {isArabic ? "نظرة عامة" : "Overview"}
              </p>
              <h2
                className={`mt-2 font-goudy text-[1.25rem] leading-tight text-royal-cream ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                {content.cards[activeCard].title}
              </h2>
              <p
                className={`mt-2 text-[0.8rem] leading-5 text-royal-cream/85 ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                {content.cards[activeCard].description}
              </p>
              <ul className="mt-2.5 space-y-1.5 text-[0.78rem] text-royal-cream/85">
                {content.cards[activeCard].bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1 w-1 rotate-45 bg-royal-gold/70" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              {content.cards[activeCard].footer ? (
                <p
                  className={`mt-2.5 text-[0.76rem] leading-5 text-royal-cream/70 ${
                    isArabic ? "text-right" : "text-left"
                  }`}
                >
                  {content.cards[activeCard].footer}
                </p>
              ) : null}
            </div>

            <div dir="ltr" className="flex items-center justify-center gap-2">
              {content.cards.map((card, index) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => setActiveCard(index)}
                  aria-label={`${isArabic ? "عرض البطاقة" : "Show card"} ${index + 1}`}
                  className={`h-2.5 w-2.5 rounded-full border border-white/30 transition ${
                    index === activeCard ? "bg-white" : "bg-white/25"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="hidden h-full md:col-span-3 md:grid md:grid-cols-3 md:gap-3 lg:gap-4">
          {content.cards.map((card) => (
            <div
              key={card.title}
              className="liquid-glass h-full rounded-2xl border border-royal-cream/10 p-4 lg:p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-gold/70">
                {isArabic ? "نظرة عامة" : "Overview"}
              </p>
              <h2
                className={`mt-3 font-goudy text-2xl leading-tight text-royal-cream ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                {card.title}
              </h2>
              <p
                className={`mt-3 text-sm leading-7 text-royal-cream/85 sm:text-[15px] ${
                  isArabic ? "text-right" : "text-left"
                }`}
              >
                {card.description}
              </p>
              <ul className="mt-4 space-y-2 text-sm text-royal-cream/85 sm:text-[15px]">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-1.75 h-1 w-1 rotate-45 bg-royal-gold/70" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              {card.footer && (
                <p
                  className={`mt-3 text-sm leading-6 text-royal-cream/70 ${
                    isArabic ? "text-right" : "text-left"
                  }`}
                >
                  {card.footer}
                </p>
              )}
            </div>
          ))}
          </div>
        </div>
      </section>
    </main>
  );
}
