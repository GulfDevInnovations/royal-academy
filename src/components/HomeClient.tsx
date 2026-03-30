"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AboutParallax from "@/components/AboutParallax";
import AboutSection from "@/components/AboutSection";
import HomeTrioShowcaseFloor from "@/components/HomeTrioShowcaseFloor";
import { useNavbarState } from "@/components/NavbarStateContext";
import { useHomeNav } from "@/context/HomeNavigationContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import RoyalCombinedIntroHeroV2 from "./RoyalCombinedIntroHeroV2";

// Floor layout:
//   0 → Intro
//   1 → About
//   2 → Parallax (scrollable)
//   3 → Offers / News / Upcomings
const FLOOR_COUNT = 4;

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

  const locale = pathname.split("/")[1] || "en";

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

      window.setTimeout(() => {
        isAnimating.current = false;
      }, 900);
    },
    [floor, setNavSolid],
  );

  // ── Wheel + keyboard navigation ──────────────────────────────────────────
  // Floor 2 is a scrollable parallax container. We only intercept navigation
  // at the edges; otherwise we let it scroll natively.
  useEffect(() => {
    const wheelOptions: AddEventListenerOptions = { passive: false };

    const onWheel = (e: WheelEvent) => {
      if (floor === 2) {
        const el = parallaxScrollRef.current;
        if (!el) return;
        const atTop = el.scrollTop <= 4;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;

        if (e.deltaY < -30 && atTop) {
          e.preventDefault();
          slideTo(1);
        } else if (e.deltaY > 30 && atBottom) {
          e.preventDefault();
          slideTo(3);
        }
        return;
      }

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

      if (floor === 2) {
        const el = parallaxScrollRef.current;
        if (!el) return;
        const atTop = el.scrollTop <= 4;
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;

        if (["ArrowUp", "PageUp"].includes(e.key)) {
          e.preventDefault();
          if (atTop) slideTo(1);
          else el.scrollBy({ top: -220, behavior: "smooth" });
        }
        if (["ArrowDown", "PageDown", " "].includes(e.key)) {
          e.preventDefault();
          if (atBottom) slideTo(3);
          else {
            el.scrollBy({
              top: e.key === " " ? 320 : 220,
              behavior: "smooth",
            });
          }
        }
        return;
      }

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
          <RoyalCombinedIntroHeroV2
            onScrolled={() => slideTo(1)}
            active={floor === 0}
          />
        </div>

        {/* Floor 1 — About */}
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

        {/* Floor 2 — Parallax */}
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
            <AboutParallax scrollContainerRef={parallaxScrollRef} locale={locale} />
          </div>
        </div>

        {/* Floor 3 — Offers / News / Upcomings */}
        <div
          style={{
            position: "absolute",
            top: "300vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <HomeTrioShowcaseFloor
            active={floor === 3}
            onScrollUp={() => slideTo(2)}
            onScrollDown={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
