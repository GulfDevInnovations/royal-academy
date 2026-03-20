"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// ─── Placeholder media ────────────────────────────────────────────────────────
const MEDIA: { type: "image" | "video"; src: string }[] = [
  { type: "image", src: "/images/about-1.jpg" },
  // { type: "video", src: "/videos/about-1.mp4" },
  { type: "image", src: "/images/about-2.jpg" },
  { type: "image", src: "/images/about-3.jpg" },

  // { type: "video", src: "/videos/about-2.mp4" },
];

// ─── Philosophy content ───────────────────────────────────────────────────────
const PHILOSOPHY = [
  {
    id: "history",
    label: "Our Story",
    heading: "Founded on a Vision of Excellence",
    body: "Royal Academy was founded in Muscat with a singular conviction: that the arts are not a luxury, but a language — one that shapes character, refines the spirit, and connects humanity across centuries. From its earliest days, the Academy has drawn together masters of ballet, music, dance, and visual art under one roof.",
  },
  {
    id: "philosophy",
    label: "Teaching Philosophy",
    heading: "Discipline as Liberation",
    body: "True creative freedom is born not from the absence of structure, but from a profound mastery of it. Every student is guided through a rigorous yet nurturing curriculum — one that honours classical traditions while encouraging original expression. Our teachers are mentors who see the full potential of each student.",
  },
  {
    id: "values",
    label: "Core Values",
    heading: "Excellence · Integrity · Community · Heritage",
    body: "We hold ourselves to the highest standards as a form of respect for the art. We teach with honesty and celebrate progress over perfection. The Academy is a place of belonging — for students, families, and the wider cultural life of Oman. We preserve great traditions, ensuring they are passed with care to the next generation.",
  },
];

// ─── RA Monogram SVG (inline, gold gradient version) ─────────────────────────
function RAMonogram({ size = 32 }: { size?: number }) {
  const id = `ra-grad-${size}`;
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 100 75"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8a5a6a" />
          <stop offset="45%" stopColor="#b08090" />
          <stop offset="100%" stopColor="#c4a882" />
        </linearGradient>
      </defs>
      {/* R — calligraphic, loosely traced from logo */}
      <path
        d="M 8,8 C 8,8 10,6 18,6 C 30,6 36,12 34,20 C 32,27 25,30 18,30
           L 28,50 L 22,50 L 14,31 L 12,31 L 12,50 L 7,50 Z
           M 12,10 L 12,27 L 20,27 C 26,27 30,24 30,19 C 30,13 26,10 18,10 Z"
        fill={`url(#${id})`}
        opacity="0.9"
      />
      {/* R tail flourish */}
      <path
        d="M 22,50 C 28,58 20,68 12,65 C 6,63 4,58 8,54"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      {/* A — tall with crossbar */}
      <path
        d="M 55,6 L 75,6 C 90,6 96,12 94,22 C 92,30 85,34 76,34
           L 88,50 L 82,50 L 71,34 L 60,34 L 60,50 L 55,50 Z
           M 60,10 L 60,30 L 74,30 C 81,30 89,27 89,21
           C 89,14 83,10 74,10 Z"
        fill={`url(#${id})`}
        opacity="0.9"
      />
      {/* A diagonal stroke bottom */}
      <path
        d="M 68,50 C 74,60 82,68 90,70"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
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
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
        overflow: "visible",
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
          <stop offset="0%" stopColor="#c4a882" stopOpacity="0.3" />
          <stop offset="30%" stopColor="#e8d4b0" stopOpacity="1" />
          <stop offset="70%" stopColor="#c4a882" stopOpacity="1" />
          <stop offset="100%" stopColor="#c4a882" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="bgoldV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c4a882" stopOpacity="0.3" />
          <stop offset="30%" stopColor="#e8d4b0" stopOpacity="1" />
          <stop offset="70%" stopColor="#c4a882" stopOpacity="1" />
          <stop offset="100%" stopColor="#c4a882" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id="braGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8a5a6a" />
          <stop offset="45%" stopColor="#b08090" />
          <stop offset="100%" stopColor="#c4a882" />
        </linearGradient>
      </defs>

      {/* ── Outer border lines ── */}
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
        stroke="rgba(196,168,130,0.2)"
        strokeWidth="0.6"
      />

      {/* ── Four corner ornaments ── */}
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
          {/* L-bracket */}
          <path
            d={`M 3,${cs * 0.75} L 3,14 Q 3,3 14,3 L ${cs * 0.75},3`}
            fill="none"
            stroke="rgba(196,168,130,0.9)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d={`M 10,${cs * 0.55} L 10,18 Q 10,10 18,10 L ${cs * 0.55},10`}
            fill="none"
            stroke="rgba(196,168,130,0.35)"
            strokeWidth="0.7"
            strokeLinecap="round"
          />

          {/* Corner rosette — replaced by RA silhouette hint */}
          <circle
            cx="3"
            cy="3"
            r="5"
            fill="rgba(212,184,150,0.9)"
            stroke="rgba(196,168,130,0.7)"
            strokeWidth="1"
          />
          <circle cx="3" cy="3" r="2" fill="rgba(196,168,130,0.5)" />

          {/* Scroll along top edge */}
          <path
            d={`M ${cs * 0.14},3 C ${cs * 0.2},-1 ${cs * 0.3},-4 ${cs * 0.38},3 C ${cs * 0.46},9 ${cs * 0.54},1 ${cs * 0.65},3`}
            fill="none"
            stroke="rgba(196,168,130,0.55)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          {/* Diamond along top */}
          <path
            d={`M ${cs * 0.14},3 L ${cs * 0.18},-1 L ${cs * 0.22},3 L ${cs * 0.18},7 Z`}
            fill="rgba(196,168,130,0.45)"
          />

          {/* Scroll along left edge */}
          <path
            d={`M 3,${cs * 0.14} C -1,${cs * 0.2} -4,${cs * 0.3} 3,${cs * 0.38} C 9,${cs * 0.46} 1,${cs * 0.54} 3,${cs * 0.65}`}
            fill="none"
            stroke="rgba(196,168,130,0.55)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          {/* Diamond along left */}
          <path
            d={`M 3,${cs * 0.14} L -1,${cs * 0.18} L 3,${cs * 0.22} L 7,${cs * 0.18} Z`}
            fill="rgba(196,168,130,0.45)"
          />

          {/* Filigree petals at corner */}
          {[0, 60, 120, 180, 240, 300].map((angle, pi) => (
            <ellipse
              key={pi}
              cx={3 + Math.cos((angle * Math.PI) / 180) * 9}
              cy={3 + Math.sin((angle * Math.PI) / 180) * 9}
              rx="3"
              ry="1.2"
              transform={`rotate(${angle} ${3 + Math.cos((angle * Math.PI) / 180) * 9} ${3 + Math.sin((angle * Math.PI) / 180) * 9})`}
              fill="rgba(196,168,130,0.22)"
            />
          ))}
        </g>
      ))}

      {/* ── Top center — RA medallion ── */}
      <g transform={`translate(${sw / 2}, 0)`} filter="url(#bsoftGlow)">
        {/* Medallion background circle */}
        <circle
          cx="0"
          cy="0"
          r="22"
          fill="rgba(0,0,0)"
          stroke="rgba(196,168,130,0.7)"
          strokeWidth="1.2"
        />
        <circle
          cx="0"
          cy="0"
          r="18"
          fill="none"
          stroke="rgba(196,168,130,0.25)"
          strokeWidth="0.6"
        />
        {/* Radiating spokes */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => (
          <g key={i}>
            <line
              x1={Math.cos((a * Math.PI) / 180) * 23}
              y1={Math.sin((a * Math.PI) / 180) * 23}
              x2={Math.cos((a * Math.PI) / 180) * 28}
              y2={Math.sin((a * Math.PI) / 180) * 28}
              stroke="rgba(196,168,130,0.4)"
              strokeWidth="0.8"
            />
          </g>
        ))}
        {/* RA text in medallion */}
        <text
          x="0"
          y="5"
          textAnchor="middle"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "14px",
            fill: "url(#braGold)",
            fontStyle: "italic",
          }}
        >
          RA
        </text>
        {/* Side scrolls */}
        <path
          d="M -36,0 C -28,-6 -24,6 -28,0"
          fill="none"
          stroke="rgba(196,168,130,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M 36,0 C 28,-6 24,6 28,0"
          fill="none"
          stroke="rgba(196,168,130,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Dashed lines to corners */}
        <line
          x1="-46"
          y1="0"
          x2={-(sw / 2 - cs * 0.75)}
          y2="0"
          stroke="rgba(196,168,130,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
        <line
          x1="46"
          y1="0"
          x2={sw / 2 - cs * 0.75}
          y2="0"
          stroke="rgba(196,168,130,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
      </g>

      {/* ── Bottom center — RA medallion ── */}
      <g transform={`translate(${sw / 2}, ${sh})`} filter="url(#bsoftGlow)">
        <circle
          cx="0"
          cy="0"
          r="22"
          fill="rgba(0,0,0)"
          stroke="rgba(196,168,130,0.7)"
          strokeWidth="1.2"
        />
        <circle
          cx="0"
          cy="0"
          r="18"
          fill="none"
          stroke="rgba(196,168,130,0.25)"
          strokeWidth="0.6"
        />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => (
          <g key={i}>
            <line
              x1={Math.cos((a * Math.PI) / 180) * 23}
              y1={Math.sin((a * Math.PI) / 180) * 23}
              x2={Math.cos((a * Math.PI) / 180) * 28}
              y2={Math.sin((a * Math.PI) / 180) * 28}
              stroke="rgba(196,168,130,0.4)"
              strokeWidth="0.8"
            />
          </g>
        ))}
        <text
          x="0"
          y="5"
          textAnchor="middle"
          style={{
            fontFamily: "Georgia, serif",
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
          stroke="rgba(196,168,130,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M 36,0 C 28,-6 24,6 28,0"
          fill="none"
          stroke="rgba(196,168,130,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="-46"
          y1="0"
          x2={-(sw / 2 - cs * 0.75)}
          y2="0"
          stroke="rgba(196,168,130,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
        <line
          x1="46"
          y1="0"
          x2={sw / 2 - cs * 0.75}
          y2="0"
          stroke="rgba(196,168,130,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
      </g>

      {/* ── Left center — RA medallion ── */}
      <g transform={`translate(0, ${sh / 2})`} filter="url(#bsoftGlow)">
        <circle
          cx="0"
          cy="0"
          r="20"
          fill="rgba(0,0,0)"
          stroke="rgba(196,168,130,0.7)"
          strokeWidth="1.2"
        />
        <circle
          cx="0"
          cy="0"
          r="16"
          fill="none"
          stroke="rgba(196,168,130,0.25)"
          strokeWidth="0.6"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
          <g key={i}>
            <line
              x1={Math.cos((a * Math.PI) / 180) * 21}
              y1={Math.sin((a * Math.PI) / 180) * 21}
              x2={Math.cos((a * Math.PI) / 180) * 26}
              y2={Math.sin((a * Math.PI) / 180) * 26}
              stroke="rgba(196,168,130,0.4)"
              strokeWidth="0.8"
            />
          </g>
        ))}
        <text
          x="0"
          y="4"
          textAnchor="middle"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "12px",
            fill: "url(#braGold)",
            fontStyle: "italic",
          }}
        >
          RA
        </text>
        {/* Top/bottom scrolls */}
        <path
          d="M 0,-34 C -6,-26 6,-22 0,-26"
          fill="none"
          stroke="rgba(196,168,130,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M 0,34 C -6,26 6,22 0,26"
          fill="none"
          stroke="rgba(196,168,130,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="-44"
          x2="0"
          y2={-(sh / 2 - cs * 0.75)}
          stroke="rgba(196,168,130,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
        <line
          x1="0"
          y1="44"
          x2="0"
          y2={sh / 2 - cs * 0.75}
          stroke="rgba(196,168,130,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
      </g>

      {/* ── Right center — RA medallion ── */}
      <g transform={`translate(${sw}, ${sh / 2})`} filter="url(#bsoftGlow)">
        <circle
          cx="0"
          cy="0"
          r="20"
          fill="rgba(0,0,0)"
          stroke="rgba(196,168,130,0.7)"
          strokeWidth="1.2"
        />
        <circle
          cx="0"
          cy="0"
          r="16"
          fill="none"
          stroke="rgba(196,168,130,0.25)"
          strokeWidth="0.6"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => (
          <line
            key={i}
            x1={Math.cos((a * Math.PI) / 180) * 21}
            y1={Math.sin((a * Math.PI) / 180) * 21}
            x2={Math.cos((a * Math.PI) / 180) * 26}
            y2={Math.sin((a * Math.PI) / 180) * 26}
            stroke="rgba(196,168,130,0.4)"
            strokeWidth="0.8"
          />
        ))}
        <text
          x="0"
          y="4"
          textAnchor="middle"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "12px",
            fill: "url(#braGold)",
            fontStyle: "italic",
          }}
        >
          RA
        </text>
        <path
          d="M 0,-34 C -6,-26 6,-22 0,-26"
          fill="none"
          stroke="rgba(196,168,130,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M 0,34 C -6,26 6,22 0,26"
          fill="none"
          stroke="rgba(196,168,130,0.6)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="-44"
          x2="0"
          y2={-(sh / 2 - cs * 0.75)}
          stroke="rgba(196,168,130,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
        <line
          x1="0"
          y1="44"
          x2="0"
          y2={sh / 2 - cs * 0.75}
          stroke="rgba(196,168,130,0.2)"
          strokeWidth="0.6"
          strokeDasharray="5,7"
        />
      </g>

      {/* ── Animated gold shimmer sweep ── */}
      <rect
        x="1"
        y="1"
        width={sw - 2}
        height={sh - 2}
        fill="none"
        strokeWidth="2"
        stroke="rgba(232,212,176,0)"
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
function RoyalMediaPlayer({ active }: { active: boolean }) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [frameSize, setFrameSize] = useState({ width: 500, height: 360 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const item = MEDIA[current];

  // Measure for frame
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setFrameSize({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Auto-play on section activation
  useEffect(() => {
    if (active) setPlaying(true);
    else {
      setPlaying(false);
      if (videoRef.current) videoRef.current.pause();
    }
  }, [active]);

  // Video play/pause control
  useEffect(() => {
    if (item.type !== "video") return;
    // Small delay lets AnimatePresence finish mounting the video element
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

  // Auto-advance images
  useEffect(() => {
    if (!playing || item.type === "video") {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(goNext, 4500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, current, item.type, goNext]);

  return (
    // Constrained width so navbar pills don't overlap frame
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2,
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "calc(60% - 100px)",
          height: "100%",
          padding: 0,
          marginTop: "180px",
        }}
      >
        {/* Baroque frame */}
        {mounted && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              pointerEvents: "none",
            }}
          >
            <BaroqueFrame width={frameSize.width} height={frameSize.height} />
          </div>
        )}
        {/* Media area inset from frame border */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            background: "#000000",
            zIndex: 1,
          }}
        >
          <AnimatePresence mode="wait">
            {item.type === "image" ? (
              <motion.img
                key={`img-${current}`}
                src={item.src}
                alt="Royal Academy"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.75, ease: "easeInOut" }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
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
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )}
          </AnimatePresence>

          {/* Vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 2,
              background:
                "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(8,12,30,0.55) 100%)",
            }}
          />
        </div>

        {/* Play / Pause — centered below frame, sitting on the bottom border */}
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            position: "absolute",
            bottom: 30,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--royal-purple)",
            border: "1px solid rgba(196,168,130,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(196,168,130,0.9)",
            boxShadow: "0 0 14px rgba(196,168,130,0.2)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--royal-purple)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--royal-dark)")
          }
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

// ─── Philosophy panel ─────────────────────────────────────────────────────────
function PhilosophyPanel({ active }: { active: boolean }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        // Match the horizontal inset of the media player above
        padding: "20px 80px 20px 80px",
        position: "relative",
        marginTop: "80px",
        zIndex: 2,
      }}
    >
      {/* Header row — all inline, no wrapping */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : -8 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 20,
          marginBottom: 16,
          whiteSpace: "nowrap",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 24,
              height: 1,
              background: "rgba(196,168,130,0.5)",
            }}
          />
          {/* <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "0.55rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "rgba(196,168,130,0.55)",
            }}
          >
            Royal Academy · Est. MMXXIV
          </span> */}
        </div>
        <h2
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(1.1rem, 1.6vw, 1.6rem)",
            fontWeight: 400,
            lineHeight: 1,
            color: "rgba(222,194,171,0.95)",
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          The Spirit of{" "}
          <em style={{ color: "rgba(196,168,130,0.9)" }}>the Academy</em>
        </h2>
      </motion.div>

      {/* Tab row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.55, delay: 0.32 }}
        style={{
          display: "flex",
          gap: 0,
          marginBottom: 16,
          borderBottom: "1px solid rgba(196,168,130,0.1)",
          whiteSpace: "nowrap",
          zIndex: 2,
        }}
      >
        {PHILOSOPHY.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActiveTab(i)}
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "0.80rem",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color:
                activeTab === i
                  ? "rgba(196,168,130,0.95)"
                  : "rgba(196,168,130,0.3)",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === i
                  ? "1px solid rgba(196,168,130,0.65)"
                  : "1px solid transparent",
              padding: "6px 18px 8px",
              cursor: "pointer",
              marginBottom: -1,
              transition: "all 0.3s ease",
            }}
          >
            {p.label}
          </button>
        ))}
      </motion.div>

      {/* Tab content — single line layout, no wrapping */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          style={{ flex: 1, overflow: "hidden", zIndex: 2 }}
        >
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "1.5rem",
              fontWeight: 400,
              color: "rgba(222,194,171,0.75)",
              letterSpacing: "0.04em",
              marginBottom: 10,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            — {PHILOSOPHY[activeTab].heading}
          </div>
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "1rem",
              lineHeight: 1.75,
              color: "rgba(222,194,171,0.45)",
              // Allow wrapping only for body text since it's long
              maxWidth: "100%",
            }}
          >
            {PHILOSOPHY[activeTab].body}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Animated rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ duration: 1.1, delay: 0.5, ease: "easeOut" }}
        style={{
          marginTop: 12,
          height: 1,
          zIndex: 2,
          background:
            "linear-gradient(to right, rgba(196,168,130,0.4), transparent)",
          transformOrigin: "left",
        }}
      />

      {/* Decorative large quote */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 60,
          fontFamily: "Georgia, serif",
          fontSize: "6rem",
          color: "rgba(196,168,130,0.035)",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
          zIndex: 2,
        }}
      >
        &quot;
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AboutSection({
  active = false,
}: {
  active?: boolean;
  onScrollUp?: () => void;
  onScrollDown?: () => void;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        zIndex: 2,
      }}
    >
      {/* Top gold rule */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          zIndex: 5,
          background:
            "linear-gradient(to right, transparent, rgba(196,168,130,0.4), transparent)",
        }}
      />

      {/* Subtle grain */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.022,
          pointerEvents: "none",
          zIndex: 2,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Section label */}
      {/* <div
        style={{
          position: "absolute",
          top: 18,
          left: 24,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{ width: 1, height: 26, background: "rgba(196,168,130,0.3)" }}
        />
        <div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "0.5rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "rgba(196,168,130,0.4)",
            }}
          >
            Royal Academy
          </div>
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "0.82rem",
              letterSpacing: "0.12em",
              color: "rgba(222,194,171,0.7)",
            }}
          >
            About
          </div>
        </div>
      </div> */}

      {/* Scrolling background pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/images/pattern.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "auto",
          animation: "patternScroll 32s linear infinite",
          opacity: 1,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Fixed overlay pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/images/pattern_black_transparent.svg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 1,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Top 58% — media frame ── */}
      <div style={{ flex: "0 0 58%", position: "relative", paddingTop: 16 }}>
        <RoyalMediaPlayer active={active} />
      </div>

      {/* ── Bottom 42% — philosophy ── */}
      <div
        style={{
          flex: 1,
          position: "relative",
          zIndex: 2,
        }}
      >
        <PhilosophyPanel active={active} />
      </div>

      {/* Bottom rule */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          zIndex: 2,
          background:
            "linear-gradient(to right, transparent, rgba(196,168,130,0.25), transparent)",
        }}
      />
    </div>
  );
}
