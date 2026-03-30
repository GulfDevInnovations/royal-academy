"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavbarState } from "@/components/NavbarStateContext";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useHomeNav } from "@/context/HomeNavigationContext";
import AboutSection from "@/components/AboutSection";
import type { ContentCard } from "./RoyalWorldIntro.types";
import RoyalWorldIntro from "./RoyalWorldIntro";
import { MobileHomePage } from "./RoyalWorldIntro.mobile";
import { useLocale } from "next-intl";

// ─────────────────────────────────────────────
// Floor layout (desktop only):
//   0 → RoyalWorldIntro  (cards + departments)
//   1 → AboutSection
// Mobile bypasses this entirely — see MobileHomePage.
// ─────────────────────────────────────────────
const FLOOR_COUNT = 2;

interface Props {
  worldData: {
    upcoming: ContentCard[];
    news: ContentCard[];
    offers: ContentCard[];
  };
  logoUrl?: string;
  backgroundImageUrl?: string;
}

export default function HomeClient({
  worldData,
  logoUrl,
  backgroundImageUrl,
}: Props) {
  const { setNavSolid } = useNavbarState();
  const [floor, setFloor] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const isAnimating = useRef(false);
  const elevatorRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { requestedFloor, clearRequest } = useHomeNav();
  const locale = useLocale();

  const LAST_FLOOR = FLOOR_COUNT - 1;

  // ── Detect mobile (same breakpoint as RoyalWorldIntro) ────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // ── slideTo — desktop only ────────────────────────────────────────────────
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

      setTimeout(() => {
        setFloor(targetFloor);
      }, 0);

      setTimeout(() => {
        isAnimating.current = false;
      }, 900);
    },
    [floor],
  );

  // ── Navbar solid state ────────────────────────────────────────────────────
  useEffect(() => {
    // Mobile scrolls naturally so always keep navbar solid
    if (isMobile) {
      setNavSolid(true);
      return;
    }
    setNavSolid(floor >= 1);
  }, [floor, isMobile, setNavSolid]);

  // ── Wheel + keyboard (desktop floors 1+) ─────────────────────────────────
  useEffect(() => {
    if (isMobile) return;

    const onWheel = (e: WheelEvent) => {
      if (floor === 0) return; // RoyalWorldIntro handles floor 0 itself
      if (floor === LAST_FLOOR) {
        if (e.deltaY < -30) slideTo(LAST_FLOOR - 1);
        return;
      }
      if (e.deltaY > 30) slideTo(floor + 1);
      else if (e.deltaY < -30) slideTo(floor - 1);
    };

    const onKey = (e: KeyboardEvent) => {
      if (floor === 0) return;
      if (floor === LAST_FLOOR) {
        if (["ArrowUp", "PageUp"].includes(e.key)) slideTo(LAST_FLOOR - 1);
        return;
      }
      if (["ArrowDown", " ", "PageDown"].includes(e.key)) slideTo(floor + 1);
      if (["ArrowUp", "PageUp"].includes(e.key)) slideTo(floor - 1);
    };

    window.addEventListener("wheel", onWheel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [floor, slideTo, LAST_FLOOR, isMobile]);

  // ── Navbar context requests (desktop) ────────────────────────────────────
  useEffect(() => {
    if (isMobile || requestedFloor === null) return;
    slideTo(requestedFloor);
    clearRequest();
  }, [requestedFloor, slideTo, clearRequest, isMobile]);

  // ── ?floor= query param (desktop) ────────────────────────────────────────
  useEffect(() => {
    if (isMobile) return;
    const floorParam = searchParams.get("floor");
    if (!floorParam) return;
    const targetFloor = parseInt(floorParam, 10);
    if (isNaN(targetFloor)) return;
    const timer = setTimeout(() => {
      slideTo(targetFloor);
      router.replace(pathname, { scroll: false });
    }, 100);
    return () => clearTimeout(timer);
  }, [pathname, router, searchParams, slideTo, isMobile]);

  // ── MOBILE: hand off to a fully self-contained scrollable page ────────────
  if (isMobile) {
    return (
      <MobileHomePage
        worldData={worldData}
        backgroundImageUrl={backgroundImageUrl}
        pathname={pathname}
      />
    );
  }

  // ── DESKTOP: elevator layout ──────────────────────────────────────────────
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
        {/* Floor 0 — RoyalWorldIntro */}
        <div
          style={{
            position: "absolute",
            top: "0vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <RoyalWorldIntro
            upcoming={worldData.upcoming}
            news={worldData.news}
            offers={worldData.offers}
            logoUrl={logoUrl}
            backgroundImageUrl={backgroundImageUrl}
            active={floor === 0}
            onScrollDown={() => slideTo(1)}
          />
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
            locale={locale}
            onScrollUp={() => slideTo(0)}
            onScrollDown={() => slideTo(2)}
          />
        </div>
      </div>
    </div>
  );
}
