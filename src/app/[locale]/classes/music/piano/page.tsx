"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type PianoKey = {
  id: string;
  label: string;
  shortcut: string;
  frequency: number;
  isSharp: boolean;
  whiteIndex: number;
  blackAnchorIndex: number | null;
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const KEY_SHORTCUTS = [
  "A",
  "W",
  "S",
  "E",
  "D",
  "F",
  "T",
  "G",
  "Y",
  "H",
  "U",
  "J",
  "K",
  "O",
  "L",
  "P",
  ";",
  "'",
  "[",
  "]",
  "\\",
  "1",
  "2",
  "3",
] as const;

const START_MIDI = 60;
const KEY_COUNT = 24;
const KEYBOARD_VISUAL_UNITS = 14;
const WHITE_KEY_WIDTH = 100 / KEYBOARD_VISUAL_UNITS;
const BLACK_KEY_WIDTH = WHITE_KEY_WIDTH * 0.62;

const PIANO_KEYS: PianoKey[] = Array.from({ length: KEY_COUNT }, (_, index) => {
  const midi = START_MIDI + index;
  const noteName = NOTE_NAMES[midi % NOTE_NAMES.length];
  const octave = Math.floor(midi / 12) - 1;
  const isSharp = noteName.includes("#");
  const whiteIndex = Array.from({ length: index + 1 }, (_, innerIndex) => START_MIDI + innerIndex).filter(
    (value) => !NOTE_NAMES[value % NOTE_NAMES.length].includes("#"),
  ).length - 1;
  const blackAnchorIndex = isSharp ? whiteIndex + 1 : null;

  return {
    id: `piano-${midi}`,
    label: `${noteName}${octave}`,
    shortcut: KEY_SHORTCUTS[index],
    frequency: 440 * 2 ** ((midi - 69) / 12),
    isSharp,
    whiteIndex,
    blackAnchorIndex,
  };
});

const KEYBOARD_NOTE_MAP = Object.fromEntries(
  PIANO_KEYS.map((key) => [key.shortcut.toLowerCase(), key.id]),
) as Record<string, string>;

function PianoKeyButton({
  note,
  active,
  onPlay,
}: {
  note: PianoKey;
  active: boolean;
  onPlay: (note: PianoKey) => void;
}) {
  const positionStyle = note.isSharp
    ? {
        left: `calc(${(note.blackAnchorIndex ?? 0) * WHITE_KEY_WIDTH}% - ${BLACK_KEY_WIDTH / 2}%)`,
        width: `${BLACK_KEY_WIDTH}%`,
      }
    : {
        left: `${note.whiteIndex * WHITE_KEY_WIDTH}%`,
        width: `${WHITE_KEY_WIDTH}%`,
      };

  return (
    <button
      type="button"
      aria-label={`Play ${note.label}`}
      onClick={() => onPlay(note)}
      className={`absolute bottom-0 -scale-y-100 rounded-b-[0.95rem] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f1d6a5] ${
        note.isSharp
          ? `z-20 h-[58%] rounded-t-[0.4rem] border border-[#2a1a15]/80 ${
              active
                ? "bg-[linear-gradient(180deg,#4c3830_0%,#24140f_72%,#120907_100%)] shadow-[0_18px_34px_rgba(0,0,0,0.55),0_0_18px_rgba(239,199,135,0.24)]"
                : "bg-[linear-gradient(180deg,#3a2922_0%,#1b100d_70%,#0b0504_100%)] shadow-[0_18px_32px_rgba(0,0,0,0.5)] hover:-translate-y-px"
            }`
          : `z-10 h-full border border-[#d9c29b]/40 ${
              active
                ? "bg-[linear-gradient(180deg,#fdf5e4_0%,#ecd7b3_52%,#ddc093_100%)] shadow-[0_22px_38px_rgba(0,0,0,0.24),0_0_20px_rgba(240,214,170,0.22)]"
                : "bg-[linear-gradient(180deg,#fffef7_0%,#f6ead4_40%,#ead5ad_100%)] shadow-[0_18px_34px_rgba(0,0,0,0.16)] hover:-translate-y-px"
            }`
      }`}
      style={positionStyle}
    >
      <span
        className={`absolute inset-x-[12%] bottom-[8%] rounded-full px-1.5 py-0.5 text-center text-[0.52rem] font-semibold tracking-[0.12em] ${
          note.isSharp
            ? "border border-[#8ecfff]/24 bg-[#6ac8ff]/10 text-[#9fdfff]"
            : "border border-[#afdcff]/22 bg-[#8dd3ff]/10 text-[#6fbff2]"
        }`}
      >
        {note.shortcut}
      </span>
      <span
        className={`absolute inset-x-1 top-[10%] text-center text-[0.54rem] font-medium tracking-[0.08em] ${
          note.isSharp ? "text-[#f5e7cd]/88" : "text-[#4d3524]"
        }`}
      >
        {note.label}
      </span>
    </button>
  );
}

export default function PianoPage() {
  const params = useParams<{ locale: string }>();
  const isArabic = params?.locale === "ar";
  const locale = params?.locale ?? "en";
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const activeTimeoutsRef = useRef<Map<string, number>>(new Map());
  const playNoteRef = useRef<(note: PianoKey) => void>(() => undefined);
  const [activeNoteIds, setActiveNoteIds] = useState<string[]>([]);

  useEffect(() => {
    const activeTimeouts = activeTimeoutsRef.current;

    return () => {
      activeTimeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      activeTimeouts.clear();
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  const content = isArabic
    ? {
        paragraph:
          'اختُرع البيانو حوالي عام 1700 على يد صانع الآلات الموسيقية الإيطالي بارتولوميو كريستوفوري. وعلى خلاف آلات المفاتيح الأقدم مثل الهاربسيكورد والكلافيكورد، كان البيانو قادراً على إصدار الأصوات الهادئة والقوية معاً، ولهذا جاء اسمه الأصلي gravicembalo col piano e forte أي «آلة مفاتيح ناعمة وقوية». وخلال القرنين الثامن عشر والتاسع عشر، ساهم مؤلفون مثل لودفيغ فان بيتهوفن وفريدريك شوبان وفرانز ليست في جعل البيانو واحداً من أهم الآلات في الموسيقى الكلاسيكية.',
        enrollmentLabel: 'التسجيل',
        rangeLabel: 'Range',
        rangeValue: 'C4 → B5',
      }
    : {
        paragraph:
          'The piano was invented around 1700 by the Italian instrument maker Bartolomeo Cristofori. Unlike earlier keyboard instruments like the Harpsichord and the Clavichord, the piano could play both soft and loud sounds, which is why its original name was gravicembalo col piano e forte ("soft and loud keyboard"). During the 18th and 19th centuries, composers such as Ludwig van Beethoven, Frederic Chopin, and Franz Liszt helped make the piano one of the most important instruments in classical music!',
        enrollmentLabel: 'Enrollment',
        rangeLabel: 'Range',
        rangeValue: 'C4 -> B5',
      };

  const createNoiseBuffer = (context: AudioContext) => {
    if (noiseBufferRef.current) return noiseBufferRef.current;

    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.05), context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
    }

    noiseBufferRef.current = buffer;
    return buffer;
  };

  const markNoteActive = (noteId: string) => {
    const existingTimeout = activeTimeoutsRef.current.get(noteId);
    if (existingTimeout !== undefined) {
      window.clearTimeout(existingTimeout);
    }

    setActiveNoteIds((current) => (current.includes(noteId) ? current : [...current, noteId]));

    const timeoutId = window.setTimeout(() => {
      setActiveNoteIds((current) => current.filter((entry) => entry !== noteId));
      activeTimeoutsRef.current.delete(noteId);
    }, 220);

    activeTimeoutsRef.current.set(noteId, timeoutId);
  };

  const playNote = async (note: PianoKey) => {
    markNoteActive(note.id);

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
    const mainGain = context.createGain();
    const toneFilter = context.createBiquadFilter();
    const brightnessFilter = context.createBiquadFilter();
    const compressor = context.createDynamicsCompressor();

    toneFilter.type = "lowpass";
    toneFilter.frequency.setValueAtTime(3600, now);
    toneFilter.frequency.exponentialRampToValueAtTime(1500, now + 1.35);
    toneFilter.Q.setValueAtTime(0.7, now);

    brightnessFilter.type = "highshelf";
    brightnessFilter.frequency.setValueAtTime(2400, now);
    brightnessFilter.gain.setValueAtTime(2.4, now);

    compressor.threshold.setValueAtTime(-18, now);
    compressor.knee.setValueAtTime(18, now);
    compressor.ratio.setValueAtTime(2.6, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.18, now);

    mainGain.gain.setValueAtTime(0.0001, now);
    mainGain.gain.exponentialRampToValueAtTime(0.28, now + 0.008);
    mainGain.gain.exponentialRampToValueAtTime(0.12, now + 0.09);
    mainGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    toneFilter.connect(brightnessFilter);
    brightnessFilter.connect(mainGain);
    mainGain.connect(compressor);
    compressor.connect(context.destination);

    const fundamental = context.createOscillator();
    const body = context.createOscillator();
    const sparkle = context.createOscillator();
    const fundamentalGain = context.createGain();
    const bodyGain = context.createGain();
    const sparkleGain = context.createGain();

    fundamental.type = "triangle";
    fundamental.frequency.setValueAtTime(note.frequency, now);
    fundamental.detune.setValueAtTime(-3, now);

    body.type = "sine";
    body.frequency.setValueAtTime(note.frequency * 2, now);

    sparkle.type = "sine";
    sparkle.frequency.setValueAtTime(note.frequency * 3.01, now);

    fundamentalGain.gain.setValueAtTime(0.24, now);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.75);

    bodyGain.gain.setValueAtTime(0.13, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

    sparkleGain.gain.setValueAtTime(0.05, now);
    sparkleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    fundamental.connect(fundamentalGain);
    body.connect(bodyGain);
    sparkle.connect(sparkleGain);
    fundamentalGain.connect(toneFilter);
    bodyGain.connect(toneFilter);
    sparkleGain.connect(toneFilter);

    const hammerNoise = context.createBufferSource();
    hammerNoise.buffer = createNoiseBuffer(context);

    const hammerFilter = context.createBiquadFilter();
    const hammerGain = context.createGain();

    hammerFilter.type = "bandpass";
    hammerFilter.frequency.setValueAtTime(1900, now);
    hammerFilter.Q.setValueAtTime(0.9, now);

    hammerGain.gain.setValueAtTime(0.075, now);
    hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    hammerNoise.connect(hammerFilter);
    hammerFilter.connect(hammerGain);
    hammerGain.connect(toneFilter);

    fundamental.start(now);
    body.start(now);
    sparkle.start(now);
    hammerNoise.start(now);

    fundamental.stop(now + 1.85);
    body.stop(now + 1.25);
    sparkle.stop(now + 0.48);
    hammerNoise.stop(now + 0.05);
  };
  playNoteRef.current = (note: PianoKey) => {
    void playNote(note);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.repeat ||
        (target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable))
      ) {
        return;
      }

      const noteId = KEYBOARD_NOTE_MAP[event.key.toLowerCase()];
      if (!noteId) return;

      const note = PIANO_KEYS.find((entry) => entry.id === noteId);
      if (!note) return;

      playNoteRef.current(note);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const activeNotes = useMemo(() => new Set(activeNoteIds), [activeNoteIds]);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#0b1018] text-white"
      style={{ direction: 'ltr' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,73,38,0.3)_0%,rgba(34,22,17,0.9)_44%,rgba(9,8,10,1)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(133,87,49,0.05)_0%,transparent_36%,rgba(91,58,36,0.04)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(168,118,73,0.55)_1px,transparent_1px),linear-gradient(90deg,rgba(168,118,73,0.55)_1px,transparent_1px)] bg-size-[36px_36px] opacity-[0.08]" />

      <section
        className="relative z-10 flex min-h-screen w-full flex-col justify-start px-4 pb-10 pt-27.5 sm:px-6 sm:pb-12 sm:pt-27.5 lg:px-[50px] lg:pb-14 lg:pt-27.5"
        style={{ direction: 'ltr' }}
      >
        <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="order-2 flex h-[32rem] w-full items-center justify-center overflow-visible sm:h-[38rem] lg:order-1 lg:h-auto lg:w-full lg:max-w-[54rem] lg:justify-start">
            <div className="relative w-[52rem] max-w-none origin-center rotate-90 scale-[0.95] overflow-hidden rounded-[1.9rem] border border-[#2b2118]/66 bg-[linear-gradient(180deg,#5b3a24_0%,#2a170f_22%,#130a08_100%)] px-3.5 pb-3.5 pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_52px_rgba(0,0,0,0.44)] sm:w-[62rem] sm:scale-100 sm:px-4 lg:w-full lg:max-w-none lg:rotate-0 lg:scale-100">
              <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/6 bg-black/14 px-4 py-2.5 text-[0.72rem] uppercase tracking-[0.18em] text-white/55">
                <span>{content.rangeLabel}</span>
                <span className="text-[#f0dec0]">{content.rangeValue}</span>
              </div>

              <div
                className="relative h-72 rounded-[1.55rem] border border-black/20 bg-[linear-gradient(180deg,rgba(17,10,8,0.92)_0%,rgba(36,23,17,0.95)_100%)] px-[2.2%] pb-[2.4%] pt-[1.6%] shadow-[inset_0_14px_24px_rgba(255,255,255,0.03)] sm:h-84"
                style={{
                  transform: 'perspective(1400px) rotateX(180deg)',
                  transformStyle: 'preserve-3d',
                }}
              >
                <div className="absolute inset-x-[2.2%] top-[4.6%] h-1.25 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.02)_18%,rgba(255,255,255,0.02)_82%,rgba(255,255,255,0.12)_100%)]" />
                <div className="absolute inset-x-[2.2%] bottom-[2.4%] h-1 rounded-full bg-black/18" />

                {PIANO_KEYS.map((note) => (
                  <PianoKeyButton
                    key={note.id}
                    note={note}
                    active={activeNotes.has(note.id)}
                    onPlay={(targetNote) => {
                      void playNote(targetNote);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <article
            dir={isArabic ? 'rtl' : 'ltr'}
            className="order-1 mx-auto w-full max-w-[19rem] self-center rounded-[1.7rem] border border-[#d9c29b]/14 bg-[linear-gradient(180deg,rgba(95,62,37,0.26)_0%,rgba(33,22,17,0.34)_100%)] px-4 py-3 text-[#f1e1c4]/88 shadow-[0_28px_64px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:max-w-[22rem] sm:px-5 sm:py-4 lg:order-2 lg:ml-auto lg:mr-[100px] lg:max-w-[34rem] lg:px-6 lg:py-5"
          >
            <p
              className={`text-[0.84rem] leading-6 sm:text-[0.95rem] sm:leading-7 lg:text-[1.28rem] lg:leading-[2.15rem] ${isArabic ? 'font-layla text-right lg:text-right' : 'text-center lg:text-left'}`}
            >
              {content.paragraph}
            </p>
            <Link
              href={`/${locale}/enrollment`}
              className="mx-auto mt-4 inline-flex items-center rounded-full border border-[#d9c29b]/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.05)_100%)] px-4 py-2 text-[0.76rem] uppercase tracking-[0.16em] text-[#f3dfbb] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-200 hover:scale-[1.02] hover:bg-white/10 sm:px-5 sm:py-2.5 sm:text-[0.86rem] lg:mx-0 lg:mt-5 lg:px-6 lg:py-3 lg:text-[1.08rem]"
            >
              {content.enrollmentLabel}
            </Link>
          </article>
        </div>
      </section>
    </main>
  );
}
