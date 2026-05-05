'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type HandpanNote = {
  id: string;
  label: string;
  shortcut: string;
  frequency: number;
  samplePath: string;
  position: 'center' | 'outer';
  angle?: number;
};

const HANDPAN_NOTES: HandpanNote[] = [
  {
    id: 'ding',
    label: 'D3',
    shortcut: 'G',
    frequency: 146.83,
    samplePath: '/audio/handpan/D3.mp3',
    position: 'center',
  },
  {
    id: 'a3',
    label: 'A3',
    shortcut: 'F',
    frequency: 220,
    samplePath: '/audio/handpan/A3.mp3',
    position: 'outer',
    angle: -112.5,
  },
  {
    id: 'c4',
    label: 'C4',
    shortcut: 'H',
    frequency: 261.63,
    samplePath: '/audio/handpan/C4.mp3',
    position: 'outer',
    angle: -67.5,
  },
  {
    id: 'd4',
    label: 'D4',
    shortcut: 'J',
    frequency: 293.66,
    samplePath: '/audio/handpan/D4.mp3',
    position: 'outer',
    angle: -22.5,
  },
  {
    id: 'f4',
    label: 'F4',
    shortcut: 'K',
    frequency: 349.23,
    samplePath: '/audio/handpan/F4.mp3',
    position: 'outer',
    angle: 22.5,
  },
  {
    id: 'g4',
    label: 'G4',
    shortcut: 'L',
    frequency: 392,
    samplePath: '/audio/handpan/G4.mp3',
    position: 'outer',
    angle: 67.5,
  },
  {
    id: 'a4',
    label: 'A4',
    shortcut: 'A',
    frequency: 440,
    samplePath: '/audio/handpan/A4.mp3',
    position: 'outer',
    angle: 112.5,
  },
  {
    id: 'c5',
    label: 'C5',
    shortcut: 'S',
    frequency: 523.25,
    samplePath: '/audio/handpan/C5.mp3',
    position: 'outer',
    angle: 157.5,
  },
  {
    id: 'd5',
    label: 'D5',
    shortcut: 'D',
    frequency: 587.33,
    samplePath: '/audio/handpan/D5.mp3',
    position: 'outer',
    angle: 202.5,
  },
];

const KEYBOARD_NOTE_MAP: Record<string, HandpanNote['label']> = {
  h: 'C4',
  j: 'D4',
  k: 'F4',
  l: 'G4',
  f: 'A3',
  d: 'D5',
  s: 'C5',
  a: 'A4',
  g: 'D3',
};

function HandpanPad({
  note,
  active,
  onHit,
}: {
  note: HandpanNote;
  active: boolean;
  onHit: (note: HandpanNote) => void;
}) {
  const sizeClassName =
    note.position === 'center'
      ? 'h-[4.2rem] w-[4.2rem] sm:h-20 sm:w-20 md:h-[5.6rem] md:w-[5.6rem]'
      : 'h-[3.15rem] w-[3.15rem] sm:h-[3.6rem] sm:w-[3.6rem] md:h-[4.2rem] md:w-[4.2rem]';

  const positionStyle = useMemo(() => {
    if (note.position === 'center') {
      return {
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const angle = ((note.angle ?? 0) * Math.PI) / 180;
    const radiusPercent = 38.5;

    return {
      left: `${50 + radiusPercent * Math.cos(angle)}%`,
      top: `${50 + radiusPercent * Math.sin(angle)}%`,
      transform: 'translate(-50%, -50%)',
    };
  }, [note.angle, note.position]);

  return (
    <button
      type="button"
      onClick={() => onHit(note)}
      aria-label={`Play ${note.label}`}
      className={`absolute ${sizeClassName} rounded-full transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9c997] ${
        active ? 'scale-[1.04]' : 'hover:scale-[1.02]'
      }`}
      style={positionStyle}
    >
      <span
        className={`absolute inset-0 rounded-full border border-white/20 bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.26)_0%,rgba(255,255,255,0.08)_18%,rgba(95,109,122,0.35)_42%,rgba(26,34,43,0.9)_72%,rgba(10,13,18,1)_100%)] shadow-[inset_0_2px_6px_rgba(255,255,255,0.08),0_18px_32px_rgba(0,0,0,0.35)]`}
      />
      <span
        className={`absolute inset-[17%] rounded-full border ${
          active ? 'border-[#f0d6aa]/80' : 'border-white/10'
        }`}
      />
      <span
        className={`absolute inset-[34%] rounded-full transition-all duration-150 ${
          active
            ? 'bg-[#f0d6aa]/45 shadow-[0_0_18px_rgba(240,214,170,0.45)]'
            : 'bg-white/5'
        }`}
      />
      <span className="absolute left-1/2 top-[14%] -translate-x-1/2 rounded-full border border-[#b7e6ff]/35 bg-[#74c8ff]/10 px-2 py-[2px] text-[9px] font-semibold uppercase tracking-[0.12em] text-[#9fdfff] shadow-[0_0_14px_rgba(116,200,255,0.12)] sm:text-[10px]">
        {note.shortcut}
      </span>
      <span className="absolute inset-x-0 bottom-[14%] text-center text-[10px] font-medium uppercase tracking-[0.18em] text-[#f2e3c8] sm:text-[11px]">
        {note.label}
      </span>
    </button>
  );
}

export default function HandpanPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeTimeoutRef = useRef<number | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const isArabic = locale === 'ar';

  useEffect(() => {
    return () => {
      if (activeTimeoutRef.current !== null) {
        window.clearTimeout(activeTimeoutRef.current);
      }
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, []);

  const hitNote = async (note: HandpanNote) => {
    if (activeTimeoutRef.current !== null) {
      window.clearTimeout(activeTimeoutRef.current);
    }
    setActiveNoteId(note.id);
    activeTimeoutRef.current = window.setTimeout(() => {
      setActiveNoteId((current) => (current === note.id ? null : current));
    }, 240);

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
    if (context.state === 'suspended') {
      await context.resume();
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const overtone = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(note.frequency, now);

    overtone.type = 'triangle';
    overtone.frequency.setValueAtTime(note.frequency * 2.01, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(0.75, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.28, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);

    oscillator.connect(filter);
    overtone.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    overtone.start(now);
    oscillator.stop(now + 1.75);
    overtone.stop(now + 1.6);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      const mappedLabel = KEYBOARD_NOTE_MAP[event.key.toLowerCase()];
      if (!mappedLabel) return;

      const note = HANDPAN_NOTES.find((entry) => entry.label === mappedLabel);
      if (!note) return;

      void hitNote(note);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const content = isArabic
    ? {
        helper:
          'اضغط على رموز المفاتيح الزرقاء الفاتحة الظاهرة على كل نغمة لتشغيل الهاندبان من لوحة المفاتيح الإنجليزية.',
        paragraph:
          'الهاندبان آلة إيقاعية لحنية حديثة صُنعت لأول مرة عام 2000 في برن، سويسرا، على يد فيليكس روهنر وسابينا شيرر. وقد قدمت آلتهما الأصلية، المعروفة باسم Hang، مزيجاً فريداً بين الإيقاع والهارموني مستلهماً من آلات مثل الستيل بان. وبفضل نغماتها الغنية والرنانة وطابعها الهادئ، أصبحت الهاندبان آلة مميزة تحظى بالإعجاب حول العالم بسبب صوتها الآسر والتأملي. 🎶',
        reserveHelper: 'احجز جلسة هاندبان حقيقية',
        reserveCta: 'التسجيل',
      }
    : {
        helper:
          'Press the light blue key hints shown on each note to play the handpan from your English keyboard.',
        paragraph:
          'The Handpan is a modern melodic percussion instrument first created in 2000 in Bern, Switzerland by Felix Rohner and Sabina Scharer. Their original instrument, known as the Hang, introduced a unique blend of rhythm and harmony inspired by instruments like the Steelpan. With its rich, resonant tones and serene character, the handpan has become a remarkable instrument admired around the world for its captivating and meditative sound. 🎶',
        reserveHelper: 'Reserve a real handpan session',
        reserveCta: 'Enrollment',
      };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071117]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(122,92,58,0.28)_0%,rgba(12,19,24,0.82)_52%,rgba(5,9,12,1)_100%)]" />
      <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-[0.03] mix-blend-screen" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-7xl flex-col justify-start px-4 pb-16 pt-[calc(4rem+30px)] sm:min-h-[calc(100svh-5rem)] sm:px-6 sm:pb-20 sm:pt-[calc(5rem+30px)] md:px-10">
        <div className="grid items-center gap-8 sm:gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div className="order-1 lg:order-1">
            <div className="relative mx-auto aspect-square w-full max-w-[18.5rem] sm:max-w-[24rem] lg:max-w-[29.4rem]">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.02)_18%,rgba(40,53,62,0.82)_38%,rgba(16,21,27,0.98)_72%,rgba(7,10,14,1)_100%)] shadow-[0_36px_80px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.08)]" />
              <div className="absolute inset-[3.2%] rounded-full border border-white/10" />
              <div className="absolute inset-[7%] rounded-full border border-white/10" />
              <div className="absolute inset-[11.5%] rounded-full border border-white/8" />
              <div className="absolute inset-[15.5%] rounded-full border border-white/6" />
              <div className="absolute inset-[22%] rounded-full border border-white/5" />
              <div className="absolute left-1/2 top-1/2 h-[12%] w-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#f0d6aa]/45 bg-[radial-gradient(circle_at_center,rgba(244,227,197,0.9)_0%,rgba(168,127,76,0.72)_80%,rgba(86,58,34,0.9)_100%)] shadow-[0_0_24px_rgba(240,214,170,0.12)]" />

              {HANDPAN_NOTES.map((note) => (
                <HandpanPad
                  key={note.id}
                  note={note}
                  active={activeNoteId === note.id}
                  onHit={hitNote}
                />
              ))}
            </div>
          </div>

          <div className="order-2 lg:order-2 lg:translate-x-[100px]">
            <div className="mx-auto flex w-full max-w-[31rem] flex-col gap-4 sm:max-w-[36rem] sm:gap-5 lg:mx-0 lg:max-w-none">
              <div
                className="hidden max-w-[22rem] rounded-[1.35rem] border px-4 py-[0.7rem] sm:max-w-[24rem] sm:px-5 sm:py-[0.85rem] lg:block"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderColor: 'rgba(217,192,161,0.18)',
                  boxShadow: '0 22px 48px rgba(0,0,0,0.28)',
                }}
              >
                <p className="text-[11px] leading-6 tracking-[0.18em] text-[#9fdfff]">
                  {content.helper}
                </p>
              </div>

              <div
                className="rounded-[1.6rem] border px-6 py-6 sm:rounded-[2rem] sm:px-7 sm:py-7 lg:px-8 lg:py-8"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderColor: 'rgba(217,192,161,0.18)',
                  boxShadow: '0 28px 58px rgba(0,0,0,0.32)',
                }}
              >
                <p className="text-[18px] leading-[2rem] text-[#eadfc9]/88 sm:text-[19px] sm:leading-[2.15rem]">
                  {content.paragraph}
                </p>

                <div className="mt-6 flex flex-col items-start gap-3 sm:mt-8">
                  <p className="text-[14px] uppercase tracking-[0.22em] text-[#d8bc92]/68 sm:text-[15px]">
                    {content.reserveHelper}
                  </p>
                  <Link
                    href={`/${locale}/enrollment/sub-handpan`}
                    className="liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-7 py-3 text-[14px] font-medium uppercase tracking-[0.18em] text-[#eadfc9]/88 transition-transform duration-300 hover:scale-[1.03] sm:text-[15px]"
                  >
                    {content.reserveCta}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
