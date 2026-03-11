"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavbarState } from "@/components/NavbarStateContext";
import RoyalIntro from "@/components/RoyalIntro";
import RoyalHeroSection from "@/components/RoyalHeroSection";

// Physics state lives HERE so it survives RoyalIntro re-renders
// and bubbles are exactly where they were left when coming back up
export type BubblePhysics = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  baseSize: number;
};

const BUBBLE_DEFS = [
  { baseSize: 148 },
  { baseSize: 132 },
  { baseSize: 122 },
  { baseSize: 138 },
  { baseSize: 126 },
  { baseSize: 142 },
];

export default function HomeClient({ locale }: { locale: string }) {
  const { setNavSolid } = useNavbarState();

  // "floor" 0 = intro visible, 1 = hero visible
  const [floor, setFloor] = useState(0);
  const isAnimating = useRef(false);

  // Elevator container ref — we translate this div
  const elevatorRef = useRef<HTMLDivElement>(null);

  // Bubble physics — persistent, never reset
  const bubblePhysics = useRef<BubblePhysics[]>(
    BUBBLE_DEFS.map((b, i) => ({
      x: 0,
      y: 0,
      z: 0.3 + Math.random() * 0.5,
      vx: 0,
      vy: 0,
      vz: 0,
      baseSize: b.baseSize,
    })),
  );

  // Animate the elevator slide
  const slideTo = useCallback(
    (targetFloor: number) => {
      if (isAnimating.current) return;
      if (targetFloor === floor) return;
      isAnimating.current = true;

      const el = elevatorRef.current;
      if (!el) return;

      const targetY = targetFloor === 1 ? "-100vh" : "0vh";
      el.style.transition = "transform 0.85s cubic-bezier(0.76, 0, 0.24, 1)";
      el.style.transform = `translateY(${targetY})`;

      setNavSolid(targetFloor === 1);
      setFloor(targetFloor);

      setTimeout(() => {
        isAnimating.current = false;
      }, 900);
    },
    [floor, setNavSolid],
  );

  // Scroll down from intro
  const handleScrollDown = useCallback(() => {
    slideTo(1);
  }, [slideTo]);

  // Scroll up from hero
  const handleScrollUp = useCallback(() => {
    slideTo(0);
  }, [slideTo]);

  // Wheel listener on hero floor
  useEffect(() => {
    if (floor !== 1) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY < -30) handleScrollUp();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "PageUp"].includes(e.key)) handleScrollUp();
    };
    window.addEventListener("wheel", onWheel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [floor, handleScrollUp]);

  // Lock body scroll always — we handle it ourselves
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    // Outer viewport clip
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      {/* Elevator shaft — 200vh tall, slides up/down */}
      <div
        ref={elevatorRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "200vh",
          transform: "translateY(0vh)",
          willChange: "transform",
        }}
      >
        {/* Floor 0 — Intro (top 100vh) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <RoyalIntro
            onScrolled={handleScrollDown}
            active={floor === 0}
            bubblePhysics={bubblePhysics}
          />
        </div>

        {/* Floor 1 — Hero (bottom 100vh) */}
        <div
          style={{
            position: "absolute",
            top: "100vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <RoyalHeroSection />
        </div>
      </div>
    </div>
  );
}
