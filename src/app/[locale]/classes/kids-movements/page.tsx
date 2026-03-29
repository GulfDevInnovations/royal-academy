"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function KidsMovementsPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const imagesPerView = isMobile ? 1 : IMAGES_PER_VIEW;
  const slideGroups = Array.from(
    { length: Math.ceil(KIDS_MOVEMENT_SLIDES.length / imagesPerView) },
    (_, groupIndex) =>
      KIDS_MOVEMENT_SLIDES.slice(
        groupIndex * imagesPerView,
        groupIndex * imagesPerView + imagesPerView,
      ),
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
    const syncViewportMode = () => {
      setIsMobile(window.innerWidth < 768);
    };

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);

    return () => window.removeEventListener("resize", syncViewportMode);
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

  return (
    <main
      className="min-h-screen bg-[#ede6dc] pt-24 text-[#f8f3eb] sm:pt-28"
      style={{ direction: "ltr" }}
    >
      <section className="relative h-[38vh] min-h-[18rem] w-full overflow-hidden sm:h-[35vh] lg:h-[36vh]">
        {slideGroups.map((group, index) => (
          <div
            key={`kids-group-${index}`}
            className={`absolute inset-0 transition-opacity duration-[1400ms] ${
              index === activeSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <div
              className={`grid h-full pt-14 pb-2 sm:gap-3 sm:px-3 sm:pt-16 sm:pb-3 ${
                isMobile
                  ? "mx-auto max-w-[19rem] grid-cols-1 gap-0 px-4"
                  : "grid-cols-3 gap-2 px-2"
              }`}
            >
              {group.map((slide, imageIndex) => (
                <div
                  key={slide}
                  className="relative overflow-hidden rounded-[1rem] bg-[rgba(255,255,255,0.14)]"
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
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,11,9,0.1)_0%,rgba(15,11,9,0.28)_100%)]" />
          </div>
        ))}

        <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[rgba(255,255,255,0.12)] px-3 py-2 backdrop-blur-sm">
          {slideGroups.map((_, index) => (
            <button
              key={`kids-group-dot-${index}`}
              type="button"
              onClick={() => setActiveSlide(index)}
              aria-label={`${content.dotsLabelPrefix} ${index + 1}`}
              className={`h-2.5 w-2.5 rounded-full border border-white/30 transition ${
                index === activeSlide ? "bg-white" : "bg-white/25"
              }`}
            />
          ))}
        </div>
      </section>

      <section className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div
          className="mx-auto flex w-full flex-col rounded-[1.5rem] border border-white/18 bg-[linear-gradient(160deg,rgba(31,24,19,0.8)_0%,rgba(73,56,44,0.68)_100%)] p-5 shadow-[0_18px_36px_rgba(33,22,13,0.2)] backdrop-blur-sm sm:p-6"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <h1 className={`text-[1.1rem] font-semibold tracking-[0.02em] text-[#fff4e8] sm:text-[1.25rem] ${isArabic ? "text-right" : ""}`}>
            {content.cardTitle}
          </h1>

          <p className={`mt-3 text-[0.88rem] leading-6 text-[#f4e6d7] sm:text-[0.96rem] ${isArabic ? "text-right" : ""}`}>
            {content.cardDescription}
          </p>

          <div className={`mt-3 space-y-1 text-[0.9rem] font-medium leading-6 text-[#fff0df] sm:text-[0.96rem] ${isArabic ? "text-right" : ""}`}>
            {content.cardBullets.map((bullet) => (
              <p key={bullet}>{`• ${bullet}`}</p>
            ))}
          </div>

          <p className={`mt-3 text-[0.88rem] leading-6 text-[#f1e1d0] sm:text-[0.96rem] ${isArabic ? "text-right" : ""}`}>
            {content.cardFooter}
          </p>

          <Link
            href={`/${locale}/reservation`}
            className={`mt-4 inline-flex w-[9rem] items-center justify-center rounded-full border border-white/20 bg-[rgba(255,245,232,0.16)] px-3 py-1.5 text-center text-[0.64rem] font-semibold leading-tight text-[#fff8ee] transition hover:scale-[1.02] hover:bg-[rgba(255,245,232,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${isArabic ? "self-end" : "uppercase tracking-[0.14em]"}`}
          >
            {content.enrollment}
          </Link>
        </div>
      </section>
    </main>
  );
}
