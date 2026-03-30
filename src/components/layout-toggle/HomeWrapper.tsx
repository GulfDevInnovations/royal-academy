"use client";

/**
 * HomeWrapper — thin client shell that owns the layout-version state.
 *
 * To remove the toggle entirely when you're done:
 *   1. Delete LayoutToggle.tsx
 *   2. Remove the three LayoutToggle lines below (import + state + <LayoutToggle>)
 *   3. Hard-code whichever layout you want to keep as the only return value,
 *      or just inline it back into page.tsx.
 */

import { useEffect, useState } from "react";
import HomeClient from "@/components/royal-intro/HomeClient";
import HomeClientV2 from "@/components/home/v2/HomeClientV2";
import LayoutToggle, { STORAGE_KEY } from "./LayoutToggle"; // ← remove this line when done
import type { ContentCard } from "@/components/royal-intro/RoyalWorldIntro.types";

interface Props {
  worldData: {
    upcoming: ContentCard[];
    news: ContentCard[];
    offers: ContentCard[];
  };
  logoUrl: string;
  backgroundImageUrl: string;
}

export default function HomeWrapper({
  worldData,
  logoUrl,
  backgroundImageUrl,
}: Props) {
  // Read persisted version; default to "v1" until we can read localStorage
  const [version, setVersion] = useState<"v1" | "v2">("v1");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "v2") setVersion("v2");
    setHydrated(true);
  }, []);

  const handleChange = (v: "v1" | "v2") => {
    setVersion(v);
    localStorage.setItem(STORAGE_KEY, v);
  };

  // Avoid flash: don't render either layout until we've read localStorage
  if (!hydrated) return null;

  return (
    <>
      {/* ── Remove the line below when the toggle is no longer needed ── */}
      <LayoutToggle version={version} onChange={handleChange} />

      {version === "v1" ? (
        <HomeClient
          worldData={worldData}
          logoUrl={logoUrl}
          backgroundImageUrl={backgroundImageUrl}
        />
      ) : (
        <HomeClientV2 />
      )}
    </>
  );
}
