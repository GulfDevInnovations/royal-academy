"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const INHALE_MS = 4000;
const HOLD_MS = 7000;
const EXHALE_MS = 8000;
const CUE_LEAD_MS = 450;
const TOTAL_CYCLES = 4;
const ARCH_START_X = 14;
const ARCH_END_X = 86;
const ARCH_BASE_Y = 62;
const ARCH_RADIUS = 36;
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

type Phase = "idle" | "inhale" | "hold" | "exhale";

function getPointOnArch(progress: number) {
  const clamped = Math.max(0, Math.min(1, progress));
  const angle = Math.PI - clamped * Math.PI;

  return {
    x: 50 + ARCH_RADIUS * Math.cos(angle),
    y: ARCH_BASE_Y - ARCH_RADIUS * Math.sin(angle),
  };
}

export default function VocalPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const runIdRef = useRef(0);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pointerProgress, setPointerProgress] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);
  const reservationHref = `/${locale}/reservation/sub-vocal`;

  const content = isArabic
    ? {
        title: "مدرّب التنفس الصوتي",
        warmupTitle: "تقنية الإحماء 4-7-8",
        start: "ابدأ",
        stop: "أوقف",
        inhale: "شهيق",
        hold: "احبس",
        exhale: "زفير",
        idle: "اضغط ابدأ",
        outOf: "من",
        paragraph:
          "انضم إلى صفوف الغناء لدينا، حيث نوجّه الطلاب لتطوير أصواتهم، وتقنياتهم، وثقتهم من خلال تدريب منظم وتمارين ممتعة. هنا ستتعلم التحكم في التنفس باستخدام الحجاب الحاجز، وتقوية الصوت عبر الإحماء والسلالم الموسيقية، وتحسين الطبقة والأذن الموسيقية. ومع التركيز على النبرة وتموضع الصوت، ستكتشف كيف تُنتج صوتًا واضحًا وغنيًا وتطبّق هذه المهارات على أغانٍ حقيقية. وإلى جانب التقنية، تركز حصصنا على التعبير والأداء لتساعدك على تقديم الإحساس والأسلوب والثقة في كل نغمة تغنيها. 🎤✨",
        reserveHelper: "احجز تجربتك الصوتية",
        reserveCta: "اذهب إلى الحجز",
      }
    : {
        title: "Vocal Breathing Trainer",
        warmupTitle: "4-7-8 warm-up technique",
        start: "Start",
        stop: "Stop",
        inhale: "Inhale",
        hold: "Hold",
        exhale: "Exhale",
        idle: "Press start",
        outOf: "out of",
        paragraph:
          "Step into our vocal classes, where students are guided to develop their voice, technique, and confidence through structured practice and engaging exercises. Here, you will learn to control your breathing using the diaphragm, strengthen your voice through warm-ups and scales, and improve your pitch and musical ear. With a focus on tone and voice placement, you'll discover how to produce a clear, rich sound while applying these skills to real songs. Beyond technique, our classes emphasize expression and performance, helping you bring emotion, style, and confidence to every note you sing. 🎤✨",
        reserveHelper: "Reserve your vocal experience",
        reserveCta: "Go to reservation",
      };

  const pointer = useMemo(
    () => getPointOnArch(pointerProgress),
    [pointerProgress],
  );

  const phaseLabel =
    phase === "inhale"
      ? content.inhale
      : phase === "hold"
        ? content.hold
        : phase === "exhale"
          ? content.exhale
          : content.idle;
  const displayedCycle = completedCycles === 0 ? 1 : completedCycles;

  useEffect(() => {
    const ambientAudio = ambientAudioRef.current;
    const audioContext = audioContextRef.current;

    return () => {
      runIdRef.current += 1;
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
      timeoutIdsRef.current = [];
      ambientAudio?.pause();
      if (ambientAudio) {
        ambientAudio.currentTime = 0;
      }
      audioContext?.close().catch(() => undefined);
    };
  }, []);

  const clearPendingWork = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  const startAmbientAudio = async () => {
    const audio = ambientAudioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.volume = 0.42;
    audio.loop = true;

    try {
      await audio.play();
    } catch {
      // Ignore blocked autoplay errors if the browser rejects playback.
    }
  };

  const stopAmbientAudio = () => {
    const audio = ambientAudioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
  };

  const stopSequence = (resetPointer = true) => {
    runIdRef.current += 1;
    clearPendingWork();
    stopAmbientAudio();
    setIsRunning(false);
    setPhase("idle");
    setCompletedCycles(0);
    if (resetPointer) {
      setPointerProgress(0);
    }
  };

  const waitFor = (ms: number, runId: number) =>
    new Promise<boolean>((resolve) => {
      const id = window.setTimeout(() => {
        timeoutIdsRef.current = timeoutIdsRef.current.filter(
          (timeoutId) => timeoutId !== id,
        );
        resolve(runIdRef.current === runId);
      }, ms);

      timeoutIdsRef.current.push(id);
    });

  const animatePointer = (from: number, to: number, duration: number, runId: number) =>
    new Promise<boolean>((resolve) => {
      const startTime = performance.now();

      const step = (timestamp: number) => {
        if (runIdRef.current !== runId) {
          resolve(false);
          return;
        }

        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / duration);
        const nextValue = from + (to - from) * progress;
        setPointerProgress(nextValue);

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(step);
          return;
        }

        animationFrameRef.current = null;
        resolve(true);
      };

      animationFrameRef.current = window.requestAnimationFrame(step);
    });

  const playCueNote = async () => {
    const AudioContextCtor =
      window.AudioContext ||
      (
        window as Window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextCtor) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    const context = audioContextRef.current;
    if (context.state === "suspended") {
      await context.resume();
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const overtone = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(220, now);

    overtone.type = "triangle";
    overtone.frequency.setValueAtTime(220 * 2.01, now);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(0.75, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

    oscillator.connect(filter);
    overtone.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    overtone.start(now);
    oscillator.stop(now + 1.05);
    overtone.stop(now + 1.05);
  };

  const runSequence = async () => {
    if (isRunning) return;

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    clearPendingWork();
    setIsRunning(true);
    setPhase("idle");
    setPointerProgress(0);
    setCompletedCycles(0);
    await startAmbientAudio();

    for (let cycle = 1; cycle <= TOTAL_CYCLES; cycle += 1) {
      if (runIdRef.current !== runId) return;

      setPointerProgress(0);
      await playCueNote();

      if (!(await waitFor(CUE_LEAD_MS, runId))) return;

      setPhase("inhale");
      if (!(await animatePointer(0, 0.5, INHALE_MS, runId))) return;

      setPointerProgress(0.5);
      await playCueNote();
      if (!(await waitFor(CUE_LEAD_MS, runId))) return;

      setPhase("hold");
      if (!(await waitFor(HOLD_MS, runId))) return;

      await playCueNote();
      if (!(await waitFor(CUE_LEAD_MS, runId))) return;

      setPhase("exhale");
      if (!(await animatePointer(0.5, 1, EXHALE_MS, runId))) return;
      setCompletedCycles(cycle);
    }

    if (runIdRef.current !== runId) return;

    setIsRunning(false);
    setPhase("idle");
    setPointerProgress(0);
    stopAmbientAudio();
  };

  const handleToggle = () => {
    if (isRunning) {
      stopSequence();
      return;
    }

    void runSequence();
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,240,214,0.18)_0%,rgba(40,21,14,0.88)_42%,rgba(10,8,14,1)_100%)] px-4 py-8 text-royal-cream sm:px-6 sm:py-10 lg:px-8 xl:px-10">
      <section
        className={`mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col items-center justify-center gap-6 lg:gap-8 lg:justify-between xl:gap-10 ${
          isArabic ? "lg:flex-row-reverse" : "lg:flex-row"
        }`}
      >
        <div
          className="order-2 w-full max-w-[22rem] rounded-[1.6rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_100%)] px-4 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:max-w-sm sm:px-5 sm:py-6 lg:order-1"
          dir={isArabic ? "rtl" : "ltr"}
        >
          <audio ref={ambientAudioRef} src="/images/vocal.mp3" preload="auto" />

          <div className="mx-auto max-w-3xl text-center">
            <h1
              className={`font-goudy text-[1.6rem] text-royal-cream sm:text-[1.36rem] ${
                isArabic ? "" : "uppercase"
              }`}
            >
              {content.warmupTitle}
            </h1>
          </div>

          <div className="mt-2 flex flex-col items-center justify-center gap-4">
            <div className="flex min-h-8 flex-wrap items-center justify-center gap-2">
              <span
                className={`rounded-full border border-royal-gold/20 bg-white/5 px-4 py-1.5 text-royal-cream sm:text-xs ${
                  isArabic
                    ? "text-[0.84rem] leading-5"
                    : "text-[0.68rem] uppercase tracking-[0.24em]"
                }`}
              >
                {phaseLabel}
              </span>

              <button
                type="button"
                onClick={handleToggle}
                className={`liquid-glass-gold shimmer inline-flex min-w-24 items-center justify-center rounded-full px-4 py-2 font-goudy text-royal-cream transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-gold/70 ${
                  isArabic
                    ? "text-[0.84rem] leading-5"
                    : "text-[0.68rem] uppercase tracking-[0.2em]"
                }`}
              >
                {isRunning ? content.stop : content.start}
              </button>
            </div>

            <p
              className={`text-royal-cream/72 sm:text-xs ${
                isArabic
                  ? "text-[0.84rem] leading-5"
                  : "text-[0.68rem] uppercase tracking-[0.22em]"
              }`}
            >
              {displayedCycle} {content.outOf} {TOTAL_CYCLES}
            </p>

            <div className="-mt-[26px] w-full max-w-[15rem] sm:max-w-[18rem]">
              <svg
                viewBox="0 0 100 84"
                role="img"
                aria-label={content.title}
                className="h-auto w-full overflow-visible"
              >
                <defs>
                  <linearGradient id="vocal-arch-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(214,181,139,0.32)" />
                    <stop offset="50%" stopColor="rgba(255,235,205,0.85)" />
                    <stop offset="100%" stopColor="rgba(214,181,139,0.32)" />
                  </linearGradient>
                  <linearGradient id="vocal-hold-glass-fill" x1="18%" y1="18%" x2="82%" y2="82%">
                    <stop offset="0%" stopColor="rgba(196, 168, 130, 0.18)" />
                    <stop offset="50%" stopColor="rgba(196, 168, 130, 0.07)" />
                    <stop offset="100%" stopColor="rgba(196, 168, 130, 0.14)" />
                  </linearGradient>
                  <filter id="vocal-pointer-glow" x="-120%" y="-120%" width="340%" height="340%">
                    <feGaussianBlur stdDeviation="2.6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <path
                  d={`M ${ARCH_START_X} ${ARCH_BASE_Y} A ${ARCH_RADIUS} ${ARCH_RADIUS} 0 0 1 ${ARCH_END_X} ${ARCH_BASE_Y}`}
                  fill="none"
                  stroke="url(#vocal-arch-stroke)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <path
                  d={`M ${ARCH_START_X} ${ARCH_BASE_Y} A ${ARCH_RADIUS} ${ARCH_RADIUS} 0 0 1 ${ARCH_END_X} ${ARCH_BASE_Y}`}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeDasharray="1.4 5"
                />

                <circle
                  cx={pointer.x}
                  cy={pointer.y}
                  r="3.6"
                  fill="rgba(255, 244, 217, 0.96)"
                  stroke="rgba(219, 184, 129, 0.85)"
                  strokeWidth="0.8"
                  filter="url(#vocal-pointer-glow)"
                />

                <circle
                  cx="50"
                  cy="49"
                  r="12.2"
                  className={phase === "hold" ? "vocal-hold-orb is-active" : "vocal-hold-orb"}
                />

              </svg>
            </div>
          </div>
        </div>

        <div className="order-1 w-full max-w-[28rem] lg:order-2 lg:max-w-[31rem] xl:max-w-[36rem]">
          <div
            className="rounded-[1.65rem] border px-4 py-4 sm:px-5 sm:py-5"
            style={GLASS_CARD_STYLE}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <p
              className={`text-[16px] leading-[1.8rem] text-royal-cream/90 sm:text-[18px] sm:leading-[2rem] ${
                isArabic ? "text-right" : ""
              }`}
            >
              {content.paragraph}
            </p>

            <div
              className={`mt-4 flex w-full flex-col gap-3 ${
                isArabic ? "items-end text-right" : "items-start"
              }`}
            >
              <p
                className={`w-full text-[10px] text-royal-gold/65 ${
                  isArabic ? "text-right leading-5" : "uppercase tracking-[0.22em]"
                }`}
              >
                <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
              </p>
              <Link
                href={reservationHref}
                className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4.5 py-2 text-[10px] font-medium text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] ${
                  isArabic ? "self-end text-right leading-5" : "uppercase tracking-[0.2em]"
                }`}
              >
                {content.reserveCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .vocal-hold-orb {
          fill: url(#vocal-hold-glass-fill);
          stroke: transparent;
          stroke-width: 0;
          transform-origin: 50px 49px;
          filter:
            drop-shadow(0 8px 18px rgba(0, 0, 0, 0.25))
            drop-shadow(0 0 12px rgba(196, 168, 130, 0.14));
          opacity: 1;
          transition:
            stroke 240ms ease,
            opacity 240ms ease,
            filter 240ms ease;
        }

        .vocal-hold-orb.is-active {
          stroke: transparent;
          filter:
            drop-shadow(0 8px 18px rgba(0, 0, 0, 0.25))
            drop-shadow(0 0 18px rgba(255, 236, 196, 0.46))
            drop-shadow(0 0 42px rgba(196, 168, 130, 0.34));
          animation: vocal-hold-pulse 1.4s ease-in-out infinite;
        }

        @keyframes vocal-hold-pulse {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.62;
            filter:
              drop-shadow(0 8px 18px rgba(0, 0, 0, 0.25))
              drop-shadow(0 0 12px rgba(255, 234, 194, 0.24))
              drop-shadow(0 0 24px rgba(236, 194, 124, 0.18));
          }

          50% {
            transform: scale(1.26);
            opacity: 1;
            filter:
              drop-shadow(0 8px 18px rgba(0, 0, 0, 0.25))
              drop-shadow(0 0 24px rgba(255, 243, 221, 0.64))
              drop-shadow(0 0 52px rgba(242, 204, 141, 0.46));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .vocal-hold-orb.is-active {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
