"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "framer-motion";

const smallBubbles = [
  { id: 1, size: 48, x: "12%", y: "35%", delay: 0.6, floatDuration: 5.0 },
  { id: 2, size: 28, x: "7%", y: "62%", delay: 0.9, floatDuration: 6.5 },
  { id: 3, size: 52, x: "20%", y: "70%", delay: 0.4, floatDuration: 4.8 },
  { id: 4, size: 22, x: "80%", y: "28%", delay: 0.7, floatDuration: 7.0 },
  { id: 5, size: 38, x: "86%", y: "58%", delay: 0.3, floatDuration: 5.5 },
  { id: 6, size: 26, x: "74%", y: "74%", delay: 1.0, floatDuration: 6.0 },
  { id: 7, size: 18, x: "50%", y: "82%", delay: 1.2, floatDuration: 8.0 },
  { id: 8, size: 34, x: "40%", y: "18%", delay: 0.5, floatDuration: 5.2 },
];

const mainBubbles = [
  {
    key: "dance",
    href: "/classes/dance",
    accentR: 196,
    accentG: 200,
    accentB: 200,
    delay: 0.1,
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14">
        <circle
          cx="32"
          cy="11"
          r="5.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M32 17 C27 25 19 27 17 36"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M32 17 C37 25 45 27 47 36"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M25 30 L19 46 M39 30 L45 46"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M27 39 L22 54 M37 39 L42 54"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "music",
    href: "/classes/music",
    accentR: 196,
    accentG: 168,
    accentB: 180,
    delay: 0.4,
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14">
        <path
          d="M22 50 L22 22 L50 15 L50 43"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="18"
          cy="50"
          r="4.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="46"
          cy="43"
          r="4.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M22 30 L50 23"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "art",
    href: "/classes/art",
    accentR: 158,
    accentG: 112,
    accentB: 112,
    delay: 0.25,
    icon: (
      <svg viewBox="0 0 64 64" fill="none" className="w-14 h-14">
        <path
          d="M32 8C20 8 12 18 12 28C12 38 20 44 28 42C30 41 30 38 32 38C34 38 34 41 36 42C44 44 52 38 52 28C52 18 44 8 32 8Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="22" cy="27" r="2.5" fill="currentColor" opacity="0.7" />
        <circle cx="32" cy="21" r="2.5" fill="currentColor" opacity="0.7" />
        <circle cx="42" cy="27" r="2.5" fill="currentColor" opacity="0.7" />
        <circle cx="37" cy="34" r="2.5" fill="currentColor" opacity="0.7" />
        <circle cx="27" cy="34" r="2.5" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
];

function GlassBubble({
  size,
  accentR = 200,
  accentG = 220,
  accentB = 255,
  opacity = 1,
  children,
  className = "",
  style = {},
}: {
  size: number;
  accentR?: number;
  accentG?: number;
  accentB?: number;
  opacity?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative rounded-full flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        opacity,
        // Almost-transparent tinted fill
        background: `
          radial-gradient(circle at 50% 50%,
            rgba(${accentR},${accentG},${accentB}, 0.03) 0%,
            rgba(${accentR},${accentG},${accentB}, 0.07) 70%,
            rgba(${accentR},${accentG},${accentB}, 0.13) 100%
          )
        `,
        // Iridescent rim
        // border: `1.5px solid rgba(${accentR},${accentG},${accentB}, 0.35)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(6px) saturate(1.8)",
        boxShadow: `
          0 8px 32px rgba(0,0,0,0.13),
          inset 0 0 0 1px rgba(255,255,255,0.13),
          inset 0 2px 4px rgba(255,255,255,0.18),
          inset 0 -2px 4px rgba(${accentR},${accentG},${accentB}, 0.10)
        `,
        ...style,
      }}
    >
      {/* Primary specular — sharp oval gleam top-left */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: "10%",
          left: "14%",
          width: "38%",
          height: "18%",
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.0) 75%)",
          transform: "rotate(-32deg)",
          filter: "blur(1.5px)",
          opacity: 0.5,
        }}
      />
      {/* Secondary softer gleam — smaller, slightly lower */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          top: "22%",
          left: "18%",
          width: "18%",
          height: "8%",
          background:
            "radial-gradient(ellipse, rgba(255,255,255,0.38) 0%, transparent 80%)",
          transform: "rotate(-28deg)",
          filter: "blur(2px)",
          opacity: 0.4,
        }}
      />
      {/* Iridescent rainbow rim overlay */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `
            conic-gradient(
              from 200deg,
              rgba(255,100,100,0.07),
              rgba(255,200,80,0.06),
              rgba(80,255,160,0.06),
              rgba(80,180,255,0.07),
              rgba(180,80,255,0.06),
              rgba(255,100,100,0.07)
            )
          `,
          borderRadius: "50%",
          mixBlendMode: "screen",
        }}
      />
      {/* Bottom depth — inner shadow to round out the sphere */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 60% 75%, rgba(0,0,0,0.10) 0%, transparent 60%)",
        }}
      />
      {/* Icon sits here, slightly dimmed so it feels inside the bubble */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
export default function HeroSection() {
  const locale = useLocale();
  const t = useTranslations("hero");
  const isArabic = locale === "ar";

  return (
    <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden px-6">
      {/* Small decorative bubbles */}
      {smallBubbles.map((b) => (
        <motion.div
          key={b.id}
          className="absolute pointer-events-none"
          style={{ left: b.x, top: b.y }}
          initial={{ y: -600, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            y: {
              type: "spring",
              stiffness: 40,
              damping: 14,
              delay: b.delay,
            },
            opacity: {
              duration: 0.5,
              delay: b.delay,
            },
          }}
        >
          {/* idle float */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: b.floatDuration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: b.delay + 1.5,
            }}
          >
            <GlassBubble size={b.size} opacity={0.5} />
          </motion.div>
        </motion.div>
      ))}

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, delay: 1.6, ease: "easeOut" }}
        className="text-center mb-24 z-10 pointer-events-none"
      >
        <h1
          className={`text-5xl md:text-7xl font-light tracking-[0.18em] text-royal-cream mb-5 ${isArabic ? "font-layla" : "font-goudy"}`}
          style={{ textShadow: "0 2px 40px rgba(196,168,130,0.15)" }}
        >
          {isArabic ? "الأكاديمية الملكية" : "Royal Academy"}
        </h1>
        <p className="text-royal-gold/55 text-xs md:text-sm tracking-[0.4em] uppercase">
          {t("tagline")}
        </p>
      </motion.div>

      {/* Main bubbles */}
      <div className="flex items-center justify-center gap-10 md:gap-20 z-10">
        {mainBubbles.map((bubble) => (
          <motion.div
            key={bubble.key}
            className="flex flex-col items-center gap-4"
            initial={{ y: -700, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              y: {
                type: "spring",
                stiffness: 38,
                damping: 13,
                delay: bubble.delay,
              },
              opacity: {
                duration: 0.4,
                delay: bubble.delay,
              },
            }}
          >
            {/* idle float after landing */}
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{
                duration: 4.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: bubble.delay + 2,
                repeatDelay: 0.2,
              }}
              className="flex flex-col items-center gap-4"
            >
              <Link href={`/${locale}${bubble.href}`}>
                <motion.div
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                  className="relative group"
                >
                  {/* Hover glow */}
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    initial={{
                      boxShadow: `0 0 0px 0px rgba(${bubble.accentR},${bubble.accentG},${bubble.accentB}, 0)`,
                    }}
                    whileHover={{
                      boxShadow: `0 0 55px 18px rgba(${bubble.accentR},${bubble.accentG},${bubble.accentB}, 0.22)`,
                    }}
                    transition={{ duration: 0.4 }}
                  />

                  <GlassBubble
                    size={200}
                    accentR={bubble.accentR}
                    accentG={bubble.accentG}
                    accentB={bubble.accentB}
                    className="cursor-pointer md:w-[220px] md:h-[220px]"
                  >
                    <div className="relative z-10 text-royal-cream/40 group-hover:text-royal-gold transition-colors duration-300">
                      {bubble.icon}
                    </div>
                  </GlassBubble>
                </motion.div>
              </Link>

              {/* Label */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: bubble.delay + 1.4, duration: 0.7 }}
                className="text-royal-cream/50 text-xs tracking-[0.35em] uppercase"
              >
                {t(bubble.key as "dance" | "music" | "art")}
              </motion.p>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-0" />
    </section>
  );
}
