"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ContentCard, Section } from "./RoyalWorldIntro.types";

// ─────────────────────────────────────────────
// EXPIRY COUNTDOWN
// ─────────────────────────────────────────────

export function ExpiryCountdown({ expireAt }: { expireAt: string }) {
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

export function CardMedia({ card }: { card: ContentCard }) {
  const allMedia: { type: "image" | "video"; src: string }[] = [
    ...card.videoUrls.map((src) => ({ type: "video" as const, src })),
    ...card.mediaUrls.map((src) => ({ type: "image" as const, src })),
  ];

  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % allMedia.length);
  }, [allMedia.length]);

  useEffect(() => {
    if (allMedia.length <= 1) return;
    if (allMedia[index].type === "image") {
      timerRef.current = setTimeout(advance, 5000);
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
              loop={allMedia.length === 1}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onEnded={allMedia.length > 1 ? advance : undefined}
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
// CARD
// ─────────────────────────────────────────────

export function Card({
  card,
  isFront,
  contentOpacity = 1,
  titleSize = 14,
  brighten = false,
}: {
  card: ContentCard;
  isFront: boolean;
  contentOpacity?: number;
  titleSize?: number;
  brighten?: boolean;
}) {
  const isMini = contentOpacity === 0;
  const EASE = "cubic-bezier(0.4,0,0.2,1)";

  return (
    <div
      className="liquid-glass backdrop-blur-3xl"
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 16,
        overflow: "hidden",
        background: brighten ? "rgba(255, 255, 255, 0.7)" : undefined,
        display: "flex",
        flexDirection: "column",
        boxShadow: "1px 2px 0px rgba(0,0,0,0.2)",
        pointerEvents: isFront ? "auto" : "none",
      }}
    >
      <div
        style={{
          width: "100%",
          height: isMini ? "70%" : "48%",
          flexShrink: 0,
          borderBottom: "2px solid #111",
          overflow: "hidden",
          transition: `height 0.5s ${EASE}`,
        }}
      >
        <CardMedia card={card} />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
          padding: isMini ? "6px 8px" : "12px 14px",
          transition: `padding 0.5s ${EASE}`,
        }}
      >
        {/* RA logo */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            opacity: contentOpacity,
            transition: `opacity 0.35s ease`,
            pointerEvents: contentOpacity > 0 ? "auto" : "none",
          }}
        >
          <Image
            src="/images/logo/Logo-gray-cropped.png"
            alt="Royal Academy"
            width={40}
            height={40}
            priority
          />
        </div>

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
              opacity: contentOpacity,
              transition: `opacity 0.3s ease`,
            }}
          >
            {card.badgeLabel}
          </span>
        )}

        {/* Title */}
        <h3
          style={
            {
              fontSize: titleSize,
              textAlign: isMini ? "center" : "left",
              fontWeight: 700,
              lineHeight: 1.3,
              color: "#111",
              margin: isMini ? "auto 0" : "0 0 4px",
              fontFamily: "'Georgia', serif",
              paddingRight: isMini ? 0 : 28,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              transition: `font-size 0.5s ${EASE}, text-align 0.5s ease, padding 0.5s ease, margin 0.5s ease`,
            } as React.CSSProperties
          }
        >
          {card.title}
        </h3>

        {/* Collapsible: subtitle + date + description */}
        <div
          style={{
            opacity: contentOpacity,
            maxHeight: isMini ? "0px" : "220px",
            overflow: "hidden",
            transition: `opacity 0.35s ease, max-height 0.5s ${EASE}`,
          }}
        >
          {card.subtitle && (
            <p
              style={{
                fontSize: 14,
                color: "#111",
                margin: "0 0 5px",
                fontStyle: "italic",
                lineHeight: 1.4,
                fontFamily: "'Georgia', serif",
              }}
            >
              {card.subtitle}
            </p>
          )}
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
          {card.description && (
            <p
              style={
                {
                  fontSize: 12,
                  color: "#111",
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
        </div>

        <div
          style={{ flex: isMini ? 0 : 1, transition: `flex 0.5s ${EASE}` }}
        />

        {/* Footer: expiry + link */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            paddingTop: 8,
            borderTop: "1px solid #e8e8e8",
            flexWrap: "wrap",
            opacity: contentOpacity,
            maxHeight: isMini ? "0px" : "60px",
            overflow: "hidden",
            marginTop: isMini ? 0 : 8,
            transition: `opacity 0.3s ease, max-height 0.5s ${EASE}, margin 0.5s ease`,
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
// MINI PILE POPUP
// ─────────────────────────────────────────────

export function MiniPilePopup({
  cards,
  label,
  onClose,
}: {
  cards: ContentCard[];
  label: string;
  onClose: () => void;
}) {
  const [frontIndex, setFrontIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flyingOut, setFlyingOut] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [undoTargetIndex, setUndoTargetIndex] = useState<number | null>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  const commitNext = useCallback(
    (currentIndex: number) => {
      const next = (currentIndex + 1) % cards.length;
      setHistory((h) => [...h, currentIndex]);
      setFrontIndex(next);
    },
    [cards.length],
  );

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

  const undo = useCallback(() => {
    if (isAnimatingRef.current || history.length === 0) return;
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
  }, [history]);

  const ordered = Array.from(
    { length: Math.min(cards.length, 4) },
    (_, i) => cards[(frontIndex + i) % cards.length],
  );
  const W = 280,
    H = 440;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        animation: "ra-fadein 0.3s ease both",
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            position: "relative",
            width: W,
            height: H,
            userSelect: "none",
          }}
        >
          {ordered.map((card, stackIndex) => {
            const isFront = stackIndex === 0;
            const tilts = [0, 1.5, -2, 2.5, -1.5];
            const offsetsY = [0, -2, -4, -6, -8];
            const offsetsX = [0, 2, -2, 3, -3];
            const scaleArr = [1, 0.99, 0.98, 0.97, 0.96];
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
                  transform: `translateX(${offsetsX[Math.min(stackIndex, 4)]}px) translateY(${offsetsY[Math.min(stackIndex, 4)]}px) rotate(${tilts[Math.min(stackIndex, 4)]}deg) scale(${scaleArr[Math.min(stackIndex, 4)]})`,
                  animation:
                    isFront && flyingOut
                      ? "ra-exit-up 0.9s ease-in-out both"
                      : undoing && card.id === cards[undoTargetIndex ?? -1]?.id
                        ? "ra-enter-from-back 0.9s ease-in-out both"
                        : undefined,
                  transition: isFront
                    ? "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)"
                    : "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
                  zIndex: ordered.length - stackIndex,
                  pointerEvents: isFront ? "auto" : "none",
                }}
              >
                <Card card={card} isFront={isFront} contentOpacity={1} />
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Image
            src={label}
            alt=""
            width={140}
            height={140}
            style={{ objectFit: "contain" }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <button
              className="liquid-glass-gold"
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
                  transition: "width 0.3s ease",
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
          <button
            onClick={onClose}
            style={{
              marginTop: 4,
              fontSize: 11,
              fontFamily: "'Arial', sans-serif",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(200,169,110,0.7)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px 12px",
            }}
          >
            Close ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SYMBOL CARD (spinning department icon)
// ─────────────────────────────────────────────

type SymbolState = "hidden" | "rising" | "spinning" | "falling";

export function SymbolCard({
  section,
  isActive,
  isMobile,
}: {
  section: Section;
  isActive: boolean;
  isMobile: boolean;
}) {
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
          style={{ objectFit: "contain" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SUBCLASS ITEM
// ─────────────────────────────────────────────

const ITEM_HEIGHT = 38;
export const VISIBLE_ITEMS = 3;

export function SubclassItem({
  sub,
}: {
  sub: { label: string; href: string };
}) {
  const [hovered, setHovered] = useState(false);
  const locale = useLocale();

  const href = useMemo(() => {
    const raw = sub.href;
    if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
    if (/^\/[a-z]{2}(\/|$)/i.test(raw)) return raw;
    if (raw.startsWith("/")) return `/${locale}${raw}`;
    return `/${locale}/${raw}`;
  }, [locale, sub.href]);

  return (
    <Link
      href={href}
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
        boxShadow: hovered
          ? "inset 0 1px 0 rgba(255,230,160,0.12), inset 0 -1px 0 rgba(0,0,0,0.28), 0 0 18px rgba(196,155,80,0.07)"
          : "none",
        background: hovered
          ? "linear-gradient(to bottom, rgba(196,155,80,0.18) 0%, rgba(140,100,40,0.12) 100%)"
          : "rgba(20,10,4,0.45)", // dark enough to look frosted without needing backdrop blur
        backdropFilter: "none",
        WebkitBackdropFilter: "none",
        transition:
          "color 0.25s ease, box-shadow 0.3s ease, background 0.3s ease, padding-left 0.3s cubic-bezier(0.4,0,0.2,1)",
        paddingLeft: hovered ? "20px" : "14px",
        overflow: "hidden",
      }}
    >
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
      {sub.label}
    </Link>
  );
}

// ─────────────────────────────────────────────
// SUBCLASSES
// ─────────────────────────────────────────────

export function Subclasses({
  section,
  isActive,
}: {
  section: Section;
  isActive: boolean;
}) {
  const hasMore = section.subclasses.length > VISIBLE_ITEMS;

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (hasMore) e.stopPropagation();
    },
    [hasMore],
  );

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {/* Top fade */}
      {hasMore && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 20,
            background:
              "linear-gradient(to bottom, rgba(18,7,2,0.7), transparent)",
            zIndex: 2,
            pointerEvents: "none",
            opacity: isActive ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        />
      )}

      {/* Bottom fade */}
      {hasMore && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 20,
            background:
              "linear-gradient(to top, rgba(18,7,2,0.7), transparent)",
            zIndex: 2,
            pointerEvents: "none",
            opacity: isActive ? 1 : 0,
            transition: "opacity 0.5s ease",
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
          /* Firefox */
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(196,155,80,0.45) transparent",
          /* Subtle inset border — feels more refined than a full border */
          boxShadow: "inset 0 0 0 1px rgba(196,168,120,0.18)",
          borderRadius: 3,
          paddingTop: 2,
          paddingBottom: 2,
        }}
      >
        {section.subclasses.map((sub, idx) => (
          <div
            key={`${section.id}-${sub.href}-${idx}`}
            style={{
              opacity: isActive ? 1 : 0,
              transform: isActive ? "translateY(0)" : "translateY(5px)",
              transition: `opacity 0.35s ease ${0.06 * idx}s, transform 0.35s ease ${0.06 * idx}s`,
            }}
          >
            <SubclassItem sub={sub} />
          </div>
        ))}
      </div>
    </div>
  );
}
