"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  musicCtaTextClass,
  musicHelperTextClass,
  musicTypography,
} from "@/lib/musicTypography";

type TheoryItem = {
  key: string;
  label: string;
  labelAr: string;
  imageSrc: string;
};

const THEORY_ITEMS: TheoryItem[] = [
  { key: "semibreve", label: "Semibreve", labelAr: "روند", imageSrc: "/images/semi-breve.png" },
  { key: "minim", label: "Minim", labelAr: "بلانش", imageSrc: "/images/minim.png" },
  { key: "crotchet", label: "Crotchet", labelAr: "نوار", imageSrc: "/images/crotchet.png" },
  { key: "quaver", label: "Quaver", labelAr: "كروش", imageSrc: "/images/quaver.png" },
  { key: "semiquaver", label: "Semiquaver", labelAr: "دبل كروش", imageSrc: "/images/semi-quaver.png" },
  { key: "sharp", label: "Sharp", labelAr: "دييز", imageSrc: "/images/sharp.png" },
  { key: "flat", label: "Flat", labelAr: "بيمول", imageSrc: "/images/flat.png" },
  { key: "treble-clef", label: "Treble Clef", labelAr: "مفتاح صول", imageSrc: "/images/treble-clef.png" },
  {
    key: "semibreve-rest",
    label: "Semibreve Rest",
    labelAr: "سكتة روند",
    imageSrc: "/images/semibreve-rest.png",
  },
  {
    key: "minim-rest",
    label: "Minim Rest",
    labelAr: "سكتة بلانش",
    imageSrc: "/images/minim-rest.png",
  },
  {
    key: "crotchet-rest",
    label: "Crotchet Rest",
    labelAr: "سكتة نوار",
    imageSrc: "/images/crotchet-rest.png",
  },
  {
    key: "quaver-rest",
    label: "Quaver Rest",
    labelAr: "سكتة كروش",
    imageSrc: "/images/quaver-rest.png",
  },
  { key: "bass-clef", label: "Bass Clef", labelAr: "مفتاح فا", imageSrc: "/images/bass-clif.png" },
  { key: "stave", label: "Stave", labelAr: "المدرج", imageSrc: "/images/stave.png" },
  { key: "bar-line", label: "Bar Line", labelAr: "خط الميزان", imageSrc: "/images/barline.png" },
  { key: "dotted-note", label: "Dotted Note", labelAr: "نغمة منقوطة", imageSrc: "/images/dotted-note.png" },
];

const LOOP_DURATION_MS = 34000;
const GLASS_CARD_STYLE = {
  borderColor: "rgba(255,255,255,0.12)",
  background:
    "linear-gradient(160deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 100%)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.28)",
  backdropFilter: "blur(12px)",
} as const;
const TEXT_HIGHLIGHT_STYLE = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(228,195,145,0.16) 58%, rgba(255,255,255,0) 100%)",
} as const;

function wrapProgress(value: number) {
  if (value < 0) {
    return value - Math.floor(value);
  }

  return value % 1;
}

export default function TheoryPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const reservationHref = `/${locale}/reservation`;
  const loopItems = [...THEORY_ITEMS, ...THEORY_ITEMS];
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loopProgress, setLoopProgress] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const itemStep = THEORY_ITEMS.length ? 1 / THEORY_ITEMS.length : 0;
  const content = isArabic
    ? {
        cardTitle: "مرحبًا بك في مادة النظرية الموسيقية",
        intro:
          "اكتشف اللغة الكامنة وراء الموسيقى وافتح كامل إمكاناتك الإبداعية. في هذه الحصة لن تكتفي بعزف الموسيقى، بل ستفهمها أيضًا.",
        sections: [
          {
            title: "1. قراءة الموسيقى وكتابتها",
            body: "تعلّم قراءة وكتابة النوتة الموسيقية، بما في ذلك النغمات والسكتات والإيقاعات والميزان الزمني، وهي أساس كل موسيقى.",
          },
          {
            title: "2. السلالم والمفاتيح",
            body: "استكشف السلالم الكبرى والصغرى، وعلامات المفاتيح، والمقامات المختلفة لفهم كيفية بناء الألحان.",
          },
          {
            title: "3. التآلفات والهارموني",
            body: "ابنِ التآلفات وتعلّم كيف تعمل معًا لخلق المشاعر والحركة في الموسيقى.",
          },
          {
            title: "4. تدريب الأذن",
            body: "طوّر مهارات الاستماع لديك من خلال تمييز النغمات والمسافات والألحان بالسمع.",
          },
          {
            title: "5. المسافات والعلاقات",
            body: "افهم المسافة بين النغمات وكيف تشكّل هذه العلاقات صوت الموسيقى وطابعها.",
          },
          {
            title: "6. أساسيات التأليف",
            body: "ابدأ في ابتكار موسيقاك الخاصة من خلال كتابة الألحان وبناء هارموني بسيط.",
          },
          {
            title: "7. التحليل",
            body: "حلّل مقطوعات موسيقية حقيقية لترى كيف تتكامل جميع العناصر معًا.",
          },
          {
            title: "8. تاريخ الموسيقى",
            body: "استكشف أنماطًا وتقاليد موسيقية مختلفة لتوسيع فهمك ومصادرك الإلهامية.",
          },
        ],
        closing:
          "ابدأ رحلتك اليوم، وتعلّم ليس فقط أن تعزف الموسيقى، بل أن تفهمها حقًا.",
        reserveHelper: "احجز حصتك في النظرية الموسيقية",
        reserveCta: "التسجيل",
      }
    : {
        cardTitle: "Welcome to Music Theory",
        intro:
          "Discover the language behind music and unlock your full creative potential. In this class, you won't just play music, you'll understand it.",
        sections: [
          {
            title: "1. Reading & Writing Music",
            body: "Learn how to read and write musical notation, including notes, rests, rhythms, and time signatures, the foundation of all music.",
          },
          {
            title: "2. Scales & Keys",
            body: "Explore major and minor scales, key signatures, and modes to understand how melodies are structured.",
          },
          {
            title: "3. Chords & Harmony",
            body: "Build chords and learn how they work together to create emotion and movement in music.",
          },
          {
            title: "4. Ear Training",
            body: "Develop your listening skills by identifying notes, intervals, and melodies by ear.",
          },
          {
            title: "5. Intervals & Relationships",
            body: "Understand the distance between notes and how these relationships shape the sound of music.",
          },
          {
            title: "6. Composition Basics",
            body: "Start creating your own music by writing melodies and building simple harmonies.",
          },
          {
            title: "7. Analysis",
            body: "Break down real pieces of music to see how everything fits together.",
          },
          {
            title: "8. Music History",
            body: "Explore different musical styles and traditions to broaden your understanding and inspiration.",
          },
        ],
        closing:
          "Start your journey today, learn not just to play music, but to truly understand it.",
        reserveHelper: "Reserve your theory class",
        reserveCta: "Enrollment",
      };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    const node = marqueeRef.current;
    if (!node) return;

    const updateWidth = () => {
      setTrackWidth(node.scrollWidth / 2);
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(node);
    window.addEventListener("resize", updateWidth);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useEffect(() => {
    if (selectedKey || prefersReducedMotion) {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTimestampRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
      }

      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      setLoopProgress((currentProgress) =>
        wrapProgress(currentProgress + delta / LOOP_DURATION_MS),
      );

      frameRef.current = window.requestAnimationFrame(step);
    };

    frameRef.current = window.requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTimestampRef.current = null;
    };
  }, [prefersReducedMotion, selectedKey]);

  const translateX = trackWidth ? -trackWidth + loopProgress * trackWidth : 0;

  const moveByStep = (direction: -1 | 1) => {
    setLoopProgress((currentProgress) =>
      wrapProgress(currentProgress + direction * itemStep),
    );
  };

  return (
    <main className="min-h-full overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,240,214,0.18)_0%,rgba(40,21,14,0.88)_42%,rgba(10,8,14,1)_100%)] px-4 pb-12 pt-24 text-royal-cream sm:px-6 sm:pb-14 sm:pt-28 lg:px-8 lg:pb-14 lg:pt-32 xl:px-10">
      <section className="-mt-[40px] mx-auto max-w-[104rem] px-0 pt-3 pb-10 sm:px-4 sm:pt-4 sm:pb-10 lg:px-6 lg:pt-4.5 lg:pb-10">
        <div className="relative top-[-30px] mt-[35px]">
          <div
            className="mb-3 mt-[10px] flex flex-wrap items-center justify-between gap-3 sm:mb-4"
            dir="ltr"
          >
            <h1
              className={`${musicTypography.titleCompact} text-royal-cream/92`}
            >
              Musical Literacy
            </h1>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => moveByStep(-1)}
                aria-label="Previous item"
                className="liquid-glass-gold shimmer inline-flex h-10 w-10 items-center justify-center rounded-full text-royal-cream transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-gold/70 sm:h-11 sm:w-11"
              >
                <span className="text-lg leading-none">‹</span>
              </button>

              <button
                type="button"
                onClick={() => moveByStep(1)}
                aria-label="Next item"
                className="liquid-glass-gold shimmer inline-flex h-10 w-10 items-center justify-center rounded-full text-royal-cream transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-gold/70 sm:h-11 sm:w-11"
              >
                <span className="text-lg leading-none">›</span>
              </button>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.04)_100%)] py-2.5 sm:rounded-[1.45rem] sm:py-3.5"
            dir="ltr"
          >
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-[linear-gradient(90deg,rgba(33,20,18,0.96)_0%,rgba(33,20,18,0)_100%)] sm:w-20" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-[linear-gradient(270deg,rgba(33,20,18,0.96)_0%,rgba(33,20,18,0)_100%)] sm:w-20" />

            <div
              ref={marqueeRef}
              className="theory-marquee flex w-max gap-2.5 sm:gap-4.5"
              dir="ltr"
              style={{ transform: `translate3d(${translateX}px, 0, 0)` }}
            >
              {loopItems.map((item, index) => (
                <button
                  type="button"
                  key={`${item.key}-${index}`}
                  onClick={() =>
                    setSelectedKey((currentKey) =>
                      currentKey === item.key ? null : item.key,
                    )
                  }
                  aria-pressed={selectedKey === item.key}
                className={`flex h-[6.9rem] w-[6.9rem] shrink-0 flex-col items-center justify-center rounded-full border border-white/10 px-2.5 py-2.5 text-center shadow-[0_16px_34px_rgba(8,6,9,0.24)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-gold/70 sm:h-[10.15rem] sm:w-[10.15rem] sm:px-4.5 sm:py-5 ${
                  selectedKey === item.key
                    ? "scale-[1.12] border-royal-gold/40 bg-[linear-gradient(160deg,rgba(196,168,130,0.28)_0%,rgba(255,255,255,0.08)_100%)] brightness-125 shadow-[0_18px_46px_rgba(8,6,9,0.34),0_0_26px_rgba(228,194,138,0.26)]"
                    : index % 3 === 0
                      ? "bg-[linear-gradient(160deg,rgba(196,168,130,0.18)_0%,rgba(255,255,255,0.04)_100%)]"
                      : "bg-[linear-gradient(160deg,rgba(255,255,255,0.11)_0%,rgba(255,255,255,0.03)_100%)]"
                }`}
                >
                  <div className="flex h-12 items-center justify-center sm:h-[5.4rem]">
                    <Image
                      src={item.imageSrc}
                      alt={isArabic ? item.labelAr : item.label}
                      width={96}
                      height={96}
                      className="h-11 w-11 object-contain sm:h-[5.4rem] sm:w-[5.4rem]"
                      unoptimized
                    />
                  </div>
                  <p
                    dir="ltr"
                    className="w-full px-1 text-center text-[0.64rem] font-semibold uppercase leading-tight tracking-[0.06em] text-royal-cream sm:text-[0.86rem] sm:tracking-[0.08em]"
                    style={{ fontFamily: 'Arial, "Helvetica Neue", sans-serif' }}
                  >
                    {item.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className="relative -top-[30px] mt-5 mb-10 w-full rounded-[1.35rem] border px-4 py-4 sm:rounded-[1.65rem] sm:px-5 sm:py-5"
          style={GLASS_CARD_STYLE}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <div className={`${isArabic ? "text-right" : ""}`}>
            <p className="font-goudy text-[1.3rem] text-royal-cream sm:text-[1.55rem]">
              {content.cardTitle}
            </p>

            <div className="mt-3 columns-1 gap-5 lg:columns-3">
              <div className="mb-4 break-inside-avoid">
                <p className="text-[15px] leading-7 text-royal-cream/90 sm:text-[16px] sm:leading-8">
                  {content.intro}
                </p>
              </div>

              {content.sections.map((section) => (
                <div key={section.title} className="mb-4 break-inside-avoid space-y-1.5">
                  <p className="font-semibold text-royal-cream sm:text-[1.02rem]">
                    {section.title}
                  </p>
                  <p className="text-[15px] leading-7 text-royal-cream/90 sm:text-[16px] sm:leading-8">
                    {section.body}
                  </p>
                </div>
              ))}

              <div className="break-inside-avoid">
                <p className="font-medium text-royal-cream sm:text-[1.02rem]">
                  {content.closing}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`mt-5 flex w-full flex-col gap-3 ${
              isArabic ? "items-end text-right" : "items-end text-right"
            }`}
          >
            <p
              className={`${musicHelperTextClass(isArabic)} text-royal-gold/65 ${
                isArabic ? "self-end text-right" : "w-full text-right"
              }`}
            >
              <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
            </p>
            <Link
              href={reservationHref}
              className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4.5 py-2 ${musicCtaTextClass(
                isArabic,
              )} text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] ${
                isArabic ? "self-end text-right" : "self-end"
              }`}
            >
              {content.reserveCta}
            </Link>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .theory-marquee {
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .theory-marquee {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}
