"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavbarState } from "@/components/NavbarStateContext";
import RoyalIntro from "@/components/RoyalIntro";
import RoyalHeroSection from "@/components/RoyalHeroSection";
import TeachersSection from "@/components/TeachersSection";
import AboutSection from "@/components/AboutSection";
import GallerySection from "@/components/GallerySection";
import type { PublicGalleryItem } from "@/lib/actions/gallery.public.actions";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useHomeNav } from "@/context/HomeNavigationContext";

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

const FLOOR_COUNT = 5; // 0=intro, 1=hero, 2=teachers, 3=about, 4=gallery

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

  const bubblePhysics = useRef<BubblePhysics[]>(
    BUBBLE_DEFS.map((b) => ({
      x: 0,
      y: 0,
      z: 0.5,
      vx: 0,
      vy: 0,
      vz: 0,
      baseSize: b.baseSize,
    })),
  );

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
  // Floor 4 (gallery) owns its own wheel/key listeners
  useEffect(() => {
    if (floor === 4) return;
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
          <RoyalIntro
            onScrolled={() => slideTo(1)}
            active={floor === 0}
            bubblePhysics={bubblePhysics}
          />
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
          <RoyalHeroSection />
        </div>

        {/* Floor 2 — Teachers */}
        <div
          style={{
            position: "absolute",
            top: "200vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <TeachersSection
            locale={locale}
            isArabic={locale === "ar"}
            onScrollUp={() => slideTo(1)}
            onScrollDown={() => slideTo(3)}
          />
        </div>

        {/* Floor 3 — About */}
        <div
          style={{
            position: "absolute",
            top: "300vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <AboutSection
            active={floor === 3}
            onScrollUp={() => slideTo(2)}
            onScrollDown={() => slideTo(4)}
          />
        </div>

        <div
          style={{
            position: "absolute",
            top: "400vh",
            left: 0,
            right: 0,
            height: "100vh",
          }}
        >
          <GallerySection
            items={galleryItems}
            active={floor === 4}
            onScrollUp={() => slideTo(3)}
            onScrollDown={() => {}}
          />
        </div>
      </div>
    </div>
  );
}
