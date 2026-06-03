'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import Footer from './Footer';

// ─── Placeholder media ────────────────────────────────────────────────────────
const MEDIA: { type: 'image' | 'video'; src: string }[] = [
  { type: 'image', src: '/images/aboutSection/about-1.jpg' },
  { type: 'image', src: '/images/aboutSection/about-2.jpg' },
  { type: 'image', src: '/images/aboutSection/about-3.jpg' },
  { type: 'image', src: '/images/aboutSection/about-4.jpg' },
  { type: 'image', src: '/images/aboutSection/about-5.jpg' },
];

// ─── Our Story content (EN + AR) ─────────────────────────────────────────────
const OUR_STORY = {
  label: { en: 'Our Story', ar: 'قصتنا' },
  heading: {
    en: 'Founded on a Vision of Excellence',
    ar: 'تأسست على رؤية من التميز',
  },
  body: {
    en: [
      'Previously known as Music Palace – Al Mouj, Royal Academy has evolved into a multidisciplinary center for Dance, Music, and Arts in Muscat.',
      'Founded on the belief that the arts are not a luxury, but a language of expression, discipline, and personal growth, the Academy brings together ballet, music, dance, visual arts, and wellness under one inspiring roof.',
      'We offer professionally structured programs designed to inspire, develop, and elevate students across all age groups. Whether discovering a new passion, returning to the arts, or deepening personal technique and wellbeing, every student is welcomed into a supportive and refined learning environment.',
      'At Royal Academy, we cultivate technique, confidence, creativity, and a lifelong connection to the arts.',
    ],
    ar: [
      'كانت تُعرف سابقاً بـ Music Palace – Al Mouj، وقد تطورت الأكاديمية الملكية لتصبح مركزاً متعدد التخصصات للرقص والموسيقى والفنون في مسقط.',
      'تأسست على الاعتقاد بأن الفنون ليست ترفاً، بل هي لغة للتعبير والانضباط والنمو الشخصي، وتجمع الأكاديمية الباليه والموسيقى والرقص والفنون البصرية والعافية تحت سقف واحد ملهم.',
      'نقدم برامج منظمة باحترافية مصممة لإلهام الطلاب وتطويرهم والارتقاء بهم عبر جميع الفئات العمرية. سواء أكانوا يكتشفون شغفاً جديداً، أم يعودون إلى الفنون، أم يعمّقون تقنياتهم الشخصية ورفاهيتهم، يُرحَّب بكل طالب في بيئة تعليمية داعمة ومتطورة.',
      'في الأكاديمية الملكية، نُنمّي التقنية والثقة والإبداع وارتباطاً مدى الحياة بالفنون.',
    ],
  },
};

// ─── Inject patternScroll keyframe once ──────────────────────────────────────
const PATTERN_SCROLL_CSS = `
@keyframes patternScroll {
  from { background-position: 0 0; }
  to   { background-position: 0 500px; }
}
`;

function usePatternScrollKeyframe() {
  useEffect(() => {
    const id = 'pattern-scroll-keyframe';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = PATTERN_SCROLL_CSS;
    document.head.appendChild(style);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);
}

// ─── useIsMobile hook ─────────────────────────────────────────────────────────
// AFTER
function useIsMobile(breakpoint = 768): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── Baroque SVG Frame ────────────────────────────────────────────────────────
function BaroqueFrame({ width, height }: { width: number; height: number }) {
  const sw = width;
  const sh = height;
  const cs = Math.min(sw, sh) * 0.16;

  return (
    <svg
      viewBox={`0 0 ${sw} ${sh}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'visible',
      }}
    >
      <defs>
        <filter id="bgoldGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="bsoftGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="bgoldH" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#aaaaaa" stopOpacity="0.3" />
          <stop offset="30%" stopColor="#dddddd" stopOpacity="1" />
          <stop offset="70%" stopColor="#aaaaaa" stopOpacity="1" />
          <stop offset="100%" stopColor="#aaaaaa" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="bgoldV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#aaaaaa" stopOpacity="0.3" />
          <stop offset="30%" stopColor="#dddddd" stopOpacity="1" />
          <stop offset="70%" stopColor="#aaaaaa" stopOpacity="1" />
          <stop offset="100%" stopColor="#aaaaaa" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="braGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#555555" />
          <stop offset="45%" stopColor="#888888" />
          <stop offset="100%" stopColor="#aaaaaa" />
        </linearGradient>
      </defs>

      <rect
        x="1"
        y="1"
        width={sw - 2}
        height={sh - 2}
        fill="none"
        stroke="url(#bgoldH)"
        strokeWidth="1.5"
        filter="url(#bgoldGlow)"
      />
      <rect
        x="8"
        y="8"
        width={sw - 16}
        height={sh - 16}
        fill="none"
        stroke="rgba(180,180,180,0.2)"
        strokeWidth="0.6"
      />

      {(
        [
          [0, 0, 1, 1],
          [sw, 0, -1, 1],
          [0, sh, 1, -1],
          [sw, sh, -1, -1],
        ] as [number, number, number, number][]
      ).map(([cx, cy, sx, sy], idx) => (
        <g
          key={idx}
          transform={`translate(${cx},${cy}) scale(${sx},${sy})`}
          filter="url(#bgoldGlow)"
        >
          <path
            d={`M 3,${cs * 0.75} L 3,14 Q 3,3 14,3 L ${cs * 0.75},3`}
            fill="none"
            stroke="rgba(180,180,180,0.9)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d={`M 10,${cs * 0.55} L 10,18 Q 10,10 18,10 L ${cs * 0.55},10`}
            fill="none"
            stroke="rgba(180,180,180,0.35)"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
          <circle
            cx="3"
            cy="3"
            r="5"
            fill="rgba(200,200,200,0.9)"
            stroke="rgba(180,180,180,0.7)"
            strokeWidth="1"
          />
          <circle cx="3" cy="3" r="2" fill="rgba(180,180,180,0.5)" />
          <path
            d={`M ${cs * 0.14},3 C ${cs * 0.2},-1 ${cs * 0.3},-4 ${cs * 0.38},3 C ${cs * 0.46},9 ${cs * 0.54},1 ${cs * 0.65},3`}
            fill="none"
            stroke="rgba(180,180,180,0.55)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d={`M ${cs * 0.14},3 L ${cs * 0.18},-1 L ${cs * 0.22},3 L ${cs * 0.18},7 Z`}
            fill="rgba(180,180,180,0.45)"
          />
          <path
            d={`M 3,${cs * 0.14} C -1,${cs * 0.2} -4,${cs * 0.3} 3,${cs * 0.38} C 9,${cs * 0.46} 1,${cs * 0.54} 3,${cs * 0.65}`}
            fill="none"
            stroke="rgba(180,180,180,0.55)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d={`M 3,${cs * 0.14} L -1,${cs * 0.18} L 3,${cs * 0.22} L 7,${cs * 0.18} Z`}
            fill="rgba(180,180,180,0.45)"
          />
          {[0, 60, 120, 180, 240, 300].map((angle, pi) => (
            <ellipse
              key={pi}
              cx={3 + Math.cos((angle * Math.PI) / 180) * 9}
              cy={3 + Math.sin((angle * Math.PI) / 180) * 9}
              rx="3"
              ry="1.2"
              transform={`rotate(${angle} ${3 + Math.cos((angle * Math.PI) / 180) * 9} ${3 + Math.sin((angle * Math.PI) / 180) * 9})`}
              fill="rgba(180,180,180,0.22)"
            />
          ))}
        </g>
      ))}

      {/* <g transform={`translate(${sw / 2}, 0)`} filter="url(#bsoftGlow)">
        <circle
          cx="0"
          cy="0"
          r="22"
          fill="rgba(0,0,0)"
          stroke="rgba(180,180,180,0.7)"
          strokeWidth="1.2"
        />
        <circle
          cx="0"
          cy="0"
          r="18"
          fill="none"
          stroke="rgba(180,180,180,0.25)"
          strokeWidth="0.6"
        />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => (
          <line
            key={i}
            x1={Math.cos((a * Math.PI) / 180) * 23}
            y1={Math.sin((a * Math.PI) / 180) * 23}
            x2={Math.cos((a * Math.PI) / 180) * 28}
            y2={Math.sin((a * Math.PI) / 180) * 28}
            stroke="rgba(180,180,180,0.4)"
            strokeWidth="0.8"
          />
        ))}
        <text
          x="0"
          y="5"
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            fill: "url(#braGold)",
            fontStyle: "italic",
          }}
        >
          RA
        </text>
        <path
          d="M -36,0 C -28,-6 -24,6 -28,0"
          fill="none"
          stroke="rgba(180,180,180,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M 36,0 C 28,-6 24,6 28,0"
          fill="none"
          stroke="rgba(180,180,180,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="-46"
          y1="0"
          x2={-(sw / 2 - cs * 0.75)}
          y2="0"
          stroke="rgba(180,180,180,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
        <line
          x1="46"
          y1="0"
          x2={sw / 2 - cs * 0.75}
          y2="0"
          stroke="rgba(180,180,180,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
      </g>

      <g transform={`translate(${sw / 2}, ${sh})`} filter="url(#bsoftGlow)">
        <circle
          cx="0"
          cy="0"
          r="22"
          fill="rgba(0,0,0)"
          stroke="rgba(180,180,180,0.7)"
          strokeWidth="1.2"
        />
        <circle
          cx="0"
          cy="0"
          r="18"
          fill="none"
          stroke="rgba(180,180,180,0.25)"
          strokeWidth="0.6"
        />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => (
          <line
            key={i}
            x1={Math.cos((a * Math.PI) / 180) * 23}
            y1={Math.sin((a * Math.PI) / 180) * 23}
            x2={Math.cos((a * Math.PI) / 180) * 28}
            y2={Math.sin((a * Math.PI) / 180) * 28}
            stroke="rgba(180,180,180,0.4)"
            strokeWidth="0.8"
          />
        ))}
        <text
          x="0"
          y="5"
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "14px",
            fill: "url(#braGold)",
            fontStyle: "italic",
          }}
        >
          RA
        </text>
        <path
          d="M -36,0 C -28,-6 -24,6 -28,0"
          fill="none"
          stroke="rgba(180,180,180,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M 36,0 C 28,-6 24,6 28,0"
          fill="none"
          stroke="rgba(180,180,180,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="-46"
          y1="0"
          x2={-(sw / 2 - cs * 0.75)}
          y2="0"
          stroke="rgba(180,180,180,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
        <line
          x1="46"
          y1="0"
          x2={sw / 2 - cs * 0.75}
          y2="0"
          stroke="rgba(180,180,180,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
      </g>

      <g transform={`translate(0, ${sh / 2})`} filter="url(#bsoftGlow)">
        <circle
          cx="0"
          cy="0"
          r="20"
          fill="rgba(0,0,0)"
          stroke="rgba(180,180,180,0.7)"
          strokeWidth="1.2"
        />
        <circle
          cx="0"
          cy="0"
          r="16"
          fill="none"
          stroke="rgba(180,180,180,0.25)"
          strokeWidth="0.6"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
          <line
            key={i}
            x1={Math.cos((a * Math.PI) / 180) * 21}
            y1={Math.sin((a * Math.PI) / 180) * 21}
            x2={Math.cos((a * Math.PI) / 180) * 26}
            y2={Math.sin((a * Math.PI) / 180) * 26}
            stroke="rgba(180,180,180,0.4)"
            strokeWidth="0.8"
          />
        ))}
        <text
          x="0"
          y="4"
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "12px",
            fill: "url(#braGold)",
            fontStyle: "italic",
          }}
        >
          RA
        </text>
        <line
          x1="0"
          y1="-44"
          x2="0"
          y2={-(sh / 2 - cs * 0.75)}
          stroke="rgba(180,180,180,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
        <line
          x1="0"
          y1="44"
          x2="0"
          y2={sh / 2 - cs * 0.75}
          stroke="rgba(180,180,180,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
      </g>

      <g transform={`translate(${sw}, ${sh / 2})`} filter="url(#bsoftGlow)">
        <circle
          cx="0"
          cy="0"
          r="20"
          fill="rgba(0,0,0)"
          stroke="rgba(180,180,180,0.7)"
          strokeWidth="1.2"
        />
        <circle
          cx="0"
          cy="0"
          r="16"
          fill="none"
          stroke="rgba(180,180,180,0.25)"
          strokeWidth="0.6"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
          <line
            key={i}
            x1={Math.cos((a * Math.PI) / 180) * 21}
            y1={Math.sin((a * Math.PI) / 180) * 21}
            x2={Math.cos((a * Math.PI) / 180) * 26}
            y2={Math.sin((a * Math.PI) / 180) * 26}
            stroke="rgba(180,180,180,0.4)"
            strokeWidth="0.8"
          />
        ))}
        <text
          x="0"
          y="4"
          textAnchor="middle"
          style={{
            fontFamily: "var(--font-text)",
            fontSize: "12px",
            fill: "url(#braGold)",
            fontStyle: "italic",
          }}
        >
          RA
        </text>
        <line
          x1="0"
          y1="-44"
          x2="0"
          y2={-(sh / 2 - cs * 0.75)}
          stroke="rgba(180,180,180,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
        <line
          x1="0"
          y1="44"
          x2="0"
          y2={sh / 2 - cs * 0.75}
          stroke="rgba(180,180,180,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
      </g> */}

      <rect
        x="1"
        y="1"
        width={sw - 2}
        height={sh - 2}
        fill="none"
        strokeWidth="2"
        stroke="rgba(220,220,220,0)"
      >
        <animate
          attributeName="stroke-opacity"
          values="0;0.5;0"
          dur="5s"
          repeatCount="indefinite"
        />
      </rect>
    </svg>
  );
}

// ─── Media player ─────────────────────────────────────────────────────────────
function RoyalMediaPlayer({
  active,
  isMobile,
}: {
  active: boolean;
  isMobile: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [frameSize, setFrameSize] = useState({ width: 500, height: 360 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  useEffect(() => setMounted(true), []);

  // Pause slideshow when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const item = MEDIA[current];

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setFrameSize({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (active) setPlaying(true);
    else {
      setPlaying(false);
      if (videoRef.current) videoRef.current.pause();
    }
  }, [active]);

  useEffect(() => {
    if (item.type !== 'video') return;
    const t = setTimeout(() => {
      const v = videoRef.current;
      if (!v) return;
      if (playing) v.play().catch(() => {});
      else v.pause();
    }, 100);
    return () => clearTimeout(t);
  }, [playing, current, item.type]);

  const goNext = useCallback(() => {
    setCurrent((p) => (p + 1) % MEDIA.length);
  }, []);

  useEffect(() => {
    if (!playing || !inView || item.type === 'video') {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(goNext, 4500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, current, item.type, goNext, inView]);

  // On desktop the player fills its grid cell; on mobile it uses old sizing
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: isMobile ? 'calc(100% - 56px)' : '100%',
          height: isMobile ? undefined : '100%',
          aspectRatio: isMobile ? '4/3' : undefined,
          marginTop: isMobile ? '40px' : 0,
        }}
      >
        {/* Baroque frame */}
        {mounted && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 3,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            <BaroqueFrame width={frameSize.width} height={frameSize.height} />
          </div>
        )}

        {/* Media area */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            background: '#000000',
            zIndex: 1,
          }}
        >
          <AnimatePresence mode="wait">
            {item.type === 'image' ? (
              <motion.img
                key={`img-${current}`}
                src={item.src}
                alt="Royal Academy"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.75, ease: 'easeInOut' }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            ) : (
              <motion.video
                key={`vid-${current}`}
                ref={videoRef}
                src={item.src}
                loop={false}
                muted
                playsInline
                preload="auto"
                onEnded={goNext}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            )}
          </AnimatePresence>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 2,
              background:
                'radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(8,12,30,0.55) 100%)',
            }}
          />
        </div>

        {/* Play / Pause */}
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            position: 'absolute',
            bottom: isMobile ? 28 : 42,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            width: isMobile ? 32 : 36,
            height: isMobile ? 32 : 36,
            borderRadius: '50%',
            background: 'var(--royal-dark)',
            border: '1px solid rgba(180,180,180,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(180,180,180,0.9)',
            boxShadow: '0 0 14px rgba(180,180,180,0.2)',
            transition: 'all 0.2s ease',
          }}
        >
          {playing ? (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <rect x="0" y="0" width="3.5" height="12" rx="1" />
              <rect x="6.5" y="0" width="3.5" height="12" rx="1" />
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor">
              <path d="M0 0 L10 6 L0 12 Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Our Story text block ─────────────────────────────────────────────────────
function OurStoryBlock({ locale }: { locale: string }) {
  const isArabic = locale === 'ar';
  const paragraphs = isArabic ? OUR_STORY.body.ar : OUR_STORY.body.en;
  return (
    <div
      style={{
        maxWidth: 'min(960px, 88vw)',
        width: '100%',
        textAlign: 'center',
        direction: isArabic ? 'rtl' : 'ltr',
        padding: '0 16px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-text)',
          fontSize: 'clamp(0.65rem, 0.9vw, 0.95rem)',
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#ff751f',
          marginBottom: 14,
        }}
      >
        {isArabic ? OUR_STORY.label.ar : OUR_STORY.label.en}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-text)',
          fontSize: 'clamp(1.2rem, 2.4vw, 2.4rem)',
          fontWeight: 400,
          color: '#1a1a1a',
          lineHeight: 1.3,
          marginBottom: 20,
        }}
      >
        {isArabic ? OUR_STORY.heading.ar : OUR_STORY.heading.en}
      </div>
      <div
        style={{
          height: 1,
          background:
            'linear-gradient(to right, transparent, rgba(0,0,0,0.2), transparent)',
          margin: '0 auto 24px',
          maxWidth: 260,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              fontFamily: 'var(--font-text)',
              fontSize: 'clamp(0.85rem, 1.15vw, 1.15rem)',
              lineHeight: 1.82,
              color: '#555555',
              margin: 0,
            }}
          >
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Mobile layout ────────────────────────────────────────────────────────────
function MobileAboutLayout({
  active,
  locale,
}: {
  active: boolean;
  locale: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 2,
        marginTop: 80,
      }}
    >
      <div
        style={{
          flex: 'none',
          width: '100%',
          height: '56vw',
          minHeight: 280,
          maxHeight: 420,
          paddingTop: 16,
        }}
      >
        <RoyalMediaPlayer active={active} isMobile={true} />
      </div>
      <div style={{ padding: '32px 32px 24px' }}>
        <OurStoryBlock locale={locale} />
      </div>
    </div>
  );
}

// ─── Desktop layout: frame centered, Our Story below ─────────────────────────
function DesktopAboutLayout({
  active,
  locale,
}: {
  active: boolean;
  locale: string;
}) {
  return (
    <div
      style={{
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '72px 40px 0 40px',
        position: 'relative',
        zIndex: 2,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'min(900px, 72vw)',
          aspectRatio: '4 / 3',
          position: 'relative',
          maxHeight: '65vh',
        }}
      >
        <RoyalMediaPlayer active={active} isMobile={false} />
      </div>
      <div style={{ marginTop: 56, paddingBottom: 56 }}>
        <OurStoryBlock locale={locale} />
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AboutSection({
  active = false,
  locale,
  scrollable = false,
}: {
  active?: boolean;
  locale: string;
  scrollable?: boolean;
}) {
  const isMobile = useIsMobile(768);
  usePatternScrollKeyframe();

  return (
    <div
      style={{
        width: '100%',
        height: scrollable ? 'auto' : '100%',
        minHeight: scrollable ? '100svh' : undefined,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: scrollable ? 'visible' : (isMobile === true ? 'visible' : 'hidden'),
        zIndex: 2,
        /* background:
          'radial-gradient(circle at 18% 12%, rgba(180,180,180,0.16) 0%, transparent 55%), radial-gradient(circle at 82% 28%, rgba(92,45,74,0.30) 0%, transparent 62%), linear-gradient(135deg, var(--royal-purple) 0%, var(--royal-dark) 58%, #0b0f2a 100%)', */
        background: '#e5e4e2',
      }}
    >
      {/* Top gold rule */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          zIndex: 5,
          background:
            'linear-gradient(to right, transparent, rgba(180,180,180,0.4), transparent)',
        }}
      />

      {/* Subtle grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.022,
          pointerEvents: 'none',
          zIndex: 2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Scrolling background pattern */}
      {/* <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/pattern.png')",
          backgroundRepeat: 'repeat',
          backgroundSize: 'auto',
          animation: 'patternScroll 32s linear infinite',
          opacity: 1,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      /> */}

      {/* Fixed overlay pattern */}
      {/* <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: "url('/images/pattern_black_transparent.svg')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 1,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      /> */}

      {/* ── Layout branch: mobile vs desktop ── */}
      {isMobile ? (
        <MobileAboutLayout active={active} locale={locale} />
      ) : (
        <DesktopAboutLayout active={active} locale={locale} />
      )}

      {/* Footer */}
      <div style={{ position: 'relative', zIndex: 3, flexShrink: 0 }}>
        <Footer locale={locale} />
      </div>
    </div>
  );
}
