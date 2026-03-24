"use client";

import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const FLYING_NOTES = [
  { id: "note-1", symbol: "♪", left: "14%", bottom: "18%", delay: "0s", duration: "4.8s" },
  { id: "note-2", symbol: "♫", left: "24%", bottom: "10%", delay: "0.8s", duration: "5.2s" },
  { id: "note-3", symbol: "♬", left: "36%", bottom: "22%", delay: "1.3s", duration: "4.6s" },
  { id: "note-4", symbol: "♪", left: "58%", bottom: "14%", delay: "0.4s", duration: "5.5s" },
  { id: "note-5", symbol: "♫", left: "72%", bottom: "18%", delay: "1.6s", duration: "4.9s" },
  { id: "note-6", symbol: "♩", left: "84%", bottom: "12%", delay: "2.1s", duration: "5.4s" },
] as const;

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

const WAVEFORM_BAR_COUNT = 28;
const WAVEFORM_IDLE_BARS = Array.from(
  { length: WAVEFORM_BAR_COUNT },
  () => 0.18,
);

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

export default function OudPage() {
  const params = useParams<{ locale: string }>();
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
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const reservationHref = `/${locale}/reservation/sub-oud`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncDuration = () => {
      const nextDuration = Number.isFinite(audio.duration) && audio.duration > 0
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
    const nextDuration = Number.isFinite(audio.duration) && audio.duration > 0
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

  const content = isArabic
    ? {
        playLabel: "تشغيل المقطوعة",
        pauseLabel: "إيقاف المقطوعة",
        paragraph:
          "هل تعلم أن العود يُعد من أقدم الآلات الوترية في العالم، إذ يعود تاريخه إلى أكثر من 3000 عام في بلاد ما بين النهرين القديمة؟ تطور العود من آلات أقدم وأصبح أكثر دقة وإتقاناً خلال العصر الذهبي الإسلامي. وكان يُعزف في القصور الملكية والمجالس الثقافية وتقاليد السرد والحكاية. وأسهم الموسيقي الشهير زرياب في تطوير أسلوبه وأضاف له وتراً خامساً. ثم انتقلت هذه الآلة إلى أوروبا وأثرت في نشأة آلة اللوت. وبفضل صوته الدافئ والعميق، أصبح العود محورياً في الموسيقى العربية والتركية والفارسية. ولا يزال اليوم رمزاً لتراث موسيقي عريق وأصيل. 🎶",
        reserveHelper: "اكتشف سحر العود في حصة حقيقية",
        reserveCta: "احجز الآن",
      }
    : {
        playLabel: "Play track",
        pauseLabel: "Pause track",
        paragraph:
          "Did you know the Oud is one of the oldest string instruments in the world, dating back over 3000 years to ancient Mesopotamia? It evolved from early instruments and became highly refined during the Islamic Golden Age. The oud was widely played in royal courts, cultural gatherings, and storytelling traditions. A famous musician, Ziryab, helped develop its style and added a fifth string. The instrument later traveled to Europe, influencing the creation of the lute. Its deep, warm sound made it central to Arabic, Turkish, and Persian music. Today, the oud remains a symbol of rich musical heritage and tradition. 🎶",
        reserveHelper: "Discover the oud in a real class",
        reserveCta: "Reserve Now",
      };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/oud.png')" }}
    >
      <audio
        ref={audioRef}
        preload="auto"
        src="/images/YasaminshahhosseiniOud.mp3"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.2)_68%,rgba(0,0,0,0.4)_100%)]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {FLYING_NOTES.map((note) => (
          <span
            key={note.id}
            aria-hidden="true"
            className="absolute text-3xl text-royal-cream/80 drop-shadow-[0_10px_18px_rgba(0,0,0,0.28)] sm:text-4xl"
            style={{
              left: note.left,
              bottom: note.bottom,
              animation: `oud-note-float ${note.duration} ease-in-out ${note.delay} infinite`,
            }}
          >
            {note.symbol}
          </span>
        ))}
      </div>

      <div
        className="absolute left-8 top-24 z-20 hidden lg:block lg:left-12 lg:top-28"
        dir="ltr"
      >
        <div className="font-goudy flex flex-col items-center gap-4">
          <div className="liquid-glass flex items-center gap-2 rounded-full px-3 py-2">
            <GlassControlButton label={content.playLabel} onClick={playAudio}>
              <Play size={12} className={isPlaying ? "text-royal-cream" : ""} />
            </GlassControlButton>
            <GlassControlButton label={content.pauseLabel} onClick={pauseAudio}>
              <Pause
                size={12}
                className={!isPlaying ? "text-royal-cream" : ""}
              />
            </GlassControlButton>
          </div>

          <div className="liquid-glass w-44 rounded-[1.1rem] px-3 py-2 sm:w-52">
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
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-royal-cream/75">
              <span>{formatTime(currentTime)}</span>
              <span>{progress ? `${Math.round(progress)}%` : "0%"}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-6 top-24 z-20 hidden w-72 lg:block lg:right-10 lg:top-28 lg:w-80">
        <div
          className="rounded-[1.5rem] border px-4 py-4 sm:px-5 sm:py-5"
          style={GLASS_CARD_STYLE}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <p className="text-[11px] leading-5 text-royal-cream/90 sm:text-[12px] sm:leading-[1.35rem]">
            <span style={TEXT_HIGHLIGHT_STYLE}>{content.paragraph}</span>
          </p>

          <div className="mt-4 flex flex-col items-start gap-3">
            <p
              className={`text-[10px] text-royal-gold/65 ${
                isArabic ? "leading-5" : "uppercase tracking-[0.22em]"
              }`}
            >
              <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
            </p>
            <Link
              href={reservationHref}
              className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4 py-2 text-[10px] font-medium text-[#2b1912] transition-transform duration-300 hover:scale-[1.03] ${
                isArabic ? "leading-5" : "uppercase tracking-[0.2em]"
              }`}
            >
              {content.reserveCta}
            </Link>
          </div>
        </div>
      </div>

      <section className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-24 sm:px-6 lg:hidden">
        <div
          className="font-goudy flex w-full max-w-[18rem] flex-col items-center gap-4 sm:max-w-[20rem]"
          dir="ltr"
        >
          <div className="liquid-glass flex items-center gap-2 rounded-full px-3 py-2">
            <GlassControlButton label={content.playLabel} onClick={playAudio}>
              <Play size={12} className={isPlaying ? "text-royal-cream" : ""} />
            </GlassControlButton>
            <GlassControlButton label={content.pauseLabel} onClick={pauseAudio}>
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
            <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-royal-cream/75">
              <span>{formatTime(currentTime)}</span>
              <span>{progress ? `${Math.round(progress)}%` : "0%"}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[22rem] sm:max-w-[26rem]">
          <div
            className="rounded-[1.5rem] border px-4 py-4 sm:px-5 sm:py-5"
            style={GLASS_CARD_STYLE}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <p className="text-[11px] leading-5 text-royal-cream/90 sm:text-[12px] sm:leading-[1.35rem]">
              <span style={TEXT_HIGHLIGHT_STYLE}>{content.paragraph}</span>
            </p>

            <div className="mt-4 flex flex-col items-start gap-3">
              <p
                className={`text-[10px] text-royal-gold/65 ${
                  isArabic ? "leading-5" : "uppercase tracking-[0.22em]"
                }`}
              >
                <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
              </p>
              <Link
                href={reservationHref}
                className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4 py-2 text-[10px] font-medium text-[#2b1912] transition-transform duration-300 hover:scale-[1.03] ${
                  isArabic ? "leading-5" : "uppercase tracking-[0.2em]"
                }`}
              >
                {content.reserveCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
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
      `}</style>

      <style jsx>{`
        @keyframes oud-note-float {
          0% {
            transform: translate3d(0, 0, 0) scale(0.9) rotate(-6deg);
            opacity: 0;
          }
          12% {
            opacity: 0.88;
          }
          55% {
            transform: translate3d(12px, -120px, 0) scale(1.05) rotate(4deg);
            opacity: 0.72;
          }
          100% {
            transform: translate3d(-10px, -220px, 0) scale(1.12) rotate(-8deg);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}
