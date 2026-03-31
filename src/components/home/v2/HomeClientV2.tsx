"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AboutSection from "@/components/home/v2/AboutSectionV2";
import HomeTrioShowcaseFloor from "@/components/home/v2/HomeTrioShowcaseFloorV2";
import { useNavbarState } from "@/components/NavbarStateContext";
import { useHomeNav } from "@/context/HomeNavigationContext";
import { usePreloader } from "@/context/PreloaderContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import RoyalCombinedIntroHeroV2 from "@/components/home/v2/RoyalCombinedIntroHeroV2Section";
import { useLocale } from "next-intl";
import MobileHomePageV2 from "@/components/home/v2/MobileHomePageV2";

// Floor layout:
//   0 → Offers / News / Upcomings
//   1 → Intro
//   2 → About
const FLOOR_COUNT = 3;

export default function HomeClientV2() {
  const { setNavSolid } = useNavbarState();
  const { markDone } = usePreloader();
  const [floor, setFloor] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const isAnimating = useRef(false);
  const elevatorRef = useRef<HTMLDivElement>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { requestedFloor, clearRequest } = useHomeNav();
  const locale = useLocale();

  // V2 home doesn't run the v1 "world" preloader sequence.
  // Mark preloader as done so the navbar isn't stuck hidden on the home route.
  useEffect(() => {
    markDone();
  }, [markDone]);

  // ── Detect mobile (match v1 home breakpoint) ────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");

    const computeIsMobile = () => {
      const isTouchCapable =
        (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) ||
        "ontouchstart" in window;
      return mq.matches || isTouchCapable;
    };

    const update = () => setIsMobile(computeIsMobile());
    update();

    const onResize = () => update();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    // Safari < 14 uses addListener/removeListener
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => {
        mq.removeEventListener("change", update);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("orientationchange", onResize);
      };
    }

    mq.addListener(update);
    return () => {
      mq.removeListener(update);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  // Keep navbar style aligned with current floor (hero wants transparent)
  useEffect(() => {
    // On mobile we allow natural page scroll; keep navbar solid.
    if (isMobile) {
      setNavSolid(true);
      return;
    }
    setNavSolid(floor !== 1);
  }, [floor, isMobile, setNavSolid]);

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
    if (isMobile) return;
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
  }, [floor, isMobile, slideTo]);

  // ── Navbar context requests ───────────────────────────────────────────────
  useEffect(() => {
    if (requestedFloor === null) return;
    if (isMobile) {
      // Mobile v2 is a freely scrollable page (v1-style).
      // Ignore floor requests to avoid programmatic section jumps.
      clearRequest();
      return;
    }

    slideTo(requestedFloor);
    clearRequest();
  }, [requestedFloor, slideTo, clearRequest, isMobile]);

  // ── ?floor= query param (navigating from another page) ───────────────────
  useEffect(() => {
    const floorParam = searchParams.get("floor");
    if (!floorParam) return;
    const targetFloor = parseInt(floorParam, 10);
    if (isNaN(targetFloor)) return;

    const timer = window.setTimeout(() => {
      if (isMobile) {
        // See note above: mobile v2 ignores floor jumps.
        router.replace(pathname, { scroll: true });
        return;
      }
      slideTo(targetFloor);
      router.replace(pathname, { scroll: false });
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isMobile, pathname, router, searchParams, slideTo]);

  const scrollTo = (targetFloor: number) => {
    const el = document.getElementById(`home-v2-floor-${targetFloor}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* MOBILE: normal document scroll (no elevator / no scroll-jacking)
          Rendered via CSS so it works before JS runs. */}
      <div
        className="md:hidden"
        style={{ display: isMobile ? "block" : undefined }}
      >
        <MobileHomePageV2 />
      </div>

      {/* DESKTOP: elevator layout */}
      <div
        className="hidden md:block"
        style={{ display: isMobile ? "none" : undefined }}
      >
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
              <RoyalCombinedIntroHeroV2
                onScrolled={() => slideTo(2)}
                active={floor === 1}
              />
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
              <AboutSection
                active={floor === 2}
                locale={locale}
                onScrollUp={() => slideTo(1)}
                onScrollDown={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
