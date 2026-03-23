"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavbarState } from "@/components/NavbarStateContext";
// import RoyalIntro from "@/components/RoyalIntro";
// import RoyalHeroSection from "@/components/RoyalHeroSection";
import RoyalCombined from "./RoyalCombinedIntroHero";
// import TeachersSection from "@/components/TeachersSection";
import AboutSection from "@/components/AboutSection";
import GallerySection from "@/components/GallerySection";
import type { PublicGalleryItem } from "@/lib/actions/gallery.public.actions";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useHomeNav } from "@/context/HomeNavigationContext";

const FLOOR_COUNT = 3; // 0=intro, 1=about, 2=gallery

interface Props {
  locale: string;
  galleryItems: PublicGalleryItem[];
}

export default function HomeClient({ locale, galleryItems }: Props) {
  const { setNavSolid } = useNavbarState();
  const [floor, setFloor] = useState(0);
  const isAnimating = useRef(false);
  const elevatorRef = useRef<HTMLDivElement>(null);
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

  // Global wheel + key — only for floors 0-3
  // Floor 3 (gallery) owns its own wheel/key listeners
  useEffect(() => {
    if (floor === 2) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 30) slideTo(floor + 1);
      else if (e.deltaY < -30) slideTo(floor - 1);
    };
    const onKey = (e: KeyboardEvent) => {
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

  // Handle navbar context requests (user already on home page)
  useEffect(() => {
    if (requestedFloor === null) return;
    slideTo(requestedFloor);
    clearRequest();
  }, [requestedFloor, slideTo, clearRequest]);

  // Handle ?floor= query param (user navigated from another page)
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
  }, []);
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

        {/* Floor 1 — Hero */}
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

        <div
          style={{
            position: "absolute",
            top: "200vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <GallerySection
            items={galleryItems}
            active={floor === 2}
            onScrollUp={() => slideTo(1)}
            onScrollDown={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
