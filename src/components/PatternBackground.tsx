"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface PatternBackgroundProps {
  opacity?: number;
  speed?: number;
  className?: string;
}

export default function PatternBackground({
  opacity = 0.015,
  speed = 0.15,
  className = "",
}: PatternBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();

  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);

  return (
    <div
      ref={ref}
      className={`fixed inset-0 w-full h-full pointer-events-none overflow-hidden z-0 ${className}`}
      aria-hidden="true"
    >
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-[130%] -top-[20%]"
      >
        {/* Pattern image */}
        <div
          className="w-full h-full"
          style={{
            backgroundImage: "url('/images/pattern.svg')",
            backgroundRepeat: "repeat",
            backgroundSize: "1600px auto",
            opacity: opacity,
            filter: "sepia(1) saturate(0.8) hue-rotate(5deg) brightness(1.8)",
          }}
        />
      </motion.div>
    </div>
  );
}
