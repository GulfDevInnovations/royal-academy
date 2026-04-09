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

export default function DurbukaPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const reservationHref = `/${locale}/reservation`;
  const content = isArabic
    ? {
        paragraph:
          "تُعد الدربوكة آلة إيقاع تقليدية تعود جذورها إلى آلاف السنين في بلاد ما بين النهرين ومصر القديمة، حيث صُنعت النماذج الأولى منها من الطين واستُخدمت في الطقوس والاحتفالات والحكايات الشعبية. ومع مرور الزمن انتشرت في الشرق الأوسط وشمال أفريقيا وأجزاء من أوروبا الشرقية، وتطورت في الشكل والخامات حتى وصلت إلى النماذج المعدنية والخزفية المستخدمة اليوم. وبفضل صوتيها المميزين «دم» العميق و«تك» الحاد، أصبحت الدربوكة آلة أساسية في التقاليد الموسيقية الشعبية والكلاسيكية، لما تمنحه من ثراء إيقاعي وتعبير أدائي. واليوم ما زالت رمزاً للتراث الثقافي وتُستخدم على نطاق واسع في الموسيقى الحديثة والعروض الحية حول العالم. 🥁",
        reserveHelper: "احجز تجربتك مع الدربوكة",
        reserveCta: "التسجيل",
      }
    : {
        paragraph:
          "The Darbuka is a traditional percussion instrument with roots dating back thousands of years to ancient Mesopotamia and Egypt, where early versions were made from clay and used in rituals, celebrations, and storytelling. Over time, it spread across the Middle East, North Africa, and parts of Eastern Europe, evolving in shape and materials into the metal and ceramic forms used today. Known for its distinctive “dum” (bass) and “tek” (sharp) sounds, the darbuka became a central instrument in folk and classical music traditions, valued for both rhythmic complexity and expressive performance. Today, it remains a symbol of cultural heritage and is widely used in modern music and live performances around the world. 🥁",
        reserveHelper: "Reserve your darbuka experience",
        reserveCta: "Enrollment",
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
      style={{ backgroundImage: "url('/images/durbuka.png')" }}
    >
      <audio ref={audioRef} preload="auto" src="/images/durbuka.mp3" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.18)_68%,rgba(0,0,0,0.38)_100%)]" />

      <section className="relative z-20 hidden min-h-[calc(100svh-4rem)] px-5 pb-12 pt-[calc(4rem+30px)] lg:block lg:px-6 lg:pt-[calc(5rem+30px)] xl:px-10">
        <div className="mx-auto flex w-full max-w-6xl items-start justify-between gap-6 xl:max-w-7xl xl:gap-12">
          <div
            className="font-goudy flex w-[min(15rem,28vw)] min-w-[12rem] flex-col items-center gap-4 xl:w-[min(17rem,22vw)]"
            dir="ltr"
          >
            <p
              className={`max-w-[14rem] text-center ${musicTypography.captionCaps} text-royal-cream/88`}
            >
              Daren darya- Radolph Manoukian
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

            <div className="liquid-glass w-full max-w-[14rem] rounded-[1.1rem] px-3 py-2 lg:max-w-[15rem] xl:max-w-[16rem]">
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

          <div className="w-full max-w-[29rem] shrink-0 lg:relative lg:left-[80px] lg:max-w-[31rem] xl:max-w-[34rem]">
            <div
              className="rounded-[1.65rem] border px-6 py-6 sm:px-7 sm:py-7"
              style={GLASS_CARD_STYLE}
              dir={isArabic ? "rtl" : "ltr"}
            >
              <p
                className={`${musicTypography.body} text-[18px] leading-[2rem] text-royal-cream/90 sm:text-[19px] sm:leading-[2.15rem] ${
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
                  className={`w-full ${musicHelperTextClass(isArabic)} text-[14px] text-royal-gold/65 sm:text-[15px] ${
                    isArabic ? "text-right" : ""
                  }`}
                >
                  <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
                </p>
                <Link
                  href={reservationHref}
                  className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-7 py-3 ${musicCtaTextClass(
                    isArabic,
                  )} text-[14px] text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] sm:text-[15px] ${
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

      <section className="relative z-20 flex min-h-[calc(100svh-4rem)] flex-col items-center justify-start gap-6 px-4 pb-12 pt-[calc(4rem+30px)] sm:min-h-[calc(100svh-5rem)] sm:px-6 sm:pt-[calc(5rem+30px)] lg:hidden">
        <div
          className="font-goudy flex w-full max-w-[19rem] flex-col items-center gap-4 sm:max-w-[22rem]"
          dir="ltr"
        >
          <p
            className={`max-w-[16rem] text-center ${musicTypography.captionCaps} text-royal-cream/88`}
          >
            Daren darya- Radolph Manoukian
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
            className="w-full max-w-[26rem] rounded-[1.65rem] border px-6 py-6 sm:max-w-[28rem] sm:px-7 sm:py-7"
            style={GLASS_CARD_STYLE}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <p
              className={`${musicTypography.body} text-[18px] leading-[2rem] text-royal-cream/90 sm:text-[19px] sm:leading-[2.15rem] ${
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
                className={`w-full ${musicHelperTextClass(isArabic)} text-[14px] text-royal-gold/65 sm:text-[15px] ${
                  isArabic ? "text-right" : ""
                }`}
              >
                <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
              </p>
              <Link
                href={reservationHref}
                className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-7 py-3 ${musicCtaTextClass(
                  isArabic,
                )} text-[14px] text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] sm:text-[15px] ${
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
    </main>
  );
}
