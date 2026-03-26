"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavbarState } from "@/components/NavbarStateContext";
import RoyalCombined from "./RoyalCombinedIntroHero";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useHomeNav } from "@/context/HomeNavigationContext";
import AboutSection from "@/components/AboutSection";
import AboutParallax from "@/components/AboutParallax";

// Floor layout:
//   0 → Intro       (0vh)
//   1 → AboutSection (100vh)
//   2 → Parallax    (200vh)  ← last floor
const FLOOR_COUNT = 3;

export default function HomeClient() {
  const { setNavSolid } = useNavbarState();
  const [floor, setFloor] = useState(0);
  const isAnimating = useRef(false);
  const elevatorRef = useRef<HTMLDivElement>(null);
  const parallaxScrollRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { requestedFloor, clearRequest } = useHomeNav();

  const slideTo = useCallback(
    (targetFloor: number) => {
      if (isAnimating.current) return;
      if (targetFloor === floor) return;
      if (targetFloor < 0 || targetFloor >= FLOOR_COUNT) return;
      isAnimating.current = true;

      const el = elevatorRef.current;
      if (!el) {
        isAnimating.current = false;
        return;
      }

      el.style.transition = "transform 0.85s cubic-bezier(0.76, 0, 0.24, 1)";
      el.style.transform = `translateY(${targetFloor * -100}vh)`;

      setNavSolid(targetFloor >= 1);
      setFloor(targetFloor);

      setTimeout(() => {
        isAnimating.current = false;
      }, 900);
    },
    [floor, setNavSolid],
  );

  // ── Wheel + keyboard navigation ──────────────────────────────────────────
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      // Floor 2 = Parallax (last floor).
      // Scroll up from its top edge → go to floor 1.
      // Scroll down past its bottom edge → stay (it's the last floor).
      if (floor === 2) {
        const el = parallaxScrollRef.current;
        if (!el) return;
        const atTop = el.scrollTop <= 4;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;

        if (e.deltaY < -30 && atTop) {
          slideTo(1);
        } else if (e.deltaY > 30 && atBottom) {
          // Last floor — do nothing.
        }
        // Otherwise let the parallax container scroll natively.
        return;
      }

      // All other floors: simple up/down slide.
      if (e.deltaY > 30) slideTo(floor + 1);
      else if (e.deltaY < -30) slideTo(floor - 1);
    };

    const onKey = (e: KeyboardEvent) => {
      // Floor 2 = Parallax.
      if (floor === 2) {
        const el = parallaxScrollRef.current;
        if (!el) return;
        const atTop = el.scrollTop <= 4;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;

        if (["ArrowUp", "PageUp"].includes(e.key)) {
          if (atTop) slideTo(1);
          else el.scrollBy({ top: -220, behavior: "smooth" });
        }
        if (["ArrowDown", "PageDown", " "].includes(e.key)) {
          if (!atBottom) {
            el.scrollBy({
              top: e.key === " " ? 320 : 220,
              behavior: "smooth",
            });
          }
          // atBottom on last floor → do nothing.
        }
        return;
      }

      // All other floors.
      if (["ArrowDown", " ", "PageDown"].includes(e.key)) slideTo(floor + 1);
      if (["ArrowUp", "PageUp"].includes(e.key)) slideTo(floor - 1);
    };

    window.addEventListener("wheel", onWheel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [floor, slideTo]);

  // ── Navbar context requests ───────────────────────────────────────────────
  useEffect(() => {
    if (requestedFloor === null) return;
    slideTo(requestedFloor);
    clearRequest();
  }, [requestedFloor, slideTo, clearRequest]);

  // ── ?floor= query param (navigating from another page) ───────────────────
  useEffect(() => {
    const floorParam = searchParams.get("floor");
    if (!floorParam) return;
    const targetFloor = parseInt(floorParam, 10);
    if (isNaN(targetFloor)) return;

    const timer = setTimeout(() => {
      slideTo(targetFloor);
      router.replace(pathname, { scroll: false });
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname, router, searchParams, slideTo]);

  // ── Reset parallax scroll position when leaving floor 2 ──────────────────
  useEffect(() => {
    if (floor !== 2) {
      const el = parallaxScrollRef.current;
      if (el) el.scrollTop = 0;
    }
  }, [floor]);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <div
        ref={elevatorRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: `${FLOOR_COUNT * 100}vh`,
          transform: "translateY(0vh)",
          willChange: "transform",
        }}
      >
        {/* Floor 0 — Intro */}
        <div
          style={{
            position: "absolute",
            top: "0vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <RoyalCombined onScrolled={() => slideTo(1)} active={floor === 0} />
        </div>

        {/* Floor 1 — AboutSection */}
        <div
          style={{
            position: "absolute",
            top: "100vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <AboutSection
            active={floor === 1}
            onScrollUp={() => slideTo(0)}
            onScrollDown={() => slideTo(2)}
          />
        </div>

        {/* Floor 2 — Parallax (last) */}
        <div
          style={{
            position: "absolute",
            top: "200vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <div
            ref={parallaxScrollRef}
            style={{
              height: "100%",
              width: "100%",
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              scrollbarWidth: "none",
            }}
          >
            <AboutParallax
              scrollContainerRef={parallaxScrollRef}
              locale={pathname.split("/")[1] || "en"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
