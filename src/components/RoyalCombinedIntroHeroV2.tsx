"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

type SymbolState = "hidden" | "rising" | "spinning" | "falling";

type MainClassId = "ballet" | "dance" | "music" | "art";

type Subclass = {
  id: string;
  label: string;
  slug: string;
  image: string;
};

type Section = {
  id: MainClassId;
  label: string;
  arLabel: string;
  icon: string;
  image: string;
  subclasses: Subclass[];
};

const SECTIONS_V2: Section[] = [
  {
    id: "music",
    label: "Music",
    arLabel: "الموسيقى",
    icon: "/images/HeroSection/musicGold.png",
    image: "/images/music-hero.jpg",
    subclasses: [
      {
        id: "piano",
        label: "Piano",
        slug: "piano",
        image: "/images/piano.jpg",
      },
      {
        id: "guitar",
        label: "Guitar",
        slug: "guitar",
        image: "/images/guitarroom.png",
      },
      {
        id: "violin",
        label: "Violin",
        slug: "violin",
        image: "/images/violin.png",
      },
      {
        id: "oud",
        label: "Oud",
        slug: "oud",
        image: "/images/oud.png",
      },
      {
        id: "drums-percussion",
        label: "Drums & Percussion",
        slug: "drumsandpercussion",
        image: "/images/drumsroom.png",
      },
      {
        id: "darbuka",
        label: "Darbuka",
        slug: "durbuka",
        image: "/images/durbuka.png",
      },
      {
        id: "bass",
        label: "Bass",
        slug: "bass",
        image: "/images/bass.png",
      },
      {
        id: "handpan",
        label: "Handpan",
        slug: "handpan",
        image: "/images/drums.png",
      },
      {
        id: "vocal",
        label: "Vocal",
        slug: "vocal",
        image: "/images/treble-clef.png",
      },
      {
        id: "theory",
        label: "Theory",
        slug: "theory",
        image: "/images/treble-clef.png",
      },
      {
        id: "sightreading",
        label: "Sight Reading",
        slug: "sightreading",
        image: "/images/stave.png",
      },
      {
        id: "solfege",
        label: "Solfège",
        slug: "solfege",
        image: "/images/crotchet.png",
      },
      {
        id: "musicawakening",
        label: "Music Awakening",
        slug: "musicawakening",
        image: "/images/musicawakening.png",
      },
    ],
  },
  {
    id: "ballet",
    label: "Ballet",
    arLabel: "الباليه",
    icon: "/images/HeroSection/balletGold.png",
    image: "/images/ballet-hero.jpg",
    subclasses: [
      {
        id: "baby-ballet",
        label: "Baby Ballet",
        slug: "baby-ballet",
        image: "/images/babyballet.png",
      },
      {
        id: "rad-ballet",
        label: "RAD Ballet",
        slug: "rad-ballet",
        image: "/images/ballet.png",
      },
      {
        id: "open-ballet",
        label: "Open Ballet",
        slug: "open-ballet",
        image: "/images/ballet-hero.jpg",
      },
    ],
  },
  {
    id: "dance",
    label: "Dance & Wellness",
    arLabel: "الرقص والعافية",
    icon: "/images/HeroSection/dance&wellnessGold.png",
    image: "/images/dance-hero.jpg",
    subclasses: [
      {
        id: "aerial-hoop",
        label: "Aerial Hoop",
        slug: "aerial-hoop",
        image: "/images/dance/aerial-hoop.jpg",
      },
      {
        id: "contemporary-dance",
        label: "Contemporary Dance",
        slug: "contemporary-dance",
        image: "/images/dance/contemporary.jpg",
      },
      {
        id: "salsa",
        label: "Salsa",
        slug: "salsa",
        image: "/images/dance/salsa.jpg",
      },
      {
        id: "zumba",
        label: "Zumba",
        slug: "zumba",
        image: "/images/dance/zumba.jpg",
      },
      {
        id: "body-flexibility",
        label: "Body & Flexibility",
        slug: "body&flexibility",
        image: "/images/movement01.png",
      },
      {
        id: "kids-movements",
        label: "Kids Movements",
        slug: "kids-movements",
        image: "/images/babygymnastics.png",
      },
    ],
  },
  {
    id: "art",
    label: "Art",
    arLabel: "الفنون",
    icon: "/images/HeroSection/artGold.png",
    image: "/images/art-hero.jpg",
    subclasses: [
      {
        id: "drawing",
        label: "Drawing",
        slug: "art",
        image: "/images/drawingsample.png",
      },
      {
        id: "shading-color",
        label: "Shading & Color",
        slug: "art",
        image: "/images/shadingsmaple.png",
      },
      {
        id: "portrait",
        label: "Portrait & Caricature",
        slug: "art",
        image: "/images/portrait&caricaturesample.png",
      },
      {
        id: "acrylic",
        label: "Acrylic",
        slug: "art",
        image: "/images/acrylicsample.png",
      },
      {
        id: "oil",
        label: "Oil Painting",
        slug: "art",
        image: "/images/oilpaintingsample.png",
      },
      {
        id: "watercolor",
        label: "Watercolor",
        slug: "art",
        image: "/images/watercolorsample.png",
      },
    ],
  },
];

function resolveSubclassPageHref(
  locale: string,
  sectionId: MainClassId,
  subclassSlug: string,
) {
  if (sectionId === "art") return `/${locale}/classes/art`;
  return `/${locale}/classes/${sectionId}/${subclassSlug}`;
}

function getSectionEnglishLabel(section: Section) {
  // UI shorthand for the department chips.
  if (section.id === "dance") return "Dance";
  return section.label;
}

function getSectionPrimaryLabel(locale: string, section: Section) {
  return locale === "ar" ? section.arLabel : getSectionEnglishLabel(section);
}

function getSectionSecondaryLabel(locale: string, section: Section) {
  return locale === "ar" ? getSectionEnglishLabel(section) : section.arLabel;
}

interface SymbolCardProps {
  section: Pick<Section, "label" | "icon">;
  isActive: boolean;
  isMobile: boolean;
}

function SymbolCard({ section, isActive, isMobile }: SymbolCardProps) {
  const [symState, setSymState] = useState<SymbolState>("hidden");
  const prevActiveRef = useRef<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = isActive;
    if (isActive === wasActive) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isActive && !wasActive) {
      setSymState("rising");
      timerRef.current = setTimeout(() => setSymState("spinning"), 700);
    }
    if (!isActive && wasActive) {
      setSymState("falling");
      timerRef.current = setTimeout(() => setSymState("hidden"), 500);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive]);

  const isVisible =
    symState === "rising" || symState === "spinning" || symState === "falling";
  const outerTransform =
    symState === "hidden" || symState === "falling"
      ? "translateY(70px)"
      : "translateY(0px)";
  const outerTransition =
    symState === "rising"
      ? "opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)"
      : symState === "falling"
        ? "opacity 0.45s ease, transform 0.5s cubic-bezier(0.55,0,1,0.8)"
        : "none";

  const w = isMobile ? 62 : 100;
  const h = isMobile ? 104 : 140;
  const minH = isMobile ? 112 : 168;

  return (
    <div
      style={{
        perspective: "900px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        minHeight: minH,
        marginBottom: isMobile ? "0.5rem" : "0.2rem",
        opacity: isVisible ? 1 : 0,
        transform: outerTransform,
        transition: outerTransition,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: w,
          height: h,
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
          border: "1px solid rgba(196,168,120,0.18)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
          animation:
            symState !== "hidden"
              ? "continuousSpin 2s linear infinite"
              : "none",
          filter:
            "drop-shadow(0 0 20px rgba(196,168,130,0.6)) drop-shadow(0 0 7px rgba(196,168,130,0.35))",
        }}
      >
        <Image
          src={section.icon}
          alt={section.label}
          fill
          unoptimized
          style={{ objectFit: "cover" }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(10,4,2,0.72) 0%, rgba(10,4,2,0.26) 45%, transparent 78%)",
          }}
        />
      </div>
    </div>
  );
}

interface StageOverlayProps {
  activeIndex: number;
  revealed: boolean;
}

function StageOverlay({ activeIndex, revealed }: StageOverlayProps) {
  const colCentres = [17, 39, 61, 83];
  const spotX = colCentres[activeIndex];

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          pointerEvents: "none",
          background:
            "linear-gradient(to bottom, rgba(10,4,2,0.55) 0%, rgba(10,4,2,0.45) 50%, rgba(10,4,2,0.20) 67%, rgba(10,4,2,0.05) 82%, transparent 100%)",
          opacity: revealed ? 1 : 0,
          transition: "opacity 1s cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "67%",
          zIndex: 6,
          pointerEvents: "none",
          backdropFilter: revealed ? "blur(3px)" : "blur(0px)",
          WebkitBackdropFilter: revealed ? "blur(3px)" : "blur(0px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
          opacity: revealed ? 1 : 0,
          transition:
            "opacity 1s ease, backdrop-filter 1s ease, -webkit-backdrop-filter 1s ease",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "70%",
          zIndex: 7,
          pointerEvents: "none",
          opacity: revealed ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: `${spotX}%`,
            transform: "translateX(-50%)",
            width: "38%",
            height: "100%",
            background:
              "radial-gradient(ellipse 55% 80% at 50% 100%, rgba(196,155,90,0.13) 0%, rgba(160,120,60,0.06) 45%, transparent 75%)",
            transition: "left 0.65s cubic-bezier(0.4,0,0.2,1)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: `${spotX}%`,
            transform: "translateX(-50%)",
            width: "24%",
            height: 90,
            background:
              "radial-gradient(ellipse 70% 100% at 50% 100%, rgba(210,170,100,0.18) 0%, transparent 75%)",
            transition: "left 0.65s cubic-bezier(0.4,0,0.2,1)",
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}

interface DesktopDepartmentsProps {
  activeIndex: number;
  onHover: (i: number) => void;
  revealed: boolean;
  locale: string;
}

function DesktopDepartmentsV2({
  activeIndex,
  onHover,
  revealed,
  locale,
}: DesktopDepartmentsProps) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: revealed
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(100%)",
        opacity: revealed ? 1 : 0,
        transition:
          "transform 0.75s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease",
        width: "88%",
        zIndex: 10,
        perspective: "800px",
        perspectiveOrigin: "50% 100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "5%",
          right: "5%",
          height: 60,
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(10,5,3,0.3) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      <div
        style={{
          display: "flex",
          width: "100%",
          transformOrigin: "bottom center",
          transformStyle: "preserve-3d",
        }}
      >
        {SECTIONS_V2.map((section, i) => {
          const isActive = i === activeIndex;
          const primary = getSectionPrimaryLabel(locale, section);
          const secondary = getSectionSecondaryLabel(locale, section);
          const primaryIsArabic = locale === "ar";
          return (
            <div
              key={section.id}
              style={{
                flex: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                cursor: "pointer",
                transition: "flex 0.6s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <div
                style={{
                  padding: "0 24px 48px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <SymbolCard
                  section={section}
                  isActive={isActive}
                  isMobile={false}
                />

                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: isActive ? "1.8rem" : "2.25rem",
                    fontWeight: 400,
                    lineHeight: 1.1,
                    color: isActive
                      ? "rgba(222,194,158,1)"
                      : "rgba(200,175,140,0.8)",
                    transition:
                      "font-size 0.5s cubic-bezier(0.4,0,0.2,1), color 0.5s ease",
                    letterSpacing: "0.03em",
                  }}
                  onMouseEnter={() => onHover(i)}
                >
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={
                        primaryIsArabic
                          ? {
                              fontFamily: "var(--font-layla), sans-serif",
                              fontStyle: "normal",
                              letterSpacing: 0,
                            }
                          : undefined
                      }
                    >
                      {primary}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: isActive ? "1.05rem" : "1.15rem",
                        opacity: 0.9,
                        ...(primaryIsArabic
                          ? undefined
                          : {
                              fontFamily: "var(--font-layla), sans-serif",
                              fontStyle: "normal",
                              letterSpacing: 0,
                            }),
                      }}
                    >
                      {secondary}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: isActive
                    ? "linear-gradient(to right, transparent, rgba(196,168,120,0.35), transparent)"
                    : "transparent",
                  transition: "background 0.5s ease",
                  pointerEvents: "none",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface RoyalCombinedProps {
  active: boolean;
  onScrolled: () => void;
}

export default function RoyalCombinedIntroHeroV2({
  active,
  onScrolled,
}: RoyalCombinedProps) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";

  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredSubclassId, setHoveredSubclassId] = useState<string | null>(
    null,
  );

  const departmentsRevealed = true;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const activeSection = SECTIONS_V2[activeIndex];
  const sectionPrimaryIsArabic = locale === "ar";
  const activeSectionPrimary = getSectionPrimaryLabel(locale, activeSection);
  const activeSectionSecondary = getSectionSecondaryLabel(locale, activeSection);

  const hoveredSubclass = useMemo(() => {
    if (!hoveredSubclassId) return null;
    return (
      activeSection.subclasses.find((sub) => sub.id === hoveredSubclassId) ??
      null
    );
  }, [activeSection.subclasses, hoveredSubclassId]);

  const displayImage = hoveredSubclass?.image ?? activeSection.image;

  const handleActivate = useCallback((i: number) => {
    setActiveIndex(i);
    setHoveredSubclassId(null);
  }, []);

  useEffect(() => {
    if (!active) return;

    // Desktop navigation is handled globally by HomeClient (wheel/keys).
    // Here we only support mobile swipe-to-next-floor, while explicitly
    // ignoring gestures that start inside scrollable subclass panels.
    if (!isMobile) return;

    let startY: number | null = null;
    let startTarget: EventTarget | null = null;

    const isInsideHeroScrollable = (target: EventTarget | null) => {
      const el = target as Element | null;
      return !!el?.closest?.('[data-hero-scrollable="true"]');
    };

    const onTouchStart = (e: TouchEvent) => {
      startTarget = e.target;
      if (isInsideHeroScrollable(startTarget)) {
        startY = null;
        return;
      }
      startY = e.touches?.[0]?.clientY ?? null;
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (startY === null) return;
      if (isInsideHeroScrollable(startTarget)) return;
      const endY = e.changedTouches?.[0]?.clientY;
      if (typeof endY !== "number") return;

      const delta = startY - endY;
      if (delta > 34) onScrolled();
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [active, isMobile, onScrolled]);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          background: isMobile
            ? "radial-gradient(circle at 50% 12%, rgba(196,168,130,0.12) 18%, transparent 78%), radial-gradient(circle at 82% 28%, rgba(92,45,74,0.26) 48%, transparent 64%), linear-gradient(135deg, #0b0a1c 0%, #060914 55%, #02040a 100%)"
            : "radial-gradient(circle at 50% 12%, rgba(196,168,130,0.18) 20%, transparent 80%), radial-gradient(circle at 82% 28%, rgba(92,45,74,0.35) 50%, transparent 62%), linear-gradient(135deg, var(--royal-purple) 0%, var(--royal-dark) 58%, #0b0f2a 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            isMobile
              ? "linear-gradient(to bottom, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.50) 38%, rgba(0,0,0,0.82) 100%)"
              : "linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.0) 30%, rgba(0,0,0,0.58) 100%)",
          opacity: isMobile ? 1 : 0.9,
        }}
      />

      {/* Subtle grain (keeps the new gradient from feeling flat) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          opacity: 0.018,
          pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <style>{`
        @keyframes continuousSpin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
        @keyframes lampOn {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 50,
          pointerEvents: "none",
          background: "black",
          animation: "lampOn 1s cubic-bezier(0.4, 0, 0.8, 1) 2s forwards",
        }}
      />

      {!isMobile && (
        <StageOverlay
          activeIndex={activeIndex}
          revealed={departmentsRevealed}
        />
      )}

      {!isMobile && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 9,
            display: "flex",
            alignItems: "stretch",
            padding: "110px 6% 240px",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{ flex: 1, display: "flex", gap: 22, pointerEvents: "auto" }}
          >
            {/* Image panel */}
            <div
              className="liquid-glass"
              style={{
                flex: 1.2,
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.10)",
                overflow: "hidden",
                position: "relative",
                pointerEvents: "none",
                boxShadow: "0 30px 90px rgba(0,0,0,0.45)",
              }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={displayImage}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <Image
                    src={displayImage}
                    alt={hoveredSubclass?.label ?? activeSectionPrimary}
                    fill
                    unoptimized
                    style={{ objectFit: "cover", objectPosition: "50% 50%" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(135deg, rgba(10,4,2,0.35) 0%, rgba(10,4,2,0.18) 40%, rgba(10,4,2,0.45) 100%)",
                    }}
                  />
                </motion.div>
              </AnimatePresence>

              <div
                style={{
                  position: "absolute",
                  left: 18,
                  right: 18,
                  bottom: 18,
                  borderRadius: 999,
                  padding: "10px 14px",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  boxShadow: "0 16px 44px rgba(0,0,0,0.38)",
                }}
              >
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontStyle: "italic",
                    letterSpacing: "0.04em",
                    fontSize: "1.05rem",
                    lineHeight: 1.2,
                    color: "rgba(248,240,225,0.92)",
                    textAlign: "center",
                    textShadow: "0 1px 10px rgba(0,0,0,0.45)",
                    userSelect: "none",
                  }}
                >
                  {hoveredSubclass ? (
                    hoveredSubclass.label
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={
                          sectionPrimaryIsArabic
                            ? {
                                fontFamily: "var(--font-layla), sans-serif",
                                fontStyle: "normal",
                                letterSpacing: 0,
                              }
                            : undefined
                        }
                      >
                        {activeSectionPrimary}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: "0.95rem",
                          opacity: 0.92,
                          ...(sectionPrimaryIsArabic
                            ? undefined
                            : {
                                fontFamily: "var(--font-layla), sans-serif",
                                fontStyle: "normal",
                                letterSpacing: 0,
                              }),
                        }}
                      >
                        {activeSectionSecondary}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subclasses panel */}
            <div
              className="liquid-glass"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.10)",
                padding: 18,
                boxShadow: "0 30px 90px rgba(0,0,0,0.42)",
                pointerEvents: "auto",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(196,168,120,0.75)",
                    }}
                  >
                    <div>
                      <div
                        style={
                          sectionPrimaryIsArabic
                            ? {
                                fontFamily: "var(--font-layla), sans-serif",
                                textTransform: "none",
                                letterSpacing: "0.04em",
                              }
                            : undefined
                        }
                      >
                        {activeSectionPrimary}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 10,
                          letterSpacing: "0.06em",
                          opacity: 0.9,
                          ...(sectionPrimaryIsArabic
                            ? undefined
                            : {
                                fontFamily: "var(--font-layla), sans-serif",
                                textTransform: "none",
                                letterSpacing: "0.04em",
                              }),
                        }}
                      >
                        {activeSectionSecondary}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontStyle: "italic",
                      fontSize: 22,
                      letterSpacing: "0.03em",
                      color: "rgba(222,194,158,0.95)",
                    }}
                  >
                    {locale === "ar" ? "الصفوف" : "Subclasses"}
                  </div>
                </div>
              </div>

              <div
                data-hero-scrollable="true"
                onWheelCapture={(e) => e.stopPropagation()}
                onTouchMoveCapture={(e) => e.stopPropagation()}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                  WebkitOverflowScrolling: "touch",
                  paddingRight: 6,
                  scrollbarWidth: "thin",
                  scrollbarColor: "#e4d0b5 transparent",
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeSection.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22 }}
                  >
                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: {},
                        show: {
                          transition: {
                            staggerChildren: 0.09,
                            delayChildren: 0.08,
                          },
                        },
                      }}
                      className="flex flex-col gap-2"
                    >
                      {activeSection.subclasses.map((sub) => (
                        <motion.div
                          key={sub.id}
                          variants={{
                            hidden: { opacity: 0, y: 30, scale: 0.985 },
                            show: { opacity: 1, y: 0, scale: 1 },
                          }}
                          transition={{
                            duration: 0.35,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="relative"
                        >
                          <Link
                            href={resolveSubclassPageHref(
                              locale,
                              activeSection.id,
                              sub.slug,
                            )}
                            onMouseEnter={() => setHoveredSubclassId(sub.id)}
                            onMouseLeave={() => setHoveredSubclassId(null)}
                            className="group block rounded-2xl border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm transition hover:bg-white/10"
                            style={{
                              boxShadow:
                                "0 18px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
                              textDecoration: "none",
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="mt-1 font-goudy text-xl leading-tight text-royal-cream/95">
                                {sub.label}
                              </div>
                              <div className="h-10 w-10 shrink-0 rounded-full border border-white/10 bg-black/20 backdrop-blur-sm transition group-hover:bg-black/25" />
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}

      {isMobile && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "92px 5% 22px",
            pointerEvents: "auto",
          }}
        >
          <div
            className="liquid-glass"
            style={{
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.12)",
              overflow: "hidden",
              position: "relative",
              height: 240,
              boxShadow: "0 22px 70px rgba(0,0,0,0.45)",
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={displayImage}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ position: "absolute", inset: 0 }}
              >
                <Image
                  src={displayImage}
                  alt={hoveredSubclass?.label ?? activeSectionPrimary}
                  fill
                  unoptimized
                  style={{ objectFit: "cover", objectPosition: "50% 50%" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(135deg, rgba(10,4,2,0.35) 0%, rgba(10,4,2,0.18) 40%, rgba(10,4,2,0.55) 100%)",
                  }}
                />
              </motion.div>
            </AnimatePresence>

            <div
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 14,
                borderRadius: 999,
                padding: "10px 12px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 16px 44px rgba(0,0,0,0.38)",
              }}
            >
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontStyle: "italic",
                  letterSpacing: "0.04em",
                  fontSize: "1rem",
                  lineHeight: 1.2,
                  color: "rgba(248,240,225,0.92)",
                  textAlign: "center",
                  textShadow: "0 1px 10px rgba(0,0,0,0.45)",
                  userSelect: "none",
                }}
              >
                {hoveredSubclass ? (
                  hoveredSubclass.label
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={
                        sectionPrimaryIsArabic
                          ? {
                              fontFamily: "var(--font-layla), sans-serif",
                              fontStyle: "normal",
                              letterSpacing: 0,
                            }
                          : undefined
                      }
                    >
                      {activeSectionPrimary}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: "0.95rem",
                        opacity: 0.92,
                        ...(sectionPrimaryIsArabic
                          ? undefined
                          : {
                              fontFamily: "var(--font-layla), sans-serif",
                              fontStyle: "normal",
                              letterSpacing: 0,
                            }),
                      }}
                    >
                      {activeSectionSecondary}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="liquid-glass"
            style={{
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.10)",
              padding: 14,
              boxShadow: "0 22px 70px rgba(0,0,0,0.38)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              {SECTIONS_V2.map((section, i) => {
                const isActive = i === activeIndex;
                const primary = getSectionPrimaryLabel(locale, section);
                const secondary = getSectionSecondaryLabel(locale, section);
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => handleActivate(i)}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-2 py-3 backdrop-blur-sm transition"
                    style={{
                      boxShadow: isActive
                        ? "0 16px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)"
                        : "0 12px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
                      background: isActive
                        ? "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)"
                        : undefined,
                    }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-black/20">
                        <Image
                          src={section.icon}
                          alt={section.label}
                          fill
                          unoptimized
                          style={{ objectFit: "contain" }}
                        />
                      </div>
                      <div
                        style={{
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontStyle: "italic",
                          fontSize: 12,
                          letterSpacing: "0.03em",
                          color: isActive
                            ? "rgba(222,194,158,0.98)"
                            : "rgba(200,175,140,0.82)",
                          lineHeight: 1.1,
                        }}
                      >
                        <div style={{ textAlign: "center" }}>
                          <div
                            style={
                              sectionPrimaryIsArabic
                                ? {
                                    fontFamily: "var(--font-layla), sans-serif",
                                    fontStyle: "normal",
                                    letterSpacing: 0,
                                  }
                                : undefined
                            }
                          >
                            {primary}
                          </div>
                          <div
                            style={{
                              marginTop: 3,
                              fontSize: 10,
                              opacity: 0.9,
                              ...(sectionPrimaryIsArabic
                                ? undefined
                                : {
                                    fontFamily: "var(--font-layla), sans-serif",
                                    fontStyle: "normal",
                                    letterSpacing: 0,
                                  }),
                            }}
                          >
                            {secondary}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div
              data-hero-scrollable="true"
              onWheelCapture={(e) => e.stopPropagation()}
              onTouchMoveCapture={(e) => e.stopPropagation()}
              style={{
                maxHeight: "40vh",
                overflowY: "auto",
                overscrollBehavior: "contain",
                WebkitOverflowScrolling: "touch",
                paddingRight: 8,
                                  scrollbarWidth: "thin",
                  scrollbarColor: "#e4d0b5 transparent",
              }}
            >
              <div className="flex flex-col gap-5">
                {activeSection.subclasses.map((sub) => (
                  <Link
                    key={sub.id}
                    href={resolveSubclassPageHref(
                      locale,
                      activeSection.id,
                      sub.slug,
                    )}
                    onPointerEnter={() => setHoveredSubclassId(sub.id)}
                    onPointerLeave={() => setHoveredSubclassId(null)}
                    aria-label={sub.label}
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                    style={{
                      boxShadow:
                        "0 14px 34px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
                      textDecoration: "none",
                    }}
                  >
                    <span className="sr-only">{sub.label}</span>
                    <div
                      style={{
                        position: "relative",
                        height: 76,
                        borderRadius: 16,
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(0,0,0,0.22)",
                      }}
                    >
                      <Image
                        src={sub.image}
                        alt={sub.label}
                        fill
                        unoptimized
                        style={{ objectFit: "cover", objectPosition: "50% 50%" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.62) 100%)",
                        }}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isMobile && (
        <DesktopDepartmentsV2
          activeIndex={activeIndex}
          onHover={handleActivate}
          revealed={departmentsRevealed}
          locale={locale}
        />
      )}

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          zIndex: 10,
          background:
            "linear-gradient(to right, transparent, rgba(196,168,120,0.45), transparent)",
        }}
      />
    </section>
  );
}
