"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { usePreloader } from "@/context/PreloaderContext";
import HomeTrioShowcaseFloor from "@/components/home/v2/HomeTrioShowcaseFloorV2";
import RoyalCombinedIntroHeroV2 from "@/components/home/v2/RoyalCombinedIntroHeroV2Section";
import AboutSection from "@/components/home/v2/AboutSectionV2";

/**
 * MobileHomePageV2
 *
 * Mirrors the v1 mobile approach:
 * - one self-contained scroll container (no fixed elevator)
 * - momentum scrolling on iOS via WebkitOverflowScrolling
 */
export default function MobileHomePageV2() {
  const { markDone } = usePreloader();
  const locale = useLocale();

  useEffect(() => {
    // Ensure navbar isn't stuck waiting for any preloader sequence.
    markDone();
  }, [markDone]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100svh",
        overflowX: "hidden",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        background: "#0e0d0b",
      }}
    >
      <div style={{ position: "relative", width: "100%" }}>
        <section style={{ width: "100%" }}>
          <HomeTrioShowcaseFloor
            active
            onScrollUp={() => {}}
            onScrollDown={() => {}}
            scrollable
          />
        </section>

        {/* Divider */}
        <div
          style={{
            height: 1,
            margin: "10px 24px",
            background:
              "linear-gradient(to right, transparent, rgba(196,168,120,0.5), transparent)",
          }}
        />

        <section style={{ width: "100%" }}>
          <RoyalCombinedIntroHeroV2 active onScrolled={() => {}} />
        </section>

        {/* Divider */}
        <div
          style={{
            height: 1,
            margin: "10px 24px",
            background:
              "linear-gradient(to right, transparent, rgba(196,168,120,0.35), transparent)",
          }}
        />

        <section style={{ width: "100%" }}>
          <AboutSection
            active
            locale={locale}
            scrollable
            onScrollUp={undefined}
            onScrollDown={undefined}
          />
        </section>
      </div>
    </div>
  );
}
