"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePreloader } from "@/context/PreloaderContext";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type ContentCard = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  mediaUrls: string[];
  videoUrls: string[];
  thumbnailUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  isExternal: boolean;
  badgeLabel: string | null;
  eventDate?: string | null;
  expireAt?: string | null;
  slug?: string;
};

interface Props {
  upcoming: ContentCard[];
  news: ContentCard[];
  offers: ContentCard[];
  logoUrl?: string;
  backgroundImageUrl?: string;
  onScrollDown?: () => void;
}

// ─────────────────────────────────────────────
// EXPIRY COUNTDOWN
// ─────────────────────────────────────────────

function ExpiryCountdown({ expireAt }: { expireAt: string }) {
  const [label, setLabel] = useState("");

  const compute = useCallback(() => {
    const diff = new Date(expireAt).getTime() - Date.now();
    if (diff <= 0) {
      setLabel("Expired");
      return;
    }
    const totalMins = Math.floor(diff / 60000);
    const days = Math.floor(totalMins / 1440);
    const hours = Math.floor((totalMins % 1440) / 60);
    const mins = totalMins % 60;
    if (days > 0) setLabel(`${days}d ${hours}h left`);
    else if (hours > 0) setLabel(`${hours}h ${mins}m left`);
    else setLabel(`${mins}m left`);
  }, [expireAt]);

  useEffect(() => {
    compute();
    const id = setInterval(compute, 30000);
    return () => clearInterval(id);
  }, [compute]);

  if (!label || label === "Expired") return null;

  return (
    <span
      style={{
        fontSize: 11,
        fontFamily: "'Arial', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: "#b45309",
        background: "#fef3c7",
        border: "1px solid #f59e0b",
        padding: "3px 9px",
        borderRadius: 20,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────
// CARD MEDIA PLAYER
// ─────────────────────────────────────────────

function CardMedia({ card }: { card: ContentCard }) {
  const allMedia: { type: "image" | "video"; src: string }[] = [
    ...card.mediaUrls.map((src) => ({ type: "image" as const, src })),
    ...card.videoUrls.map((src) => ({ type: "video" as const, src })),
  ];

  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % allMedia.length);
  }, [allMedia.length]);

  useEffect(() => {
    if (allMedia.length <= 1) return;
    if (allMedia[index].type === "image") {
      timerRef.current = setTimeout(advance, 3200);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, allMedia, advance]);

  if (allMedia.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f5f2ed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "#bbb",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
          }}
        >
          no media
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {allMedia.map((m, i) => (
        <div
          key={m.src}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === index ? 1 : 0,
            transition: "opacity 0.7s ease",
          }}
        >
          {m.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={m.src}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <video
              src={m.src}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onEnded={advance}
            />
          )}
        </div>
      ))}
      {allMedia.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 4,
          }}
        >
          {allMedia.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === index ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === index ? "#fff" : "rgba(255,255,255,0.45)",
                transition: "width 0.3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SINGLE CARD — Portrait layout (top: media, bottom: content)
// ─────────────────────────────────────────────

function Card({ card, isFront }: { card: ContentCard; isFront: boolean }) {
  // Tilt alternates left/right depending on stack position for visual variety
  // const tilts = [0, 1.5, -2, 2.5, -1.5];
  // const offsetsY = [0, -2, -4, -6, -8];
  // const offsetsX = [0, 2, -2, 3, -3];
  // const scaleArr = [1, 0.99, 0.98, 0.97, 0.96];

  // const tilt = tilts[Math.min(stackIndex, tilts.length - 1)];
  // const offY = offsetsY[Math.min(stackIndex, offsetsY.length - 1)];
  // const offX = offsetsX[Math.min(stackIndex, offsetsX.length - 1)];
  // const scale = scaleArr[Math.min(stackIndex, scaleArr.length - 1)];
  // const zIndex = total - stackIndex;
  // const isFront = stackIndex === 0;

  return (
    <div
      className="liquid-glass backdrop-blur-3xl"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 16,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: "1px 2px 0px rgba(0,0,0,0.2)",
        pointerEvents: isFront ? "auto" : "none",
      }}
    >
      {/* Top: media — 48% of card height */}
      <div
        style={{
          width: "100%",
          height: "48%",
          flexShrink: 0,
          borderBottom: "2px solid #111",
          overflow: "hidden",
        }}
      >
        <CardMedia card={card} />
      </div>

      {/* Bottom: content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "12px 14px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Image
          src="/images/logo/Logo-gray-cropped.png"
          alt="Royal Academy"
          width={40}
          height={40}
          className="absolute top-0 right-0"
          priority
        />

        {/* Badge */}
        {card.badgeLabel && (
          <span
            style={{
              alignSelf: "flex-start",
              fontSize: 9,
              fontFamily: "'Arial', sans-serif",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "#111",
              color: "#fff",
              padding: "2px 7px",
              borderRadius: 20,
              marginBottom: 6,
            }}
          >
            {card.badgeLabel}
          </span>
        )}

        {/* Title */}
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.25,
            color: "#111",
            margin: "0 0 4px",
            fontFamily: "'Georgia', serif",
            paddingRight: 28,
          }}
        >
          {card.title}
        </h3>

        {/* Subtitle */}
        {card.subtitle && (
          <p
            style={{
              fontSize: 11,
              color: "#555",
              margin: "0 0 5px",
              fontStyle: "italic",
              lineHeight: 1.4,
              fontFamily: "'Georgia', serif",
            }}
          >
            {card.subtitle}
          </p>
        )}

        {/* Event date */}
        {card.eventDate && (
          <p
            style={{
              fontSize: 10,
              color: "#888",
              margin: "0 0 5px",
              fontFamily: "'Arial', sans-serif",
              letterSpacing: "0.03em",
            }}
          >
            {new Date(card.eventDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {/* Description */}
        {card.description && (
          <p
            style={
              {
                fontSize: 11,
                color: "#444",
                lineHeight: 1.55,
                margin: 0,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                fontFamily: "'Georgia', serif",
              } as React.CSSProperties
            }
          >
            {card.description}
          </p>
        )}

        <div style={{ flex: 1 }} />

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid #e8e8e8",
            flexWrap: "wrap",
          }}
        >
          <div>
            {card.expireAt ? (
              <ExpiryCountdown expireAt={card.expireAt} />
            ) : (
              <span style={{ display: "block", height: 20 }} />
            )}
          </div>

          {card.linkUrl && (
            <a
              href={card.linkUrl}
              target={card.isExternal ? "_blank" : "_self"}
              rel="noopener noreferrer"
              style={{
                fontSize: 10,
                fontFamily: "'Arial', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#111",
                textDecoration: "none",
                border: "1.5px solid #111",
                padding: "3px 10px",
                borderRadius: 20,
                transition: "background 0.2s, color 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "#111";
                (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLAnchorElement).style.color = "#111";
              }}
            >
              {card.linkLabel ?? "See more"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CARD PILE — portrait, label sits below, nav dots horizontal
// Animation: bottom → top  (translateY instead of translateX)
// ─────────────────────────────────────────────

const CARD_W = 380; // portrait width
const CARD_H = 600; // portrait height — taller than wide

function CardPile({
  cards,
  label,
  revealDelay,
  onDragStart,
  onDragEnd,
}: {
  cards: ContentCard[];
  label: string;
  revealDelay: number;
  onDragStart?: () => void;
  onDragEnd?: () => void;
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

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const currentDragRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isAnimatingRef = useRef(false); // ← ref mirror so closures always see current value
  const pileRef = useRef<HTMLDivElement | null>(null);
  const [undoTargetIndex, setUndoTargetIndex] = useState<number | null>(null);
  const frontIndexRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  useEffect(() => {
    const t = setTimeout(() => setEntryDone(true), revealDelay + 900);
    return () => clearTimeout(t);
  }, [revealDelay]);

  const commitNext = useCallback(
    (currentIndex: number) => {
      const next = (currentIndex + 1) % cards.length;
      setHistory((h) => [...h, currentIndex]);
      setFrontIndex(next);
    },
    [cards.length],
  );

  // Button-triggered next — keyframe exit animation
  const next = useCallback(() => {
    if (isAnimatingRef.current || cards.length <= 1) return;
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
  }, [cards.length, commitNext, frontIndex]);

  // Drag-triggered — fly from release position back to pile center
  const flyToPile = useCallback(() => {
    if (isAnimatingRef.current || cards.length <= 1) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);

    const fromX = currentDragRef.current.x;
    const fromY = currentDragRef.current.y;

    // Step 1: switch from drag mode to fly mode at the EXACT same position
    // isDragging→false, isFlying→true, flyOffset starts at fromX/fromY
    // All in one React batch so there's zero visual jump
    setIsDragging(false);
    isDraggingRef.current = false;
    setFlyOffset({ x: fromX, y: fromY });
    setIsFlying(true);

    // Step 2: one rAF later, update flyOffset to {0,0}
    // The CSS transition on the card sees the change and animates smoothly
    requestAnimationFrame(() => {
      setFlyOffset({ x: 0, y: 0 });
    });

    setTimeout(() => {
      setIsFlying(false);
      setDragX(0);
      setDragY(0);
      onDragEnd?.(); // ← restore after fly completes
      commitNext(frontIndex);
      setTimeout(() => {
        isAnimatingRef.current = false;
        setIsAnimating(false);
      }, 100);
    }, 450);
  }, [cards.length, commitNext, onDragEnd, frontIndex]);

  const undo = useCallback(() => {
    if (isAnimatingRef.current || history.length === 0) return;
    isAnimatingRef.current = true;
    setIsAnimating(true);

    const prev = history[history.length - 1];
    setUndoTargetIndex(prev); // ← mark exactly which card should animate in
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
  }, [history]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (isAnimatingRef.current || cards.length <= 1) return;
    e.preventDefault();
    onDragStart?.(); // ← lift this column
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

      let releasedOutside = false;
      if (pileRef.current) {
        const rect = pileRef.current.getBoundingClientRect();
        releasedOutside =
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom;
      }

      isDraggingRef.current = false;
      dragStartRef.current = null;
      onDragEnd?.(); // ← restore column z-index

      if (distance > 350) {
        flyToPile();
      } else {
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
  }, [flyToPile]); // ← only flyToPile needed now

  const ordered = Array.from(
    { length: Math.min(cards.length, 4) },
    (_, i) => cards[(frontIndex + i) % cards.length],
  );

  const dragRotation = dragX * 0.04;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transform: entryDone ? "translateY(0)" : "translateY(180%)",
        transition: `transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)`,
        transitionDelay: `${revealDelay}ms`,
      }}
    >
      <div
        ref={pileRef}
        style={{
          position: "relative",
          width: CARD_W,
          height: CARD_H,
          cursor: isDragging
            ? "grabbing"
            : cards.length > 1
              ? "grab"
              : "default",
          userSelect: "none",
          zIndex: isDragging || isFlying ? 1000 : "auto", // ← elevate the whole pile
          isolation: isDragging || isFlying ? "isolate" : "auto",
        }}
        onPointerDown={onPointerDown}
        // NO onPointerMove or onPointerUp here — they're on window now
      >
        {ordered.map((card, stackIndex) => {
          const isFront = stackIndex === 0;

          const tilts = [0, 1.5, -2, 2.5, -1.5];
          const offsetsY = [0, -2, -4, -6, -8];
          const offsetsX = [0, 2, -2, 3, -3];
          const scaleArr = [1, 0.99, 0.98, 0.97, 0.96];

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
                transformOrigin: "center top",

                transform: (() => {
                  if (isFront && isFlying) {
                    return `translateX(${flyOffset.x}px) translateY(${flyOffset.y}px) rotate(${flyOffset.x * 0.02}deg)`;
                  }
                  if (isFront && isDragging) {
                    return `translateX(${dragX}px) translateY(${dragY}px) rotate(${dragRotation}deg)`;
                  }
                  // Default stack position
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
              <Card card={card} isFront={isFront} />
            </div>
          );
        })}
      </div>
      {/* Label + controls — identical to before */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          opacity: entryDone ? 1 : 0,
          transition: "opacity 0.5s ease",
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
            }}
          >
            <button
              className="liquid-glass-gold "
              onClick={undo}
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
                  if (i !== frontIndex && !isAnimating) {
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
                  cursor: "pointer",
                }}
              />
            ))}
            <button
              className="liquid-glass-gold"
              onClick={next}
              disabled={isAnimating}
              style={{
                marginLeft: 2,
                width: 56,
                height: 56,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#c8a96e",
                transition: "background 0.2s",
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
// EMPTY FALLBACK
// ─────────────────────────────────────────────

function emptyCard(id: string, message: string): ContentCard {
  return {
    id,
    title: message,
    subtitle: null,
    description: null,
    mediaUrls: [],
    videoUrls: [],
    thumbnailUrl: null,
    linkUrl: null,
    linkLabel: null,
    isExternal: false,
    badgeLabel: null,
    expireAt: null,
  };
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

let _sessionFast = false;

export default function RoyalWorld({
  upcoming,
  news,
  offers,
  logoUrl,
  backgroundImageUrl,
  onScrollDown,
}: Props) {
  const { isDone, markDone } = usePreloader();
  const [revealed, setRevealed] = useState(false);
  const [logoVisible, setLogoVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const isFast = useRef(false);
  const [draggingLabel, setDraggingLabel] = useState<string | null>(null);

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

  // Scroll handoff
  useEffect(() => {
    if (!revealed || !onScrollDown) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY > 30) onScrollDown();
    };
    window.addEventListener("wheel", onWheel);
    return () => window.removeEventListener("wheel", onWheel);
  }, [revealed, onScrollDown]);

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

  return (
    <>
      <style>{`
        @keyframes ra-reveal-up {
          0%   { clip-path: inset(100% 0% 0% 0%); opacity: 0.15; }
          10%  { opacity: 1; }
          100% { clip-path: inset(0% 0% 0% 0%);   opacity: 1;    }
        }
        @keyframes ra-fadein {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        /* Card exit: fly upward then snap back from top */
        @keyframes ra-exit-up {
  0%   { 
    transform: translateY(0px)    scale(1)    rotate(0deg); 
    opacity: 1;
  }
  15%  { 
    transform: translateY(-8px)   scale(1.03) rotate(2deg); 
    opacity: 1;
  }
  55%  { 
    transform: translateY(-115%)  scale(0.92) rotate(6deg); 
    opacity: 0.3;
  }
  56%  { 
    transform: translateY(-115%)  scale(0.82) rotate(0deg); 
    opacity: 0;
  }
  75%  {
    transform: translateY(20px)   scale(0.88) rotate(-1.5deg);
    opacity: 0;
  }
  100% { 
    transform: translateY(0px)    scale(1)    rotate(0deg); 
    opacity: 0;
  }
}
        @keyframes ra-float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-6px); }
        }

@keyframes ra-enter-from-back {
  0%   { 
    transform: translateY(0px)    scale(.97)    rotate(0deg); 
    opacity: 0;
  }
  15%  { 
    transform: translateY(-8px)   scale(1) rotate(-2deg); 
    opacity: 0;
  }
  55%  { 
    transform: translateY(-115%)  scale(1.08) rotate(-6deg); 
    opacity: 0.3;
  }
  56%  { 
    transform: translateY(-115%)  scale(1.12) rotate(0deg); 
    opacity: 1;
  }
  75%  {
    transform: translateY(20px)   scale(1.16) rotate(-1.5deg);
    opacity: 1;
  }
  100% { 
    transform: translateY(0px)    scale(1)    rotate(0deg); 
    opacity: 1;
  }
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

        {/* LOGO PRELOADER */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0e0d0b",
            opacity: logoVisible ? 1 : 0,
            pointerEvents: logoVisible ? "auto" : "none",
            transition: "opacity 0.65s ease",
          }}
        >
          <Image
            src="/images/rooms/second-room.png"
            alt="Royal Academy"
            width={320}
            height={200}
            priority
            style={{
              animation: `ra-reveal-up 1.6s cubic-bezier(0.22, 1, 0.36, 1) both`,
            }}
          />
        </div>

        {/* CARDS — three columns side by side */}
        {mounted && revealed && (
          <div
            style={{
              display: "flex",
              flexDirection: "row", // ← horizontal layout
              justifyContent: "center",
              alignItems: "flex-end", // ← align piles at bottom so labels line up
              gap: 120,
              width: "100%",
              height: "100%",
              padding: "32px 48px 40px",
              boxSizing: "border-box",
              overflow: "hidden",
              animation: "ra-fadein 0.5s ease both",
            }}
          >
            {[
              {
                cards: upcomingCards,
                label: "/images/royalWorld/upcomings.png",
                delay: 0,
              },
              {
                cards: newsCards,
                label: "/images/royalWorld/news.png",
                delay: 160,
              },
              {
                cards: offersCards,
                label: "/images/royalWorld/offers.png",
                delay: 320,
              },
            ].map(({ cards, label, delay }) => (
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
                  onDragStart={() => setDraggingLabel(label)}
                  onDragEnd={() => setDraggingLabel(null)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
