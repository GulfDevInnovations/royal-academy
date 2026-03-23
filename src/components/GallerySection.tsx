"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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
const TIMELINE_WIDTH = "clamp(110px, 18vw, 200px)";
const LABEL_HEIGHT = 58; // px below each image
const INDEX_HEIGHT = 22; // px above each image
const ITEM_GAP = 25; // px between items
const HANDOFF_THRESHOLD = 80;
const TIMELINE_PARALLAX = 0.3; // timeline moves at 0.30× track speed
const DAY_TICKS = 15; // tick marks between month labels
const DESKTOP_RAIL_TICKS = 55;
const DESKTOP_RAIL_W = 75;

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
  const [isMobile, setIsMobile] = useState(false);
  const [desktopRailMouseY, setDesktopRailMouseY] = useState<number | null>(null);
  const desktopRailHostRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tlInnerRef = useRef<HTMLDivElement>(null);
  const [lightboxItem, setLightboxItem] = useState<PublicGalleryItem | null>(
    null,
  );
  const lastScroll = useRef(0);
  const velocity = useRef(0);
  const raf = useRef<number>(0);
  const dragging = useRef(false);
  const trackPointerDown = useRef(false);
  const trackPointerId = useRef<number | null>(null);
  const dragX0 = useRef(0);
  const dragScroll0 = useRef(0);
  const dragMoved = useRef(false);
  const suppressClickUntil = useRef(0);
  const pendingOpenId = useRef<string | null>(null);
  const tlDragging = useRef(false);
  const tlDragX0 = useRef(0);
  const tlDragY0 = useRef(0);
  const tlTrackScroll0 = useRef(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tilt, setTilt] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const timeline = useMemo(() => buildTimeline(items), [items]);
  const itemsById = useMemo(() => {
    const m = new Map<string, PublicGalleryItem>();
    items.forEach((it) => m.set(it.id, it));
    return m;
  }, [items]);
  const [activeTimelineIndex, setActiveTimelineIndex] = useState(0);
  const activeTimelineIndexRef = useRef(0);
  const scrollTarget = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

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
    const tlMax = isMobile
      ? tl.scrollWidth - tl.clientWidth
      : tl.scrollHeight - tl.clientHeight;
    if (tlMax <= 0) return;
    const target = (left / Math.max(max, 1)) * (tlMax / TIMELINE_PARALLAX);
    // Lerp: move 12% toward target each frame — smooths out jitter
    tlScrollCurrent.current += (target - tlScrollCurrent.current) * 0.12;
    if (isMobile) tl.scrollLeft = tlScrollCurrent.current;
    else tl.scrollTop = tlScrollCurrent.current;
  }, [isMobile]);

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

        // Active month (for NOW badge): derive from current scroll position
        const estItemSpan = MAX_IMAGE_HEIGHT * 0.7 + ITEM_GAP;
        const approxIndex = Math.round(el.scrollLeft / Math.max(estItemSpan, 1));
        const clampedIndex = Math.max(
          0,
          Math.min(items.length - 1, approxIndex),
        );
        let nextActive = 0;
        for (let i = 0; i < timeline.length; i += 1) {
          if (timeline[i].itemIndex <= clampedIndex) nextActive = i;
          else break;
        }
        if (nextActive !== activeTimelineIndexRef.current) {
          activeTimelineIndexRef.current = nextActive;
          setActiveTimelineIndex(nextActive);
        }

        syncTimeline(el.scrollLeft, max);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [items.length, syncTimeline, timeline]);

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
    trackPointerDown.current = true;
    trackPointerId.current = e.pointerId;
    dragging.current = false;
    dragMoved.current = false;
    pendingOpenId.current = null;

    const targetEl = e.target as HTMLElement | null;
    const clickable = targetEl?.closest?.('[data-gallery-open="1"]') as
      | HTMLElement
      | null;
    const id = clickable?.dataset?.galleryId;
    if (id) pendingOpenId.current = id;

    dragX0.current = e.clientX;
    dragScroll0.current = trackRef.current?.scrollLeft ?? 0;
    scrollTarget.current = dragScroll0.current; // ← sync target to current position
  }, []);
  const onTrackMove = useCallback((e: React.PointerEvent) => {
    if (!trackPointerDown.current) return;
    const dx = dragX0.current - e.clientX;
    const threshold = e.pointerType === "touch" ? 14 : 8;
    if (!dragging.current && Math.abs(dx) > threshold) {
      dragging.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    if (!dragging.current) return;
    dragMoved.current = true;
    pendingOpenId.current = null;
    scrollTarget.current = dragScroll0.current + dx;
  }, []);
  const onTrackUp = useCallback(() => {
    trackPointerDown.current = false;
    trackPointerId.current = null;
    dragging.current = false;
    if (dragMoved.current) suppressClickUntil.current = Date.now() + 250;

    const id = pendingOpenId.current;
    pendingOpenId.current = null;
    if (!dragMoved.current && id && Date.now() >= suppressClickUntil.current) {
      const item = itemsById.get(id);
      if (item) {
        setLightboxItem(item);
        // Prevent the subsequent click event (if any) from trying to re-open.
        suppressClickUntil.current = Date.now() + 500;
      }
    }
    dragMoved.current = false;
  }, [itemsById]);

  // ── Timeline drag ────────────────────────────────────────────────────────
  const onTlDown = useCallback((e: React.PointerEvent) => {
    tlDragging.current = true;
    dragMoved.current = false;
    tlDragX0.current = e.clientX;
    tlDragY0.current = e.clientY;
    tlTrackScroll0.current = trackRef.current?.scrollLeft ?? 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const onTlMove = useCallback((e: React.PointerEvent) => {
    if (!tlDragging.current) return;
    const delta = isMobile
      ? (tlDragX0.current - e.clientX)
      : (tlDragY0.current - e.clientY);
    if (Math.abs(delta) > 6) dragMoved.current = true;
    scrollTarget.current =
      tlTrackScroll0.current + delta / TIMELINE_PARALLAX; // ← target, not el.scrollLeft
  }, [isMobile]);
  const onTlUp = useCallback(() => {
    tlDragging.current = false;
    if (dragMoved.current) suppressClickUntil.current = Date.now() + 250;
  }, []);

  const onDesktopRailMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = desktopRailHostRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDesktopRailMouseY(e.clientY - rect.top);
  }, []);

  const onDesktopRailMouseLeave = useCallback(() => {
    setDesktopRailMouseY(null);
  }, []);

  const openLightbox = useCallback((item: PublicGalleryItem) => {
    if (Date.now() < suppressClickUntil.current) return;
    setLightboxItem(item);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxItem(null);
  }, []);

  useEffect(() => {
    if (!lightboxItem) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeLightbox, lightboxItem]);

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
          background:
            "linear-gradient(180deg, #000 0%, var(--royal-dark) 45%, var(--royal-purple) 100%)",
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
        background:
          "linear-gradient(180deg, #000 0%, var(--royal-dark) 45%, var(--royal-purple) 100%)",
        overflow: "hidden",
      }}
    >
      {isMobile ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "10vw"
          }}
        >
          {/* Track (top) */}
          <div
            ref={trackRef}
            onPointerDown={onTrackDown}
            onPointerMove={onTrackMove}
            onPointerUp={onTrackUp}
            onPointerCancel={onTrackUp}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: `${ITEM_GAP}px`,
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "none",
              touchAction: "pan-y",
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
                isMobile
                maxHeight={MAX_IMAGE_HEIGHT}
                displayHeight={displayHeights[item.id]}
                labelHeight={LABEL_HEIGHT}
                indexHeight={INDEX_HEIGHT}
                tilt={tilt}
                hovered={hoveredId === item.id}
                onHover={setHoveredId}
                onImageLoad={onImageLoad}
                onOpen={openLightbox}
              />
            ))}
          </div>

          {/* Timeline (bottom) */}
          <div
            style={{
              height: `${TIMELINE_HEIGHT}px`,
              width: "100%",
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
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
              {timeline.map((month, i) => (
                <MonthSegment
                  key={month.label}
                  month={month}
                  isYearBoundary={i === 0 || timeline[i - 1].year !== month.year}
                  isNow={i === activeTimelineIndex}
                  onJump={() => jumpToMonth(month.itemIndex)}
                />
              ))}
              <div style={{ flexShrink: 0, width: "5vw" }} />
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            height: "100%",
            display: "flex",
            gap: "3vw",
            padding: "0 5vw",
          }}
        >
          {/* Timeline (left, vertical) */}
          <div
            style={{
              width: TIMELINE_WIDTH,
              flexShrink: 0,
              paddingTop: "10vw",
              paddingBottom: 22,
            }}
          >
            <div
              ref={desktopRailHostRef}
              onMouseMove={onDesktopRailMouseMove}
              onMouseLeave={onDesktopRailMouseLeave}
              style={{ position: "relative", height: "100%" }}
            >
              <DesktopVerticalTickRail mouseY={desktopRailMouseY} />
              <div
                ref={tlInnerRef}
                onPointerDown={onTlDown}
                onPointerMove={onTlMove}
                onPointerUp={onTlUp}
                onPointerCancel={onTlUp}
                style={{
                  height: "100%",
                  overflowY: "hidden",
                  overflowX: "hidden",
                  cursor: "grab",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  scrollbarWidth: "none",
                  paddingLeft: DESKTOP_RAIL_W + 10,
                  paddingRight: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    paddingTop: 6,
                  }}
                >
                  {timeline.map((month, i) => (
                    <VerticalMonthSegment
                      key={month.label}
                      month={month}
                      isYearBoundary={i === 0 || timeline[i - 1].year !== month.year}
                      isNow={i === activeTimelineIndex}
                      onJump={() => jumpToMonth(month.itemIndex)}
                    />
                  ))}
                  <div style={{ height: 28 }} />
                </div>
              </div>
            </div>
          </div>

          {/* Track (right) */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              paddingTop: "10vw",
              paddingBottom: TRACK_BOTTOM_PAD,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              ref={trackRef}
              onPointerDown={onTrackDown}
              onPointerMove={onTrackMove}
              onPointerUp={onTrackUp}
              onPointerCancel={onTrackUp}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: `${ITEM_GAP}px`,
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "none",
                touchAction: "pan-y",
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
                  isMobile={false}
                  maxHeight={MAX_IMAGE_HEIGHT}
                  displayHeight={displayHeights[item.id]}
                  labelHeight={LABEL_HEIGHT}
                  indexHeight={INDEX_HEIGHT}
                  tilt={tilt}
                  hovered={hoveredId === item.id}
                  onHover={setHoveredId}
                  onImageLoad={onImageLoad}
                  onOpen={openLightbox}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {lightboxItem && (
        <Lightbox item={lightboxItem} onClose={closeLightbox} />
      )}

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

      {atStart && <ScrollHint tlH={isMobile ? TIMELINE_HEIGHT : 0} />}
    </div>
  );
}

function VerticalMonthSegment({
  month,
  isYearBoundary,
  isNow,
  onJump,
}: {
  month: TimelineMonth;
  isYearBoundary: boolean;
  isNow: boolean;
  onJump: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {isYearBoundary && (
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.18em",
            color: "rgba(249,220,198,0.75)",
            fontWeight: 700,
          }}
        >
          {month.year}
        </div>
      )}
      <button
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onJump}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "grab",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: hovered ? "#f59e0b" : "rgba(249,220,198,0.55)",
            boxShadow: hovered
              ? "0 0 0 3px rgba(245,158,11,0.10)"
              : "0 0 0 3px rgba(249,220,198,0.05)",
            transition: "background 0.2s ease, box-shadow 0.2s ease",
            flexShrink: 0,
          }}
        />
        <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: 18,
              letterSpacing: "0.14em",
              lineHeight: 1,
              color: hovered ? "#f9dcc6" : "rgba(249,220,198,0.78)",
              fontWeight: 600,
              transition: "color 0.2s ease",
            }}
          >
            {month.shortLabel}
          </span>
          {isNow && (
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.18em",
                color: "#f59e0b",
                fontWeight: 800,
              }}
            >
              NOW
            </span>
          )}
        </span>
      </button>
    </div>
  );
}

function DesktopVerticalTickRail({ mouseY }: { mouseY: number | null }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [railHeight, setRailHeight] = useState(0);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setRailHeight(el.clientHeight);
    });
    ro.observe(el);
    setRailHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={railRef}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: DESKTOP_RAIL_W,
        pointerEvents: "none",
        opacity: 0.95,
      }}
    >
      {Array.from({ length: DESKTOP_RAIL_TICKS }).map((_, i) => {
        const pct = (i / Math.max(DESKTOP_RAIL_TICKS - 1, 1)) * 100;
        const isMajor = i % 5 === 0;

        const y = (i / Math.max(DESKTOP_RAIL_TICKS - 1, 1)) * railHeight;
        const PROXIMITY = 34;
        const distance = mouseY !== null ? Math.abs(mouseY - y) : Infinity;
        const isClose = distance < PROXIMITY;
        const strength = isClose ? 1 - distance / PROXIMITY : 0;

        const baseW = isMajor ? 40 : 20;
        const growW = isMajor ? 28 : 20;
        const w = Math.min(DESKTOP_RAIL_W, Math.round(baseW + strength * growW));
        const op = isMajor ? 0.7 + strength * 0.3 : 0.35 + strength * 0.5;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: `${pct}%`,
              transform: "translateY(-50%)",
              width: w,
              height: 1,
              background: "#ffffffe0",
              opacity: op,
              transition: "width 0.12s ease, opacity 0.12s ease",
            }}
          />
        );
      })}
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

  return (
    <div
      style={{
        position: "absolute",
        bottom: 10,
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
          background: "#ffffffe0",
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
  isNow,
  onJump,
}: {
  month: TimelineMonth;
  isYearBoundary: boolean;
  isNow: boolean;
  onJump: () => void;
}) {
  const totalW = MONTH_W + DAY_TICKS * DAY_SLOT_W;
  const [mouseX, setMouseX] = useState<number | null>(null);
  const segRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = segRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouseX(e.clientX - rect.left);
  }, []);

  const onMouseLeave = useCallback(() => {
    setMouseX(null);
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
              fontSize: 20,
              letterSpacing: "0.12em",
              lineHeight: 1,
              color: "#e4d0b5",
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
            color: "#f9dcc6",
            transition: "color 0.2s ease",
          }}
        >
          {month.shortLabel}
        </span>

        {isNow && (
          <span
            style={{
              fontSize: 9,
              letterSpacing: "0.15em",
              color: "#f59e0b",
              fontWeight: 700,
            }}
          >
            NOW
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Gallery item ─────────────────────────────────────────────────────────────

function GalleryItem({
  item,
  index,
  isMobile,
  maxHeight,
  displayHeight, // ← add
  labelHeight,
  indexHeight,
  tilt,
  hovered,
  onHover,
  onImageLoad, // ← add
  onOpen,
}: {
  item: PublicGalleryItem;
  index: number;
  isMobile: boolean;
  maxHeight: number;
  displayHeight?: number; // ← add
  labelHeight: number;
  indexHeight: number;
  tilt: number;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onImageLoad: (id: string, naturalHeight: number) => void; // ← add
  onOpen: (item: PublicGalleryItem) => void;
}) {
  const isVideo = item.mediaType === "VIDEO";
  const videoRef = useRef<HTMLVideoElement | null>(null);

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
          onClick={() => onOpen(item)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onOpen(item);
          }}
          data-gallery-open="1"
          data-gallery-id={item.id}
          style={{
            transformOrigin: "center center",
            transform: `rotateY(${rotateY}deg)`,
            willChange: "transform",
            transition:
              Math.abs(tilt) < 0.04 ? "transform 0.55s ease-out" : undefined,
            cursor: "pointer",
          }}
        >
          {isVideo ? (
            <VideoMedia
              item={item}
              videoRef={videoRef}
              hovered={hovered}
              maxHeight={maxHeight}
              displayHeight={displayHeight}
              isMobile={isMobile}
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
                height: "auto",
                maxHeight: displayHeight
                  ? `${displayHeight}px`
                  : `${maxHeight}px`,
                maxWidth: isMobile ? "86vw" : "52vw",
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
  isMobile,
  index,
  onImageLoad,
}: {
  item: PublicGalleryItem;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hovered: boolean;
  maxHeight: number;
  displayHeight?: number;
  isMobile: boolean;
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
    height: "auto",
    maxHeight: displayHeight
      ? `${displayHeight}px`
      : `${maxHeight}px`,
    maxWidth: isMobile ? "86vw" : "52vw",
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
            objectFit: isMobile ? "contain" : "cover",
            opacity: hovered ? 0 : 1,
            transition: "opacity 0.3s ease",
            filter: "brightness(0.74)",
            background: "rgba(0,0,0,0.2)",
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
          objectFit: isMobile ? "contain" : "cover",
          opacity: hovered ? 1 : item.thumbnailUrl ? 0 : 1,
          transition: "opacity 0.3s ease",
          filter: hovered ? "brightness(1)" : "brightness(0.74)",
          background: "rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
}

function Lightbox({
  item,
  onClose,
}: {
  item: PublicGalleryItem;
  onClose: () => void;
}) {
  const isVideo = item.mediaType === "VIDEO";
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const openedAt = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setStatus("loading");
    openedAt.current = performance.now();
  }, [item.id]);

  const requestClose = useCallback(() => {
    // Guard against the same interaction sequence that opened the lightbox
    // also immediately closing it.
    if (performance.now() - openedAt.current < 250) return;
    onClose();
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onPointerDown={requestClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6vh 5vw",
      }}
    >
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        style={{
          position: "fixed",
          top: 18,
          right: 18,
          width: 44,
          height: 44,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.35)",
          color: "white",
          cursor: "pointer",
          display: "grid",
          placeItems: "center",
          backdropFilter: "blur(6px)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M4 4L14 14M14 4L4 14"
            stroke="white"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "92vw",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {status !== "ready" && (
          <div
            style={{
              width: "min(92vw, 1100px)",
              height: "min(62vh, 520px)",
              minWidth: 240,
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 18px 60px rgba(0,0,0,0.55)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.12em",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <div>{status === "loading" ? "LOADING" : "FAILED TO LOAD"}</div>
            {status === "error" && (
              <div
                style={{
                  maxWidth: "min(84vw, 980px)",
                  fontSize: 11,
                  letterSpacing: "0.02em",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.55)",
                  wordBreak: "break-all",
                  padding: "0 14px",
                  textAlign: "center",
                }}
              >
                {item.url}
              </div>
            )}
          </div>
        )}

        {isVideo ? (
          <video
            src={item.url}
            controls
            playsInline
            preload="metadata"
            poster={item.thumbnailUrl ?? undefined}
            onLoadedData={() => setStatus("ready")}
            onError={() => setStatus("error")}
            style={{
              width: "auto",
              height: "auto",
              maxWidth: "92vw",
              maxHeight: "78vh",
              objectFit: "contain",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 10,
              display: status === "ready" ? "block" : "none",
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.url}
            alt={item.altText ?? item.title ?? "Gallery item"}
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
            style={{
              width: "auto",
              height: "auto",
              maxWidth: "92vw",
              maxHeight: "78vh",
              objectFit: "contain",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 10,
              display: status === "ready" ? "block" : "none",
            }}
          />
        )}

        {(item.title || item.category) && (
          <div
            style={{
              color: "rgba(255,255,255,0.86)",
              fontSize: 12,
              letterSpacing: "0.04em",
              lineHeight: 1.4,
            }}
          >
            {item.title && (
              <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.92)" }}>
                {item.title}
              </div>
            )}
            {item.category?.name && (
              <div style={{ color: "rgba(245,158,11,0.95)", marginTop: 2 }}>
                {item.category.name.toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
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
          color: "white",
          fontWeight: 500,
        }}
      >
        DRAG OR SCROLL
      </span>
      <svg width="14" height="9" viewBox="0 0 14 9" fill="none">
        <path
          d="M2 4.5H12M12 4.5L9 1.5M12 4.5L9 7.5"
          stroke="white"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
