"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePreloader } from "@/context/PreloaderContext";

import {
  ContentCard,
  Props,
  SECTIONS,
  emptyCard,
} from "./RoyalWorldIntro.types";
import {
  Card,
  MiniPilePopup,
  SymbolCard,
  Subclasses,
} from "./RoyalWorldIntro.shared";

// ─────────────────────────────────────────────
// SCROLL STATES
// 0 = full size cards
// 1 = mini mode — departments revealed
// ─────────────────────────────────────────────
const SCROLL_STATES = 2; // 0..1

// ─────────────────────────────────────────────
// CARD PILE
// ─────────────────────────────────────────────

const CARD_W = 380;
const CARD_H = 600;

function CardPile({
  cards,
  label,
  revealDelay,
  onDragStart,
  onDragEnd,
  contentOpacity = 1,
  mini = false,
  labelCounterScale = 1,
  buttonCounterScale = 1,
  disabled = false,
  onMiniClick,
  titleSize = 14,
}: {
  cards: ContentCard[];
  label: string;
  revealDelay: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  contentOpacity?: number;
  mini?: boolean;
  labelCounterScale?: number;
  buttonCounterScale?: number;
  disabled?: boolean;
  onMiniClick?: () => void;
  titleSize?: number;
}) {
  const [frontIndex, setFrontIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyingOut, setFlyingOut] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [entryDone, setEntryDone] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [flyOffset, setFlyOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [history, setHistory] = useState<number[]>([]);
  const [undoTargetIndex, setUndoTargetIndex] = useState<number | null>(null);

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const currentDragRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isAnimatingRef = useRef(false);
  const pileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  useEffect(() => {
    const t = setTimeout(() => setEntryDone(true), revealDelay + 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commitNext = useCallback(
    (currentIndex: number) => {
      const next = (currentIndex + 1) % cards.length;
      setHistory((h) => [...h, currentIndex]);
      setFrontIndex(next);
    },
    [cards.length],
  );

  const next = useCallback(() => {
    if (isAnimatingRef.current || cards.length <= 1 || disabled) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    setFlyingOut(true);
    setTimeout(() => {
      commitNext(frontIndex);
      setFlyingOut(false);
      setTimeout(() => {
        isAnimatingRef.current = false;
        setIsAnimating(false);
      }, 460);
    }, 430);
  }, [cards.length, commitNext, frontIndex, disabled]);

  const flyToPile = useCallback(() => {
    if (isAnimatingRef.current || cards.length <= 1) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    const fromX = currentDragRef.current.x;
    const fromY = currentDragRef.current.y;
    setIsDragging(false);
    isDraggingRef.current = false;
    setFlyOffset({ x: fromX, y: fromY });
    setIsFlying(true);
    requestAnimationFrame(() => {
      setFlyOffset({ x: 0, y: 0 });
    });
    setTimeout(() => {
      setIsFlying(false);
      setDragX(0);
      setDragY(0);
      onDragEnd?.();
      commitNext(frontIndex);
      setTimeout(() => {
        isAnimatingRef.current = false;
        setIsAnimating(false);
      }, 100);
    }, 450);
  }, [cards.length, commitNext, onDragEnd, frontIndex]);

  const undo = useCallback(() => {
    if (isAnimatingRef.current || history.length === 0 || disabled) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    const prev = history[history.length - 1];
    setUndoTargetIndex(prev);
    setUndoing(true);
    setTimeout(() => {
      setFrontIndex(prev);
      setHistory((h) => h.slice(0, -1));
      setTimeout(() => {
        setUndoing(false);
        setUndoTargetIndex(null);
        isAnimatingRef.current = false;
        setIsAnimating(false);
      }, 600);
    }, 50);
  }, [history, disabled]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (mini) return;
    if (isAnimatingRef.current || cards.length <= 1 || disabled) return;
    e.preventDefault();
    onDragStart?.();
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    currentDragRef.current = { x: 0, y: 0 };
    isDraggingRef.current = true;
    setIsDragging(true);
    setDragX(0);
    setDragY(0);
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      currentDragRef.current = { x: dx, y: dy };
      setDragX(dx);
      setDragY(dy);
    };
    const onUp = (e: PointerEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      isDraggingRef.current = false;
      dragStartRef.current = null;
      onDragEnd?.();
      if (distance > 350) flyToPile();
      else {
        setIsDragging(false);
        setDragX(0);
        setDragY(0);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [flyToPile]);

  const ordered = Array.from(
    { length: Math.min(cards.length, 4) },
    (_, i) => cards[(frontIndex + i) % cards.length],
  );
  const dragRotation = dragX * 0.04;
  const W = CARD_W;
  const H = CARD_H;

  return (
    <div
      style={{
        marginTop: 120,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: entryDone
          ? "translateY(0)"
          : `translateY(${180 + revealDelay * 0.2}%)`,
        transition: `transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)`,
        transitionDelay: `${revealDelay}ms`,
      }}
    >
      <div
        ref={pileRef}
        style={{
          position: "relative",
          width: W,
          height: H,
          cursor: mini
            ? "pointer"
            : isDragging
              ? "grabbing"
              : cards.length > 1 && !disabled
                ? "grab"
                : "default",
          userSelect: "none",
          zIndex: isDragging || isFlying ? 1000 : "auto",
          isolation: isDragging || isFlying ? "isolate" : "auto",
        }}
        onPointerDown={onPointerDown}
        onClick={mini ? onMiniClick : undefined}
      >
        {ordered.map((card, stackIndex) => {
          const isFront = stackIndex === 0;
          const tilts = mini ? [0, 6, -6, 10, -10] : [0, 1.5, -2, 2.5, -1.5];
          const offsetsY = mini ? [0, 10, 10, 18, 18] : [0, -2, -4, -6, -8];
          const offsetsX = mini ? [0, 14, -14, 26, -26] : [0, 2, -2, 3, -3];
          const scaleArr = mini
            ? [1, 0.98, 0.98, 0.96, 0.96]
            : [1, 0.99, 0.98, 0.97, 0.96];
          const tilt = tilts[Math.min(stackIndex, tilts.length - 1)];
          const offY = offsetsY[Math.min(stackIndex, offsetsY.length - 1)];
          const offX = offsetsX[Math.min(stackIndex, offsetsX.length - 1)];
          const scale = scaleArr[Math.min(stackIndex, scaleArr.length - 1)];

          return (
            <div
              key={card.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                transformOrigin: "center bottom",
                transform: (() => {
                  if (isFront && isFlying)
                    return `translateX(${flyOffset.x}px) translateY(${flyOffset.y}px) rotate(${flyOffset.x * 0.02}deg)`;
                  if (isFront && isDragging)
                    return `translateX(${dragX}px) translateY(${dragY}px) rotate(${dragRotation}deg)`;
                  return `translateX(${offX}px) translateY(${offY}px) rotate(${tilt}deg) scale(${scale})`;
                })(),
                transition: (() => {
                  if (isFront && isDragging) return "none";
                  if (isFront && isFlying)
                    return "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)";
                  if (isFront && !flyingOut)
                    return "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)";
                  if (!isFront || !flyingOut)
                    return "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)";
                  return undefined;
                })(),
                animation: (() => {
                  if (isFront && flyingOut)
                    return "ra-exit-up 0.9s ease-in-out both";
                  if (undoing && card.id === cards[undoTargetIndex ?? -1]?.id)
                    return "ra-enter-from-back 0.9s ease-in-out both";
                  return undefined;
                })(),
                zIndex: (() => {
                  if (isFront && isDragging) return 1000;
                  if (isFront && isFlying) return 0;
                  return ordered.length - stackIndex;
                })(),
              }}
            >
              <Card
                card={card}
                isFront={isFront}
                contentOpacity={contentOpacity}
                titleSize={titleSize}
              />
            </div>
          );
        })}
      </div>

      {/* Label + controls */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          opacity: entryDone ? 1 : 0,
          transform: `scale(${labelCounterScale})`,
          transformOrigin: "center top",
          transition:
            "opacity 0.5s ease, transform 0.65s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <Image
          src={label}
          alt=""
          width={180}
          height={180}
          style={{ objectFit: "contain" }}
        />
        {cards.length > 1 && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              transform: `scale(${buttonCounterScale / labelCounterScale})`,
              transformOrigin: "center top",
            }}
          >
            <button
              className="liquid-glass-gold"
              onClick={mini ? undefined : undo}
              disabled={history.length === 0 || isAnimating}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: history.length === 0 ? "default" : "pointer",
                color:
                  history.length === 0 ? "rgba(200,169,110,0.25)" : "#c8a96e",
                transition: "background 0.2s, color 0.2s",
                marginRight: 2,
                pointerEvents: mini ? "none" : "auto",
                opacity: mini ? 0 : 1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7a5 5 0 1 0 1.5-3.5L2 2v3.5h3.5L4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {cards.slice(0, 5).map((_, i) => (
              <div
                key={i}
                onClick={() => {
                  if (!mini && i !== frontIndex && !isAnimating) {
                    setHistory((h) => [...h, frontIndex]);
                    setFrontIndex(i);
                  }
                }}
                style={{
                  height: 5,
                  width: i === frontIndex ? 18 : 5,
                  borderRadius: 3,
                  background:
                    i === frontIndex ? "#c8a96e" : "rgba(200,169,110,0.28)",
                  transition: "width 0.3s ease, background 0.3s ease",
                  cursor: mini ? "default" : "pointer",
                  opacity: mini ? 0 : 1,
                }}
              />
            ))}
            <button
              className="liquid-glass-gold"
              onClick={mini ? undefined : next}
              disabled={isAnimating}
              style={{
                marginLeft: 2,
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: mini ? "default" : "pointer",
                color: "#c8a96e",
                transition: "background 0.2s",
                pointerEvents: mini ? "none" : "auto",
                opacity: mini ? 0 : 1,
              }}
            >
              <svg width="30" height="30" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 11L7 3M7 3L3.5 6.5M7 3L10.5 6.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STAGE OVERLAY (desktop departments bg)
// ─────────────────────────────────────────────

function StageOverlay({
  activeIndex,
  overlayVisible,
  spotlightVisible,
}: {
  activeIndex: number;
  overlayVisible: boolean;
  spotlightVisible: boolean;
}) {
  const colCentres = [17, 39, 61, 83];
  const spotX = colCentres[activeIndex] ?? 50;
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
          opacity: overlayVisible ? 1 : 0,
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
          backdropFilter: spotlightVisible ? "blur(3px)" : "blur(0px)",
          WebkitBackdropFilter: spotlightVisible ? "blur(3px)" : "blur(0px)",
          opacity: spotlightVisible ? 1 : 0,
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 70%, transparent 100%)",
          transition: "opacity 1s ease, backdrop-filter 1s ease",
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
          opacity: spotlightVisible ? 1 : 0,
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
            transition: `left 0.65s cubic-bezier(0.4,0,0.2,1)`,
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
            transition: `left 0.65s cubic-bezier(0.4,0,0.2,1)`,
          }}
        />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// DESKTOP DEPARTMENTS
// ─────────────────────────────────────────────

function DesktopDepartments({
  activeIndex,
  onHover,
  revealed,
}: {
  activeIndex: number;
  onHover: (i: number) => void;
  revealed: boolean;
}) {
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
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          transformOrigin: "bottom center",
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
                }}
              >
                <SymbolCard
                  section={section}
                  isActive={isActive}
                  isMobile={false}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    width: "100%",
                    overflow: "hidden",
                    maxHeight: isActive ? "360px" : "0px",
                    opacity: isActive ? 1 : 0,
                    transition:
                      "max-height 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease",
                    pointerEvents: isActive ? "auto" : "none",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      border: "1px solid rgba(196,168,120,0.28)",
                      borderRadius: 6,
                      overflow: "hidden",
                      background: "rgba(0,0,0,0.28)",
                      boxShadow:
                        "0 2px 8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,220,140,0.06)",
                    }}
                  >
                    <Subclasses
                      section={section}
                      isActive={isActive}
                      isMobile={true}
                    />
                  </div>
                  <div
                    style={{
                      height: 1,
                      marginTop: 7,
                      marginBottom: 3,
                      background:
                        "linear-gradient(to right, transparent, rgba(196,168,120,0.4), transparent)",
                      width: "82%",
                      flexShrink: 0,
                    }}
                  />
                </div>
                {/* Section label */}
                <div
                  style={{
                    fontFamily: "var(--font-text)",
                    fontSize: isActive ? "1.75rem" : "2.2rem",
                    fontWeight: 400,
                    lineHeight: 1.15,
                    letterSpacing: "0.035em",
                    color: isActive
                      ? "rgba(230, 205, 165, 1)"
                      : "rgba(200, 175, 140, 0.75)",
                    transition:
                      "font-size 0.45s cubic-bezier(0.4,0,0.2,1), color 0.45s ease",
                    textShadow: isActive
                      ? "0 2px 4px rgba(0,0,0,0.9), 0 -1px 0 rgba(255,230,140,0.5), 1px 0 2px rgba(0,0,0,0.7), -1px 0 2px rgba(0,0,0,0.7), 0 0 14px rgba(220,185,110,0.35)"
                      : "0 2px 3px rgba(0,0,0,0.8), 0 -1px 0 rgba(255,220,140,0.2), 1px 0 1px rgba(0,0,0,0.5), -1px 0 1px rgba(0,0,0,0.5)",
                  }}
                >
                  {section.label}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "10%",
                  right: "10%",
                  height: 1,
                  borderRadius: 1,
                  background: isActive
                    ? "linear-gradient(to right, transparent, rgba(196,168,120,0.45), transparent)"
                    : "transparent",
                  transition: "background 0.45s ease, opacity 0.45s ease",
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

// ─────────────────────────────────────────────
// SCALE INTERPOLATION
// ─────────────────────────────────────────────

const STATE_SCALES = [1, 0.42];
const STATE_CONTENT_OPACITY = [1, 0.0];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function getInterpolated(states: number[], scrollState: number, t: number) {
  const lo = Math.floor(scrollState);
  const hi = Math.min(lo + 1, states.length - 1);
  return lerp(states[lo], states[hi], t);
}

let _sessionFast = false;
let _savedScrollState = 0;
let _savedDepartmentsRevealed = false;

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function RoyalWorldIntro({
  upcoming,
  news,
  offers,
  logoUrl,
  backgroundImageUrl,
  onScrollDown,
  active,
}: Props) {
  const { isDone, markDone } = usePreloader();
  const [revealed, setRevealed] = useState(false);
  const [logoVisible, setLogoVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const isFast = useRef(false);

  const [scrollState, setScrollState] = useState(
    Math.min(_savedScrollState, 1),
  );
  const [scrollFraction, setScrollFraction] = useState(0);
  const isScrollAnimating = useRef(false);
  const scrollDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [departmentsRevealed, setDepartmentsRevealed] = useState(
    _savedDepartmentsRevealed,
  );
  const [activeDepIndex, setActiveDepIndex] = useState(0);
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null);
  const [popupPile, setPopupPile] = useState<{
    cards: ContentCard[];
    label: string;
  } | null>(null);

  const [showExplore, setShowExplore] = useState(
    _savedScrollState >= 1 && !_savedDepartmentsRevealed,
  );
  const [exploreClicked, setExploreClicked] = useState(false);
  const [exploreHovered, setExploreHovered] = useState(false);

  // Preloader
  useEffect(() => {
    setMounted(true);
    if (isDone || _sessionFast) {
      isFast.current = true;
      setLogoVisible(false);
      setRevealed(true);
      return;
    }
    const MIN_DURATION = 2000;
    const MAX_TIMEOUT = 5000;
    const startTime = Date.now();
    const preloadOne = (url: string): Promise<void> =>
      new Promise((resolve) => {
        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(url);
        if (isVideo) {
          const v = document.createElement("video");
          v.preload = "metadata";
          v.onloadedmetadata = () => resolve();
          v.onerror = () => resolve();
          v.src = url;
        } else {
          const img = document.createElement("img") as HTMLImageElement;
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        }
      });
    const finish = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_DURATION - elapsed);
      setTimeout(() => {
        _sessionFast = true;
        setLogoVisible(false);
        setTimeout(() => {
          setRevealed(true);
          markDone();
        }, 650);
      }, remaining);
    };
    const timeoutId = setTimeout(finish, MAX_TIMEOUT);
    const allMediaUrls = [
      ...upcoming.flatMap((c) =>
        [...c.mediaUrls, ...c.videoUrls, c.thumbnailUrl].filter(Boolean),
      ),
      ...news.flatMap((c) =>
        [...c.mediaUrls, ...c.videoUrls, c.thumbnailUrl].filter(Boolean),
      ),
      ...offers.flatMap((c) =>
        [...c.mediaUrls, ...c.videoUrls, c.thumbnailUrl].filter(Boolean),
      ),
    ] as string[];
    const loadAll =
      allMediaUrls.length > 0
        ? Promise.all(allMediaUrls.map(preloadOne))
        : Promise.resolve();
    loadAll.then(() => {
      clearTimeout(timeoutId);
      finish();
    });
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll / key handler
  const advanceScroll = useCallback(
    (direction: 1 | -1) => {
      if (isScrollAnimating.current) return;
      setScrollState((prev) => {
        const next = prev + direction;
        if (prev === 1 && direction === 1) {
          onScrollDown?.();
          return prev;
        }
        if (next < 0) return prev;
        if (next > 1) return prev;
        isScrollAnimating.current = true;
        setScrollFraction(0);
        if (next === 1) setTimeout(() => setShowExplore(true), 600);
        if (next < 1) {
          setShowExplore(false);
          setDepartmentsRevealed(false);
          setExploreClicked(false);
          _savedDepartmentsRevealed = false;
        }
        _savedScrollState = next;
        if (scrollDebounce.current) clearTimeout(scrollDebounce.current);
        scrollDebounce.current = setTimeout(() => {
          isScrollAnimating.current = false;
        }, 700);
        return next;
      });
    },
    [onScrollDown],
  );

  useEffect(() => {
    if (!revealed || !active) return;
    const onWheel = (e: WheelEvent) => {
      if (popupPile) return;
      if (e.deltaY > 30) advanceScroll(1);
      else if (e.deltaY < -30) advanceScroll(-1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (popupPile) return;
      if (["ArrowDown", " ", "PageDown"].includes(e.key)) advanceScroll(1);
      if (["ArrowUp", "PageUp"].includes(e.key)) advanceScroll(-1);
    };
    window.addEventListener("wheel", onWheel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [revealed, advanceScroll, popupPile]);

  // Derived animation values
  const scale = getInterpolated(STATE_SCALES, scrollState, scrollFraction);
  const contentOpacity = getInterpolated(
    STATE_CONTENT_OPACITY,
    scrollState,
    scrollFraction,
  );
  const TITLE_SIZES = [14, 30];
  const titleSize = getInterpolated(TITLE_SIZES, scrollState, scrollFraction);
  const mini = scrollState >= 1;

  const TARGET_LABEL = 0.72;
  const TARGET_BUTTON = 0.65;
  const labelCounterScale = mini && scale > 0 ? TARGET_LABEL / scale : 1;
  const buttonCounterScale = mini && scale > 0 ? TARGET_BUTTON / scale : 1;

  const translateYStates = [0, -16];
  const cardTranslateY = getInterpolated(
    translateYStates,
    scrollState,
    scrollFraction,
  );

  const upcomingCards =
    upcoming.length > 0
      ? upcoming
      : [emptyCard("empty-u", "No upcoming events yet")];
  const newsCards =
    news.length > 0 ? news : [emptyCard("empty-n", "No news yet")];
  const offersCards =
    offers.length > 0
      ? offers
      : [emptyCard("empty-o", "No offers at the moment")];

  const pileConfigs = [
    {
      cards: upcomingCards,
      label: "/images/royalWorld/upcomings.png",
      delay: 0,
    },
    { cards: newsCards, label: "/images/royalWorld/news.png", delay: 160 },
    { cards: offersCards, label: "/images/royalWorld/offers.png", delay: 320 },
  ];

  // ── Desktop return ───────────────────────────────────────────────────────
  return (
    <>
      {popupPile &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <MiniPilePopup
            cards={popupPile.cards}
            label={popupPile.label}
            onClose={() => setPopupPile(null)}
          />,
          document.body,
        )}

      <style>{`
        @keyframes ra-reveal-up {
          0%   { clip-path: inset(100% 0% 0% 0%); opacity: 0.15; }
          10%  { opacity: 1; }
          100% { clip-path: inset(0% 0% 0% 0%);   opacity: 1; }
        }
        @keyframes ra-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ra-exit-up {
          0%   { transform: translateY(0px) scale(1) rotate(0deg); opacity: 1; }
          15%  { transform: translateY(-8px) scale(1.03) rotate(2deg); opacity: 1; }
          55%  { transform: translateY(-115%) scale(0.92) rotate(6deg); opacity: 0.3; }
          56%  { transform: translateY(-115%) scale(0.82) rotate(0deg); opacity: 0; }
          75%  { transform: translateY(20px) scale(0.88) rotate(-1.5deg); opacity: 0; }
          100% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 0; }
        }
        @keyframes ra-enter-from-back {
          0%   { transform: translateY(0px) scale(.97) rotate(0deg); opacity: 0; }
          15%  { transform: translateY(-8px) scale(1) rotate(-2deg); opacity: 0; }
          55%  { transform: translateY(-115%) scale(1.08) rotate(-6deg); opacity: 0.3; }
          56%  { transform: translateY(-115%) scale(1.12) rotate(0deg); opacity: 1; }
          75%  { transform: translateY(20px) scale(1.16) rotate(-1.5deg); opacity: 1; }
          100% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes continuousSpin {
          from { transform: rotateY(0deg); }
          to   { transform: rotateY(360deg); }
        }
        @keyframes exploreOurClassesPulse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(5px); }
        }
        .subclass-scroll::-webkit-scrollbar { width: 3px; }
        .subclass-scroll::-webkit-scrollbar-track { background: rgba(30,12,4,0.35); border-radius: 2px; }
        .subclass-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(255,215,120,0.2), rgba(196,155,80,0.7), rgba(255,215,120,0.2));
          border-radius: 2px;
        }
      `}</style>

      <section
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0e0d0b",
        }}
      >
        {/* Background */}
        {mounted && backgroundImageUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 1,
            }}
          />
        )}

        {/* Preloader */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#111",
            opacity: logoVisible ? 1 : 0,
            pointerEvents: logoVisible ? "auto" : "none",
            transition: "opacity 0.65s ease",
          }}
        />

        {/* Stage overlay + desktop departments */}
        {mounted && revealed && (
          <StageOverlay
            activeIndex={activeDepIndex}
            overlayVisible={mini || departmentsRevealed}
            spotlightVisible={departmentsRevealed}
          />
        )}
        {mounted && revealed && departmentsRevealed && (
          <DesktopDepartments
            activeIndex={activeDepIndex}
            onHover={setActiveDepIndex}
            revealed={departmentsRevealed}
          />
        )}

        {/* Cards area */}
        {mounted && revealed && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: departmentsRevealed ? 8 : 8,
              pointerEvents: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                transform: `translateY(${cardTranslateY}vh) scale(${scale})`,
                transition: "transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)",
                transformOrigin: "center center",
                willChange: "transform",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: mini ? 220 : 120,
                  padding: "32px 48px 40px",
                  boxSizing: "border-box",
                  animation: "ra-fadein 0.5s ease both",
                  transition: "gap 0.65s cubic-bezier(0.22, 1, 0.36, 1)",
                  minHeight: CARD_H + 220,
                }}
              >
                {pileConfigs.map(({ cards, label, delay }) => (
                  <div
                    key={label}
                    style={{
                      zIndex: draggingLabel === label ? 100 : 1,
                      position: "relative",
                    }}
                  >
                    <CardPile
                      cards={cards}
                      label={label}
                      revealDelay={delay}
                      contentOpacity={contentOpacity}
                      mini={mini}
                      titleSize={titleSize}
                      labelCounterScale={labelCounterScale}
                      buttonCounterScale={buttonCounterScale}
                      onDragStart={() => !mini && setDraggingLabel(label)}
                      onDragEnd={() => setDraggingLabel(null)}
                      onMiniClick={() => setPopupPile({ cards, label })}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Explore button */}
        {mounted && revealed && showExplore && !departmentsRevealed && (
          <div
            onClick={() => {
              if (exploreClicked) return;
              setExploreClicked(true);
              setTimeout(() => {
                setDepartmentsRevealed(true);
                _savedDepartmentsRevealed = true;
              }, 400);
            }}
            onMouseEnter={() => setExploreHovered(true)}
            onMouseLeave={() => setExploreHovered(false)}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 20,
              cursor: "pointer",
              opacity: exploreClicked ? 0 : 1,
              transition: "opacity 0.6s cubic-bezier(0.4,0,0.2,1)",
              background: exploreHovered
                ? "linear-gradient(to top, rgba(6,3,1,0.50) 0%, rgba(10,5,2,0.40) 20%, transparent 60%)"
                : "linear-gradient(to top, rgba(4,2,1,0.40) 0%, rgba(8,4,1,0.30) 20%, transparent 60%)",
              paddingTop: 60,
              paddingBottom: 52,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              animation: "ra-fadein 0.7s ease both",
            }}
          >
            <div
              style={{
                width: exploreHovered ? "65%" : "22%",
                height: 2,
                background:
                  "linear-gradient(to right, transparent, rgba(196,168,120,0.6), transparent)",
                transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)",
                marginBottom: 2,
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-text)",
                fontSize: "1.2rem",
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "rgba(222,194,158,0.9)",
                userSelect: "none",
                filter: exploreHovered ? "brightness(1.2)" : "brightness(1)",
                transition: "color 0.4s ease, filter 0.4s ease",
                animation: "exploreOurClassesPulse 2.4s infinite",
              }}
            >
              Click to Explore our classes
            </div>
          </div>
        )}

        {/* Scroll state dots */}
        {mounted && revealed && !departmentsRevealed && (
          <div
            style={{
              position: "absolute",
              bottom: 22,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 20,
              display: "flex",
              flexDirection: "row",
              gap: 6,
              alignItems: "center",
              opacity: showExplore ? 0 : 1,
              transition: "opacity 0.4s ease",
              pointerEvents: "none",
            }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                style={{
                  width: i === scrollState ? 18 : 5,
                  height: 5,
                  borderRadius: 3,
                  background:
                    i === scrollState
                      ? "rgba(200,169,110,0.9)"
                      : "rgba(200,169,110,0.3)",
                  transition: "width 0.3s ease, background 0.3s ease",
                }}
              />
            ))}
          </div>
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
    </>
  );
}
