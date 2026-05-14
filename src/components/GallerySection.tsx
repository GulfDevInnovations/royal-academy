'use client';

import type { PublicGalleryItem } from '@/lib/actions/gallery.public.actions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  items: PublicGalleryItem[];
  active: boolean;
  onScrollUp: () => void;
  onScrollDown: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MAX_IMAGE_HEIGHT = 520;
const TRACK_BOTTOM_PAD = 48;
const CAT_BAR_HEIGHT = 56; // category bar at bottom
const LABEL_HEIGHT = 58;
const INDEX_HEIGHT = 22;
const ITEM_GAP = 3;
const HANDOFF_THRESHOLD = 80;

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

export default function GallerySection({
  items,
  active,
  onScrollUp,
  onScrollDown,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const lastScroll = useRef(0);
  const velocity = useRef(0);
  const raf = useRef<number>(0);
  const scrollTarget = useRef(0);

  const dragging = useRef(false);
  const dragX0 = useRef(0);
  const dragScroll0 = useRef(0);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tilt, setTilt] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [naturalHeights, setNaturalHeights] = useState<Record<string, number>>(
    {},
  );

  // ── Derive categories from items ──────────────────────────────────────────
  const categories = useMemo(() => {
    const seen = new Map<string, string>(); // slug → name
    items.forEach((item) => {
      if (item.category) seen.set(item.category.slug, item.category.name);
    });
    return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }));
  }, [items]);

  // ── Filtered categories (search) ─────────────────────────────────────────
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  // ── Filtered items ────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (activeCategory === 'ALL') return items;
    return items.filter((item) => item.category?.slug === activeCategory);
  }, [items, activeCategory]);

  // ── Natural height normalization ──────────────────────────────────────────
  const onImageLoad = useCallback((id: string, naturalHeight: number) => {
    setNaturalHeights((prev) => ({ ...prev, [id]: naturalHeight }));
  }, []);

  const maxNatural = useMemo(
    () => Math.max(...Object.values(naturalHeights), 1),
    [naturalHeights],
  );

  const displayHeights = useMemo(() => {
    const result: Record<string, number> = {};
    filteredItems.forEach((item) => {
      const natural = naturalHeights[item.id];
      if (!natural) return;
      result[item.id] = Math.round((natural / maxNatural) * MAX_IMAGE_HEIGHT);
    });
    return result;
  }, [naturalHeights, maxNatural, filteredItems]);

  // ── RAF: lerp scroll + velocity + tilt ───────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const el = trackRef.current;
      if (el) {
        const current = el.scrollLeft;
        const diff = scrollTarget.current - current;
        if (Math.abs(diff) > 0.5) el.scrollLeft = current + diff * 0.09;

        const dx = el.scrollLeft - lastScroll.current;
        lastScroll.current = el.scrollLeft;
        velocity.current = velocity.current * 0.78 + dx * 0.22;
        const clamped = Math.max(-28, Math.min(28, velocity.current));
        setTilt(clamped / 28);

        const max = el.scrollWidth - el.clientWidth;
        scrollTarget.current = Math.max(0, Math.min(scrollTarget.current, max));
        setAtStart(el.scrollLeft <= 4);
        setAtEnd(el.scrollLeft >= max - 4);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  // ── Reset scroll when category changes ───────────────────────────────────
  useEffect(() => {
    scrollTarget.current = 0;
    if (trackRef.current) trackRef.current.scrollLeft = 0;
    lastScroll.current = 0;
  }, [activeCategory]);

  // ── Wheel ─────────────────────────────────────────────────────────────────
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
      scrollTarget.current += e.deltaY * 1.15;
    };
    window.addEventListener('wheel', fn, { passive: false });
    return () => window.removeEventListener('wheel', fn);
  }, [active, atStart, atEnd, onScrollUp, onScrollDown]);

  // ── Keys ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    const fn = (e: KeyboardEvent) => {
      const el = trackRef.current;
      if (!el) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        scrollTarget.current += 220;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scrollTarget.current -= 220;
      }
      if (e.key === 'ArrowUp') onScrollUp();
      if (e.key === 'ArrowDown') onScrollDown();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [active, onScrollUp, onScrollDown]);

  // ── Track drag ────────────────────────────────────────────────────────────
  const onTrackDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    dragX0.current = e.clientX;
    dragScroll0.current = trackRef.current?.scrollLeft ?? 0;
    scrollTarget.current = dragScroll0.current;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const onTrackMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    scrollTarget.current = dragScroll0.current + (dragX0.current - e.clientX);
  }, []);
  const onTrackUp = useCallback(() => {
    dragging.current = false;
  }, []);

  if (items.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#757575',
        }}
      >
        <p
          style={{
            color: 'rgba(255,255,255,0.18)',
            fontSize: 12,
            letterSpacing: '0.12em',
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
        position: 'relative',
        width: '100%',
        height: '100%',
        background: '#757575',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
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
          display: 'flex',
          alignItems: 'center',
          gap: `${ITEM_GAP}px`,
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none',
          paddingLeft: '5vw',
          paddingRight: '5vw',
          paddingBottom: `${TRACK_BOTTOM_PAD}px`,
          cursor: 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {filteredItems.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              opacity: 0.3,
            }}
          >
            <p style={{ color: 'white', fontSize: 12, letterSpacing: '0.1em' }}>
              NO ITEMS IN THIS CATEGORY
            </p>
          </div>
        ) : (
          filteredItems.map((item, i) => (
            <GalleryItem
              key={item.id}
              item={item}
              index={i}
              maxHeight={MAX_IMAGE_HEIGHT}
              displayHeight={displayHeights[item.id]}
              labelHeight={LABEL_HEIGHT}
              indexHeight={INDEX_HEIGHT}
              tilt={tilt}
              hovered={hoveredId === item.id}
              onHover={setHoveredId}
              onImageLoad={onImageLoad}
            />
          ))
        )}
      </div>

      {/* ── Category bar ── */}
      <div
        style={{
          height: `${CAT_BAR_HEIGHT}px`,
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,1)',
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          paddingLeft: '5vw',
          paddingRight: '5vw',
          paddingBottom: 10,
        }}
      >
        {/* Search box */}
        <div style={{ position: 'relative', flexShrink: 0, marginRight: 20 }}>
          <svg
            width="11"
            height="11"
            viewBox="0 0 11 11"
            fill="none"
            style={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }}
          >
            <circle
              cx="4.5"
              cy="4.5"
              r="3.5"
              stroke="rgba(255,255,255,1)"
              strokeWidth="1"
            />
            <path
              d="M7.5 7.5L10 10"
              stroke="rgba(255,255,255,1)"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: '4px 10px 4px 24px',
              fontSize: 10,
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,1)',
              outline: 'none',
              width: 110,
              cursor: 'text',
            }}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 16,
            background: 'rgba(255,255,255,1)',
            marginRight: 20,
            flexShrink: 0,
          }}
        />

        {/* ALL pill */}
        <CategoryPill
          label="ALL"
          count={items.length}
          active={activeCategory === 'ALL'}
          onClick={() => {
            setActiveCategory('ALL');
            setSearch('');
          }}
        />

        {/* Category pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {filteredCategories.length === 0 ? (
            <span
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,1)',
                letterSpacing: '0.08em',
              }}
            >
              no match
            </span>
          ) : (
            filteredCategories.map((cat) => {
              const count = items.filter(
                (i) => i.category?.slug === cat.slug,
              ).length;
              return (
                <CategoryPill
                  key={cat.slug}
                  label={cat.name}
                  count={count}
                  active={activeCategory === cat.slug}
                  onClick={() => {
                    setActiveCategory(cat.slug);
                    setSearch('');
                  }}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Edge vignettes */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: CAT_BAR_HEIGHT,
          width: '4vw',
          background: 'linear-gradient(to right, #757575 30%, transparent)',
          pointerEvents: 'none',
          opacity: atStart ? 0 : 1,
          transition: 'opacity 0.4s',
          zIndex: 10,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: CAT_BAR_HEIGHT,
          width: '4vw',
          background: 'linear-gradient(to left, #757575 30%, transparent)',
          pointerEvents: 'none',
          opacity: atEnd ? 0 : 1,
          transition: 'opacity 0.4s',
          zIndex: 10,
        }}
      />

      {atStart && <ScrollHint barH={CAT_BAR_HEIGHT} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY PILL
// ─────────────────────────────────────────────────────────────────────────────

function CategoryPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 12px',
        marginRight: 4,
        borderRadius: 999,
        border: active
          ? '1px solid rgba(245,158,11,1)'
          : '1px solid rgba(255,255,255,1)',
        background: active
          ? 'rgba(245,158,11,0.10)'
          : hovered
            ? 'rgba(255,255,255,0.05)'
            : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
      }}
    >
      <span
        style={{
          fontSize: 10,
          letterSpacing: '0.1em',
          color: active
            ? '#f59e0b'
            : hovered
              ? 'rgba(255,255,255,1)'
              : 'rgba(255,255,255,1)',
          transition: 'color 0.18s ease',
          lineHeight: 1,
          fontWeight: active ? 500 : 400,
        }}
      >
        {label.toUpperCase()}
      </span>
      <span
        style={{
          fontSize: 9,
          color: active ? 'rgba(245,158,11,1)' : 'rgba(255,255,255,1)',
          lineHeight: 1,
          transition: 'color 0.18s ease',
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GALLERY ITEM
// ─────────────────────────────────────────────────────────────────────────────

function GalleryItem({
  item,
  index,
  maxHeight,
  displayHeight,
  labelHeight,
  indexHeight,
  tilt,
  hovered,
  onHover,
  onImageLoad,
}: {
  item: PublicGalleryItem;
  index: number;
  maxHeight: number;
  displayHeight?: number;
  labelHeight: number;
  indexHeight: number;
  tilt: number;
  hovered: boolean;
  onHover: (id: string | null) => void;
  onImageLoad: (id: string, naturalHeight: number) => void;
}) {
  const isVideo = item.mediaType === 'VIDEO';
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const rotateY = tilt * -7;

  return (
    <div
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        alignSelf: 'center',
      }}
    >
      {/* Index */}
      <div
        style={{
          height: indexHeight,
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: 5,
          paddingLeft: 1,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '0.08em',
            color: hovered ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,1)',
            transition: 'color 0.2s ease',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Image / video with tilt */}
      <div
        style={{ position: 'relative', perspective: '700px', flexShrink: 0 }}
      >
        <div
          style={{
            transformOrigin: 'center center',
            transform: `rotateY(${rotateY}deg)`,
            willChange: 'transform',
            transition:
              Math.abs(tilt) < 0.04 ? 'transform 0.55s ease-out' : undefined,
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
              onLoad={(e) =>
                onImageLoad(item.id, e.currentTarget.naturalHeight)
              }
              style={{
                display: 'block',
                width: 'auto',
                height: displayHeight ? `${displayHeight}px` : 'auto',
                maxHeight: displayHeight ? undefined : `${maxHeight}px`,
                maxWidth: '52vw',
                minWidth: '40px',
                minHeight: '32px',
                pointerEvents: 'none',
                filter: hovered ? 'brightness(1)' : 'brightness(0.74)',
                transition: 'filter 0.32s ease',
              }}
            />
          )}

          {item.isFeatured && (
            <div
              style={{
                position: 'absolute',
                top: 7,
                left: 7,
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#f59e0b',
              }}
            />
          )}
        </div>
      </div>

      {/* Label */}
      <div
        style={{
          height: labelHeight,
          width: '100%',
          paddingTop: 8,
          paddingLeft: 1,
          overflow: 'hidden',
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateY(0)' : 'translateY(5px)',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
        }}
      >
        {item.title && (
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.88)',
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '48vw',
            }}
          >
            {item.title}
          </p>
        )}
        {item.category && (
          <p
            style={{
              margin: '3px 0 0',
              fontSize: 10,
              color: '#f59e0b',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '48vw',
            }}
          >
            {item.category.name.toUpperCase()}
          </p>
        )}
        {item.persons.length > 0 && (
          <p
            style={{
              margin: '3px 0 0',
              fontSize: 10,
              color: 'rgba(255,255,255,1)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '48vw',
            }}
          >
            {item.persons.map((p) => p.displayName).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO MEDIA
// ─────────────────────────────────────────────────────────────────────────────

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
  videoRef: React.RefObject<HTMLVideoElement | null>;
  hovered: boolean;
  maxHeight: number;
  displayHeight?: number;
  index: number;
  onImageLoad: (id: string, naturalHeight: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const savedTime = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.currentTime = savedTime.current;
          video.play().catch(() => {});
        } else {
          savedTime.current = video.currentTime;
          video.pause();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [videoRef]);

  const mediaStyle: React.CSSProperties = {
    display: 'block',
    width: 'auto',
    height: displayHeight ? `${displayHeight}px` : 'auto',
    maxHeight: displayHeight ? undefined : `${maxHeight}px`,
    maxWidth: '52vw',
    minWidth: '40px',
    pointerEvents: 'none',
    objectFit: 'cover',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {item.thumbnailUrl && !hovered && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailUrl}
          alt={item.altText ?? `Video ${index + 1}`}
          draggable={false}
          onLoad={(e) => onImageLoad(item.id, e.currentTarget.naturalHeight)}
          style={{ ...mediaStyle, filter: 'brightness(0.74)' }}
        />
      )}
      <video
        ref={videoRef}
        src={item.url}
        muted
        loop
        playsInline
        preload="auto"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (v.videoHeight > 0) onImageLoad(item.id, v.videoHeight);
        }}
        style={{
          ...mediaStyle,
          display: hovered || !item.thumbnailUrl ? 'block' : 'none',
          filter: hovered ? 'brightness(1)' : 'brightness(0.74)',
        }}
      />
      {!hovered && (
        <div
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 6px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.55)',
            fontSize: 9,
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,1)',
          }}
        >
          <svg width="6" height="8" viewBox="0 0 6 8" fill="currentColor">
            <polygon points="0,0 6,4 0,8" />
          </svg>
          VIDEO
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCROLL HINT
// ─────────────────────────────────────────────────────────────────────────────

function ScrollHint({ barH }: { barH: number }) {
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
        position: 'absolute',
        bottom: barH + 22,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        pointerEvents: 'none',
        opacity: op,
        transition: 'opacity 1s ease',
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
          letterSpacing: '0.16em',
          color: 'white',
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
