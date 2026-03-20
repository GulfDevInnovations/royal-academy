"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { PublicGalleryItem } from "@/lib/actions/gallery.public.actions";

interface Props {
  items: PublicGalleryItem[];
  active: boolean;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

interface TimelineMonth {
  label: string;
  shortLabel: string;
  year: string;
  itemIndex: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGE_HEIGHT = 550; // px cap — images render at natural ratio below this
const TRACK_BOTTOM_PAD = 48; // breathing room between images and timeline
const TIMELINE_HEIGHT = 130; // px
const LABEL_HEIGHT = 58; // px below each image
const INDEX_HEIGHT = 22; // px above each image
const ITEM_GAP = 25; // px between items
const HANDOFF_THRESHOLD = 80;
const TIMELINE_PARALLAX = 0.3; // timeline moves at 0.30× track speed
const DAY_TICKS = 15; // tick marks between month labels

const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

function buildTimeline(items: PublicGalleryItem[]): TimelineMonth[] {
  const seen = new Set<string>();
  const result: TimelineMonth[] = [];
  items.forEach((item, idx) => {
    const d = item.takenAt ? new Date(item.takenAt) : null;
    if (!d) return;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        shortLabel: MONTH_NAMES[d.getMonth()],
        year: String(d.getFullYear()),
        itemIndex: idx,
      });
    }
  });
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function GallerySection({
  items,
  active,
  onScrollUp,
  onScrollDown,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const tlInnerRef = useRef<HTMLDivElement>(null);
  const lastScroll = useRef(0);
  const velocity = useRef(0);
  const raf = useRef<number>(0);
  const dragging = useRef(false);
  const dragX0 = useRef(0);
  const dragScroll0 = useRef(0);
  const tlDragging = useRef(false);
  const tlDragX0 = useRef(0);
  const tlScroll0 = useRef(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tilt, setTilt] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const timeline = useMemo(() => buildTimeline(items), [items]);
  const scrollTarget = useRef(0);

  // After your items prop arrives, compute a scale factor per item.
  // You need the natural image dimensions — store them in state as images load.
  const [naturalHeights, setNaturalHeights] = useState<Record<string, number>>(
    {},
  );
  const onImageLoad = useCallback((id: string, naturalHeight: number) => {
    setNaturalHeights((prev) => ({ ...prev, [id]: naturalHeight }));
  }, []);
  // Once you have heights, find the tallest and compute each item's display height:
  const maxNatural = Math.max(...Object.values(naturalHeights), 1);
  const displayHeights = useMemo(() => {
    const result: Record<string, number> = {};
    items.forEach((item) => {
      const natural = naturalHeights[item.id];
      if (!natural) return;
      // Scale proportionally so the tallest image = MAX_IMAGE_HEIGHT
      result[item.id] = Math.round((natural / maxNatural) * MAX_IMAGE_HEIGHT);
    });
    return result;
  }, [naturalHeights, maxNatural, items]);
  // ── Sync timeline to track ───────────────────────────────────────────────
  // Add a ref for the timeline's current rendered position:
  const tlScrollCurrent = useRef(0);
  const syncTimeline = useCallback((left: number, max: number) => {
    const tl = tlInnerRef.current;
    if (!tl) return;
    const tlMax = tl.scrollWidth - tl.clientWidth;
    if (tlMax <= 0) return;
    const target = (left / Math.max(max, 1)) * (tlMax / TIMELINE_PARALLAX);
    // Lerp: move 12% toward target each frame — smooths out jitter
    tlScrollCurrent.current += (target - tlScrollCurrent.current) * 0.12;
    tl.scrollLeft = tlScrollCurrent.current;
  }, []);

  // ── RAF: velocity → tilt + sync ─────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const el = trackRef.current;
      if (el) {
        // Lerp scroll toward target — 0.08 = very smooth, 0.14 = snappier
        const current = el.scrollLeft;
        const target = scrollTarget.current;
        const diff = target - current;

        if (Math.abs(diff) > 0.5) {
          el.scrollLeft = current + diff * 0.09;
        }

        const dx = el.scrollLeft - lastScroll.current;
        lastScroll.current = el.scrollLeft;
        velocity.current = velocity.current * 0.78 + dx * 0.22;
        const clamped = Math.max(-28, Math.min(28, velocity.current));
        setTilt(clamped / 28);
        const max = el.scrollWidth - el.clientWidth;

        // Keep target clamped to valid range
        scrollTarget.current = Math.max(0, Math.min(scrollTarget.current, max));

        setAtStart(el.scrollLeft <= 4);
        setAtEnd(el.scrollLeft >= max - 4);
        syncTimeline(el.scrollLeft, max);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [syncTimeline]);

  // ── Wheel ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const el = trackRef.current;
    if (!el) return;
    const fn = (e: WheelEvent) => {
      if (e.deltaY < -HANDOFF_THRESHOLD && atStart) {
        onScrollUp();
        return;
      }
      if (e.deltaY > HANDOFF_THRESHOLD && atEnd) {
        onScrollDown();
        return;
      }
      e.preventDefault();
      scrollTarget.current += e.deltaY * 1.15; // ← target, not el.scrollLeft
    };
    window.addEventListener("wheel", fn, { passive: false });
    return () => window.removeEventListener("wheel", fn);
  }, [active, atStart, atEnd, onScrollUp, onScrollDown]);

  // ── Keys ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const fn = (e: KeyboardEvent) => {
      const el = trackRef.current;
      if (!el) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        el.scrollLeft += 220;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        el.scrollLeft -= 220;
      }
      if (e.key === "ArrowUp") onScrollUp();
      if (e.key === "ArrowDown") onScrollDown();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [active, onScrollUp, onScrollDown]);

  // ── Track drag ───────────────────────────────────────────────────────────
  const onTrackDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    dragX0.current = e.clientX;
    dragScroll0.current = trackRef.current?.scrollLeft ?? 0;
    scrollTarget.current = dragScroll0.current; // ← sync target to current position
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const onTrackMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = dragX0.current - e.clientX;
    scrollTarget.current = dragScroll0.current + dx;
  }, []);
  const onTrackUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // ── Timeline drag ────────────────────────────────────────────────────────
  const onTlDown = useCallback((e: React.PointerEvent) => {
    tlDragging.current = true;
    tlDragX0.current = e.clientX;
    tlScroll0.current = trackRef.current?.scrollLeft ?? 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const onTlMove = useCallback((e: React.PointerEvent) => {
    if (!tlDragging.current) return;
    const dx = (tlDragX0.current - e.clientX) / TIMELINE_PARALLAX;
    scrollTarget.current = tlScroll0.current + dx; // ← target, not el.scrollLeft
  }, []);
  const onTlUp = useCallback(() => {
    tlDragging.current = false;
  }, []);

  // ── Jump to month ────────────────────────────────────────────────────────
  const jumpToMonth = useCallback((idx: number) => {
    scrollTarget.current = idx * (MAX_IMAGE_HEIGHT * 0.7 + ITEM_GAP);
  }, []);

  if (items.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#e4d0b5",
        }}
      >
        <p
          style={{
            color: "rgba(255,255,255,0.18)",
            fontSize: 12,
            letterSpacing: "0.12em",
          }}
        >
          NO GALLERY ITEMS YET
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#e4d0b5",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Image track ── */}
      <div
        ref={trackRef}
        onPointerDown={onTrackDown}
        onPointerMove={onTrackMove}
        onPointerUp={onTrackUp}
        onPointerCancel={onTrackUp}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center", // vertically center all items in the row
          gap: `${ITEM_GAP}px`,
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "none",
          paddingTop: "10vw",
          paddingLeft: "0vw",
          paddingRight: "0vw",
          paddingBottom: `${TRACK_BOTTOM_PAD}px`,
          cursor: "grab",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {items.map((item, i) => (
          <GalleryItem
            key={item.id}
            item={item}
            index={i}
            maxHeight={MAX_IMAGE_HEIGHT}
            displayHeight={displayHeights[item.id]} // ← add this
            labelHeight={LABEL_HEIGHT}
            indexHeight={INDEX_HEIGHT}
            tilt={tilt}
            hovered={hoveredId === item.id}
            onHover={setHoveredId}
            onImageLoad={onImageLoad} // ← add this
          />
        ))}
      </div>

      {/* ── Timeline ── */}
      <div
        style={{
          height: `${TIMELINE_HEIGHT}px`,
          flexShrink: 0,
          position: "relative",
        }}
      >
        <div
          ref={tlInnerRef}
          onPointerDown={onTlDown}
          onPointerMove={onTlMove}
          onPointerUp={onTlUp}
          onPointerCancel={onTlUp}
          style={{
            display: "flex",
            alignItems: "flex-start",
            overflowX: "hidden",
            height: "100%",
            paddingLeft: "5vw",
            cursor: "grab",
            userSelect: "none",
            WebkitUserSelect: "none",
            scrollbarWidth: "none",
          }}
        >
          {/* NOW marker */}
          <div
            style={{
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 5,
              paddingTop: 16,
              marginRight: 24,
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            />
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.15em",
                color: "#f59e0b",
                fontWeight: 600,
              }}
            >
              NOW
            </span>
          </div>

          {/* Month segments */}
          {timeline.map((month, i) => (
            <MonthSegment
              key={month.label}
              month={month}
              isYearBoundary={i === 0 || timeline[i - 1].year !== month.year}
              onJump={() => jumpToMonth(month.itemIndex)}
            />
          ))}
          <div style={{ flexShrink: 0, width: "5vw" }} />
        </div>
      </div>

      {/* Edge vignettes */}
      {/* <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: TIMELINE_HEIGHT,
          width: "4vw",
          background: "linear-gradient(to right, #e4d0b5 30%, transparent)",
          pointerEvents: "none",
          opacity: atStart ? 0 : 1,
          transition: "opacity 0.4s",
          zIndex: 10,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: TIMELINE_HEIGHT,
          width: "4vw",
          background: "linear-gradient(to left, #e4d0b5 30%, transparent)",
          pointerEvents: "none",
          opacity: atEnd ? 0 : 1,
          transition: "opacity 0.4s",
          zIndex: 10,
        }}
      /> */}

      {atStart && <ScrollHint tlH={TIMELINE_HEIGHT} />}
    </div>
  );
}

// ─── Month segment ────────────────────────────────────────────────────────────

function DayTick({
  left,
  isMajor,
  mouseX,
}: {
  left: number;
  isMajor: boolean;
  mouseX: number | null; // mouse X relative to MonthSegment's left edge
}) {
  const tickCenter = left + (isMajor ? 4 : 2); // center of the visible 1px line
  const PROXIMITY = 18; // px radius of influence — adjust to taste

  const distance = mouseX !== null ? Math.abs(mouseX - tickCenter) : Infinity;
  const isClose = distance < PROXIMITY;

  // How much to grow: 1 at center, 0 at edge of proximity radius
  const strength = isClose ? 1 - distance / PROXIMITY : 0;

  const restingHeight = isMajor ? 40 : 22;
  const maxGrowth = isMajor ? 44 : 32; // how many extra px it can grow
  const height = Math.round(restingHeight + strength * maxGrowth);

  const alpha = isMajor ? 0.44 + strength * 0.5 : 0.2 + strength * 0.55;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left,
        width: isMajor ? 9 : 5,
        height: "100%",
        cursor: "grab",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: isMajor ? 4 : 2,
          width: 1,
          height,
          background: `rgba(0,0,0,${alpha.toFixed(2)})`,
          transition: "height 0.15s ease, background 0.15s ease",
        }}
      />
    </div>
  );
}

const MONTH_W = 68; // px for the label column
const DAY_SLOT_W = 13; // px per day-tick slot

function MonthSegment({
  month,
  isYearBoundary,
  onJump,
}: {
  month: TimelineMonth;
  isYearBoundary: boolean;
  onJump: () => void;
}) {
  const totalW = MONTH_W + DAY_TICKS * DAY_SLOT_W;
  const [hovered, setHovered] = useState(false);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const segRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = segRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouseX(e.clientX - rect.left);
  }, []);

  const onMouseLeave = useCallback(() => {
    setMouseX(null);
    setHovered(false);
  }, []);

  return (
    <div
      ref={segRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        flexShrink: 0,
        width: totalW,
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        paddingBottom: 40,
      }}
    >
      {/* Ticks zone */}
      <div
        style={{
          position: "relative",
          height: 80,
          width: "100%",
          flexShrink: 0,
        }}
      >
        {Array.from({ length: DAY_TICKS }).map((_, d) => (
          <DayTick
            key={d}
            left={MONTH_W + d * DAY_SLOT_W}
            isMajor={d % 5 === 4}
            mouseX={mouseX} // ← pass mouse position
          />
        ))}
      </div>

      {/* Label */}
      <button
        onMouseEnter={() => setHovered(true)}
        onClick={onJump}
        style={{
          flexShrink: 0,
          width: "100%",
          height: 20,
          background: "none",
          border: "none",
          padding: "0 0 0 2px",
          cursor: "grab",
          textAlign: "left",
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 6,
          marginTop: 6,
        }}
      >
        {isYearBoundary && (
          <span
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              lineHeight: 1,
              color: hovered ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.8)",
              transition: "color 0.2s ease",
            }}
          >
            {month.year}
          </span>
        )}
        <span
          style={{
            fontSize: 20,
            letterSpacing: "0.12em",
            lineHeight: 1,
            color: hovered ? "rgba(0,0,0,1)" : "rgba(0,0,0,0.6)",
            transition: "color 0.2s ease",
          }}
        >
          {month.shortLabel}
        </span>
      </button>
    </div>
  );
}

// ─── Gallery item ─────────────────────────────────────────────────────────────

function GalleryItem({
  item,
  index,
  maxHeight,
  displayHeight, // ← add
  labelHeight,
  indexHeight,
  tilt,
  hovered,
  onHover,
  onImageLoad, // ← add
}: {
  item: PublicGalleryItem;
  index: number;
  maxHeight: number;
  displayHeight?: number; // ← add
  labelHeight: number;
  indexHeight: number;
  tilt: number;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onImageLoad: (id: string, naturalHeight: number) => void; // ← add
}) {
  const isVideo = item.mediaType === "VIDEO";
  const videoRef = useRef<HTMLVideoElement>(null);

  const rotateY = tilt * -7;

  return (
    <div
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        alignSelf: "center",
      }}
    >
      {/* Index — top left, above image */}
      <div
        style={{
          height: indexHeight,
          display: "flex",
          alignItems: "flex-end",
          paddingBottom: 5,
          paddingLeft: 1,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: "rgba(0,0,0,0.88)",
            overflow: "hidden",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0px)" : "translateY(5px)",
            transition: "opacity 0.22s ease, transform 0.40s ease",
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Image with perspective tilt */}
      <div
        style={{ position: "relative", perspective: "700px", flexShrink: 0 }}
      >
        <div
          style={{
            transformOrigin: "center center",
            transform: `rotateY(${rotateY}deg)`,
            willChange: "transform",
            transition:
              Math.abs(tilt) < 0.04 ? "transform 0.55s ease-out" : undefined,
          }}
        >
          {isVideo ? (
            <VideoMedia
              item={item}
              videoRef={videoRef}
              hovered={hovered}
              maxHeight={maxHeight}
              displayHeight={displayHeight}
              index={index}
              onImageLoad={onImageLoad}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.altText ?? item.title ?? `Gallery item ${index + 1}`}
              draggable={false}
              onLoad={(e) => {
                onImageLoad(item.id, e.currentTarget.naturalHeight);
              }}
              style={{
                display: "block",
                width: "auto",
                height: displayHeight ? `${displayHeight}px` : "auto",
                maxHeight: displayHeight ? undefined : `${maxHeight}px`,
                maxWidth: "52vw",
                minWidth: "40px",
                pointerEvents: "none",
                filter: hovered ? "brightness(1)" : "brightness(0.74)",
                transition: "filter 0.32s ease",
              }}
            />
          )}

          {item.isFeatured && (
            <div
              style={{
                position: "absolute",
                top: 7,
                left: 7,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            />
          )}
        </div>
      </div>

      {/* Label below image — appears on hover, no overlap */}
      <div
        style={{
          height: labelHeight,
          width: "100%",
          paddingTop: 8,
          paddingLeft: 1,
          overflow: "hidden",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(5px)" : "translateY(1px)",
          transition: "opacity 0.22s ease, transform 0.40s ease",
        }}
      >
        {item.title && (
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 500,
              color: "rgba(0,0,0,0.88)",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "48vw",
            }}
          >
            {item.title}
          </p>
        )}
        {item.category && (
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 10,
              color: "#f59e0b",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "48vw",
            }}
          >
            {item.category.name.toUpperCase()}
          </p>
        )}
        {item.persons.length > 0 && (
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 10,
              color: "rgba(0,0,0,0.34)",
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "48vw",
            }}
          >
            {item.persons.map((p) => p.displayName).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Video media ──────────────────────────────────────────────────────────────

function VideoMedia({
  item,
  videoRef,
  hovered,
  maxHeight,
  displayHeight,
  index,
  onImageLoad,
}: {
  item: PublicGalleryItem;
  videoRef: React.RefObject<HTMLVideoElement>;
  hovered: boolean;
  maxHeight: number;
  displayHeight?: number;
  index: number;
  onImageLoad: (id: string, naturalHeight: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const savedTime = useRef(0);
  const isVisible = useRef(false);

  // ── IntersectionObserver — play when in view, pause + save time when not ──
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          // Restore saved position then play
          video.currentTime = savedTime.current;
          video.play().catch(() => {});
        } else {
          // Save position then pause
          savedTime.current = video.currentTime;
          video.pause();
        }
      },
      {
        threshold: 0.1, // start playing when 10% visible
      },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [videoRef]);

  // ── Hover still controls brightness / thumbnail swap ──
  // (play/pause is now handled by intersection, not hover)

  const mediaStyle: React.CSSProperties = {
    display: "block",
    width: "auto",
    height: displayHeight ? `${displayHeight}px` : "auto",
    maxHeight: displayHeight ? undefined : `${maxHeight}px`,
    maxWidth: "52vw",
    minWidth: "40px",
    pointerEvents: "none",
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Thumbnail — shown when not hovered */}
      {item.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailUrl}
          alt={item.altText ?? `Video ${index + 1}`}
          draggable={false}
          onLoad={(e) => {
            onImageLoad(item.id, e.currentTarget.naturalHeight);
          }}
          style={{
            ...mediaStyle,
            position: hovered ? "absolute" : "relative",
            inset: 0,
            objectFit: "cover",
            opacity: hovered ? 0 : 1,
            transition: "opacity 0.3s ease",
            filter: "brightness(0.74)",
          }}
        />
      )}

      {/* Video */}
      <video
        ref={videoRef}
        src={item.url}
        muted
        loop
        playsInline
        onLoadedMetadata={(e) => {
          // Use video's natural dimensions for height normalization
          const video = e.currentTarget;
          if (video.videoHeight > 0) {
            onImageLoad(item.id, video.videoHeight);
          }
        }}
        style={{
          ...mediaStyle,
          display: hovered || !item.thumbnailUrl ? "block" : "block",
          objectFit: "cover",
          opacity: hovered ? 1 : item.thumbnailUrl ? 0 : 1,
          transition: "opacity 0.3s ease",
          filter: hovered ? "brightness(1)" : "brightness(0.74)",
        }}
      />
    </div>
  );
}

// ─── Scroll hint ──────────────────────────────────────────────────────────────

function ScrollHint({ tlH }: { tlH: number }) {
  const [op, setOp] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setOp(0.4), 1000);
    const t2 = setTimeout(() => setOp(0), 4500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return (
    <div
      style={{
        position: "absolute",
        bottom: tlH + 22,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
        opacity: op,
        transition: "opacity 1s ease",
        zIndex: 20,
      }}
    >
      <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
        <path
          d="M12 4.5H2M2 4.5L5 1.5M2 4.5L5 7.5"
          stroke="white"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
      </svg>
      <span
        style={{
          fontSize: 9,
          letterSpacing: "0.16em",
          color: "black",
          fontWeight: 500,
        }}
      >
        DRAG OR SCROLL
      </span>
      <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
        <path
          d="M2 4.5H12M12 4.5L9 1.5M12 4.5L9 7.5"
          stroke="black"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
