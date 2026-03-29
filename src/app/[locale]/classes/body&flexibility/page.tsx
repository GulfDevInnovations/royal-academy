"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function BodyFlexibilityPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const imagesPerView = isMobile ? 1 : IMAGES_PER_VIEW;
  const slideGroups = Array.from(
    { length: Math.ceil(MOVEMENT_SLIDES.length / imagesPerView) },
    (_, groupIndex) =>
      MOVEMENT_SLIDES.slice(
        groupIndex * imagesPerView,
        groupIndex * imagesPerView + imagesPerView,
      ),
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
            key={`group-${index}`}
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
              key={`group-dot-${index}`}
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

      <section className="px-2 py-4 sm:px-3 sm:py-5">
        <div className="mx-auto grid max-w-[19rem] grid-cols-1 gap-3 md:max-w-none md:grid-cols-3 md:gap-4">
          <div
            className="max-w-[17rem] rounded-[1.2rem] border border-white/18 bg-[linear-gradient(160deg,rgba(31,24,19,0.8)_0%,rgba(73,56,44,0.68)_100%)] p-3 shadow-[0_16px_32px_rgba(33,22,13,0.2)] backdrop-blur-sm sm:max-w-[18.5rem] sm:p-3.5 md:translate-x-[63px]"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <h1 className={`text-[0.95rem] font-semibold tracking-[0.02em] text-[#fff4e8] sm:text-[1.02rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[0].title}
            </h1>

            <p className={`mt-2 text-[0.68rem] leading-5 text-[#f4e6d7] sm:text-[0.72rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[0].description}
            </p>

            <div className={`mt-2.5 space-y-0.5 text-[0.72rem] font-medium leading-5 text-[#fff0df] sm:text-[0.76rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[0].bullets.map((bullet) => (
                <p key={bullet}>{`• ${bullet}`}</p>
              ))}
            </div>

            <p className={`mt-2.5 text-[0.68rem] leading-5 text-[#f1e1d0] sm:text-[0.72rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[0].footer}
            </p>

            <Link
              href={`/${locale}/reservation`}
              className={`mt-3 inline-flex items-center justify-center rounded-full border border-white/20 bg-[rgba(255,245,232,0.16)] px-3 py-1.5 text-[0.62rem] font-semibold text-[#fff8ee] transition hover:scale-[1.02] hover:bg-[rgba(255,245,232,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${isArabic ? "self-end" : "uppercase tracking-[0.16em]"}`}
            >
              {content.enrollment}
            </Link>
          </div>

          <div
            className="max-w-[17rem] rounded-[1.2rem] border border-white/18 bg-[linear-gradient(160deg,rgba(31,24,19,0.8)_0%,rgba(73,56,44,0.68)_100%)] p-3 shadow-[0_16px_32px_rgba(33,22,13,0.2)] backdrop-blur-sm sm:max-w-[18.5rem] sm:p-3.5 md:col-start-2 md:translate-x-[63px]"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <h2 className={`text-[0.95rem] font-semibold tracking-[0.02em] text-[#fff4e8] sm:text-[1.02rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[1].title}
            </h2>

            <p className={`mt-2 text-[0.68rem] leading-5 text-[#f4e6d7] sm:text-[0.72rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[1].description}
            </p>

            <div className={`mt-2.5 space-y-0.5 text-[0.72rem] font-medium leading-5 text-[#fff0df] sm:text-[0.76rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[1].bullets.map((bullet) => (
                <p key={bullet}>{`• ${bullet}`}</p>
              ))}
            </div>

            <p className={`mt-2.5 text-[0.68rem] leading-5 text-[#f1e1d0] sm:text-[0.72rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[1].footer}
            </p>

            <Link
              href={`/${locale}/reservation`}
              className={`mt-3 inline-flex items-center justify-center rounded-full border border-white/20 bg-[rgba(255,245,232,0.16)] px-3 py-1.5 text-[0.62rem] font-semibold text-[#fff8ee] transition hover:scale-[1.02] hover:bg-[rgba(255,245,232,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${isArabic ? "self-end" : "uppercase tracking-[0.16em]"}`}
            >
              {content.enrollment}
            </Link>
          </div>

          <div
            className="max-w-[17rem] rounded-[1.2rem] border border-white/18 bg-[linear-gradient(160deg,rgba(31,24,19,0.8)_0%,rgba(73,56,44,0.68)_100%)] p-3 shadow-[0_16px_32px_rgba(33,22,13,0.2)] backdrop-blur-sm sm:max-w-[18.5rem] sm:p-3.5 md:col-start-3 md:translate-x-[63px]"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <h2 className={`text-[0.95rem] font-semibold tracking-[0.02em] text-[#fff4e8] sm:text-[1.02rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[2].title}
            </h2>

            <p className={`mt-2 text-[0.68rem] leading-5 text-[#f4e6d7] sm:text-[0.72rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[2].description}
            </p>

            <div className={`mt-2.5 space-y-0.5 text-[0.72rem] font-medium leading-5 text-[#fff0df] sm:text-[0.76rem] ${isArabic ? "text-right" : ""}`}>
              {content.cards[2].bullets.map((bullet) => (
                <p key={bullet}>{`• ${bullet}`}</p>
              ))}
            </div>

            <Link
              href={`/${locale}/reservation`}
              className={`mt-3 inline-flex items-center justify-center rounded-full border border-white/20 bg-[rgba(255,245,232,0.16)] px-3 py-1.5 text-[0.62rem] font-semibold text-[#fff8ee] transition hover:scale-[1.02] hover:bg-[rgba(255,245,232,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${isArabic ? "self-end" : "uppercase tracking-[0.16em]"}`}
            >
              {content.enrollment}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
