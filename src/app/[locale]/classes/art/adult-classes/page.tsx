"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const SAMPLE_BUTTONS = [
  {
    label: "Acrylic",
    arLabel: "أكريليك",
    src: "/images/acrylicsample.png",
    color: "linear-gradient(145deg, rgba(255,100,94,0.84) 0%, rgba(220,58,76,0.64) 100%)",
    audience: "adult",
  },
  {
    label: "Calligraphy",
    arLabel: "خط",
    src: "/images/calligraphysample.png",
    color: "linear-gradient(145deg, rgba(255,147,83,0.84) 0%, rgba(224,106,36,0.64) 100%)",
    audience: "adult",
  },
  {
    label: "Colored Pencil Drawing",
    arLabel: "رسم بالألوان الخشبية",
    src: "/images/coloredpencildrawingsample.png",
    color: "linear-gradient(145deg, rgba(255,210,90,0.84) 0%, rgba(230,165,28,0.64) 100%)",
    audience: "adult",
  },
  {
    label: "Drawing I Basic to Advanced",
    arLabel: "الرسم من الأساسي إلى المتقدم",
    src: "/images/drawingsample.png",
    color: "linear-gradient(145deg, rgba(196,232,92,0.84) 0%, rgba(138,185,24,0.64) 100%)",
    audience: "both",
  },
  {
    label: "Mandala Dotting Art",
    arLabel: "فن الماندالا والتنقيط",
    src: "/images/mandala&dottingartsample.png",
    color: "linear-gradient(145deg, rgba(103,214,110,0.84) 0%, rgba(46,156,62,0.64) 100%)",
    audience: "adult",
  },
  {
    label: "Mixed Media",
    arLabel: "وسائط مختلطة",
    src: "/images/mixedmediasample.png",
    color: "linear-gradient(145deg, rgba(72,217,164,0.84) 0%, rgba(29,162,124,0.64) 100%)",
    audience: "adult",
  },
  {
    label: "Oil Painting",
    arLabel: "رسم زيتي",
    src: "/images/oilpaintingsample.png",
    color: "linear-gradient(145deg, rgba(84,220,236,0.84) 0%, rgba(33,166,200,0.64) 100%)",
    audience: "adult",
  },
  {
    label: "Paper Art",
    arLabel: "فن الورق",
    src: "/images/paperartsample.png",
    color: "linear-gradient(145deg, rgba(86,162,255,0.84) 0%, rgba(46,110,220,0.64) 100%)",
    audience: "kids",
  },
  {
    label: "Arts & Crafts",
    arLabel: "الفنون والأشغال اليدوية",
    src: "/images/arts&crafts.png",
    color: "linear-gradient(145deg, rgba(95,132,255,0.84) 0%, rgba(55,83,214,0.64) 100%)",
    audience: "kids",
  },
  {
    label: "Animation Drawing",
    arLabel: "رسم الأنيميشن",
    src: "/images/animationdrawing.png",
    color: "linear-gradient(145deg, rgba(106,116,255,0.84) 0%, rgba(63,71,228,0.64) 100%)",
    audience: "kids",
  },
  {
    label: "Collage",
    arLabel: "كولاج",
    src: "/images/collagesample.png",
    color: "linear-gradient(145deg, rgba(118,123,255,0.84) 0%, rgba(76,70,224,0.64) 100%)",
    audience: "kids",
  },
  {
    label: "Portrait & Caricature",
    arLabel: "بورتريه وكاريكاتير",
    src: "/images/portrait&caricaturesample.png",
    color: "linear-gradient(145deg, rgba(108,114,255,0.84) 0%, rgba(69,72,214,0.64) 100%)",
    audience: "both",
  },
  {
    label: "Shading & Color Techniques",
    arLabel: "تقنيات التظليل والألوان",
    src: "/images/shadingsmaple.png",
    color: "linear-gradient(145deg, rgba(167,106,255,0.84) 0%, rgba(120,60,214,0.64) 100%)",
    audience: "both",
  },
  {
    label: "Watercolor",
    arLabel: "ألوان مائية",
    src: "/images/watercolorsample.png",
    color: "linear-gradient(145deg, rgba(241,112,214,0.84) 0%, rgba(202,62,164,0.64) 100%)",
    audience: "adult",
  },
] as const;

const glassButtonStyle = (background: string) =>
  ({
    background,
    borderColor: "rgba(255,255,255,0.26)",
    boxShadow:
      "0 16px 36px rgba(40,32,23,0.18), inset 0 1px 0 rgba(255,255,255,0.36), inset 0 -1px 0 rgba(255,255,255,0.08)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  }) as const;

export default function AdultClassesPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isPointerVisible, setIsPointerVisible] = useState(false);
  const [activeSample, setActiveSample] = useState<(typeof SAMPLE_BUTTONS)[number] | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      setCursorPosition({ x: event.clientX, y: event.clientY });
      setIsPointerVisible(true);
    };

    const handlePointerLeave = () => {
      setIsPointerVisible(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveSample(null);
      }
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseleave", handlePointerLeave);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseleave", handlePointerLeave);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <main
      className="relative min-h-screen cursor-none overflow-hidden bg-[#f2ece3] bg-cover bg-center bg-no-repeat px-4 py-8 sm:px-6 lg:px-10"
      style={{ backgroundImage: "url('/images/canvas.painting.png')" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.04)_28%,rgba(0,0,0,0)_68%)]" />

      <section className="absolute inset-x-0 bottom-0 z-20 px-4 pb-6 sm:px-6 sm:pb-8 lg:px-10 lg:pb-10">
        <div className="mx-auto w-full max-w-7xl overflow-x-auto pb-2">
          <div className="mb-4 inline-flex w-fit items-center justify-start gap-6 rounded-[1.5rem] border border-white/18 bg-[rgba(255,255,255,0.12)] px-5 py-3 shadow-[0_14px_28px_rgba(0,0,0,0.14)] backdrop-blur-sm">
            <div className="flex flex-col items-center gap-1 text-center text-[0.92rem] font-bold leading-none text-[#a9d5ff] drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
              <Image
                src="/images/adultlogo.png"
                alt="Adult Classes"
                width={70}
                height={70}
                className="h-[4.4rem] w-[4.4rem] object-contain"
              />
              <span>
                {isArabic ? "صفوف الكبار" : "Adult Classes"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center text-[0.92rem] font-bold leading-none text-[#a9d5ff] drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
              <Image
                src="/images/kidslogo.png"
                alt="Kids Classes"
                width={70}
                height={70}
                className="h-[4.4rem] w-[4.4rem] object-contain"
              />
              <span>
                {isArabic ? "صفوف الأطفال" : "Kids Classes"}
              </span>
            </div>
          </div>

          <div className="flex w-max min-w-full items-end justify-start gap-3">
          {SAMPLE_BUTTONS.map((sample) => (
            <div
              key={sample.label}
              className="flex w-[calc((100vw-2.75rem)/2)] shrink-0 flex-col items-center gap-0 sm:w-[7.8rem]"
            >
              <div
                className={`-mb-1 flex min-h-[3.5rem] items-end justify-center ${
                  sample.audience === "both" ? "gap-0.5" : "gap-2"
                }`}
              >
                {sample.audience === "adult" || sample.audience === "both" ? (
                  <Image
                    src="/images/adultlogo.png"
                    alt="Adult Classes"
                    width={60}
                    height={60}
                    className="h-[3.75rem] w-[3.75rem] object-contain"
                  />
                ) : null}
                {sample.audience === "kids" || sample.audience === "both" ? (
                  <Image
                    src="/images/kidslogo.png"
                    alt="Kids Classes"
                    width={60}
                    height={60}
                    className="h-[3.75rem] w-[3.75rem] object-contain"
                  />
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setActiveSample(sample)}
                className="liquid-glass relative flex min-h-[3.3rem] w-full items-center justify-center overflow-hidden rounded-[1rem] border px-2 py-1.5 text-center text-[#fffaf3] transition duration-300 hover:-translate-y-1 hover:scale-[1.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                style={glassButtonStyle(sample.color)}
              >
                <span className="block break-words text-[0.6rem] font-semibold leading-[1.05] tracking-[0.005em] drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
                  {isArabic ? sample.arLabel : sample.label}
                </span>
              </button>
            </div>
          ))}
          </div>
        </div>
      </section>

      {activeSample ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(25,19,16,0.62)] px-4 py-8"
          onClick={() => setActiveSample(null)}
        >
          <div
            className="liquid-glass relative w-full max-w-5xl rounded-[1.6rem] border border-white/20 bg-[rgba(255,248,240,0.08)] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.28)] sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActiveSample(null)}
              className="absolute right-3 top-3 z-10 rounded-full border border-white/25 bg-black/20 px-3 py-1 text-sm text-white/90 transition hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Close
            </button>

            <div className="mb-3 pr-16 text-sm font-medium text-white/88">
              {isArabic ? activeSample.arLabel : activeSample.label}
            </div>

            <div className="relative overflow-hidden rounded-[1.2rem] bg-[rgba(255,255,255,0.1)]">
              <Image
                src={activeSample.src}
                alt={isArabic ? activeSample.arLabel : activeSample.label}
                width={1600}
                height={1200}
                className="h-auto max-h-[78vh] w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>
      ) : null}

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
