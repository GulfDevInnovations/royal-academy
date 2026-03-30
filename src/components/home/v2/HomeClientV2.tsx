"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AboutSection from "@/components/home/v2/AboutSectionV2";
import HomeTrioShowcaseFloor from "@/components/home/v2/HomeTrioShowcaseFloorV2";
import { useNavbarState } from "@/components/NavbarStateContext";
import { useHomeNav } from "@/context/HomeNavigationContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import RoyalCombinedIntroHeroV2 from "@/components/home/v2/RoyalCombinedIntroHeroV2Section";

// Floor layout:
//   0 → Offers / News / Upcomings
//   1 → Intro
//   2 → About
const FLOOR_COUNT = 3;

export default function HomeClientV2() {
  const { setNavSolid } = useNavbarState();
  const [floor, setFloor] = useState(0);
  const isAnimating = useRef(false);
  const elevatorRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { requestedFloor, clearRequest } = useHomeNav();

  // Keep navbar style aligned with current floor (hero wants transparent)
  useEffect(() => {
    setNavSolid(floor !== 1);
  }, [floor, setNavSolid]);

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

      setNavSolid(targetFloor !== 1);
      setFloor(targetFloor);

      window.setTimeout(() => {
        isAnimating.current = false;
      }, 900);
    },
    [floor, setNavSolid],
  );

  // ── Wheel + keyboard navigation ──────────────────────────────────────────
  useEffect(() => {
    const wheelOptions: AddEventListenerOptions = { passive: false };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 30) slideTo(floor + 1);
      else if (e.deltaY < -30) slideTo(floor - 1);
    };

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        (target?.getAttribute("contenteditable") ?? "false") === "true";
      if (isTypingTarget) return;

      if (["ArrowDown", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        slideTo(floor + 1);
      }
      if (["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        slideTo(floor - 1);
      }
    };

    window.addEventListener("wheel", onWheel, wheelOptions);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel, wheelOptions);
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

    const timer = window.setTimeout(() => {
      slideTo(targetFloor);
      router.replace(pathname, { scroll: false });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [pathname, router, searchParams, slideTo]);

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
        {/* Floor 0 — Offers / News / Upcomings */}
        <div
          style={{
            position: "absolute",
            top: "0vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <HomeTrioShowcaseFloor
            active={floor === 0}
            onScrollUp={() => {}}
            onScrollDown={() => slideTo(1)}
          />
        </div>

        {/* Floor 1 — Intro */}
        <div
          style={{
            position: "absolute",
            top: "100vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <RoyalCombinedIntroHeroV2 onScrolled={() => slideTo(2)} active={floor === 1} />
        </div>

        {/* Floor 2 — About */}
        <div
          style={{
            position: "absolute",
            top: "200vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <AboutSection active={floor === 2} onScrollUp={() => slideTo(1)} onScrollDown={() => {}} />
        </div>
      </div>
    </div>
  );
}
