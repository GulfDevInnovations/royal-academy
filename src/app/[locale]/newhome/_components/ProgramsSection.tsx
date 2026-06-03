'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import ContactGuard from './ContactGuard';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubClass {
  en: string;
  ar: string;
  indent?: boolean;
}

interface Program {
  id: string;
  en: string;
  ar: string;
  dept: string;
  description: string;
  description_ar: string;
  subClasses: SubClass[];
}

function buildHref(locale: string, dept: string, q: string): string {
  const params = new URLSearchParams({ dept });
  if (q) params.set('q', q);
  return `/${locale}/enrollment?${params.toString()}`;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const PROGRAMS: Program[] = [
  {
    id: 'dance',
    en: 'Dance',
    ar: 'الرقص',
    dept: 'ballet',
    subClasses: [
      { en: 'Ballet', ar: 'الباليه' },
      { en: 'RAD Ballet', ar: 'باليه RAD', indent: true },
      { en: 'Open Class Ballet', ar: 'باليه الفصل المفتوح', indent: true },
      { en: 'Baby Ballet', ar: 'باليه الأطفال', indent: true },
      { en: 'Contemporary Dance', ar: 'الرقص المعاصر' },
      { en: 'Hip-Hop', ar: 'هيب هوب' },
      { en: 'Jazz', ar: 'جاز' },
      { en: 'Aerial Hoop', ar: 'الحلقة الهوائية' },
      { en: 'Zumba', ar: 'زومبا' },
      { en: 'Kids Gymnastics', ar: 'جمباز الأطفال' },
    ],
  },
  {
    id: 'music',
    en: 'Music',
    ar: 'الموسيقى',
    dept: 'music',
    subClasses: [
      { en: 'Piano', ar: 'البيانو' },
      { en: 'Guitar', ar: 'الغيتار' },
      { en: 'Drums', ar: 'الطبول' },
      { en: 'Bass Guitar', ar: 'غيتار البيس' },
      { en: 'Handpan', ar: 'هاندبان' },
      { en: 'Music Awakening', ar: 'الصحوة الموسيقية' },
      { en: 'Music Theory', ar: 'نظرية الموسيقى' },
    ],
  },
  {
    id: 'art',
    en: 'Art',
    ar: 'الفن',
    dept: 'art',
    subClasses: [
      { en: 'Drawing', ar: 'الرسم' },
      { en: 'Arts & Crafts', ar: 'الفنون والحرف اليدوية' },
      { en: 'Visual Arts Workshops', ar: 'ورش الفنون البصرية' },
    ],
  },
  {
    id: 'wellness',
    en: 'Yoga & Wellness',
    ar: 'اليوغا والعافية',
    dept: 'dance',
    subClasses: [
      { en: 'Pilates', ar: 'البيلاتس' },
      { en: 'Body Flexibility', ar: 'مرونة الجسم' },
      { en: 'Stretching', ar: 'تمارين الإطالة' },
      { en: 'Yoga', ar: 'اليوغا' },
    ],
  },
];

const TAGLINE = {
  en: 'Our team will help you choose the right class based on age, level, and learning goals.',
  ar: 'سيساعدك فريقنا في اختيار الفصل المناسب بناءً على العمر والمستوى وأهداف التعلم.',
};
const LABEL = { en: 'What We Offer', ar: 'ما نقدمه' };
const HEADING = { en: 'Our Programs', ar: 'برامجنا' };

// px of scroll room per category transition
const STEP_PX = 300;

// ─── useIsMobile ──────────────────────────────────────────────────────────────

function useIsMobile(bp = 768): boolean | null {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${bp - 1}px)`);
    setV(mql.matches);
    const h = (e: MediaQueryListEvent) => setV(e.matches);
    mql.addEventListener('change', h);
    return () => mql.removeEventListener('change', h);
  }, [bp]);
  return v;
}

// ─── TypewriterTagline ────────────────────────────────────────────────────────
// Renders the tagline with a character-by-character typing effect. Once fully
// typed, the text becomes a button that opens ContactGuard.

function TypewriterTagline({
  text,
  isAr,
  fontFamily,
  locale,
  textStyle,
  inverted = false,
}: {
  text: string;
  isAr: boolean;
  fontFamily: string;
  locale: string;
  textStyle: React.CSSProperties;
  inverted?: boolean;
}) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const [showGuard, setShowGuard] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const [hover, setHover] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Start typing when the wrapper enters the viewport
  useEffect(() => {
    setDisplayed('');
    setDone(false);
    const el = wrapperRef.current;
    if (!el) return;

    let tick: ReturnType<typeof setInterval> | null = null;
    let started = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true;
          observer.disconnect();
          let i = 0;
          tick = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
              clearInterval(tick!);
              setDone(true);
            }
          }, 36);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (tick) clearInterval(tick);
    };
  }, [text]);

  // Blinking cursor while typing
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(id);
  }, [done]);

  return (
    <>
      <div ref={wrapperRef} style={{ margin: 0, padding: 0 }}>
        {done ? (
          <button
            onClick={() => setShowGuard(true)}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
              background: hover
                ? inverted
                  ? 'rgba(255,255,255,0.12)'
                  : 'rgba(255,117,31)'
                : 'transparent',
              border: '3px solid rgba(255,117,31)',
              padding: '18px 22px 14px',
              margin: 0,
              cursor: 'pointer',
              fontFamily,
              transition: 'border-color 0.25s ease, background 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              ...textStyle,
            }}
          >
            {text}
          </button>
        ) : (
          <p style={{ margin: 0, ...textStyle }}>
            {displayed}
            <span
              style={{
                opacity: cursorOn ? 0.55 : 0,
                fontStyle: 'normal',
                transition: 'opacity 0.1s',
              }}
            >
              |
            </span>
          </p>
        )}
      </div>

      {showGuard && (
        <ContactGuard
          onClose={() => setShowGuard(false)}
          locale={locale}
          isAr={isAr}
          fontFamily={fontFamily}
        />
      )}
    </>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ProgramsSection() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const isAr = locale === 'ar';
  const isMobileVal = useIsMobile(768);
  const isMobile = isMobileVal === true;

  const fontFamily = isAr
    ? "'Layla','Noto Naskh Arabic',serif"
    : "'Goudy Old Style','GoudyOlSt-BT',Georgia,serif";

  return isMobile ? (
    <MobilePrograms isAr={isAr} fontFamily={fontFamily} locale={locale} />
  ) : (
    <DesktopPrograms isAr={isAr} fontFamily={fontFamily} locale={locale} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP
// ═══════════════════════════════════════════════════════════════════════════════

function DesktopPrograms({
  isAr,
  fontFamily,
  locale,
}: {
  isAr: boolean;
  fontFamily: string;
  locale: string;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [subVisible, setSubVisible] = useState<boolean[]>(() =>
    new Array(PROGRAMS[0].subClasses.length).fill(false),
  );
  const prevIdxRef = useRef(0);
  const dir = isAr ? 'rtl' : 'ltr';

  const reveal = useCallback((items: SubClass[]) => {
    setSubVisible(new Array(items.length).fill(false));
    items.forEach((_, i) =>
      setTimeout(
        () =>
          setSubVisible((prev) => {
            const n = [...prev];
            n[i] = true;
            return n;
          }),
        40 + i * 50,
      ),
    );
  }, []);

  useEffect(() => {
    reveal(PROGRAMS[0].subClasses);
  }, [reveal]);

  useEffect(() => {
    if (prevIdxRef.current === activeIdx) return;
    prevIdxRef.current = activeIdx;
    reveal(PROGRAMS[activeIdx].subClasses);
  }, [activeIdx, reveal]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const onScroll = () => {
      const scrolled = -wrapper.getBoundingClientRect().top;
      if (scrolled < 0) {
        setActiveIdx(0);
        return;
      }
      const idx = Math.min(Math.floor(scrolled / STEP_PX), PROGRAMS.length - 1);
      setActiveIdx(idx);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollRoom = (PROGRAMS.length - 1) * STEP_PX;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        height: `calc(100vh + ${scrollRoom}px)`,
        fontFamily,
        direction: dir,
      }}
    >
      {/* Sticky full-screen panel */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Orange top bar — spans full width */}
        <div style={{ height: 3, background: '#ff751f', flexShrink: 0 }} />

        {/* Full-width header */}
        <div
          style={{
            background: '#e5e4e2',
            padding: '52px 60px 44px',
            flexShrink: 0,
            textAlign: isAr ? 'right' : 'left',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <p
            style={{
              margin: '0 0 12px',
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#ff751f',
              fontWeight: 500,
            }}
          >
            {LABEL[isAr ? 'ar' : 'en']}
          </p>
          <h2
            style={{
              margin: 0,
              fontSize: 'clamp(30px, 3.8vw, 52px)',
              fontWeight: 400,
              color: '#111',
              letterSpacing: '-0.01em',
              lineHeight: 1,
            }}
          >
            {HEADING[isAr ? 'ar' : 'en']}
          </h2>
        </div>

        {/* Two-column row: accordion (75%) + tagline (25%) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            direction: dir,
            overflow: 'hidden',
          }}
        >
          {/* ── Accordion side — 75% ── */}
          <div
            style={{
              flex: '0 0 75%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Accordion rows */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                overflow: 'hidden',
              }}
            >
              {PROGRAMS.map((prog, i) => {
                const isOpen = i === activeIdx;
                const label = isAr ? prog.ar : prog.en;
                return (
                  <div
                    key={prog.id}
                    style={{
                      flex: isOpen ? '1 1 auto' : '0 0 auto',
                      overflow: 'hidden',
                      transition: 'flex 0.5s cubic-bezier(0.22,1,0.36,1)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '22px 60px',
                        gap: 18,
                        flexDirection: isAr ? 'row-reverse' : 'row',
                      }}
                    >
                      <div
                        style={{
                          width: 3,
                          height: isOpen ? 32 : 0,
                          background: '#ff751f',
                          borderRadius: 2,
                          flexShrink: 0,
                          transition: 'height 0.4s cubic-bezier(0.22,1,0.36,1)',
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontSize: isOpen
                            ? 'clamp(37px, 4.5vw, 69px)'
                            : 'clamp(23px, 2.2vw, 37px)',
                          fontWeight: 400,
                          color: isOpen ? '#111' : 'rgba(0,0,0,0.32)',
                          letterSpacing: isOpen ? '-0.02em' : '-0.005em',
                          lineHeight: 1,
                          transition:
                            'font-size 0.5s cubic-bezier(0.22,1,0.36,1), color 0.35s ease',
                          textAlign: isAr ? 'right' : 'left',
                        }}
                      >
                        {label}
                      </span>
                    </div>

                    {isOpen && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px 0',
                          padding: isAr
                            ? '4px 100px 28px 60px'
                            : '4px 60px 28px 100px',
                          direction: dir,
                        }}
                      >
                        {prog.subClasses.map((sub, si) => (
                          <DesktopSubTag
                            key={si}
                            label={isAr ? sub.ar : sub.en}
                            indent={sub.indent}
                            visible={subVisible[si] ?? false}
                            href={buildHref(locale, prog.dept, sub.en)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Tagline side — 25% ── */}
          <div
            style={{
              flex: '0 0 25%',
              background: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 36px',
              gap: 22,
            }}
          >
            <TypewriterTagline
              text={TAGLINE[isAr ? 'ar' : 'en']}
              isAr={isAr}
              fontFamily={fontFamily}
              locale={locale}
              textStyle={{
                fontSize: 'clamp(18px, 2vw, 28px)',
                fontWeight: 400,
                color: '#1a1a1a',
                fontStyle: 'italic',
                lineHeight: 1.85,
                textAlign: 'center',
                letterSpacing: '0.01em',
              }}
            />
            <span
              style={{
                width: 32,
                height: 1,
                background: '#ff751f',
                display: 'block',
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Subclass inline tag
function DesktopSubTag({
  label,
  indent,
  visible,
  href,
}: {
  label: string;
  indent?: boolean;
  visible: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        marginInlineEnd: indent ? 18 : 26,
        marginInlineStart: indent ? 16 : 0,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: indent ? 3 : 5,
          height: indent ? 3 : 5,
          borderRadius: '50%',
          background: indent ? 'rgba(0,0,0,0.22)' : '#ff751f',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: indent ? 26 : 32,
          color: indent ? 'rgba(0,0,0,0.42)' : '#1a1a1a',
          fontWeight: 400,
          lineHeight: 1.2,
          transition: 'color 0.2s ease',
        }}
      >
        {label}
      </span>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE
// ═══════════════════════════════════════════════════════════════════════════════

function MobilePrograms({
  isAr,
  fontFamily,
  locale,
}: {
  isAr: boolean;
  fontFamily: string;
  locale: string;
}) {
  const tabBarRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [subVisible, setSubVisible] = useState<boolean[]>(() =>
    new Array(PROGRAMS[0].subClasses.length).fill(false),
  );
  const prevIdxRef = useRef(0);
  const dir = isAr ? 'rtl' : 'ltr';

  const reveal = useCallback((items: SubClass[]) => {
    setSubVisible(new Array(items.length).fill(false));
    items.forEach((_, i) =>
      setTimeout(
        () =>
          setSubVisible((prev) => {
            const n = [...prev];
            n[i] = true;
            return n;
          }),
        30 + i * 45,
      ),
    );
  }, []);

  useEffect(() => {
    reveal(PROGRAMS[0].subClasses);
  }, [reveal]);

  useEffect(() => {
    if (prevIdxRef.current === activeIdx) return;
    prevIdxRef.current = activeIdx;
    reveal(PROGRAMS[activeIdx].subClasses);
    const bar = tabBarRef.current;
    if (bar) {
      const tab = bar.children[activeIdx] as HTMLElement | undefined;
      if (tab)
        tab.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
    }
  }, [activeIdx, reveal]);

  return (
    <div style={{ fontFamily, direction: dir }}>
      {/* Orange top bar */}
      <div style={{ height: 3, background: '#ff751f' }} />

      {/* Header */}
      <div
        style={{
          background: '#e5e4e2',
          padding: '28px 18px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          textAlign: isAr ? 'right' : 'left',
        }}
      >
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 9,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: '#ff751f',
            fontWeight: 500,
          }}
        >
          {LABEL[isAr ? 'ar' : 'en']}
        </p>
        <h2
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 400,
            color: '#111',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}
        >
          {HEADING[isAr ? 'ar' : 'en']}
        </h2>
      </div>

      {/* Clickable tab bar */}
      <div
        ref={tabBarRef}
        style={{
          display: 'flex',
          flexDirection: isAr ? 'row-reverse' : 'row',
          overflowX: 'auto',
          background: '#ffffff',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          scrollbarWidth: 'none',
          flexShrink: 0,
        }}
      >
        {PROGRAMS.map((prog, i) => (
          <button
            key={prog.id}
            onClick={() => setActiveIdx(i)}
            style={{
              flexShrink: 0,
              padding: '14px 20px 12px',
              fontFamily,
              fontSize: 16,
              fontWeight: 400,
              color: i === activeIdx ? '#111' : 'rgba(0,0,0,0.32)',
              position: 'relative',
              transition: 'color 0.35s ease',
              whiteSpace: 'nowrap',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isAr ? prog.ar : prog.en}
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: i === activeIdx ? '70%' : 0,
                height: 2,
                background: '#ff751f',
                transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)',
                display: 'block',
                borderRadius: 1,
              }}
            />
          </button>
        ))}
      </div>

      {/* Active category label */}
      <div
        style={{
          padding: '18px 18px 6px',
          textAlign: isAr ? 'right' : 'left',
          background: '#ffffff',
        }}
      ></div>

      {/* Subclass items */}
      <div style={{ background: '#ffffff' }}>
        {PROGRAMS[activeIdx].subClasses.map((sub, si) => (
          <Link
            key={`${activeIdx}-${si}`}
            href={buildHref(locale, PROGRAMS[activeIdx].dept, sub.en)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: `${sub.indent ? 8 : 11}px 18px`,
              paddingInlineStart: sub.indent ? 36 : 18,
              borderBottom: '1px solid rgba(0,0,0,0.05)',
              direction: dir,
              textDecoration: 'none',
              cursor: 'pointer',
              opacity: subVisible[si] ? 1 : 0,
              transform: subVisible[si] ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            <span
              style={{
                width: sub.indent ? 3 : 5,
                height: sub.indent ? 3 : 5,
                borderRadius: '50%',
                background: sub.indent ? 'rgba(0,0,0,0.2)' : '#ff751f',
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: sub.indent ? 15 : 20,
                color: sub.indent ? 'rgba(0,0,0,0.45)' : '#1a1a1a',
                fontWeight: 400,
                lineHeight: 1.35,
              }}
            >
              {isAr ? sub.ar : sub.en}
            </span>
          </Link>
        ))}
      </div>

      {/* Tagline — at the bottom */}
      <div
        style={{
          background: '#ff751f',
          padding: '40px 18px 52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          direction: dir,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <TypewriterTagline
            text={TAGLINE[isAr ? 'ar' : 'en']}
            isAr={isAr}
            fontFamily={fontFamily}
            locale={locale}
            inverted
            textStyle={{
              fontSize: 18,
              color: '#fff',
              fontStyle: 'italic',
              lineHeight: 1.75,
              textAlign: 'center',
              letterSpacing: '0.01em',
            }}
          />
          <span
            style={{
              width: 28,
              height: 1,
              background: 'rgba(255,255,255,0.5)',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
}
