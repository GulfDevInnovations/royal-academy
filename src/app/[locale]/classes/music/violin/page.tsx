"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  musicCtaTextClass,
  musicHelperTextClass,
  musicTypography,
} from "@/lib/musicTypography";

const WAVEFORM_BAR_COUNT = 28;
const WAVEFORM_IDLE_BARS = Array.from(
  { length: WAVEFORM_BAR_COUNT },
  () => 0.18,
);

const GLASS_CARD_STYLE = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  borderColor: "rgba(217,192,161,0.22)",
  boxShadow: "0 18px 42px rgba(0,0,0,0.30)",
} as const;

const TEXT_HIGHLIGHT_STYLE = {
  background: "rgba(43,25,18,0.48)",
  padding: "0.06rem 0.32rem",
  borderRadius: "0.35rem",
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
} as const;

const VIOLIN_SPARKLES = [
  { id: "sparkle-1", left: "8%", top: "10%", size: "0.3rem", delay: "0s", duration: "4.2s" },
  { id: "sparkle-2", left: "16%", top: "18%", size: "0.22rem", delay: "0.8s", duration: "5s" },
  { id: "sparkle-3", left: "26%", top: "9%", size: "0.18rem", delay: "1.4s", duration: "4.6s" },
  { id: "sparkle-4", left: "34%", top: "22%", size: "0.26rem", delay: "0.3s", duration: "5.4s" },
  { id: "sparkle-5", left: "44%", top: "12%", size: "0.34rem", delay: "1.7s", duration: "4.8s" },
  { id: "sparkle-6", left: "56%", top: "14%", size: "0.2rem", delay: "0.5s", duration: "5.2s" },
  { id: "sparkle-7", left: "66%", top: "20%", size: "0.28rem", delay: "1.1s", duration: "4.4s" },
  { id: "sparkle-8", left: "76%", top: "11%", size: "0.18rem", delay: "0.2s", duration: "5.6s" },
  { id: "sparkle-9", left: "86%", top: "17%", size: "0.3rem", delay: "1.9s", duration: "4.9s" },
  { id: "sparkle-10", left: "14%", top: "34%", size: "0.18rem", delay: "0.6s", duration: "5.1s" },
  { id: "sparkle-11", left: "28%", top: "42%", size: "0.24rem", delay: "1.5s", duration: "4.5s" },
  { id: "sparkle-12", left: "72%", top: "38%", size: "0.22rem", delay: "0.9s", duration: "5.3s" },
  { id: "sparkle-13", left: "84%", top: "46%", size: "0.18rem", delay: "1.2s", duration: "4.7s" },
  { id: "sparkle-14", left: "11%", top: "14%", size: "0.16rem", delay: "0.4s", duration: "4.9s" },
  { id: "sparkle-15", left: "20%", top: "26%", size: "0.28rem", delay: "1.1s", duration: "5.2s" },
  { id: "sparkle-16", left: "31%", top: "15%", size: "0.2rem", delay: "1.8s", duration: "4.4s" },
  { id: "sparkle-17", left: "39%", top: "31%", size: "0.18rem", delay: "0.7s", duration: "5.5s" },
  { id: "sparkle-18", left: "48%", top: "24%", size: "0.26rem", delay: "1.3s", duration: "4.6s" },
  { id: "sparkle-19", left: "53%", top: "8%", size: "0.16rem", delay: "0.1s", duration: "5.1s" },
  { id: "sparkle-20", left: "61%", top: "29%", size: "0.24rem", delay: "1.6s", duration: "4.7s" },
  { id: "sparkle-21", left: "69%", top: "13%", size: "0.18rem", delay: "0.5s", duration: "5.4s" },
  { id: "sparkle-22", left: "78%", top: "27%", size: "0.26rem", delay: "1s", duration: "4.8s" },
  { id: "sparkle-23", left: "89%", top: "23%", size: "0.16rem", delay: "1.7s", duration: "5.2s" },
  { id: "sparkle-24", left: "22%", top: "48%", size: "0.18rem", delay: "0.2s", duration: "4.5s" },
  { id: "sparkle-25", left: "58%", top: "41%", size: "0.22rem", delay: "1.4s", duration: "5.3s" },
  { id: "sparkle-26", left: "76%", top: "44%", size: "0.2rem", delay: "0.9s", duration: "4.9s" },
] as const;

function GlassControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="liquid-glass-gold shimmer inline-flex h-8 w-8 items-center justify-center rounded-full text-royal-gold transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-gold/70"
    >
      {children}
    </button>
  );
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function AudioWaveform({ bars }: { bars: number[] }) {
  return (
    <div
      aria-hidden="true"
      className="mt-3 flex h-8 items-end justify-between gap-[3px]"
    >
      {bars.map((bar, index) => (
        <span
          key={index}
          className="block flex-1 rounded-full bg-[linear-gradient(180deg,rgba(245,228,198,0.92)_0%,rgba(226,195,146,0.8)_50%,rgba(174,129,78,0.5)_100%)] shadow-[0_0_10px_rgba(226,195,146,0.18)]"
          style={{
            height: `${Math.max(16, Math.min(100, bar * 100))}%`,
            opacity: Math.max(0.45, bar),
          }}
        />
      ))}
    </div>
  );
}

function ViolinSparkles() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      style={{ direction: "ltr" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,244,211,0.16)_0%,rgba(255,244,211,0.05)_26%,transparent_58%)]" />
      {VIOLIN_SPARKLES.map((sparkle) => (
        <span
          key={sparkle.id}
          className="violin-sparkle absolute block rounded-full"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: sparkle.delay,
            animationDuration: sparkle.duration,
          }}
        >
          <span className="violin-sparkle-cross" />
        </span>
      ))}
    </div>
  );
}

export default function ViolinPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const reservationHref = `/${locale}/reservation`;
  const content = isArabic
    ? {
        paragraph:
          "نشأ الكمان في إيطاليا خلال القرن السادس عشر، وتطوّر من آلات وترية مقوّسة أقدم، ثم بلغ كماله على يد صنّاع بارعين مثل أنطونيو ستراديفاري، ليصبح واحداً من أكثر الآلات تعبيراً في الموسيقى الكلاسيكية. ومع مرور الوقت، أخذ مكانة محورية في الأوركسترا والعزف المنفرد، واشتهر بقدرته على نقل المشاعر العميقة. ومن أجمل الأمثلة على هذه القوة التعبيرية مقطوعة تأمل من أوبرا تاييس لجول ماسينيه، وهي من أكثر أعمال الكمان رومانسية، وتتميّز بلحنها الحالم الرقيق وطابعها العاطفي الشغوف الذي يجسّد أناقة الكمان وعمقه الوجداني. 🎻",
        reserveHelper: "احجز تجربتك مع الكمان",
        reserveCta: "احجز الآن",
      }
    : {
        paragraph:
          "The Violin originated in 16th-century Italy, evolving from earlier bowed instruments, and was perfected by master makers like Antonio Stradivari, becoming one of the most expressive instruments in classical music. Over time, it took a central role in orchestras and solo performances, admired for its ability to convey deep emotion. A beautiful example of this expressive power is Meditation from Thaïs by Jules Massenet, one of the most romantic violin pieces ever written, known for its soft, dreamy melody and passionate character that captures the elegance and emotional depth of the violin. 🎻",
        reserveHelper: "Reserve your violin experience",
        reserveCta: "Reserve Now",
      };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>(WAVEFORM_IDLE_BARS);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncDuration = () => {
      const nextDuration =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : audio.seekable.length > 0
            ? audio.seekable.end(audio.seekable.length - 1)
            : 0;

      if (nextDuration > 0) {
        setDuration(nextDuration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      startWaveform();
    };
    const handlePause = () => {
      setIsPlaying(false);
      stopWaveform();
    };
    const handleTimeUpdate = () => {
      syncDuration();
      setCurrentTime(audio.currentTime);
      setSliderValue(audio.currentTime);
    };
    const handleLoadedMetadata = () => {
      syncDuration();
      setCurrentTime(audio.currentTime);
      setSliderValue(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      setSliderValue(0);
      stopWaveform();
    };

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("durationchange", syncDuration);
    audio.addEventListener("canplay", syncDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("durationchange", syncDuration);
      audio.removeEventListener("canplay", syncDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  const stopWaveform = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setWaveformBars(WAVEFORM_IDLE_BARS);
  };

  const startWaveform = () => {
    const analyser = analyserRef.current;
    const frequencyData = frequencyDataRef.current;
    if (!analyser || !frequencyData) return;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    const updateWaveform = () => {
      analyser.getByteFrequencyData(frequencyData);

      const nextBars = Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
        const start = Math.floor((index * frequencyData.length) / WAVEFORM_BAR_COUNT);
        const end = Math.floor(((index + 1) * frequencyData.length) / WAVEFORM_BAR_COUNT);
        let total = 0;

        for (let cursor = start; cursor < end; cursor += 1) {
          total += frequencyData[cursor] ?? 0;
        }

        const average = total / Math.max(1, end - start);
        const normalized = average / 255;
        return 0.18 + normalized * 0.82;
      });

      setWaveformBars(nextBars);
      animationFrameRef.current = window.requestAnimationFrame(updateWaveform);
    };

    animationFrameRef.current = window.requestAnimationFrame(updateWaveform);
  };

  const ensureAudioAnalysis = async () => {
    const audio = audioRef.current;
    if (!audio) return;

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

    if (!analyserRef.current) {
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.82;
      analyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(
        new ArrayBuffer(analyser.frequencyBinCount),
      );
    }

    if (!sourceNodeRef.current && analyserRef.current) {
      const source = audioContextRef.current.createMediaElementSource(audio);
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      sourceNodeRef.current = source;
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
  };

  const playAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    await ensureAudioAnalysis();
    await audio.play();

    const nextDuration =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : audio.seekable.length > 0
          ? audio.seekable.end(audio.seekable.length - 1)
          : 0;

    if (nextDuration > 0) {
      setDuration(nextDuration);
    }
  };

  const pauseAudio = () => {
    audioRef.current?.pause();
  };

  const progress = useMemo(() => {
    if (!duration) return 0;
    return (sliderValue / duration) * 100;
  }, [sliderValue, duration]);

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    setSliderValue(value);
    setCurrentTime(value);
    audio.currentTime = value;
  };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/violin.png')", direction: "ltr" }}
    >
      <audio
        ref={audioRef}
        preload="auto"
        src="/images/Meditation-from-Thaïs320k.mp3"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.18)_68%,rgba(0,0,0,0.38)_100%)]" />
      <ViolinSparkles />

      <section
        className="relative z-20 hidden min-h-screen px-6 pb-12 pt-24 lg:block xl:px-10 xl:pt-28"
        style={{ direction: "ltr" }}
      >
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-8 xl:gap-12">
          <div
            className="font-goudy flex w-[min(16rem,24vw)] min-w-[13.5rem] flex-col items-center gap-4 xl:w-[min(17rem,22vw)]"
            dir="ltr"
          >
            <p
              className={`max-w-[14rem] text-center ${musicTypography.captionCaps} text-royal-cream/88`}
            >
              Meditation from Thaïs-Jules Massenet
            </p>

            <div className="liquid-glass flex items-center gap-2 rounded-full px-3 py-2">
              <GlassControlButton label="Play track" onClick={playAudio}>
                <Play size={12} className={isPlaying ? "text-royal-cream" : ""} />
              </GlassControlButton>
              <GlassControlButton label="Pause track" onClick={pauseAudio}>
                <Pause
                  size={12}
                  className={!isPlaying ? "text-royal-cream" : ""}
                />
              </GlassControlButton>
            </div>

            <div className="liquid-glass w-full max-w-[15rem] rounded-[1.1rem] px-3 py-2 xl:max-w-[16rem]">
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={sliderValue}
                onInput={(event) =>
                  handleSeek(Number((event.target as HTMLInputElement).value))
                }
                onChange={(event) =>
                  handleSeek(Number((event.target as HTMLInputElement).value))
                }
                className="solfege-slider h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#e2c392]"
                style={{
                  background: `linear-gradient(90deg, rgba(226,195,146,0.95) 0%, rgba(226,195,146,0.95) ${progress}%, rgba(255,255,255,0.18) ${progress}%, rgba(255,255,255,0.18) 100%)`,
                }}
                aria-label="Audio progress"
              />
              <AudioWaveform bars={waveformBars} />
              <div
                className={`mt-2 flex items-center justify-between ${musicTypography.metaCaps} text-royal-cream/75`}
              >
                <span>{formatTime(currentTime)}</span>
                <span>{progress ? `${Math.round(progress)}%` : "0%"}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-[23.5rem] shrink-0 xl:max-w-[24.5rem]">
            <div
              className="rounded-[1.65rem] border px-4.5 py-4.5 sm:px-5 sm:py-5"
              style={GLASS_CARD_STYLE}
              dir={isArabic ? "rtl" : "ltr"}
            >
              <p
                className={`${musicTypography.body} text-royal-cream/90 ${
                  isArabic ? "text-right" : ""
                }`}
              >
                <span style={TEXT_HIGHLIGHT_STYLE}>{content.paragraph}</span>
              </p>

              <div
                className={`mt-4 flex flex-col gap-3 ${
                  isArabic ? "items-end" : "items-start"
                }`}
              >
                <p
                  className={`${musicHelperTextClass(isArabic)} text-royal-gold/65 ${
                    isArabic ? "text-right" : ""
                  }`}
                >
                  <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
                </p>
                <Link
                  href={reservationHref}
                  className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4.5 py-2 ${musicCtaTextClass(
                    isArabic,
                  )} text-[#2b1912] transition-transform duration-300 hover:scale-[1.03]`}
                >
                  {content.reserveCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-24 sm:px-6 lg:hidden"
        style={{ direction: "ltr" }}
      >
        <div
          className="font-goudy flex w-full max-w-[18rem] flex-col items-center gap-4 sm:max-w-[20rem]"
          dir="ltr"
        >
          <p
            className={`max-w-[16rem] text-center ${musicTypography.captionCaps} text-royal-cream/88`}
          >
            Meditation from Thaïs-Jules Massenet
          </p>

          <div className="liquid-glass flex items-center gap-2 rounded-full px-3 py-2">
            <GlassControlButton label="Play track" onClick={playAudio}>
              <Play size={12} className={isPlaying ? "text-royal-cream" : ""} />
            </GlassControlButton>
            <GlassControlButton label="Pause track" onClick={pauseAudio}>
              <Pause
                size={12}
                className={!isPlaying ? "text-royal-cream" : ""}
              />
            </GlassControlButton>
          </div>

          <div className="liquid-glass w-full rounded-[1.1rem] px-3 py-2">
            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={sliderValue}
              onInput={(event) =>
                handleSeek(Number((event.target as HTMLInputElement).value))
              }
              onChange={(event) =>
                handleSeek(Number((event.target as HTMLInputElement).value))
              }
              className="solfege-slider h-1.5 w-full cursor-pointer appearance-none rounded-full accent-[#e2c392]"
              style={{
                background: `linear-gradient(90deg, rgba(226,195,146,0.95) 0%, rgba(226,195,146,0.95) ${progress}%, rgba(255,255,255,0.18) ${progress}%, rgba(255,255,255,0.18) 100%)`,
              }}
              aria-label="Audio progress"
            />
            <AudioWaveform bars={waveformBars} />
            <div
              className={`mt-2 flex items-center justify-between ${musicTypography.metaCaps} text-royal-cream/75`}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{progress ? `${Math.round(progress)}%` : "0%"}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div
            className="w-full rounded-[1.65rem] border px-4.5 py-4.5"
            style={GLASS_CARD_STYLE}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <p
              className={`${musicTypography.body} text-royal-cream/90 ${
                isArabic ? "text-right" : ""
              }`}
            >
              <span style={TEXT_HIGHLIGHT_STYLE}>{content.paragraph}</span>
            </p>

            <div
              className={`mt-4 flex flex-col gap-3 ${
                isArabic ? "items-end" : "items-start"
              }`}
            >
              <p
                className={`${musicHelperTextClass(isArabic)} text-royal-gold/65 ${
                  isArabic ? "text-right" : ""
                }`}
              >
                <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
              </p>
              <Link
                href={reservationHref}
                className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4.5 py-2 ${musicCtaTextClass(
                  isArabic,
                )} text-[#2b1912] transition-transform duration-300 hover:scale-[1.03]`}
              >
                {content.reserveCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .violin-sparkle {
          background: radial-gradient(
            circle,
            rgba(255, 251, 238, 0.95) 0%,
            rgba(255, 233, 187, 0.82) 45%,
            rgba(255, 210, 132, 0.18) 78%,
            transparent 100%
          );
          box-shadow:
            0 0 16px rgba(255, 234, 193, 0.35),
            0 0 28px rgba(255, 196, 115, 0.18);
          opacity: 0.15;
          transform: scale(0.5);
          animation: violin-sparkle 4.8s ease-in-out infinite;
        }

        .violin-sparkle-cross {
          position: absolute;
          inset: 50%;
          width: 240%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 246, 226, 0.95) 50%,
            transparent 100%
          );
          transform: translate(-50%, -50%);
        }

        .violin-sparkle-cross::after {
          content: "";
          position: absolute;
          inset: 50%;
          width: 1px;
          height: 240%;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(255, 246, 226, 0.95) 50%,
            transparent 100%
          );
          transform: translate(-50%, -50%);
        }

        @keyframes violin-sparkle {
          0%,
          100% {
            opacity: 0.08;
            transform: scale(0.45) translateY(0);
          }

          35% {
            opacity: 0.9;
            transform: scale(1) translateY(-2px);
          }

          55% {
            opacity: 0.35;
            transform: scale(0.72) translateY(0);
          }
        }

        .solfege-slider {
          -webkit-appearance: none;
          appearance: none;
        }

        .solfege-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 9999px;
          background: transparent;
        }

        .solfege-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          cursor: grab;
          width: 16px;
          height: 16px;
          margin-top: -5px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 243, 220, 0.78);
          background: radial-gradient(
            circle at 35% 35%,
            rgba(255, 251, 241, 0.98) 0%,
            rgba(236, 206, 159, 0.96) 55%,
            rgba(174, 129, 78, 0.96) 100%
          );
          box-shadow:
            0 0 0 3px rgba(255, 255, 255, 0.08),
            0 6px 14px rgba(0, 0, 0, 0.28);
        }

        .solfege-slider::-moz-range-track {
          height: 6px;
          border-radius: 9999px;
          background: transparent;
        }

        .solfege-slider::-moz-range-thumb {
          cursor: grab;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          border: 1px solid rgba(255, 243, 220, 0.78);
          background: radial-gradient(
            circle at 35% 35%,
            rgba(255, 251, 241, 0.98) 0%,
            rgba(236, 206, 159, 0.96) 55%,
            rgba(174, 129, 78, 0.96) 100%
          );
          box-shadow:
            0 0 0 3px rgba(255, 255, 255, 0.08),
            0 6px 14px rgba(0, 0, 0, 0.28);
        }

        @media (prefers-reduced-motion: reduce) {
          .violin-sparkle {
            animation: none;
            opacity: 0.2;
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
