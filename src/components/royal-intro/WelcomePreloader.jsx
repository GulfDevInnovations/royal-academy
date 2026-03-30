"use client";

import { useEffect, useState } from "react";

/**
 * WelcomePreloader
 * ─────────────────────────────────────────────────────────
 * Drop-in replacement for the LOGO PRELOADER block.
 *
 * Props
 *   onComplete  – called once the overlay has fully faded out
 *   duration    – ms to keep overlay visible after letters finish  (default 800)
 */
export default function WelcomePreloader({ onComplete, duration = 800 }) {
  const WORD = "Welcome";
  const LETTER_DELAY = 110; // ms between each letter appearing
  const FADE_START = 400; // ms after last letter before overlay fades

  const [visibleCount, setVisibleCount] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [gone, setGone] = useState(false);

  /* ── letter reveal ── */
  useEffect(() => {
    if (visibleCount >= WORD.length) return;
    const t = setTimeout(
      () => setVisibleCount((c) => c + 1),
      visibleCount === 0 ? 600 : LETTER_DELAY, // first letter waits a beat
    );
    return () => clearTimeout(t);
  }, [visibleCount]);

  /* ── exit sequence ── */
  useEffect(() => {
    if (visibleCount < WORD.length) return;
    const t1 = setTimeout(() => setExiting(true), FADE_START);
    const t2 = setTimeout(() => {
      setGone(true);
      onComplete?.();
    }, FADE_START + 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visibleCount]);

  if (gone) return null;

  return (
    <>
      <style>{`
        /* ── overlay ── */
        .wpl-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
          transition: opacity 0.85s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .wpl-overlay.exiting { opacity: 0; }

        /* ── ambient glow behind the pill ── */
        .wpl-glow {
          position: absolute;
          width: min(520px, 90vw);
          height: min(180px, 30vw);
          border-radius: 50%;
          background: radial-gradient(
            ellipse at center,
            rgba(255,255,255,0.10) 0%,
            rgba(255,255,255,0.04) 45%,
            transparent 70%
          );
          filter: blur(40px);
          pointer-events: none;
        }

        /* ── glass pill ── */
        .wpl-pill {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(18px, 3vw, 28px) clamp(40px, 7vw, 80px);
          border-radius: 999px;

          /* glass fill — matches your liquid-glass palette */
          background: linear-gradient(
            145deg,
            rgba(255,255,255,0.18) 0%,
            rgba(255,255,255,0.10) 40%,
            rgba(255,255,255,0.07) 70%,
            rgba(255,255,255,0.12) 100%
          );
          backdrop-filter: blur(60px) saturate(1.8) brightness(1.1) contrast(1.04);
          -webkit-backdrop-filter: blur(60px) saturate(1.8) brightness(1.1) contrast(1.04);
          border: 0.5px solid transparent;
          box-shadow:
            0 8px 48px rgba(0,0,0,0.55),
            0 2px 8px  rgba(0,0,0,0.30),
            inset  0.2px  0.5px 0px rgba(255,255,255,0.08),
            inset  0      0.3px 0px rgba(255,255,255,0.38),
            inset  0.3px  0     0px rgba(255,255,255,0.32),
            inset -1px   -1px   0px rgba(255,255,255,0.06),
            inset  0     -1px   1px rgba(0,0,0,0.22);
          isolation: isolate;
        }

        /* subtle specular ring — the iOS touch */
        .wpl-pill::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            160deg,
            rgba(255,255,255,0.22) 0%,
            transparent 55%
          );
          pointer-events: none;
        }

        /* ── word ── */
        .wpl-word {
          display: flex;
          gap: clamp(1px, 0.5vw, 4px);
          user-select: none;
        }

        /* ── individual letter ── */
        .wpl-letter {
          font-family: "Georgia", "Didot", "Big Caslon", serif;
          font-size: clamp(28px, 5vw, 52px);
          font-weight: 300;
          letter-spacing: clamp(0.12em, 1vw, 0.22em);
          color: rgba(255,255,255,0.92);
          text-shadow:
            0 0 30px rgba(255,255,255,0.35),
            0 1px  2px rgba(0,0,0,0.6);

          opacity: 0;
          transform: translateY(6px) scale(0.96);
          transition:
            opacity  0.55s cubic-bezier(0.16, 1, 0.3, 1),
            transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: opacity, transform;
        }
        .wpl-letter.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* ── thin decorative line below ── */
        .wpl-line {
          position: absolute;
          bottom: -24px;
          left: 50%;
          transform: translateX(-50%) scaleX(0);
          width: 48px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,0.5),
            transparent
          );
          transform-origin: center;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
        }
        .wpl-pill:has(.visible) .wpl-line {
          transform: translateX(-50%) scaleX(1);
        }
      `}</style>

      <div className={`wpl-overlay${exiting ? " exiting" : ""}`}>
        <div className="wpl-glow" />

        <div className="wpl-pill">
          <div className="wpl-word" aria-label="Welcome">
            {WORD.split("").map((char, i) => (
              <span
                key={i}
                className={`wpl-letter${i < visibleCount ? " visible" : ""}`}
                style={{
                  transitionDelay: `${i * 18}ms`,
                }} /* stagger within the reveal */
              >
                {char}
              </span>
            ))}
          </div>
          <div className="wpl-line" />
        </div>
      </div>
    </>
  );
}
