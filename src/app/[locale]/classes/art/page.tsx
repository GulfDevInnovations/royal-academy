"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ART_SLIDES = [
  { label: "Acrylic", arLabel: "أكريليك", src: "/images/acrylicsample.png" },
  { label: "Calligraphy", arLabel: "خط", src: "/images/calligraphysample.png" },
  {
    label: "Colored Pencil Drawing",
    arLabel: "رسم بالألوان الخشبية",
    src: "/images/coloredpencildrawingsample.png",
  },
  {
    label: "Drawing I Basic to Advanced",
    arLabel: "الرسم من الأساسي إلى المتقدم",
    src: "/images/drawingsample.png",
  },
  {
    label: "Mandala Dotting Art",
    arLabel: "فن الماندالا والتنقيط",
    src: "/images/mandala&dottingartsample.png",
  },
  { label: "Mixed Media", arLabel: "وسائط مختلطة", src: "/images/mixedmediasample.png" },
  { label: "Oil Painting", arLabel: "رسم زيتي", src: "/images/oilpaintingsample.png" },
  { label: "Paper Art", arLabel: "فن الورق", src: "/images/paperartsample.png" },
  { label: "Arts & Crafts", arLabel: "الفنون والأشغال اليدوية", src: "/images/arts&crafts.png" },
  { label: "Animation Drawing", arLabel: "رسم الأنيميشن", src: "/images/animationdrawing.png" },
  { label: "Collage", arLabel: "كولاج", src: "/images/collagesample.png" },
  {
    label: "Portrait & Caricature",
    arLabel: "بورتريه وكاريكاتير",
    src: "/images/portrait&caricaturesample.png",
  },
  {
    label: "Shading & Color Techniques",
    arLabel: "تقنيات التظليل والألوان",
    src: "/images/shadingsmaple.png",
  },
  { label: "Watercolor", arLabel: "ألوان مائية", src: "/images/watercolorsample.png" },
] as const;

const SLIDE_INTERVAL_MS = 7_000;
const ANIMATION_MS = 900;

const ART_PAGE_COPY = {
  en: {
    title: "Arts",
    intro:
      "A creative environment designed to develop technical foundations and artistic expression across multiple disciplines.",
    sections: [
      {
        title: "Drawing & Visual Language",
        items: [
          "Basics of Pencil Drawing",
          "Shading & Coloring",
          "Portrait & Caricature",
          "Animation Drawing",
        ],
      },
      {
        title: "Painting Practices",
        items: [
          "Acrylic",
          "Oil Painting",
          "Mixed Media",
          "Watercolor Classes",
          "Glass Painting",
          "Painting on Fabrics",
        ],
      },
      {
        title: "Material Exploration",
        items: ["Collage", "Paper Art", "Magic Paper"],
      },
      {
        title: "Meditative Arts",
        items: ["Mandala Dotting Art", "Notan Art"],
      },
      {
        title: "Applied Crafts",
        items: ["Arts & Crafts", "Handmade Cards", "Calligraphy"],
      },
    ],
    enrollment: "Enrollment",
  },
  ar: {
    title: "الفنون",
    intro:
      "بيئة إبداعية مصممة لتطوير الأسس التقنية والتعبير الفني عبر تخصصات متعددة.",
    sections: [
      {
        title: "الرسم واللغة البصرية",
        items: [
          "أساسيات الرسم بالرصاص",
          "التظليل والتلوين",
          "البورتريه والكاريكاتير",
          "رسم الأنيميشن",
        ],
      },
      {
        title: "ممارسات الرسم والتلوين",
        items: [
          "الأكريليك",
          "الرسم الزيتي",
          "وسائط مختلطة",
          "صفوف الألوان المائية",
          "الرسم على الزجاج",
          "الرسم على الأقمشة",
        ],
      },
      {
        title: "استكشاف الخامات",
        items: ["الكولاج", "فن الورق", "الورق السحري"],
      },
      {
        title: "الفنون التأملية",
        items: ["فن الماندالا والتنقيط", "فن النوتان"],
      },
      {
        title: "الحرف التطبيقية",
        items: ["الفنون والأشغال اليدوية", "البطاقات اليدوية", "الخط"],
      },
    ],
    enrollment: "التسجيل",
  },
} as const;

const MOBILE_SECTION_COLUMNS = [
  [0, 1],
  [2, 3, 4],
] as const;

export default function ArtPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isPointerVisible, setIsPointerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      setCursorPosition({ x: event.clientX, y: event.clientY });
      setIsPointerVisible(true);
    };

    const handlePointerLeave = () => {
      setIsPointerVisible(false);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, []);

  useEffect(() => {
    const startTransition = () => {
      const nextIndex = (activeIndex + 1) % ART_SLIDES.length;
      setOutgoingIndex(activeIndex);
      setIncomingIndex(nextIndex);

      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = window.setTimeout(() => {
        setActiveIndex(nextIndex);
        setIncomingIndex(null);
        setOutgoingIndex(null);
        transitionTimeoutRef.current = null;
      }, ANIMATION_MS);
    };

    const intervalId = window.setInterval(startTransition, SLIDE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (transitionTimeoutRef.current !== null) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [activeIndex]);

  const visibleSlide =
    incomingIndex !== null ? ART_SLIDES[incomingIndex] : ART_SLIDES[activeIndex];
  const pageCopy = isArabic ? ART_PAGE_COPY.ar : ART_PAGE_COPY.en;

  return (
    <main
      className="relative flex h-[calc(100svh-6.75rem)] min-h-0 flex-col cursor-none overflow-hidden bg-[#f2ece3] bg-cover bg-center bg-no-repeat px-4 py-4 sm:h-[calc(100svh-3.75rem)] sm:px-6 sm:py-5 lg:px-10 lg:py-6"
      style={{ backgroundImage: "url('/images/canvas.painting.png')", direction: "ltr" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.04)_28%,rgba(0,0,0,0)_68%)]" />

      <section className="relative z-20 order-2 flex min-h-0 flex-[0_0_38%] items-start pt-1 sm:flex-1 sm:pt-3 md:order-1 md:pt-[6.5rem] lg:pt-[6.75rem]">
        <div className="mx-auto w-full max-w-[12.8rem] sm:max-w-[16.5rem] lg:ml-4 lg:mr-0 lg:max-w-[18.5rem]">
          <div
            className="mb-2 inline-flex rounded-[0.75rem] border border-white/14 bg-[rgba(24,16,11,0.78)] px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.05em] text-[#fff6ec] shadow-[0_12px_24px_rgba(22,12,7,0.2)] backdrop-blur-sm drop-shadow-[0_2px_8px_rgba(0,0,0,0.22)] sm:text-[0.86rem] lg:text-[0.96rem]"
            dir={isArabic ? "rtl" : "ltr"}
          >
            {isArabic ? visibleSlide.arLabel : visibleSlide.label}
          </div>

          <div className="relative h-[10.9rem] overflow-hidden rounded-[0.95rem] border border-white/16 bg-[rgba(255,255,255,0.12)] shadow-[0_18px_36px_rgba(32,18,9,0.22)] backdrop-blur-sm sm:h-[14.6rem] lg:h-[16.2rem]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,12,8,0.1)_0%,rgba(18,12,8,0.2)_100%)]" />

            <div className="absolute inset-0">
              {outgoingIndex !== null ? (
                <div
                  key={`outgoing-${outgoingIndex}`}
                  className="art-slide art-slide-out absolute inset-0"
                  style={{ animationDuration: `${ANIMATION_MS}ms` }}
                >
                  <Image
                    src={ART_SLIDES[outgoingIndex].src}
                    alt={isArabic ? ART_SLIDES[outgoingIndex].arLabel : ART_SLIDES[outgoingIndex].label}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 62vw, 20.3rem"
                    priority
                  />
                </div>
              ) : null}

              {incomingIndex === null ? (
                <div key={`active-${activeIndex}`} className="absolute inset-0">
                  <Image
                    src={ART_SLIDES[activeIndex].src}
                    alt={isArabic ? ART_SLIDES[activeIndex].arLabel : ART_SLIDES[activeIndex].label}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 62vw, 20.3rem"
                    priority
                  />
                </div>
              ) : null}

              {incomingIndex !== null ? (
                <div
                  key={`incoming-${incomingIndex}`}
                  className="art-slide art-slide-in absolute inset-0"
                  style={{ animationDuration: `${ANIMATION_MS}ms` }}
                >
                  <Image
                    src={ART_SLIDES[incomingIndex].src}
                    alt={isArabic ? ART_SLIDES[incomingIndex].arLabel : ART_SLIDES[incomingIndex].label}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 62vw, 20.3rem"
                    priority
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 order-1 w-full flex-none pb-1 pt-[2.35rem] sm:pb-3 sm:pt-[4rem] md:order-2 md:-mt-[100px] md:pt-0 lg:mt-0">
        <div className="flex w-full flex-col rounded-[1.05rem] border border-white/16 bg-[linear-gradient(160deg,rgba(27,18,13,0.84)_0%,rgba(70,52,40,0.72)_100%)] p-2 shadow-[0_18px_34px_rgba(25,15,8,0.2)] backdrop-blur-sm sm:p-3">
          <h1
            className={`text-[0.82rem] font-semibold text-[#fff6ec] sm:text-[1rem] ${isArabic ? "text-right font-layla" : "tracking-[0.02em]"}`}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {pageCopy.title}
          </h1>

          <p
            className={`mt-0.5 max-w-5xl text-[0.62rem] leading-[0.9rem] text-[#f1e4d6] sm:text-[0.76rem] sm:leading-5 ${isArabic ? "text-right" : ""}`}
            dir={isArabic ? "rtl" : "ltr"}
          >
            {pageCopy.intro}
          </p>

          <div className="mt-1.5 grid grid-cols-2 gap-1.5 lg:hidden">
            {MOBILE_SECTION_COLUMNS.map((column, columnIndex) => (
              <div key={`mobile-column-${columnIndex}`} className="space-y-1.5">
                {column.map((sectionIndex) => {
                  const section = pageCopy.sections[sectionIndex];
                  return (
                    <div key={section.title} dir={isArabic ? "rtl" : "ltr"}>
                      <h2
                        className={`text-[0.66rem] font-semibold text-[#fff1e0] sm:text-[0.82rem] ${isArabic ? "text-right font-layla" : ""}`}
                      >
                        {section.title}
                      </h2>
                      <div
                        className={`mt-0.5 space-y-0 text-[0.58rem] leading-[0.82rem] text-[#f4e8db] sm:text-[0.73rem] sm:leading-4.5 ${isArabic ? "text-right" : ""}`}
                      >
                        {section.items.map((item) => (
                          <p key={item}>{isArabic ? `• ${item}` : `• ${item}`}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-1.5 hidden gap-2 lg:grid lg:grid-cols-5">
            {pageCopy.sections.map((section) => (
              <div key={section.title} dir={isArabic ? "rtl" : "ltr"}>
                <h2
                  className={`text-[0.7rem] font-semibold text-[#fff1e0] sm:text-[0.82rem] ${isArabic ? "text-right font-layla" : ""}`}
                >
                  {section.title}
                </h2>
                <div
                  className={`mt-0.5 space-y-0 text-[0.61rem] leading-[0.92rem] text-[#f4e8db] sm:text-[0.73rem] sm:leading-4.5 ${isArabic ? "text-right" : ""}`}
                >
                  {section.items.map((item) => (
                    <p key={item}>{isArabic ? `• ${item}` : `• ${item}`}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/${locale}/reservation`}
            className="mt-1.5 inline-flex self-end rounded-full border border-white/18 bg-[linear-gradient(135deg,rgba(255,243,230,0.18)_0%,rgba(255,255,255,0.08)_100%)] px-3 py-0.5 text-[0.6rem] font-semibold tracking-[0.08em] text-[#fff6ec] shadow-[0_12px_24px_rgba(24,14,8,0.18)] backdrop-blur-sm transition hover:bg-[linear-gradient(135deg,rgba(255,243,230,0.26)_0%,rgba(255,255,255,0.12)_100%)] sm:text-[0.74rem]"
          >
            {pageCopy.enrollment}
          </Link>
        </div>
      </section>

      <style jsx global>{`
        .art-slide {
          will-change: transform, opacity;
        }

        .art-slide-in {
          animation-name: art-slide-in;
          animation-timing-function: ease-out;
          animation-fill-mode: both;
        }

        .art-slide-out {
          animation-name: art-slide-out;
          animation-timing-function: ease-out;
          animation-fill-mode: both;
        }

        @keyframes art-slide-in {
          0% {
            opacity: 0;
            transform: translateY(2.8rem);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes art-slide-out {
          0% {
            opacity: 1;
            transform: translateY(0);
          }

          100% {
            opacity: 0;
            transform: translateY(-2.8rem);
          }
        }
      `}</style>

      <div
        className="pointer-events-none fixed left-0 top-0 z-[100] hidden md:block"
        style={{
          transform: `translate3d(${cursorPosition.x - 9}px, ${cursorPosition.y - 4}px, 0) rotate(-18deg)`,
          opacity: isPointerVisible ? 1 : 0,
          transition: isPointerVisible ? "transform 30ms linear" : "opacity 120ms ease",
        }}
      >
        <Image
          src="/images/paitingbrush.png"
          alt=""
          width={45}
          height={68}
          priority
          aria-hidden="true"
          className="select-none drop-shadow-[0_7px_8px_rgba(0,0,0,0.24)]"
        />
      </div>
    </main>
  );
}
