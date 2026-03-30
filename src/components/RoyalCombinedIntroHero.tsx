"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
type SymbolState = "hidden" | "rising" | "spinning" | "falling";

interface Section {
  id: string;
  label: string;
  subclasses: { label: string; href: string }[];
  image: string;
}

const SECTIONS: Section[] = [
  {
    id: "ballet",
    label: "Ballet",
    subclasses: [
      { label: "Baby Ballet", href: "/baby-ballet" },
      { label: "RAD Ballet", href: "/rad-ballet" },
      { label: "Open Ballet", href: "/open-ballet" },
    ],
    image: "/images/HeroSection/balletGold.png",
  },
  {
    id: "dance-wellness",
    label: "Dance & Wellness",
    subclasses: [
      { label: "Hip Hop", href: "/hip-hop" },
      { label: "Aerial Hoop", href: "/aerial-hoop" },
      { label: "Zumba", href: "/zumba" },
      { label: "Salsa", href: "/salsa" },
      { label: "Yoga", href: "/yoga" },
      { label: "Breath & Balance", href: "/breath" },
      { label: "Wellness & Mindful Movement", href: "/wellness" },
      { label: "Mindfulness", href: "/mindfulness" },
      { label: "Gymnastics for kids", href: "/gymnastics" },
      { label: "Body Flexibility", href: "/flexibility" },
      { label: "Stretch & conditioning", href: "/stretch" },
      { label: "Posture & Mobility", href: "/posture" },
      { label: "Timeless Movement", href: "/timeless" },
      { label: "Movement Retreats", href: "/movement" },
    ],
    image: "/images/HeroSection/dance&wellnessGold.png",
  },
  {
    id: "music",
    label: "Music",
    subclasses: [
      { label: "Piano-Academic Learning", href: "/piano-academic" },
      { label: "Piano-Ear Learning", href: "/piano-Ear-learning" },
      { label: "Piano-Freelance", href: "/vocal-training" },
      { label: "Guitar", href: "/guitar" },
      { label: "Violin", href: "/violin" },
      { label: "oud", href: "/oud" },
      { label: "Drums", href: "/drums" },
      { label: "Handpan", href: "/handpan" },
      { label: "Percussion", href: "/percussion" },
      { label: "Darbuka", href: "/darbuka" },
      { label: "Bass", href: "/bass" },
      { label: "Vocal", href: "/vocal" },
      { label: "Theory", href: "/theory" },
      { label: "Sight Reading", href: "/sight-Reading" },
      { label: "Solfège", href: "/solfège" },
      { label: "Music Awakening", href: "/music-awakening" },
    ],
    image: "/images/HeroSection/musicGold.png",
  },
  {
    id: "art",
    label: "Art",
    subclasses: [
      { label: "Drawing I Basic to Advance", href: "/drawing-painting" },
      { label: "Shading & Color Techniques", href: "/sculpture" },
      { label: "Portrait & Caricature", href: "/digital-art" },
      { label: "Mandala Dotting art", href: "/Mandala" },
      { label: "Colored Pencil Drawing", href: "/Colored" },
      { label: "Calligraphy", href: "/Calligraphy" },
      { label: "Acrylic", href: "/Acrylic" },
      { label: "Oil painting", href: "/Oil" },
      { label: "WaterColor", href: "/WaterColor" },
      { label: "Mixed Media", href: "/Mixed" },
      { label: "Arts & Crafts(kids)", href: "/Arts" },
      { label: "Drawing I Basic to Advance(kids)", href: "/Drawing" },
      { label: "Shading&Color Techniques(kids)", href: "/Shading" },
      { label: "Portrait&Caricature(kids)", href: "/Portrait" },
      { label: "Animation Drawing(kids)", href: "/Animation" },
      { label: "Paper Art(kids)", href: "/Paper" },
      { label: "Collage(kids)", href: "/Collage" },
    ],
    image: "/images/HeroSection/artGold.png",
  },
];

// ─── SymbolCard ───────────────────────────────────────────────────────────────
interface SymbolCardProps {
  section: Section;
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

  const w = isMobile ? 62 : 110;
  const h = isMobile ? 104 : 184;
  const minH = isMobile ? 112 : 168;

  return (
    <div
      style={{
        perspective: "900px",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        minHeight: minH,
        marginBottom: isMobile ? "0.5rem" : "0.9rem",
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
          src={section.image}
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

        <div
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            bottom: 8,
            padding: isMobile ? "6px 10px" : "8px 12px",
            borderRadius: 999,
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 100%)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              letterSpacing: "0.04em",
              fontSize: isMobile ? "0.85rem" : "0.95rem",
              lineHeight: 1.15,
              color: "rgba(248,240,225,0.92)",
              textAlign: "center",
              textShadow: "0 1px 10px rgba(0,0,0,0.45)",
              userSelect: "none",
            }}
          >
            {section.label}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SubclassItem ─────────────────────────────────────────────────────────────
// Individual subclass row with bevel / engraved-metal hover aesthetic.
// Rest state: dim gold text, no decoration.
// Hover state:
//   • Left gold "blade" border slides in from 0→full height
//   • Text brightens and shifts right by the blade width
//   • Inset top highlight (lighter edge) + bottom shadow (darker edge) = bevel press
//   • Warm ambient glow behind the row
function SubclassItem({ sub }: { sub: { label: string; href: string } }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={sub.href}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "block",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontStyle: "italic",
        fontSize: "1.05rem",
        letterSpacing: "0.04em",
        textDecoration: "none",
        padding: "7px 12px 7px 14px",
        color: hovered ? "rgba(240,215,168,1)" : "rgba(196,168,120,0.7)",
        // Bevel: inset box-shadow creates the engraved look on hover
        boxShadow: hovered
          ? "inset 0 1px 0 rgba(255,230,160,0.12), inset 0 -1px 0 rgba(0,0,0,0.28), 0 0 18px rgba(196,155,80,0.07)"
          : "none",
        background: hovered
          ? "linear-gradient(to bottom, rgba(196,155,80,0.09) 0%, rgba(140,100,40,0.05) 100%)"
          : "transparent",
        transition:
          "color 0.25s ease, box-shadow 0.3s ease, background 0.3s ease, padding-left 0.3s cubic-bezier(0.4,0,0.2,1)",
        // Nudge text right to make room for the blade
        paddingLeft: hovered ? "20px" : "14px",
        overflow: "hidden",
      }}
    >
      {/* Left blade — slides down from 0 height to full on hover */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: hovered ? "0%" : "50%",
          width: 2,
          height: hovered ? "100%" : "0%",
          background:
            "linear-gradient(to bottom, rgba(255,215,120,0.15), rgba(210,168,80,0.85), rgba(255,215,120,0.15))",
          boxShadow: "0 0 6px rgba(210,168,80,0.5)",
          transition:
            "height 0.3s cubic-bezier(0.4,0,0.2,1), top 0.3s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: "none",
        }}
      />
      {/* Top inset highlight line — the "bevel" upper edge */}
      <span
        style={{
          position: "absolute",
          top: 0,
          left: "10%",
          right: "10%",
          height: 1,
          background: hovered
            ? "linear-gradient(to right, transparent, rgba(255,230,160,0.18), transparent)"
            : "transparent",
          transition: "background 0.3s ease",
          pointerEvents: "none",
        }}
      />
      {sub.label}
    </Link>
  );
}

// ─── Subclasses list ──────────────────────────────────────────────────────────
// Shows max 3 items at once. If more exist, the list is scrollable.
// Wheel events are stopped here so they never reach HomeClient's page-scroll handler.
const ITEM_HEIGHT = 38; // px — approximate height of one SubclassItem row
const VISIBLE_ITEMS = 3;

function Subclasses({
  section,
  isActive,
}: {
  section: Section;
  isActive: boolean;
}) {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const hasMore = section.subclasses.length > VISIBLE_ITEMS;

  // Intercept wheel so HomeClient doesn't slide to the next floor
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!hasMore) return;
      e.stopPropagation();
    },
    [hasMore],
  );

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* Top fade hint */}
      {hasMore && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 18,
            background:
              "linear-gradient(to bottom, rgba(20,8,2,0.55), transparent)",
            zIndex: 2,
            pointerEvents: "none",
            opacity: isActive ? 0.4 : 0,
            transition: "opacity 0.4s ease",
          }}
        />
      )}

      <div
        className="subclass-scroll"
        onWheel={handleWheel}
        style={{
          width: "100%",
          maxHeight: `${ITEM_HEIGHT * VISIBLE_ITEMS}px`,
          overflowY: hasMore ? "auto" : "visible",
          overflowX: "hidden",
          scrollbarWidth: "thin",
          border: "1px solid rgba(196,168,120,0.3)",
          borderRadius: 2,
          scrollbarColor: "rgba(196,155,80,0.55) rgba(30,12,4,0.4)",
        }}
      >
        {section.subclasses.map((sub, idx) => {
          const raw = sub.href.startsWith("/") ? sub.href.slice(1) : sub.href;
          const slug = raw.toLowerCase();
          const resolvedHref =
            section.id === "dance-wellness"
              ? `/${locale}/classes/dance/${slug}`: section.id === "ballet"
                ? `/${locale}/classes/ballet/${slug}` : section.id === "music"
                  ? `/${locale}/classes/music/${slug}` : section.id === "art"
                    ? `/${locale}/classes/art/${slug}`
              : `/${locale}${sub.href.startsWith("/") ? sub.href : `/${sub.href}`}`;

          return (
          <div
            key={`${section.id}-${sub.href}`}
            style={{
              opacity: isActive ? 1 : 0,
              transform: isActive ? "translateY(0)" : "translateY(6px)",
              transition: `opacity 0.4s ease ${0.08 * idx}s, transform 0.4s ease ${0.08 * idx}s`,
            }}
          >
            <SubclassItem sub={{ ...sub, href: resolvedHref }} />
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Desktop department panel ─────────────────────────────────────────────────
interface DesktopDepartmentsProps {
  activeIndex: number;
  onHover: (i: number) => void;
  revealed: boolean;
}

function DesktopDepartments({
  activeIndex,
  onHover,
  revealed,
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
      {/* Floor shadow */}
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
              <div
                style={{
                  padding: "0 24px 48px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  // No transform — content sits naturally at the bottom.
                  // The label is always visible; subclasses expand above it on hover.
                }}
              >
                <SymbolCard
                  section={section}
                  isActive={isActive}
                  isMobile={false}
                />
                {/* Subclasses expand above the label on hover.
                    The wrapper animates opacity/max-height; Subclasses
                    itself manages the per-item scroll viewport. */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    overflow: "hidden",
                    maxHeight: isActive ? "160px" : "0px",
                    opacity: isActive ? 1 : 0,
                    transition:
                      "max-height 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease",
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  <Subclasses section={section} isActive={isActive} />
                  <div
                    style={{
                      height: 1,
                      marginTop: 6,
                      marginBottom: 4,
                      background:
                        "linear-gradient(to right, transparent, rgba(196,168,120,0.55), transparent)",
                      width: "88%",
                    }}
                  />
                </div>
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
                >
                  {section.label}
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

// ─── Mobile department panel ──────────────────────────────────────────────────
interface MobileDepartmentsProps {
  activeIndex: number;
  onTap: (i: number) => void;
}

function MobileDepartments({ activeIndex, onTap }: MobileDepartmentsProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          borderBottom: "1px solid rgba(196,168,130,0.22)",
        }}
      >
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
                borderTop: isActive
                  ? "1px solid rgba(196,168,130,0.45)"
                  : "1px solid rgba(196,168,130,0.22)",
                maxHeight: isActive ? "320px" : "56px",
                transition:
                  "max-height 0.55s cubic-bezier(0.4,0,0.2,1), border-color 0.4s ease",
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to right, rgba(196,140,60,0.06), transparent 60%)",
                    pointerEvents: "none",
                  }}
                />
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 24px",
                  height: 56,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 10 }}
                >
                  <span
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: "0.58rem",
                      letterSpacing: "0.22em",
                      color: isActive
                        ? "rgba(196,168,120,0.7)"
                        : "rgba(196,168,120,0.5)",
                      transition: "color 0.4s ease",
                      userSelect: "none",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: isActive ? "1.4rem" : "1rem",
                      fontWeight: 400,
                      lineHeight: 1.1,
                      color: isActive
                        ? "rgba(222,194,158,1)"
                        : "rgba(200,175,140,0.78)",
                      transition:
                        "font-size 0.45s cubic-bezier(0.4,0,0.2,1), color 0.4s ease",
                      userSelect: "none",
                    }}
                  >
                    {section.label}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: "0.65rem",
                    color: isActive
                      ? "rgba(196,168,120,0.8)"
                      : "rgba(196,168,120,0.5)",
                    transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.4s ease, color 0.4s ease",
                    display: "inline-block",
                    userSelect: "none",
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  ↑
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "0 24px",
                }}
              >
                <SymbolCard
                  section={section}
                  isActive={isActive}
                  isMobile={true}
                />
                <Subclasses section={section} isActive={isActive} />
                <div
                  style={{
                    height: 1,
                    marginBottom: 10,
                    background:
                      "linear-gradient(to right, rgba(196,168,120,0.55), transparent)",
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

// ─── Stage Spotlight overlay (Desktop, post-reveal) ───────────────────────────
// A layered overlay that:
//  1. Darkens + subtly blurs the background (the room)
//  2. Casts a warm upward cone from the active column — like a stage floor light
interface StageOverlayProps {
  activeIndex: number;
  revealed: boolean;
}

function StageOverlay({ activeIndex, revealed }: StageOverlayProps) {
  // The departments panel is 88% wide and centered (6% left margin each side).
  // 4 equal columns → each column = 22vw wide.
  // Column centres in viewport %: 6 + 11 = 17, 39, 61, 83
  const colCentres = [17, 39, 61, 83];
  const spotX = colCentres[activeIndex];

  return (
    <>
      {/* 1 — Room darkening layer (fades in on reveal) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          pointerEvents: "none",
          // Darken the top 2/3 of the room strongly, fade out through the departments zone
          background:
            "linear-gradient(to bottom, rgba(10,4,2,0.55) 0%, rgba(10,4,2,0.45) 50%, rgba(10,4,2,0.20) 67%, rgba(10,4,2,0.05) 82%, transparent 100%)",
          opacity: revealed ? 1 : 0,
          transition: "opacity 1s cubic-bezier(0.4,0,0.2,1)",
        }}
      />

      {/* 2 — Soft backdrop blur (upper 2/3 of the section) */}
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
          // Mask fades out over the bottom 20% so blur doesn't bleed onto text
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
          opacity: revealed ? 1 : 0,
          transition:
            "opacity 1s ease, backdrop-filter 1s ease, -webkit-backdrop-filter 1s ease",
        }}
      />

      {/* 3 — Stage spotlight cone (tracks active column) */}
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
            // The spotlight cone: wide at bottom, tapering upward
            width: "38%",
            height: "100%",
            background:
              "radial-gradient(ellipse 55% 80% at 50% 100%, rgba(196,155,90,0.13) 0%, rgba(160,120,60,0.06) 45%, transparent 75%)",
            transition: `left 0.65s cubic-bezier(0.4,0,0.2,1)`,
            pointerEvents: "none",
          }}
        />
        {/* Floor glow — a bright warm ellipse at the very bottom under active column */}
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
            transition: `left 0.65s cubic-bezier(0.4,0,0.2,1)`,
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface RoyalCombinedProps {
  active: boolean;
  onScrolled: () => void;
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function RoyalCombined({
  active,
  onScrolled,
}: RoyalCombinedProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const departmentsRevealed = true;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleActivate = useCallback((i: number) => setActiveIndex(i), []);

  // Scroll trigger — only when active
  useEffect(() => {
    if (!active) return;
    const trigger = () => {
      if (active) onScrolled();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", " ", "PageDown"].includes(e.key)) trigger();
    };
    window.addEventListener("wheel", trigger, { once: true });
    window.addEventListener("touchmove", trigger, { once: true });
    window.addEventListener("keydown", onKey, { once: true });
    return () => {
      window.removeEventListener("wheel", trigger);
      window.removeEventListener("touchmove", trigger);
      window.removeEventListener("keydown", onKey);
    };
  }, [active, onScrolled]);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Desktop background */}
      {!isMobile && (
        <Image
          src="/images/initial-room4.png"
          alt="Royal Academy Room"
          fill
          unoptimized
          priority
          style={{ objectFit: "cover", objectPosition: "50% 80%", zIndex: 0 }}
        />
      )}

      {/* Mobile background */}
      {isMobile && (
        <Image
          src="/images/initial-mobile2.png"
          alt="Royal Academy Room"
          fill
          unoptimized
          priority
          style={{ objectFit: "cover", objectPosition: "50% 50%", zIndex: 0 }}
        />
      )}

      <style>{`
        @keyframes continuousSpin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
        @keyframes lampOn {
          0%   { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes exploreOurClassesPulse {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(5px);  }
        }
        .subclass-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .subclass-scroll::-webkit-scrollbar-track {
          background: rgba(30,12,4,0.35);
          border-radius: 2px;
        }
        .subclass-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(
            to bottom,
            rgba(255,215,120,0.2),
            rgba(196,155,80,0.7),
            rgba(255,215,120,0.2)
          );
          border-radius: 2px;
        }
        .subclass-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(220,175,85,0.9);
        }
      `}</style>

      {/* Lamp-on effect */}
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

      {/* ── Stage overlay: darkening + blur + spotlight (Desktop only) ── */}
      {!isMobile && (
        <StageOverlay
          activeIndex={activeIndex}
          revealed={departmentsRevealed}
        />
      )}

      {/* ── Desktop: hover hint + departments (shown after reveal) ── */}
      {!isMobile && (
        <>
          <DesktopDepartments
            activeIndex={activeIndex}
            onHover={handleActivate}
            revealed={departmentsRevealed}
          />
        </>
      )}

      {/* ── Mobile: always-on departments + tap hint ── */}
      {isMobile && (
        <>
          <MobileDepartments activeIndex={activeIndex} onTap={handleActivate} />
        </>
      )}

      {/* Gold rule */}
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
