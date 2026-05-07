"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pause, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  musicCtaTextClass,
  musicHelperTextClass,
  musicTypography,
} from "@/lib/musicTypography";

const SOLFEGE_BOX_STYLE = {
  width: "max(100vw, calc(100vh * 1.5))",
  height: "max(100vh, calc(100vw / 1.5))",
  transform: "translate(-50%, -50%)",
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

export default function SolfegePage() {
  const params = useParams<{ locale: string }>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [waveformBars, setWaveformBars] = useState<number[]>(WAVEFORM_IDLE_BARS);
  const isArabic = params?.locale === "ar";
  const locale = params?.locale ?? "en";
  const enrollmentHref = `/${locale}/enrollment`;

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
      if (isDraggingRef.current) return;
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

  const handleSeekStart = () => {
    isDraggingRef.current = true;
  };

  const handleSeekEnd = () => {
    isDraggingRef.current = false;
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setSliderValue(audio.currentTime);
  };

  const content = isArabic
    ? {
        centerText: "اجعل أحلامك تتحقق",
        playLabel: "تشغيل الأغنية",
        pauseLabel: "إيقاف الأغنية",
        paragraph:
          "السولفيج نظام لتعلم الموسيقى يساعد الموسيقيين على تمييز الدرجات الصوتية وغناء الألحان باستخدام مقاطع مثل دو، ري، مي، فا، صول، لا، تي. وقد طوّره المنظّر الموسيقي الإيطالي غويدو داريتسو في القرن الحادي عشر لمساعدة المنشدين على قراءة الموسيقى وتعلمها بسهولة أكبر. ومع مرور الوقت، تم تغيير المقطع Ut إلى Do، وأضيف Ti (أو Si) لتكوين السلم الموسيقي الحديث. 🎵",
        reserveHelper: "درّب أذنك في حصة حقيقية",
        reserveCta: "التسجيل",
      }
    : {
        centerText: "make your dreams come true",
        playLabel: "Play song",
        pauseLabel: "Pause song",
        paragraph:
          "Solfege is a music-learning system that helps musicians recognize pitch and sing melodies using syllables like Do, Re, Mi, Fa, Sol, La, Ti. It was developed in the 11th century by the Italian music theorist Guido of Arezzo to help singers read and learn music more easily. Over time, the syllable Ut was changed to Do, and Ti (or Si) was added to form the modern musical scale. 🎵",
        reserveHelper: "Train your ear with a real class",
        reserveCta: "Enrollment",
      };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#140c09]">
      <audio
        ref={audioRef}
        preload="metadata"
        src="/images/LDR-Salvatore.mp3"
      />

      <div className="absolute left-1/2 top-1/2" style={SOLFEGE_BOX_STYLE}>
        <Image
          src="/images/LDR.png"
          alt="Solfege background"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,0.18)_68%,rgba(0,0,0,0.36)_100%)]" />

      <div className="absolute left-[50px] top-[170px] z-20 hidden lg:block">
        <div className="flex flex-col items-center gap-5.5">
          <div
            className={`group relative h-50 w-50 rounded-full border border-white/40 bg-[radial-gradient(circle_at_48%_42%,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.03)_18%,rgba(10,10,10,0.98)_34%,rgba(4,4,4,1)_68%,rgba(0,0,0,1)_100%)] shadow-[0_22px_44px_rgba(0,0,0,0.45)] ${
              isPlaying ? 'animate-spin [animation-duration:8s]' : ''
            }`}
          >
            <div className="absolute inset-[3%] rounded-full border border-white/6" />
            <div className="absolute inset-[7%] rounded-full border border-white/5" />
            <div className="absolute inset-[11%] rounded-full border border-white/5" />
            <div className="absolute inset-[15%] rounded-full border border-white/5" />
            <div className="absolute inset-[19%] rounded-full border border-white/5" />
            <div className="absolute inset-[23%] rounded-full border border-white/5" />
            <div className="absolute inset-[27%] rounded-full border border-white/5" />
            <div className="absolute inset-[31%] rounded-full border border-white/5" />
            <div className="absolute inset-[35%] rounded-full border border-white/5" />
            <div className="absolute left-1/2 top-1/2 flex h-[32%] w-[32%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7d5b4]/75 bg-[radial-gradient(circle_at_center,rgba(255,250,240,0.98)_0%,rgba(231,213,180,0.95)_72%,rgba(167,132,96,0.92)_100%)] px-3 text-center shadow-[inset_0_0_0_1px_rgba(82,56,30,0.12)]">
              <span className="text-[11px] font-medium uppercase leading-[1.15] tracking-[0.08em] text-[#4a2d19]">
                {content.centerText}
              </span>
            </div>
            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#5f422d]/45 bg-[#1b130f]" />
            <div className="absolute left-[18%] top-[12%] h-[36%] w-[10%] rotate-[18deg] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.02)_100%)] blur-[1px]" />
            <div className="pointer-events-none absolute inset-[12%] flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,rgba(14,14,14,0.72)_0%,rgba(14,14,14,0.38)_46%,rgba(14,14,14,0)_78%)] px-5 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-[14px] font-medium tracking-[0.12em] text-[#f2e3c8]">
                Lana Del Rey - Salvatore
              </span>
            </div>
          </div>

          <div className="liquid-glass flex items-center gap-2.5 rounded-full px-4.5 py-3">
            <GlassControlButton label={content.playLabel} onClick={playAudio}>
              <Play size={12} className={isPlaying ? 'text-royal-cream' : ''} />
            </GlassControlButton>
            <GlassControlButton label={content.pauseLabel} onClick={pauseAudio}>
              <Pause
                size={12}
                className={!isPlaying ? 'text-royal-cream' : ''}
              />
            </GlassControlButton>
          </div>

          <div className="liquid-glass w-64 rounded-[1.3rem] px-4 py-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={sliderValue}
              onInput={(event) =>
                handleSeek(Number((event.target as HTMLInputElement).value))
              }
              onChange={(event) =>
                handleSeek(Number((event.target as HTMLInputElement).value))
              }
              onPointerDown={handleSeekStart}
              onPointerUp={handleSeekEnd}
              onPointerCancel={handleSeekEnd}
              onKeyUp={handleSeekEnd}
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
              <span>{progress ? `${Math.round(progress)}%` : '0%'}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-[80px] top-[170px] z-20 hidden w-[34rem] lg:block">
        <div
          className="rounded-[1.6rem] border px-5 py-5"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderColor: 'rgba(217,192,161,0.22)',
            boxShadow: '0 18px 42px rgba(0,0,0,0.30)',
          }}
        >
          <p className="text-[1.3rem] leading-[1.8rem] text-royal-cream/90">
            <span
              style={{
                background: 'rgba(43,25,18,0.48)',
                padding: '0.06rem 0.32rem',
                borderRadius: '0.35rem',
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
              }}
            >
              {content.paragraph}
            </span>
          </p>

          <div className="mt-3 flex flex-col items-start gap-2.5">
            <p
              className={`text-[0.95rem] ${musicHelperTextClass(isArabic)} text-royal-gold/65 ${
                isArabic ? 'text-right' : ''
              }`}
            >
              <span
                style={{
                  background: 'rgba(43,25,18,0.48)',
                  padding: '0.06rem 0.32rem',
                  borderRadius: '0.35rem',
                  boxDecorationBreak: 'clone',
                  WebkitBoxDecorationBreak: 'clone',
                }}
              >
                {content.reserveHelper}
              </span>
            </p>
            <Link
              href={enrollmentHref}
              className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-5 py-3 text-[0.95rem] ${musicCtaTextClass(
                isArabic,
              )} text-[#2b1912] transition-transform duration-300 hover:scale-[1.03] ${
                isArabic ? 'text-right' : ''
              }`}
            >
              {content.reserveCta}
            </Link>
          </div>
        </div>
      </div>

      <section className="relative z-20 flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-24 sm:px-6 lg:hidden">
        <div className="flex w-full max-w-[18rem] flex-col items-center gap-4 sm:max-w-[20rem]">
          <div
            className={`group relative h-32 w-32 rounded-full border border-white/40 bg-[radial-gradient(circle_at_48%_42%,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.03)_18%,rgba(10,10,10,0.98)_34%,rgba(4,4,4,1)_68%,rgba(0,0,0,1)_100%)] shadow-[0_18px_36px_rgba(0,0,0,0.45)] sm:h-36 sm:w-36 ${
              isPlaying ? 'animate-spin [animation-duration:8s]' : ''
            }`}
          >
            <div className="absolute inset-[3%] rounded-full border border-white/6" />
            <div className="absolute inset-[7%] rounded-full border border-white/5" />
            <div className="absolute inset-[11%] rounded-full border border-white/5" />
            <div className="absolute inset-[15%] rounded-full border border-white/5" />
            <div className="absolute inset-[19%] rounded-full border border-white/5" />
            <div className="absolute inset-[23%] rounded-full border border-white/5" />
            <div className="absolute inset-[27%] rounded-full border border-white/5" />
            <div className="absolute inset-[31%] rounded-full border border-white/5" />
            <div className="absolute inset-[35%] rounded-full border border-white/5" />
            <div className="absolute left-1/2 top-1/2 flex h-[32%] w-[32%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#e7d5b4]/75 bg-[radial-gradient(circle_at_center,rgba(255,250,240,0.98)_0%,rgba(231,213,180,0.95)_72%,rgba(167,132,96,0.92)_100%)] px-3 text-center shadow-[inset_0_0_0_1px_rgba(82,56,30,0.12)]">
              <span className="text-[9px] font-medium uppercase leading-[1.15] tracking-[0.08em] text-[#4a2d19] sm:text-[10px]">
                {content.centerText}
              </span>
            </div>
            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#5f422d]/45 bg-[#1b130f]" />
            <div className="absolute left-[18%] top-[12%] h-[36%] w-[10%] rotate-[18deg] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.02)_100%)] blur-[1px]" />
            <div className="pointer-events-none absolute inset-[12%] flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,rgba(14,14,14,0.72)_0%,rgba(14,14,14,0.38)_46%,rgba(14,14,14,0)_78%)] px-5 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-[10px] font-medium tracking-[0.12em] text-[#f2e3c8] sm:text-[11px]">
                Lana Del Rey - Salvatore
              </span>
            </div>
          </div>

          <div className="liquid-glass flex items-center gap-2 rounded-full px-3 py-2">
            <GlassControlButton label={content.playLabel} onClick={playAudio}>
              <Play size={12} className={isPlaying ? 'text-royal-cream' : ''} />
            </GlassControlButton>
            <GlassControlButton label={content.pauseLabel} onClick={pauseAudio}>
              <Pause
                size={12}
                className={!isPlaying ? 'text-royal-cream' : ''}
              />
            </GlassControlButton>
          </div>

          <div className="liquid-glass w-full rounded-[1.1rem] px-3 py-2">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={sliderValue}
              onInput={(event) =>
                handleSeek(Number((event.target as HTMLInputElement).value))
              }
              onChange={(event) =>
                handleSeek(Number((event.target as HTMLInputElement).value))
              }
              onPointerDown={handleSeekStart}
              onPointerUp={handleSeekEnd}
              onPointerCancel={handleSeekEnd}
              onKeyUp={handleSeekEnd}
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
              <span>{progress ? `${Math.round(progress)}%` : '0%'}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-[18rem] sm:max-w-[22rem]">
          <div
            className="rounded-[1.5rem] border px-4 py-4 sm:px-5 sm:py-5"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              borderColor: 'rgba(217,192,161,0.22)',
              boxShadow: '0 18px 42px rgba(0,0,0,0.30)',
            }}
          >
            <p className={`${musicTypography.body} text-royal-cream/90`}>
              <span
                style={{
                  background: 'rgba(43,25,18,0.48)',
                  padding: '0.06rem 0.32rem',
                  borderRadius: '0.35rem',
                  boxDecorationBreak: 'clone',
                  WebkitBoxDecorationBreak: 'clone',
                }}
              >
                {content.paragraph}
              </span>
            </p>

            <div className="mt-4 flex flex-col items-start gap-3">
              <p
                className={`${musicHelperTextClass(isArabic)} text-royal-gold/65 ${
                  isArabic ? 'text-right' : ''
                }`}
              >
                <span
                  style={{
                    background: 'rgba(43,25,18,0.48)',
                    padding: '0.06rem 0.32rem',
                    borderRadius: '0.35rem',
                    boxDecorationBreak: 'clone',
                    WebkitBoxDecorationBreak: 'clone',
                  }}
                >
                  {content.reserveHelper}
                </span>
              </p>
              <Link
                href={enrollmentHref}
                className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4 py-2 ${musicCtaTextClass(
                  isArabic,
                )} text-[#2b1912] transition-transform duration-300 hover:scale-[1.03] ${
                  isArabic ? 'text-right' : ''
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
