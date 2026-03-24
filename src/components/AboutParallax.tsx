"use client";

import type { RefObject } from "react";
import { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Footer from "@/components/Footer";

/**
 * Parallax scene only (no content section).
 *
 * Assets:
 * - /public/images/parallax/bg.png
 * - /public/images/parallax/left-hill-cropped.png
 * - /public/images/parallax/right-hill-cropped.png
 * - /public/images/parallax/text-part-cropped.png
 */
export default function AboutParallax({
  scrollContainerRef,
  locale,
}: {
  scrollContainerRef?: RefObject<HTMLElement | null>;
  locale: string;
}) {
  const containerRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  // Manual progress is the most reliable option when this component lives inside
  // a nested scroll container (like HomeClient's "elevator" floor).
  const manualProgress = useMotionValue(0);

  // Progress from 0→1 as the user scrolls through the "scene" container.
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef,
    target: containerRef,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    const scroller = scrollContainerRef?.current;
    const target = containerRef.current;
    if (!scroller || !target) return;

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const containerRect = scroller.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const targetTopInScroll = targetRect.top - containerRect.top + scroller.scrollTop;
      const start = targetTopInScroll;
      const end = targetTopInScroll + target.offsetHeight;
      const denom = Math.max(1, end - start);
      const raw = (scroller.scrollTop - start) / denom;
      const clamped = Math.max(0, Math.min(1, raw));
      manualProgress.set(clamped);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [manualProgress, scrollContainerRef]);

  const progress = scrollContainerRef?.current ? manualProgress : scrollYProgress;

  // Layer movement: background moves least, foreground moves most.
  const bgY = useTransform(progress, [0, 1], reduceMotion ? [0, 0] : [30, -100]);
  const leftHillY = useTransform(progress, [0, 1], reduceMotion ? [0, 0] : [0, -250]);
  const rightHillY = useTransform(progress, [0, 1], reduceMotion ? [0, 0] : [0, -300]);
  const textY = useTransform(progress, [0, 1], reduceMotion ? [0, 0] : [0, -485]);

  const leftHillX = useTransform(progress, [0, 1], reduceMotion ? [0, 0] : [0, 0]);
  const rightHillX = useTransform(progress, [0, 1], reduceMotion ? [0, 0] : [0, 0]);
  const textX = useTransform(progress, [0, 1], reduceMotion ? [0, 0] : [0, 0]);
  const bgScale = useTransform(progress, [0, 1], reduceMotion ? [1, 1] : [1.06, 1.12]);

  const titleY = useTransform(progress, [0, 1], reduceMotion ? [0, 0] : [0, -180]);
  const titleOpacity = useTransform(progress, [0, 0.65, 1], [1, 0.35, 0]);

  const vignetteOpacity = useTransform(progress, [0, 0.55, 0.82, 0], [0.25, 0.35, 0.78, 0.92]);
  const darkenOpacity = useTransform(progress, [0, 0.6, 0.9, 1], [0, 0.05, 0.35, 0.55]);
  const bottomBlendOpacity = useTransform(progress, [0, 0, 0, 0, 0], [0, 0, 0.25, 0.85, 1]);

  return (
    <section className="w-full">
      <section ref={containerRef} className="relative h-[170vh] w-full">
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#121212]">
          <motion.div
            aria-hidden
            style={{ opacity: darkenOpacity }}
            className="pointer-events-none absolute inset-0 z-9 bg-black"
          />

          <motion.div
            aria-hidden
            style={{ opacity: vignetteOpacity }}
            className="pointer-events-none absolute inset-0 z-10"
          >
            <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/15 to-black/70" />
          </motion.div>

          <motion.div
            aria-hidden
            style={{ opacity: bottomBlendOpacity }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 md:h-44 backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/35 to-[#121212]" />
          </motion.div>

          <motion.img
            src="/images/parallax/bg.png"
            alt=""
            draggable={false}
            style={{ y: bgY, scale: bgScale }}
            className="pointer-events-none absolute inset-0 z-0 h-[110vh] w-full select-none object-cover"
          />

          <motion.img
            src="/images/parallax/left-hill-cropped.png"
            alt=""
            draggable={false}
            style={{ y: leftHillY, x: leftHillX }}
            className="pointer-events-none absolute inset-0 z-1 h-[110vh] w-full select-none object-cover"
          />

          <motion.img
            src="/images/parallax/right-hill-cropped.png"
            alt=""
            draggable={false}
            style={{ y: rightHillY, x: rightHillX }}
            className="pointer-events-none absolute inset-0 z-2 h-[110vh] w-full select-none object-cover"
          />

          <motion.img
            src="/images/parallax/text-part-cropped.png"
            alt=""
            draggable={false}
            style={{ y: textY, x: textX }}
            className="pointer-events-none absolute inset-0 z-3 h-[110vh] w-full select-none object-cover"
          />

          <motion.div
            style={{ y: titleY, opacity: titleOpacity }}
            className="absolute left-1/2 top-[28%] z-5 w-[min(92vw,900px)] -translate-x-1/2 text-center"
          >
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-wide text-white drop-shadow-[0_20px_20px_rgba(0,0,0,0.25)]">
              Explore Royal
            </h2>
            <p className="mt-4 text-sm sm:text-base tracking-widest text-white/80">SCROLL TO DISCOVER</p>
          </motion.div>
        </div>
      </section>

      {/* Footer reveal at the end of the parallax scroll */}
      <section className="w-full bg-linear-to-t from-black/60 to-[#894d2e] absolute bottom-0">
        <div className="mx-auto w-full">
          <Footer locale={locale} />
        </div>
      </section>
    </section>
  );
}
