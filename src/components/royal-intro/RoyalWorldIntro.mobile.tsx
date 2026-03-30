"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import AboutSection from "@/components/AboutSection";
import { usePreloader } from "@/context/PreloaderContext";
import { ContentCard, SECTIONS, emptyCard } from "./RoyalWorldIntro.types";
import {
  Card,
  MiniPilePopup,
  SymbolCard,
  Subclasses,
} from "./RoyalWorldIntro.shared";
import { useLocale } from "next-intl";

// ─────────────────────────────────────────────
// MOBILE CARD CAROUSEL
// ─────────────────────────────────────────────

const MOBILE_CARD_W = 260;
const MOBILE_CARD_H = 400;
const CAROUSEL_GAP = 16;
const PEEK = 32;

function MobileCardCarousel({
  pileConfigs,
  onPileClick,
}: {
  pileConfigs: { cards: ContentCard[]; label: string }[];
  onPileClick: (cards: ContentCard[], label: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(pileConfigs.length - 1, index)));
      setDragOffset(0);
    },
    [pileConfigs.length],
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (!isDraggingRef.current && Math.abs(dy) > Math.abs(dx) + 8) return;
    isDraggingRef.current = true;
    setDragOffset(dx);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    if (dragOffset < -60) goTo(activeIndex + 1);
    else if (dragOffset > 60) goTo(activeIndex - 1);
    else setDragOffset(0);
    isDraggingRef.current = false;
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 100,
        paddingBottom: 8,
      }}
    >
      <div
        style={{ width: "100%", overflow: "hidden", position: "relative" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: CAROUSEL_GAP,
            transform: `translateX(calc(40vw - ${MOBILE_CARD_W / 2}px - ${activeIndex * (MOBILE_CARD_W + CAROUSEL_GAP)}px + ${dragOffset}px))`,
            transition: isDraggingRef.current
              ? "none"
              : "transform 0.42s cubic-bezier(0.22,1,0.36,1)",
            willChange: "transform",
            paddingLeft: PEEK,
            paddingRight: PEEK,
          }}
        >
          {pileConfigs.map(({ cards, label }, i) => {
            const isActive = i === activeIndex;
            const dist = Math.abs(i - activeIndex);
            return (
              <div
                key={label}
                onClick={() => (isActive ? onPileClick(cards, label) : goTo(i))}
                style={{
                  flexShrink: 0,
                  width: MOBILE_CARD_W,
                  display: "flex", // ← change: flex column wrapper
                  flexDirection: "column", // ← change
                  alignItems: "center", // ← change
                  transform: isActive
                    ? "scale(1)"
                    : dist === 1
                      ? "scale(0.92)"
                      : "scale(0.84)",
                  opacity: isActive ? 1 : dist === 1 ? 0.55 : 0.3,
                  transition:
                    "transform 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.42s ease",
                  transformOrigin: "center top", // ← change: scale from top so label stays aligned
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: MOBILE_CARD_H,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      transform: "rotate(3deg) translateY(6px)",
                      borderRadius: 16,
                      background: "rgba(0,0,0,0.08)",
                      zIndex: 0,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      transform: "rotate(-2deg) translateY(4px)",
                      borderRadius: 16,
                      background: "rgba(0,0,0,0.06)",
                      zIndex: 0,
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <Card
                      card={cards[0]}
                      isFront={true}
                      contentOpacity={1}
                      titleSize={14}
                      brighten
                    />
                  </div>
                  {isActive && cards.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        background: "rgba(0,0,0,0.55)",
                        color: "#c8a96e",
                        fontSize: 9,
                        fontFamily: "'Arial', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "3px 8px",
                        borderRadius: 20,
                        pointerEvents: "none",
                      }}
                    >
                      Tap to browse
                    </div>
                  )}
                </div>
                <Image
                  src={label}
                  alt=""
                  width={120}
                  height={120}
                  style={{ objectFit: "contain", marginTop: 8 }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 6,
          alignItems: "center",
          marginTop: 4,
        }}
      >
        {pileConfigs.map((_, i) => (
          <div
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === activeIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background:
                i === activeIndex
                  ? "rgba(200,169,110,0.9)"
                  : "rgba(200,169,110,0.3)",
              transition: "width 0.3s ease, background 0.3s ease",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      <p
        style={{
          marginTop: 8,
          fontSize: 10,
          fontFamily: "'Arial', sans-serif",
          letterSpacing: "0.08em",
          color: "rgba(200,169,110,0.5)",
          textTransform: "uppercase",
        }}
      >
        Swipe to browse · Tap to explore
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOBILE DEPARTMENTS ACCORDION
// ─────────────────────────────────────────────

function MobileDepartmentsAccordion() {
  const [activeDep, setActiveDep] = useState(-1);

  return (
    <section style={{ width: "100%" }}>
      <div
        style={{
          padding: "16px 24px 8px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 1,
            background:
              "linear-gradient(to right, rgba(196,168,120,0.4), transparent)",
          }}
        />
        <span
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "0.65rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(200,169,110,0.65)",
            whiteSpace: "nowrap",
          }}
        >
          Our Classes
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background:
              "linear-gradient(to left, rgba(196,168,120,0.4), transparent)",
          }}
        />
      </div>

      <div
        style={{ width: "100%", borderTop: "1px solid rgba(196,168,130,0.22)" }}
      >
        {SECTIONS.map((section, i) => {
          const isActive = i === activeDep;
          return (
            <div
              key={section.id}
              onClick={() => setActiveDep(isActive ? -1 : i)}
              style={{
                position: "relative",
                cursor: "pointer",
                overflow: "hidden",
                borderBottom: "1px solid rgba(196,168,130,0.22)",
                maxHeight: isActive ? "420px" : "56px",
                transition: "max-height 0.55s cubic-bezier(0.4,0,0.2,1)",
                background: isActive
                  ? "linear-gradient(to right, rgba(196,140,60,0.06), transparent 70%)"
                  : "transparent",
              }}
            >
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
                      userSelect: "none",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: isActive ? "1.35rem" : "1rem",
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
                    transition: "transform 0.4s ease",
                    display: "inline-block",
                    userSelect: "none",
                  }}
                >
                  ↑
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "0 24px 4px",
                }}
                onClick={(e) => e.stopPropagation()}
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
                    margin: "8px 0 10px",
                    background: isActive
                      ? "linear-gradient(to right, rgba(196,168,120,0.55), transparent)"
                      : "transparent",
                    transition: "background 0.4s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// MOBILE ABOUT WRAPPER
// page flow. active=true always since there are
// no floors — the user simply scrolls to them.
// onScrollUp/Down are no-ops on mobile.
// ─────────────────────────────────────────────

function MobileAboutWrapper({
  pathname,
  locale,
}: {
  pathname: string;
  locale: string;
}) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        style={{
          height: 1,
          margin: "0 24px",
          background:
            "linear-gradient(to right, transparent, rgba(196,168,120,0.4), transparent)",
        }}
      />

      <div style={{ width: "100%" }}>
        <AboutSection
          active={true}
          locale={locale}
          scrollable={true}
          onScrollUp={undefined}
          onScrollDown={undefined}
        />
      </div>
      <div
        style={{
          height: 1,
          margin: "0 24px",
          background:
            "linear-gradient(to right, transparent, rgba(196,168,120,0.4), transparent)",
        }}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// MOBILE HOME PAGE
// Single self-contained scrollable page.
// Owns its own preloader so HomeClient doesn't
// need to pass mounted/revealed/logoVisible.
// ─────────────────────────────────────────────

export interface MobileHomePageProps {
  worldData: {
    upcoming: ContentCard[];
    news: ContentCard[];
    offers: ContentCard[];
  };
  backgroundImageUrl?: string;
  pathname: string;
}

export function MobileHomePage({
  worldData,
  backgroundImageUrl,
  pathname,
}: MobileHomePageProps) {
  const { isDone, markDone } = usePreloader();
  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [logoVisible, setLogoVisible] = useState(true);
  const [popupPile, setPopupPile] = useState<{
    cards: ContentCard[];
    label: string;
  } | null>(null);
  const locale = useLocale();

  // ── Preloader ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    if (isDone) {
      setLogoVisible(false);
      setRevealed(true);
      return;
    }
    const MIN_DURATION = 1500;
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
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        }
      });

    const finish = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_DURATION - elapsed);
      setTimeout(() => {
        setLogoVisible(false);
        setTimeout(() => {
          setRevealed(true);
          markDone();
        }, 650);
      }, remaining);
    };

    const timeoutId = setTimeout(finish, MAX_TIMEOUT);
    const allUrls = [
      ...worldData.upcoming.flatMap((c) =>
        [...c.mediaUrls, ...c.videoUrls, c.thumbnailUrl].filter(Boolean),
      ),
      ...worldData.news.flatMap((c) =>
        [...c.mediaUrls, ...c.videoUrls, c.thumbnailUrl].filter(Boolean),
      ),
      ...worldData.offers.flatMap((c) =>
        [...c.mediaUrls, ...c.videoUrls, c.thumbnailUrl].filter(Boolean),
      ),
    ] as string[];

    const loadAll =
      allUrls.length > 0
        ? Promise.all(allUrls.map(preloadOne))
        : Promise.resolve();
    loadAll.then(() => {
      clearTimeout(timeoutId);
      finish();
    });
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pile configs ──────────────────────────────────────────────────────────
  const upcomingCards =
    worldData.upcoming.length > 0
      ? worldData.upcoming
      : [emptyCard("empty-u", "No upcoming events yet")];
  const newsCards =
    worldData.news.length > 0
      ? worldData.news
      : [emptyCard("empty-n", "No news yet")];
  const offersCards =
    worldData.offers.length > 0
      ? worldData.offers
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

  return (
    <>
      {/* Popup portal */}
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
        .subclass-scroll::-webkit-scrollbar { width: 3px; }
        .subclass-scroll::-webkit-scrollbar-track { background: rgba(30,12,4,0.35); border-radius: 2px; }
        .subclass-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgba(255,215,120,0.2), rgba(196,155,80,0.7), rgba(255,215,120,0.2));
          border-radius: 2px;
        }
      `}</style>

      {/* ── Scrollable page root ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          background: "#0e0d0b",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        {/* Fixed background */}
        {mounted && backgroundImageUrl && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundImage: `url(${backgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.45,
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Preloader overlay */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            background: "#111",
            opacity: logoVisible ? 1 : 0,
            pointerEvents: logoVisible ? "auto" : "none",
            transition: "opacity 0.65s ease",
          }}
        />

        {/* Content */}
        {mounted && revealed && (
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              paddingBottom: 40,
              animation: "ra-fadein 0.5s ease both",
            }}
          >
            {/* 1 ── Cards + logo */}
            <section style={{ width: "100%", paddingTop: 12 }}>
              <MobileCardCarousel
                pileConfigs={pileConfigs}
                onPileClick={(cards, label) => setPopupPile({ cards, label })}
              />
            </section>

            {/* Gold divider */}
            <div
              style={{
                height: 1,
                margin: "8px 24px",
                background:
                  "linear-gradient(to right, transparent, rgba(196,168,120,0.5), transparent)",
              }}
            />

            {/* 2 ── Departments accordion */}
            <MobileDepartmentsAccordion />

            {/* 3 ── About + Parallax */}
            <MobileAboutWrapper pathname={pathname} locale={locale} />
          </div>
        )}
      </div>
    </>
  );
}
