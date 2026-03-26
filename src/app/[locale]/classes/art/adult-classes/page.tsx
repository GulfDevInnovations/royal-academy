"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SAMPLE_BUTTONS = [
  {
    label: "acrylic",
    src: "/images/acrylicsample.png",
    color: "linear-gradient(145deg, rgba(255,132,120,0.82) 0%, rgba(244,91,114,0.62) 100%)",
  },
  {
    label: "calligraphy",
    src: "/images/calligraphysample.png",
    color: "linear-gradient(145deg, rgba(102,92,88,0.84) 0%, rgba(64,55,53,0.62) 100%)",
  },
  {
    label: "coloredpencildrawing",
    src: "/images/coloredpencildrawingsample.png",
    color: "linear-gradient(145deg, rgba(126,191,255,0.82) 0%, rgba(74,136,224,0.62) 100%)",
  },
  {
    label: "drawing",
    src: "/images/drawingsample.png",
    color: "linear-gradient(145deg, rgba(247,205,118,0.82) 0%, rgba(230,159,76,0.62) 100%)",
  },
  {
    label: "mandala&dottingart",
    src: "/images/mandala&dottingartsample.png",
    color: "linear-gradient(145deg, rgba(191,128,255,0.82) 0%, rgba(135,81,214,0.62) 100%)",
  },
  {
    label: "mixedmedia",
    src: "/images/mixedmediasample.png",
    color: "linear-gradient(145deg, rgba(115,216,179,0.82) 0%, rgba(47,154,120,0.62) 100%)",
  },
  {
    label: "oilpainting",
    src: "/images/oilpaintingsample.png",
    color: "linear-gradient(145deg, rgba(113,141,255,0.82) 0%, rgba(59,84,194,0.62) 100%)",
  },
  {
    label: "paperart",
    src: "/images/paperartsample.png",
    color: "linear-gradient(145deg, rgba(255,178,135,0.82) 0%, rgba(220,119,85,0.62) 100%)",
  },
  {
    label: "portrait&caricature",
    src: "/images/portrait&caricaturesample.png",
    color: "linear-gradient(145deg, rgba(246,133,167,0.82) 0%, rgba(205,76,129,0.62) 100%)",
  },
  {
    label: "shading",
    src: "/images/shadingsmaple.png",
    color: "linear-gradient(145deg, rgba(146,153,163,0.82) 0%, rgba(85,91,102,0.62) 100%)",
  },
  {
    label: "watercolor",
    src: "/images/watercolorsample.png",
    color: "linear-gradient(145deg, rgba(104,217,225,0.82) 0%, rgba(54,154,196,0.62) 100%)",
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
      className="relative min-h-screen cursor-none overflow-hidden bg-[#f2ece3] bg-contain bg-center bg-no-repeat px-4 py-8 sm:px-6 lg:px-10"
      style={{ backgroundImage: "url('/images/canvas.painting.png')" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.04)_28%,rgba(0,0,0,0)_68%)]" />

      <section className="absolute inset-x-0 bottom-0 z-20 px-4 pb-6 sm:px-6 sm:pb-8 lg:px-10 lg:pb-10">
        <div className="mx-auto w-full max-w-7xl overflow-x-auto pb-2">
          <div className="flex w-max min-w-full items-end justify-start gap-3">
          {SAMPLE_BUTTONS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => setActiveSample(sample)}
              className="liquid-glass relative flex min-h-[3rem] w-[6.5rem] shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border px-2 py-1.5 text-center text-[#fffaf3] transition duration-300 hover:-translate-y-1 hover:scale-[1.015] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              style={glassButtonStyle(sample.color)}
            >
              <span className="block break-words text-[0.52rem] font-semibold leading-[1.05] tracking-[0.005em] drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
                {sample.label}
              </span>
            </button>
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
              {activeSample.label}
            </div>

            <div className="relative overflow-hidden rounded-[1.2rem] bg-[rgba(255,255,255,0.1)]">
              <Image
                src={activeSample.src}
                alt={activeSample.label}
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
