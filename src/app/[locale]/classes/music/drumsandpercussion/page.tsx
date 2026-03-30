"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";
import { musicCtaTextClass, musicHelperTextClass } from "@/lib/musicTypography";

type DrumPad = {
  id: string;
  label: string;
  family: string;
  shortcut: string;
  tone: "kick" | "snare" | "rim" | "clap" | "closedHat" | "openHat" | "crash" | "ride" | "highTom" | "midTom" | "floorTom" | "cowbell";
  tint: string;
};

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

const TABLE_HELPER_HIGHLIGHT_STYLE = {
  ...TEXT_HIGHLIGHT_STYLE,
  background: "rgba(43,25,18,0.82)",
} as const;

const PAD_SUBLABEL_HIGHLIGHT_STYLE = {
  ...TEXT_HIGHLIGHT_STYLE,
  background: "rgba(43,25,18,0.48)",
} as const;

const DRUM_PADS: DrumPad[] = [
  {
    id: "kick",
    label: "Kick",
    family: "Bass Drum",
    shortcut: "Q",
    tone: "kick",
    tint: "rgba(220, 38, 38, 0.22)",
  },
  {
    id: "snare",
    label: "Snare",
    family: "Main Hit",
    shortcut: "W",
    tone: "snare",
    tint: "rgba(249, 115, 22, 0.22)",
  },
  {
    id: "rim",
    label: "Rim",
    family: "Click",
    shortcut: "E",
    tone: "rim",
    tint: "rgba(245, 158, 11, 0.22)",
  },
  {
    id: "clap",
    label: "Clap",
    family: "Accent",
    shortcut: "I",
    tone: "clap",
    tint: "rgba(234, 179, 8, 0.22)",
  },
  {
    id: "closed-hat",
    label: "Hat",
    family: "Closed",
    shortcut: "O",
    tone: "closedHat",
    tint: "rgba(132, 204, 22, 0.22)",
  },
  {
    id: "open-hat",
    label: "Open",
    family: "Hi-Hat",
    shortcut: "P",
    tone: "openHat",
    tint: "rgba(34, 197, 94, 0.22)",
  },
  {
    id: "crash",
    label: "Crash",
    family: "Cymbal",
    shortcut: "A",
    tone: "crash",
    tint: "rgba(20, 184, 166, 0.22)",
  },
  {
    id: "ride",
    label: "Ride",
    family: "Cymbal",
    shortcut: "S",
    tone: "ride",
    tint: "rgba(59, 130, 246, 0.22)",
  },
  {
    id: "high-tom",
    label: "High",
    family: "Tom",
    shortcut: "D",
    tone: "highTom",
    tint: "rgba(99, 102, 241, 0.22)",
  },
  {
    id: "mid-tom",
    label: "Mid",
    family: "Tom",
    shortcut: "J",
    tone: "midTom",
    tint: "rgba(139, 92, 246, 0.22)",
  },
  {
    id: "floor-tom",
    label: "Floor",
    family: "Tom",
    shortcut: "K",
    tone: "floorTom",
    tint: "rgba(168, 85, 247, 0.22)",
  },
  {
    id: "cowbell",
    label: "Cowbell",
    family: "Perc",
    shortcut: "L",
    tone: "cowbell",
    tint: "rgba(236, 72, 153, 0.22)",
  },
];

const DRUM_KEYBOARD_MAP: Record<string, DrumPad["id"]> = {
  q: "kick",
  w: "snare",
  e: "rim",
  i: "clap",
  o: "closed-hat",
  p: "open-hat",
  a: "crash",
  s: "ride",
  d: "high-tom",
  j: "mid-tom",
  k: "floor-tom",
  l: "cowbell",
};

function createNoiseBuffer(context: AudioContext) {
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }

  return buffer;
}

function createNoiseSource(context: AudioContext, noiseBuffer: AudioBuffer | null) {
  const source = context.createBufferSource();
  source.buffer = noiseBuffer;
  return source;
}

function playKick(context: AudioContext, now: number) {
  const oscillator = context.createOscillator();
  const punch = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  punch.type = "triangle";

  oscillator.frequency.setValueAtTime(118, now);
  oscillator.frequency.exponentialRampToValueAtTime(44, now + 0.22);
  punch.frequency.setValueAtTime(180, now);
  punch.frequency.exponentialRampToValueAtTime(56, now + 0.12);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.9, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  oscillator.connect(gain);
  punch.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  punch.start(now);
  oscillator.stop(now + 0.46);
  punch.stop(now + 0.2);
}

function playSnareFamily(
  context: AudioContext,
  noiseBuffer: AudioBuffer | null,
  now: number,
  options: {
    noiseDecay: number;
    noiseGain: number;
    toneFrequency: number;
    toneDecay: number;
    toneGain: number;
    filterFrequency: number;
    filterQ?: number;
  },
) {
  const noise = createNoiseSource(context, noiseBuffer);
  const noiseFilter = context.createBiquadFilter();
  const noiseGain = context.createGain();
  const tone = context.createOscillator();
  const toneGain = context.createGain();

  noiseFilter.type = "highpass";
  noiseFilter.frequency.setValueAtTime(options.filterFrequency, now);
  noiseFilter.Q.setValueAtTime(options.filterQ ?? 0.7, now);

  noiseGain.gain.setValueAtTime(options.noiseGain, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + options.noiseDecay);

  tone.type = "triangle";
  tone.frequency.setValueAtTime(options.toneFrequency, now);
  tone.frequency.exponentialRampToValueAtTime(
    Math.max(80, options.toneFrequency * 0.58),
    now + options.toneDecay,
  );

  toneGain.gain.setValueAtTime(options.toneGain, now);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + options.toneDecay);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(context.destination);

  tone.connect(toneGain);
  toneGain.connect(context.destination);

  noise.start(now);
  noise.stop(now + options.noiseDecay);
  tone.start(now);
  tone.stop(now + options.toneDecay);
}

function playClap(context: AudioContext, noiseBuffer: AudioBuffer | null, now: number) {
  [0, 0.018, 0.036].forEach((offset, index) => {
    const noise = createNoiseSource(context, noiseBuffer);
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1500 + index * 260, now + offset);
    filter.Q.setValueAtTime(0.85, now + offset);

    gain.gain.setValueAtTime(0.55 - index * 0.1, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    noise.start(now + offset);
    noise.stop(now + offset + 0.14);
  });
}

function playHatFamily(
  context: AudioContext,
  noiseBuffer: AudioBuffer | null,
  now: number,
  options: {
    decay: number;
    gainValue: number;
    filterFrequency: number;
  },
) {
  const noise = createNoiseSource(context, noiseBuffer);
  const highpass = context.createBiquadFilter();
  const bandpass = context.createBiquadFilter();
  const gain = context.createGain();

  highpass.type = "highpass";
  highpass.frequency.setValueAtTime(7000, now);

  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(options.filterFrequency, now);
  bandpass.Q.setValueAtTime(1.4, now);

  gain.gain.setValueAtTime(options.gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + options.decay);

  noise.connect(highpass);
  highpass.connect(bandpass);
  bandpass.connect(gain);
  gain.connect(context.destination);

  noise.start(now);
  noise.stop(now + options.decay);
}

function playMetal(
  context: AudioContext,
  now: number,
  options: {
    frequencies: number[];
    decay: number;
    gainValue: number;
    highpass: number;
  },
) {
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  filter.type = "highpass";
  filter.frequency.setValueAtTime(options.highpass, now);

  gain.gain.setValueAtTime(options.gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + options.decay);

  filter.connect(gain);
  gain.connect(context.destination);

  options.frequencies.forEach((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.connect(filter);
    oscillator.start(now);
    oscillator.stop(now + options.decay);
  });
}

function playTom(
  context: AudioContext,
  now: number,
  options: { frequency: number; decay: number; gainValue: number },
) {
  const oscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  overtone.type = "triangle";

  oscillator.frequency.setValueAtTime(options.frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(
    options.frequency * 0.58,
    now + options.decay,
  );

  overtone.frequency.setValueAtTime(options.frequency * 1.5, now);
  overtone.frequency.exponentialRampToValueAtTime(
    options.frequency * 0.75,
    now + options.decay * 0.8,
  );

  gain.gain.setValueAtTime(options.gainValue, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + options.decay);

  oscillator.connect(gain);
  overtone.connect(gain);
  gain.connect(context.destination);

  oscillator.start(now);
  overtone.start(now);
  oscillator.stop(now + options.decay + 0.02);
  overtone.stop(now + options.decay * 0.82);
}

function playCowbell(context: AudioContext, now: number) {
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  gain.connect(context.destination);

  [587, 845].forEach((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.connect(gain);
    oscillator.start(now);
    oscillator.stop(now + 0.22);
  });
}

export default function DrumsPage() {
  const params = useParams<{ locale: string }>();
  const [showRoomPreview, setShowRoomPreview] = useState(false);
  const [activePadId, setActivePadId] = useState<string | null>(null);
  const [roomPreviewFocus, setRoomPreviewFocus] = useState({ x: 50, y: 50 });
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const activePadTimeoutRef = useRef<number | null>(null);
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const reservationHref = `/${locale}/reservation`;
  const content = isArabic
    ? {
        paragraph:
          "هل تعلم أن آلات الإيقاع تُعد من أقدم أشكال الموسيقى، إذ تعود إلى آلاف السنين حين استخدم الإنسان الأول يديه والحجارة والأشياء الطبيعية لصنع الإيقاع؟ ومع مرور الزمن تطورت هذه الوسائل إلى آلات مثل الأجراس والصنوج والزيلوفون. ومن بينها أصبحت الطبول من أهم الآلات، إذ ظهرت الطبول الأولى في أفريقيا وآسيا القديمة لأغراض التواصل والطقوس والاحتفالات. وبينما تشمل آلات الإيقاع مجموعة واسعة من الآلات التي تُضرَب أو تُهَز، فإن الطبول تُعد نوعاً محدداً ضمن هذه العائلة، وتشتهر بإيقاعاتها القوية الشبيهة بنبض القلب. ومعاً تشكل هذه الآلات أساس الموسيقى في مختلف الثقافات، وتمنح كل أداء طاقة وتوقيتاً وحياة. 🥁",
        reserveHelper: "احجز تجربتك مع الطبول والإيقاع",
        reserveCta: "احجز الآن",
        roomCta: "هل تريد رؤية غرفة الطبول لدينا؟",
      }
    : {
        paragraph:
          "Did you know that Percussion instruments are among the oldest forms of music, dating back thousands of years when early humans used their hands, stones, and natural objects to create rhythm? Over time, these evolved into instruments like bells, cymbals, and xylophones. Among them, the Drum became one of the most important, with early drums appearing in ancient Africa and Asia for communication, rituals, and celebrations. While percussion includes a wide variety of instruments that are struck or shaken, drums are a specific type within this family, known for their powerful, heartbeat-like rhythms. Together, they form the foundation of music across cultures, bringing energy, timing, and life to every performance. 🥁",
        reserveHelper: "Reserve your drums/percussion experience",
        reserveCta: "Reserve Now",
        roomCta: "wanna see our drums room?",
      };

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current !== null) {
        window.clearTimeout(previewTimeoutRef.current);
      }
      if (activePadTimeoutRef.current !== null) {
        window.clearTimeout(activePadTimeoutRef.current);
      }
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

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

  const getAudioContext = async () => {
    const AudioContextCtor =
      window.AudioContext ||
      (
        window as Window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextCtor) return null;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    if (!noiseBufferRef.current) {
      noiseBufferRef.current = createNoiseBuffer(audioContextRef.current);
    }

    return audioContextRef.current;
  };

  const playDrumPad = useCallback(async (pad: DrumPad) => {
    if (activePadTimeoutRef.current !== null) {
      window.clearTimeout(activePadTimeoutRef.current);
    }

    setActivePadId(pad.id);
    activePadTimeoutRef.current = window.setTimeout(() => {
      setActivePadId((current) => (current === pad.id ? null : current));
    }, 180);

    const context = await getAudioContext();
    if (!context) return;

    const now = context.currentTime;

    switch (pad.tone) {
      case "kick":
        playKick(context, now);
        break;
      case "snare":
        playSnareFamily(context, noiseBufferRef.current, now, {
          noiseDecay: 0.22,
          noiseGain: 0.5,
          toneFrequency: 220,
          toneDecay: 0.16,
          toneGain: 0.26,
          filterFrequency: 1300,
        });
        break;
      case "rim":
        playSnareFamily(context, noiseBufferRef.current, now, {
          noiseDecay: 0.06,
          noiseGain: 0.1,
          toneFrequency: 480,
          toneDecay: 0.08,
          toneGain: 0.16,
          filterFrequency: 1800,
          filterQ: 1.2,
        });
        break;
      case "clap":
        playClap(context, noiseBufferRef.current, now);
        break;
      case "closedHat":
        playHatFamily(context, noiseBufferRef.current, now, {
          decay: 0.08,
          gainValue: 0.24,
          filterFrequency: 9000,
        });
        break;
      case "openHat":
        playHatFamily(context, noiseBufferRef.current, now, {
          decay: 0.38,
          gainValue: 0.18,
          filterFrequency: 8200,
        });
        break;
      case "crash":
        playMetal(context, now, {
          frequencies: [412, 615, 820, 1230, 1650],
          decay: 1.4,
          gainValue: 0.13,
          highpass: 3200,
        });
        break;
      case "ride":
        playMetal(context, now, {
          frequencies: [520, 780, 1040, 1560],
          decay: 0.9,
          gainValue: 0.1,
          highpass: 2800,
        });
        break;
      case "highTom":
        playTom(context, now, {
          frequency: 220,
          decay: 0.34,
          gainValue: 0.34,
        });
        break;
      case "midTom":
        playTom(context, now, {
          frequency: 164,
          decay: 0.4,
          gainValue: 0.36,
        });
        break;
      case "floorTom":
        playTom(context, now, {
          frequency: 118,
          decay: 0.52,
          gainValue: 0.42,
        });
        break;
      case "cowbell":
        playCowbell(context, now);
        break;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const padId = DRUM_KEYBOARD_MAP[event.key.toLowerCase()];
      if (!padId) return;

      const pad = DRUM_PADS.find((item) => item.id === padId);
      if (!pad) return;

      event.preventDefault();
      void playDrumPad(pad);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playDrumPad]);

  return (
    <main
      className="relative min-h-screen bg-cover bg-center bg-no-repeat px-4 pb-10 pt-28 sm:px-6 sm:pt-32"
      style={{ backgroundImage: "url('/images/drums.png')" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gray-200/20" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <section
          className="order-2 font-goudy w-full max-w-[40rem] px-1 py-1 sm:px-2 sm:py-2 lg:order-1"
          dir="ltr"
        >
          <div>
            <p className="text-center text-[20px] uppercase tracking-[0.22em] text-royal-gold/65 sm:text-[22px]">
              <span style={TABLE_HELPER_HIGHLIGHT_STYLE}>Tap the drum set</span>
            </p>
            <p className="mt-2 text-center text-[10px] uppercase tracking-[0.16em] text-royal-cream/80 sm:text-[11px]">
              <span style={TABLE_HELPER_HIGHLIGHT_STYLE}>
                key hints on each pad show the keyboard trigger
              </span>
            </p>

            <div className="mx-auto mt-3 grid max-w-[28rem] grid-cols-3 gap-2 sm:max-w-[31rem] sm:grid-cols-4 sm:gap-3">
              {DRUM_PADS.map((pad) => {
                const isActive = activePadId === pad.id;

                return (
                  <button
                    key={pad.id}
                    type="button"
                    onClick={() => void playDrumPad(pad)}
                    className={`aspect-square rounded-[1.1rem] border p-2 text-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9c997] ${
                      isActive ? "scale-[1.02]" : "hover:scale-[1.01]"
                    }`}
                    style={{
                      ...GLASS_CARD_STYLE,
                      background: isActive
                        ? "linear-gradient(135deg, rgba(255,219,177,0.28) 0%, rgba(183,94,43,0.18) 100%)"
                        : `linear-gradient(135deg, ${pad.tint} 0%, rgba(255,255,255,0.04) 100%)`,
                      boxShadow: isActive
                        ? "0 12px 28px rgba(114,56,21,0.28)"
                        : "0 14px 28px rgba(0,0,0,0.22)",
                    }}
                  >
                    <span className="flex h-full flex-col items-center justify-center rounded-[0.9rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.09),rgba(255,255,255,0.02)_58%,rgba(28,18,15,0.18)_100%)] px-2">
                      <span className="mb-1 rounded-full border border-[#b7e6ff]/35 bg-[#74c8ff]/10 px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9fdfff] shadow-[0_0_14px_rgba(116,200,255,0.12)] sm:text-[10px]">
                        {pad.shortcut}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3b2418] sm:text-xs">
                        {pad.label}
                      </span>
                    <span className="mt-1 text-[9px] uppercase tracking-[0.16em] text-royal-cream/80 sm:text-[10px]">
                      <span style={PAD_SUBLABEL_HIGHLIGHT_STYLE}>
                        {pad.family}
                      </span>
                    </span>
                  </span>
                </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside
          className="order-1 mt-3 flex w-full max-w-sm self-center flex-col rounded-[1.5rem] border px-3 py-2.5 sm:mt-4 sm:max-w-md sm:px-4 sm:py-3 lg:order-2 lg:mt-6 lg:max-w-[22rem] lg:self-auto lg:sticky lg:top-32 lg:px-5 lg:py-4"
          style={GLASS_CARD_STYLE}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <p className="mx-auto max-w-[16rem] text-center text-[12px] leading-[1.45rem] text-royal-cream/90 sm:max-w-[19rem] sm:text-[14px] sm:leading-6 lg:max-w-[20rem]">
            <span style={TEXT_HIGHLIGHT_STYLE}>
              {content.paragraph}
            </span>
          </p>

          <div className="mt-4 flex flex-col items-center gap-2.5">
            <div className="relative">
              <button
                type="button"
                onClick={handleRoomPreview}
                className="inline-flex items-center justify-center rounded-full border border-[#d9c0a1]/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_100%)] px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#3b2418] transition-transform duration-300 hover:scale-[1.03]"
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
                    src="/images/drumsroom.png"
                    alt="Drums room"
                    className="h-full w-full cursor-zoom-in object-cover transition-transform duration-150 hover:scale-150"
                    style={{
                      transformOrigin: `${roomPreviewFocus.x}% ${roomPreviewFocus.y}%`,
                    }}
                  />
                </div>
            </div>

            <p
              className={`text-center ${musicHelperTextClass(isArabic)} text-royal-gold/65`}
            >
              <span style={TEXT_HIGHLIGHT_STYLE}>{content.reserveHelper}</span>
            </p>

            <Link
              href={reservationHref}
              className={`liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4 py-2 ${musicCtaTextClass(
                isArabic,
              )} text-[#3b2418] transition-transform duration-300 hover:scale-[1.03]`}
            >
              {content.reserveCta}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
