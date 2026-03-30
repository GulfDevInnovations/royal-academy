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

const BASS_TRACK_SRC =
  "/images/Tame%20Impala-The%20Less%20I%20Know%20The%20Better%20(Original%20Instrumental)_320k.mp3";

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

const BASS_LASERS = [
  {
    id: "laser-1",
    left: "6%",
    top: "-10%",
    width: "0.55rem",
    height: "110vh",
    color: "rgba(255, 92, 146, 0.72)",
    duration: "8.5s",
    delay: "0s",
  },
  {
    id: "laser-2",
    left: "24%",
    top: "-8%",
    width: "0.42rem",
    height: "108vh",
    color: "rgba(110, 224, 255, 0.68)",
    duration: "10s",
    delay: "1.2s",
  },
  {
    id: "laser-3",
    left: "46%",
    top: "-12%",
    width: "0.6rem",
    height: "114vh",
    color: "rgba(255, 205, 107, 0.7)",
    duration: "7.8s",
    delay: "0.6s",
  },
  {
    id: "laser-4",
    left: "68%",
    top: "-10%",
    width: "0.45rem",
    height: "110vh",
    color: "rgba(198, 137, 255, 0.68)",
    duration: "9.4s",
    delay: "1.8s",
  },
  {
    id: "laser-5",
    left: "86%",
    top: "-14%",
    width: "0.5rem",
    height: "116vh",
    color: "rgba(94, 255, 188, 0.66)",
    duration: "8.9s",
    delay: "0.9s",
  },
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

function BassLasers() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      <div className="bass-laser-haze absolute inset-0" />
      {BASS_LASERS.map((laser) => (
        <span
          key={laser.id}
          className="bass-laser absolute block"
          style={{
            left: laser.left,
            top: laser.top,
            width: laser.width,
            height: laser.height,
            color: laser.color,
            animationDuration: laser.duration,
            animationDelay: laser.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function BassPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const reservationHref = `/${locale}/reservation`;
  const content = isArabic
    ? {
        paragraph:
          "تطورت آلة الباص غيتار في أوائل القرن العشرين عندما سعى الموسيقيون إلى بديل أكثر قابلية للحمل والتضخيم من الكونترباص الكبير. وبينما تعود جذورها إلى آلة الكونترباص المستخدمة في الموسيقى الكلاسيكية والجاز، فقد اشتهر الباص الكهربائي الحديث في خمسينيات القرن الماضي على يد ليو فندر، الذي قدّم أول غيتار باص كهربائي يُنتج على نطاق واسع. وقد سمح هذا الابتكار بسماع عازفي الباص بوضوح أكبر داخل الفرق الموسيقية، وحوّل دور الباص إلى عنصر أساسي في الإيقاع والغرووف. واليوم يُعد الباص عنصراً محورياً في أنماط موسيقية متعددة، من الجاز والفانك إلى الروك والبوب، إذ يمنح الموسيقى العمق والانسجام والنبض الأساسي الذي يدفعها إلى الأمام. 🎸",
        reserveHelper: "احجز تجربتك مع الباص",
        reserveCta: "احجز الآن",
      }
    : {
        paragraph:
          "The Bass guitar developed in the early 20th century as musicians sought a more portable and amplified alternative to the upright double bass. While its roots trace back to the double bass used in classical and jazz music, the modern electric bass was popularized in the 1950s by Leo Fender, who introduced the first mass-produced electric bass guitar. This innovation allowed bassists to be heard more clearly in bands and transformed the role of bass into a central element of rhythm and groove. Today, the bass is essential across genres-from jazz and funk to rock and pop-providing depth, harmony, and the foundational pulse that drives music forward. 🎸",
        reserveHelper: "Reserve your bass experience",
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

      const nextBars = Array.from(
        { length: WAVEFORM_BAR_COUNT },
        (_, index) => {
          const start = Math.floor(
            (index * frequencyData.length) / WAVEFORM_BAR_COUNT,
          );
          const end = Math.floor(
            ((index + 1) * frequencyData.length) / WAVEFORM_BAR_COUNT,
          );
          let total = 0;

          for (let cursor = start; cursor < end; cursor += 1) {
            total += frequencyData[cursor] ?? 0;
          }

          const average = total / Math.max(1, end - start);
          const normalized = average / 255;
          return 0.18 + normalized * 0.82;
        },
      );

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
      style={{ backgroundImage: "url('/images/bass.png')" }}
    >
      <audio ref={audioRef} preload="auto" src={BASS_TRACK_SRC} />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.18)_68%,rgba(0,0,0,0.38)_100%)]" />
      <BassLasers />

      <section className="relative z-20 hidden min-h-screen px-6 pb-12 pt-24 lg:block xl:px-10 xl:pt-28">
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-8 xl:gap-12">
          <div
            className="font-goudy flex w-[min(16rem,24vw)] min-w-[13.5rem] flex-col items-center gap-4 xl:w-[min(17rem,22vw)]"
            dir="ltr"
          >
            <p
              className={`max-w-[14rem] text-center ${musicTypography.captionCaps} text-royal-cream/88`}
            >
              Tame Impala-The Less I Know The Better
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
                className={`mt-4 flex w-full flex-col gap-3 ${
                  isArabic ? "items-end text-right" : "items-start"
                }`}
              >
                <p
                  className={`w-full ${musicHelperTextClass(isArabic)} text-royal-gold/65 ${
                    isArabic ? "text-right" : ""
                  }`}
                >
                  <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
                </p>
                <Link
                  href={reservationHref}
                  className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4.5 py-2 ${musicCtaTextClass(
                    isArabic,
                  )} text-[#2b1912] transition-transform duration-300 hover:scale-[1.03] ${
                    isArabic ? "self-end text-right" : ""
                  }`}
                >
                  {content.reserveCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-24 sm:px-6 lg:hidden">
        <div
          className="font-goudy flex w-full max-w-[18rem] flex-col items-center gap-4 sm:max-w-[20rem]"
          dir="ltr"
        >
          <p
            className={`max-w-[16rem] text-center ${musicTypography.captionCaps} text-royal-cream/88`}
          >
            Tame Impala-The Less I Know The Better
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
              className={`mt-4 flex w-full flex-col gap-3 ${
                isArabic ? "items-end text-right" : "items-start"
              }`}
            >
              <p
                className={`w-full ${musicHelperTextClass(isArabic)} text-royal-gold/65 ${
                  isArabic ? "text-right" : ""
                }`}
              >
                <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
              </p>
              <Link
                href={reservationHref}
                className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4.5 py-2 ${musicCtaTextClass(
                  isArabic,
                )} text-[#2b1912] transition-transform duration-300 hover:scale-[1.03] ${
                  isArabic ? "self-end text-right" : ""
                }`}
              >
                {content.reserveCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .bass-smoke-plume {
          background:
            radial-gradient(
              ellipse at 50% 55%,
              rgba(255, 255, 255, 0.42) 0%,
              rgba(232, 236, 244, 0.32) 22%,
              rgba(185, 196, 214, 0.24) 44%,
              rgba(132, 144, 166, 0.14) 62%,
              transparent 74%
            );
          filter: blur(28px);
          mix-blend-mode: screen;
          opacity: 0;
          transform: translate3d(0, 0, 0) scale(0.94);
          animation: bass-smoke-rise linear infinite;
        }

        .bass-smoke-floor {
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(205, 214, 229, 0.22) 38%,
            rgba(118, 127, 146, 0.18) 68%,
            rgba(30, 32, 42, 0.28) 100%
          );
          filter: blur(22px);
        }

        .bass-laser {
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, currentColor 0%, transparent 100%) 0%,
              color-mix(in srgb, currentColor 96%, white 4%) 18%,
              color-mix(in srgb, currentColor 88%, white 12%) 45%,
              color-mix(in srgb, currentColor 12%, transparent 88%) 100%
            );
          box-shadow:
            0 0 10px color-mix(in srgb, currentColor 70%, transparent 30%),
            0 0 22px color-mix(in srgb, currentColor 46%, transparent 54%),
            0 0 44px color-mix(in srgb, currentColor 22%, transparent 78%);
          filter: blur(0.4px);
          mix-blend-mode: screen;
          opacity: 0.62;
          transform-origin: 50% 0%;
          animation: bass-laser-sweep 9s ease-in-out infinite alternate;
        }

        .bass-laser-haze {
          background:
            radial-gradient(
              circle at 50% 10%,
              rgba(255, 255, 255, 0.08) 0%,
              rgba(255, 255, 255, 0.03) 22%,
              transparent 52%
            ),
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.02) 0%,
              rgba(0, 0, 0, 0.08) 100%
            );
          mix-blend-mode: screen;
          opacity: 0.42;
          animation: bass-laser-haze 7s ease-in-out infinite;
        }

        @keyframes bass-laser-sweep {
          0% {
            opacity: 0.3;
            transform: translate3d(0, 0, 0) rotate(-18deg) scaleY(0.92);
          }

          45% {
            opacity: 0.86;
            transform: translate3d(4vw, 2vh, 0) rotate(4deg) scaleY(1.02);
          }

          100% {
            opacity: 0.4;
            transform: translate3d(-3vw, 8vh, 0) rotate(18deg) scaleY(0.96);
          }
        }

        @keyframes bass-laser-haze {
          0%,
          100% {
            opacity: 0.24;
            filter: brightness(1);
          }

          50% {
            opacity: 0.5;
            filter: brightness(1.14);
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
          .bass-laser,
          .bass-laser-haze {
            animation: none;
          }
        }

      `}</style>
    </main>
  );
}
