"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  musicCtaTextClass,
  musicHelperTextClass,
  musicTypography,
} from "@/lib/musicTypography";

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

const GUITAR_STARS = [
  { id: "star-1", left: "4%", top: "6%", size: "0.14rem", delay: "0s", duration: "2.6s" },
  { id: "star-2", left: "8%", top: "10%", size: "0.21rem", delay: "0.8s", duration: "3.2s" },
  { id: "star-3", left: "12%", top: "7%", size: "0.11rem", delay: "0.3s", duration: "2.4s" },
  { id: "star-4", left: "16%", top: "13%", size: "0.17rem", delay: "1.2s", duration: "3.6s" },
  { id: "star-5", left: "21%", top: "5.5%", size: "0.24rem", delay: "0.5s", duration: "2.9s" },
  { id: "star-6", left: "25%", top: "11.5%", size: "0.13rem", delay: "1.5s", duration: "3.1s" },
  { id: "star-7", left: "30%", top: "6.5%", size: "0.19rem", delay: "0.2s", duration: "2.7s" },
  { id: "star-8", left: "34%", top: "9.5%", size: "0.12rem", delay: "1.1s", duration: "3.4s" },
  { id: "star-9", left: "39%", top: "7%", size: "0.22rem", delay: "0.6s", duration: "2.8s" },
  { id: "star-10", left: "43%", top: "12.5%", size: "0.15rem", delay: "1.7s", duration: "3.3s" },
  { id: "star-11", left: "47%", top: "8.5%", size: "0.1rem", delay: "0.9s", duration: "2.5s" },
  { id: "star-12", left: "52%", top: "5%", size: "0.16rem", delay: "0.4s", duration: "2.7s" },
  { id: "star-13", left: "56%", top: "10.5%", size: "0.12rem", delay: "1.4s", duration: "3s" },
  { id: "star-14", left: "61%", top: "6.5%", size: "0.2rem", delay: "0.1s", duration: "2.6s" },
  { id: "star-15", left: "65%", top: "12%", size: "0.13rem", delay: "1.8s", duration: "3.5s" },
  { id: "star-16", left: "70%", top: "8%", size: "0.18rem", delay: "0.7s", duration: "2.9s" },
  { id: "star-17", left: "74%", top: "5.5%", size: "0.11rem", delay: "1.3s", duration: "3.1s" },
  { id: "star-18", left: "79%", top: "10.5%", size: "0.22rem", delay: "0.5s", duration: "2.8s" },
  { id: "star-19", left: "83%", top: "7%", size: "0.15rem", delay: "1.6s", duration: "3.3s" },
  { id: "star-20", left: "88%", top: "13%", size: "0.12rem", delay: "0.9s", duration: "2.7s" },
  { id: "star-21", left: "92%", top: "6.5%", size: "0.2rem", delay: "0.25s", duration: "2.6s" },
  { id: "star-22", left: "96%", top: "9%", size: "0.1rem", delay: "1.1s", duration: "3.2s" },
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

export default function GuitarPage() {
  const params = useParams<{ locale: string }>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>(WAVEFORM_IDLE_BARS);
  const [showRoomPreview, setShowRoomPreview] = useState(false);
  const [roomPreviewFocus, setRoomPreviewFocus] = useState({ x: 50, y: 50 });
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const reservationHref = `/${locale}/reservation`;

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
      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current);
      }
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

  const handleRoomPreview = () => {
    if (previewTimeoutRef.current !== null) {
      window.clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    if (showRoomPreview) {
      setShowRoomPreview(false);
      return;
    }

    setShowRoomPreview(true);

    previewTimeoutRef.current = window.setTimeout(() => {
      setShowRoomPreview(false);
      previewTimeoutRef.current = null;
    }, 10000);
  };

  const handleRoomPreviewMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setRoomPreviewFocus({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  const resetRoomPreviewFocus = () => {
    setRoomPreviewFocus({ x: 50, y: 50 });
  };

  const content = isArabic
    ? {
        paragraph:
          "للجيتار تاريخ طويل يعود إلى أكثر من 4000 عام، إذ ظهرت أسلافه الأولى في حضارات قديمة مثل بلاد ما بين النهرين ومصر. وبدأ الجيتار الحديث يتشكل في إسبانيا خلال القرنين الخامس عشر والسادس عشر، متطوراً من آلات مثل العود الأوروبي. وفي القرن التاسع عشر، قام الصانع الإسباني أنطونيو توريس خورادو بتطوير تصميمه، ليمنحنا البنية التي نعرفها اليوم للجيتار الكلاسيكي.",
        reserveHelper: "اكتشف الجيتار في حصة حقيقية",
        reserveCta: "التسجيل",
        roomCta: "هل تريد رؤية غرفة الجيتار لدينا؟",
      }
    : {
        paragraph:
          "The Guitar has a long history that dates back over 4000 years, with early ancestors appearing in ancient civilizations such as Mesopotamia and Egypt. The modern guitar began to take shape in Spain during the 15th-16th centuries, evolving from instruments like the lute. By the 19th century, the Spanish maker Antonio Torres Jurado refined its design, creating the structure of the classical guitar we know today.",
        reserveHelper: "Discover the Guitar in a real class",
        reserveCta: "Enrollment",
        roomCta: "wanna see our Guitar room?",
      };

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-cover bg-no-repeat"
      style={{
        backgroundImage: "url('/images/guitar.png')",
        backgroundPosition: "center top",
      }}
    >
      <audio
        ref={audioRef}
        preload="auto"
        src="/images/bailandoguitar.mp3"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.16)_68%,rgba(0,0,0,0.34)_100%)]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[20%] overflow-hidden">
        {GUITAR_STARS.map((star) => (
          <span
            key={star.id}
            aria-hidden="true"
            className="absolute block rounded-full bg-[#fff6dc]"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              boxShadow:
                "0 0 10px rgba(255,246,220,0.95), 0 0 18px rgba(255,240,196,0.52)",
              animation: `guitar-star-blink ${star.duration} ease-in-out ${star.delay} infinite`,
            }}
          />
        ))}
      </div>

      <section className="relative z-20 hidden min-h-screen px-6 pb-12 pt-24 lg:block xl:px-10 xl:pt-28">
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-8 xl:gap-12">
          <div
            className="font-goudy flex w-[min(23.5rem,31vw)] min-w-[19rem] flex-col items-center gap-5"
            dir="ltr"
          >
            <p
              className={`max-w-[18rem] text-center text-[13px] uppercase tracking-[0.2em] leading-6 text-royal-cream/88 sm:text-[14px]`}
            >
              Sensational Spanish Guitar, Cover of Enrique Iglesias &quot;Bailando&quot;
            </p>

            <div className="liquid-glass flex items-center gap-2.5 rounded-full px-4 py-2.5">
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

            <div className="liquid-glass w-56 rounded-[1.2rem] px-4 py-2.5 sm:w-68">
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

          <div className="w-[min(39rem,57vw)] min-w-[31rem] lg:translate-x-[120px] xl:w-[min(44rem,55vw)]">
            <div
              className="rounded-[1.5rem] border px-6 py-6 sm:px-7 sm:py-7"
              style={GLASS_CARD_STYLE}
              dir={isArabic ? "rtl" : "ltr"}
            >
              <p className={`${musicTypography.body} text-[18px] leading-[2rem] text-royal-cream/90 sm:text-[19px] sm:leading-[2.15rem]`}>
                <span style={TEXT_HIGHLIGHT_STYLE}>{content.paragraph}</span>
              </p>

              <div className="mt-4 flex flex-col items-start gap-3">
                <p
                  className={`${musicHelperTextClass(isArabic)} text-[14px] text-royal-gold/65 sm:text-[15px]`}
                >
                  {content.reserveHelper}
                </p>
                <Link
                  href={reservationHref}
                  className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-6 py-3 ${musicCtaTextClass(
                    isArabic,
                )} text-[14px] text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] sm:text-[15px]`}
                >
                  {content.reserveCta}
                </Link>
                <div className="relative">
                  <button
                    type="button"
                    onClick={handleRoomPreview}
                    className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-6 py-3 ${musicCtaTextClass(
                      isArabic,
                      "narrow",
                    )} text-[14px] text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] sm:text-[15px]`}
                  >
                    {content.roomCta}
                  </button>

                  <div
                    className={`absolute left-1/2 top-full z-20 mt-3 h-48 w-48 -translate-x-1/2 overflow-hidden rounded-full border border-[#d9c0a1]/35 shadow-[0_18px_40px_rgba(0,0,0,0.34)] transition-all duration-300 sm:h-56 sm:w-56 lg:left-auto lg:right-full lg:top-1/2 lg:mt-0 lg:h-72 lg:w-72 lg:-translate-y-1/2 lg:translate-x-0 lg:mr-3 ${
                      showRoomPreview
                        ? "pointer-events-auto scale-100 opacity-100"
                        : "pointer-events-none scale-75 opacity-0"
                    }`}
                    style={GLASS_CARD_STYLE}
                    onMouseMove={handleRoomPreviewMove}
                    onMouseLeave={resetRoomPreviewFocus}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/guitarroom.png"
                      alt="Guitar room"
                      className="h-full w-full cursor-zoom-in object-cover transition-transform duration-150 hover:scale-150"
                      style={{
                        transformOrigin: `${roomPreviewFocus.x}% ${roomPreviewFocus.y}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-20 flex min-h-screen flex-col items-center justify-start gap-6 px-4 pb-12 pt-24 sm:px-6 sm:pt-28 lg:hidden">
        <div
          className="font-goudy flex w-full max-w-[23rem] flex-col items-center gap-5 sm:max-w-[26rem]"
          dir="ltr"
        >
          <p
            className={`max-w-[18rem] text-center text-[13px] uppercase tracking-[0.2em] leading-6 text-royal-cream/88 sm:text-[14px]`}
          >
            Sensational Spanish Guitar, Cover of Enrique Iglesias &quot;Bailando&quot;
          </p>

          <div className="liquid-glass flex items-center gap-2.5 rounded-full px-4 py-2.5">
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

          <div className="liquid-glass w-full rounded-[1.2rem] px-4 py-2.5">
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

        <div className="w-full max-w-[40rem] sm:max-w-[48rem]">
          <div
            className="rounded-[1.5rem] border px-6 py-6 sm:px-7 sm:py-7"
            style={GLASS_CARD_STYLE}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <p className={`${musicTypography.body} text-[18px] leading-[2rem] text-royal-cream/90 sm:text-[19px] sm:leading-[2.15rem]`}>
              <span style={TEXT_HIGHLIGHT_STYLE}>{content.paragraph}</span>
            </p>

            <div className="mt-4 flex flex-col items-start gap-3">
              <p
                className={`${musicHelperTextClass(isArabic)} text-[14px] text-royal-gold/65 sm:text-[15px]`}
              >
                {content.reserveHelper}
              </p>
              <Link
                href={reservationHref}
                className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-6 py-3 ${musicCtaTextClass(
                  isArabic,
                )} text-[14px] text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] sm:text-[15px]`}
              >
                {content.reserveCta}
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={handleRoomPreview}
                  className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-6 py-3 ${musicCtaTextClass(
                    isArabic,
                    "narrow",
                  )} text-[14px] text-royal-cream/90 transition-transform duration-300 hover:scale-[1.03] sm:text-[15px]`}
                >
                  {content.roomCta}
                </button>

                <div
                  className={`absolute left-1/2 top-full z-20 mt-3 h-48 w-48 -translate-x-1/2 overflow-hidden rounded-full border border-[#d9c0a1]/35 shadow-[0_18px_40px_rgba(0,0,0,0.34)] transition-all duration-300 sm:h-56 sm:w-56 lg:left-auto lg:right-full lg:top-1/2 lg:mt-0 lg:h-72 lg:w-72 lg:-translate-y-1/2 lg:translate-x-0 lg:mr-3 ${
                    showRoomPreview
                      ? "pointer-events-auto scale-100 opacity-100"
                      : "pointer-events-none scale-75 opacity-0"
                  }`}
                  style={GLASS_CARD_STYLE}
                  onMouseMove={handleRoomPreviewMove}
                  onMouseLeave={resetRoomPreviewFocus}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/guitarroom.png"
                    alt="Guitar room"
                    className="h-full w-full cursor-zoom-in object-cover transition-transform duration-150 hover:scale-150"
                    style={{
                      transformOrigin: `${roomPreviewFocus.x}% ${roomPreviewFocus.y}%`,
                    }}
                  />
                </div>
              </div>
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
        @keyframes guitar-star-blink {
          0%,
          100% {
            opacity: 0.22;
            transform: scale(0.72);
          }
          35% {
            opacity: 0.96;
            transform: scale(1.1);
          }
          60% {
            opacity: 0.42;
            transform: scale(0.88);
          }
        }
      `}</style>
    </main>
  );
}
