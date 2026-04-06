"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Section {
  id: string;
  label: string;
  subtitle: string;
  image: string;
}

const SECTIONS: Section[] = [
  {
    id: "ballet",
    label: "Ballet",
    subtitle: "Grace in every movement",
    image: "/images/HeroSection/balletGold.png",
  },
  {
    id: "dance & wellness",
    label: "Dance & Wellness",
    subtitle: "Rhythm of the soul",
    image: "/images/HeroSection/dance&wellnessGold.png",
  },
  {
    id: "music",
    label: "Music",
    subtitle: "The language of kings",
    image: "/images/HeroSection/musicGold.png",
  },
  {
    id: "art",
    label: "Art",
    subtitle: "Vision beyond the canvas",
    image: "/images/HeroSection/artGold.png",
  },
];

// ─── Symbol State Machine ─────────────────────────────────────────────────────
type SymbolState = "hidden" | "rising" | "spinning" | "falling";

// ─── Symbol Card ──────────────────────────────────────────────────────────────
function SymbolCard({
  section,
  isActive,
  isMobile = false,
}: {
  section: Section;
  isActive: boolean;
  isMobile?: boolean;
}) {
  // Always start hidden — the effect below handles initial active state too
  const [symState, setSymState] = useState<SymbolState>("hidden");
  // Always init to false so the effect correctly detects the first isActive=true
  const prevActiveRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const wasActive = prevActiveRef.current;
    prevActiveRef.current = isActive;
    if (isActive === wasActive) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (isActive && !wasActive) {
      // Start spin immediately, rise at the same time
      setSymState("rising");
      timerRef.current = setTimeout(() => setSymState("spinning"), 700);
    }
    if (!isActive && wasActive) {
      // Keep spinning while falling
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

  const w = isMobile ? 70 : 150;
  const h = isMobile ? 117 : 250;
  const minH = isMobile ? 125 : 220;

  return (
    <div
      style={{
        perspective: "900px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        minHeight: minH,
        marginBottom: isMobile ? "0.6rem" : "1.2rem",
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
          animation:
            symState !== "hidden"
              ? "continuousSpin 2s linear infinite"
              : "none",
          filter:
            "drop-shadow(0 0 22px rgba(196,168,130,0.65)) drop-shadow(0 0 8px rgba(196,168,130,0.4))",
        }}
      >
        <Image
          src={section.image}
          alt={section.label}
          fill
          unoptimized
          style={{ objectFit: "contain" }}
        />
      </div>
    </div>
  );
}

// ─── Shared Overlays ──────────────────────────────────────────────────────────
function Overlays() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 25%, rgba(18,12,8,0.45) 75%, rgba(12,8,5,0.7) 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background:
            "linear-gradient(to top, rgba(30,18,10,0.75) 0%, rgba(20,12,7,0.25) 45%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

// ─── Desktop Layout ───────────────────────────────────────────────────────────
// The panel sits inside a perspective container so it appears to recede like
// a stage floor — narrower than full-width, floating above the room floor.
function DesktopLayout({
  activeIndex,
  onHover,
}: {
  activeIndex: number;
  onHover: (i: number) => void;
}) {
  return (
    <>
      {/* Perspective container — creates the 3-D stage floor illusion */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "88%", // not full-width — room walls visible on sides
          zIndex: 10,
          // Perspective applied here so rotateX on the panel reads correctly
          perspective: "1200px",
          perspectiveOrigin: "50% 100%",
        }}
      >
        {/* The panel itself tilts slightly back — receding into the room */}
        <div
          style={{
            display: "flex",
            width: "100%",
            transformOrigin: "bottom center",
            transform: "rotateX(4deg)", // subtle tilt — enough to feel spatial
            // Soft side edges to blend into the room naturally
            // maskImage:
            //   "linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
            // WebkitMaskImage:
            //   "linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)",
          }}
        >
          {SECTIONS.map((section, i) => {
            const isActive = i === activeIndex;
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
                onMouseEnter={() => onHover(i)}
              >
                {/* Separator */}
                {i > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background:
                        "linear-gradient(to bottom, transparent, rgba(196,168,130,0.22), transparent)",
                    }}
                  />
                )}

                {/* Column hover glow */}
                {/* <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: isActive
                      ? "linear-gradient(to top, rgba(196,158,100,0.1) 0%, rgba(160,120,70,0.04) 50%, transparent 80%)"
                      : "transparent",
                    transition: "background 0.6s ease",
                    pointerEvents: "none",
                  }}
                /> */}

                {/* Content */}
                <div
                  style={{
                    padding: "0 28px 90px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <SymbolCard section={section} isActive={isActive} />

                  <div
                    style={{
                      fontFamily: "var(--font-text)",
                      fontSize: isActive ? "1.3rem" : "1.8rem",
                      fontWeight: 400,
                      lineHeight: 1.1,
                      color: isActive
                        ? "rgba(222,194,158,1)"
                        : "rgba(200,175,140,0.5)",
                      transition:
                        "font-size 0.5s cubic-bezier(0.4,0,0.2,1), color 0.5s ease",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {section.label}
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-text)",
                      fontStyle: "italic",
                      fontSize: "0.78rem",
                      color: "rgba(196,168,120,0.8)",
                      letterSpacing: "0.05em",
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "translateY(0)" : "translateY(6px)",
                      transition:
                        "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
                    }}
                  >
                    {section.subtitle}
                  </div>

                  <div
                    style={{
                      height: 1,
                      marginTop: 4,
                      background:
                        "linear-gradient(to right, rgba(196,168,120,0.7), transparent)",
                      width: isActive ? "100%" : "0%",
                      transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Mobile Layout ────────────────────────────────────────────────────────────
export function MobileLayout({
  activeIndex,
  onTap,
}: {
  activeIndex: number;
  onTap: (i: number) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Gold top rule */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(to right, transparent, rgba(196,168,130,0.6), transparent)",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        {SECTIONS.map((section, i) => {
          const isActive = i === activeIndex;

          return (
            <div
              key={section.id}
              onClick={() => onTap(i)}
              style={{
                position: "relative",
                cursor: "pointer",
                overflow: "hidden",
                borderTop: "1px solid rgba(196,168,130,0.12)",
                // Height-based expand: active row gets enough room for symbol+text
                maxHeight: isActive ? "340px" : "56px",
                transition: "max-height 0.55s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              {/* Active warm glow */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: isActive
                    ? "linear-gradient(to right, rgba(196,158,100,0.08), rgba(160,120,70,0.03))"
                    : "transparent",
                  transition: "background 0.5s ease",
                  pointerEvents: "none",
                }}
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "0 28px",
                }}
              >
                {/* Symbol — always mounted, isActive drives its own state machine */}
                <SymbolCard section={section} isActive={isActive} isMobile />

                {/* Row header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    height: 56,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "baseline", gap: 12 }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-text)",
                        fontSize: "0.6rem",
                        letterSpacing: "0.25em",
                        color: isActive
                          ? "rgba(196,168,120,0.7)"
                          : "rgba(196,168,120,0.3)",
                        transition: "color 0.4s ease",
                        userSelect: "none",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-text)",
                        fontSize: isActive ? "1.8rem" : "1.05rem",
                        fontWeight: 400,
                        lineHeight: 1.1,
                        color: isActive
                          ? "rgba(222,194,158,1)"
                          : "rgba(200,175,140,0.45)",
                        transition:
                          "font-size 0.45s cubic-bezier(0.4,0,0.2,1), color 0.4s ease",
                        letterSpacing: "0.03em",
                        userSelect: "none",
                      }}
                    >
                      {section.label}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: isActive
                        ? "rgba(196,168,120,0.8)"
                        : "rgba(196,168,120,0.25)",
                      transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.4s ease, color 0.4s ease",
                      userSelect: "none",
                      display: "inline-block",
                    }}
                  >
                    ↑
                  </span>
                </div>

                {/* Subtitle */}
                <div
                  style={{
                    fontFamily: "var(--font-text)",
                    fontStyle: "italic",
                    fontSize: "0.72rem",
                    color: "rgba(196,168,120,0.75)",
                    letterSpacing: "0.05em",
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "translateY(0)" : "translateY(4px)",
                    transition:
                      "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
                    marginBottom: 10,
                  }}
                >
                  {section.subtitle}
                </div>

                {/* Gold underline */}
                <div
                  style={{
                    height: 1,
                    marginBottom: 12,
                    background:
                      "linear-gradient(to right, rgba(196,168,120,0.6), transparent)",
                    width: isActive ? "100%" : "0%",
                    transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function RoyalHeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleActivate = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
    >
      <Image
        src="/images/rooms/initial-room2.png"
        alt="Hero Room"
        fill
        unoptimized
        className="object-cover"
        priority
        style={{ zIndex: 0 }}
      />

      <Overlays />

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          zIndex: 10,
          background:
            "linear-gradient(to right, transparent, rgba(196,168,120,0.5), transparent)",
        }}
      />

      {isMobile ? (
        <MobileLayout activeIndex={activeIndex} onTap={handleActivate} />
      ) : (
        <DesktopLayout activeIndex={activeIndex} onHover={handleActivate} />
      )}

      <style>{`
        @keyframes continuousSpin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
      `}</style>
    </section>
  );
}
