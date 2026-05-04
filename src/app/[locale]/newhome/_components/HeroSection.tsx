'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaItem =
  | { type: 'video'; src: string }
  | { type: 'image'; src: string; alt?: string };

interface ContentItem {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  mediaUrls: string[];
  videoUrls: string[];
  thumbnailUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  isExternal: boolean;
  badgeLabel?: string | null;
  eventDate?: string | null;
}

interface HeroProps {
  upcoming?: ContentItem[];
  news?: ContentItem[];
  offers?: ContentItem[];
}

// ─── Media ────────────────────────────────────────────────────────────────────

const MEDIA_ITEMS: MediaItem[] = [
  { type: 'video', src: 'xxx' },
  { type: 'image', src: 'xxx', alt: 'Royal Academy' },
  { type: 'image', src: 'xx', alt: 'Royal Academy 2' },
];

const SIDEBAR_W = 150;

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeroSection({
  upcoming = [],
  news = [],
  offers = [],
}: HeroProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const isAr = locale === 'ar';

  const [current, setCurrent] = useState(0);
  const [isTransitioning, setTrans] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset + replay video every time the slider lands back on it
  useEffect(() => {
    if (MEDIA_ITEMS[current].type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [current]);
  const currentRef = useRef(0);
  const transRef = useRef(false);

  const goTo = useCallback((idx: number) => {
    if (transRef.current) return;
    transRef.current = true;
    setTrans(true);
    setTimeout(() => {
      const next =
        ((idx % MEDIA_ITEMS.length) + MEDIA_ITEMS.length) % MEDIA_ITEMS.length;
      currentRef.current = next;
      setCurrent(next);
      transRef.current = false;
      setTrans(false);
    }, 400);
  }, []);

  const prev = useCallback(() => goTo(currentRef.current - 1), [goTo]);
  const next = useCallback(() => goTo(currentRef.current + 1), [goTo]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (MEDIA_ITEMS[current].type === 'image')
      timerRef.current = setTimeout(next, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, next]);

  return (
    <section
      style={{
        position: 'relative',
        width: '100vw',
        fontFamily: isAr
          ? "'Layla','Noto Naskh Arabic',serif"
          : "'Goudy Old Style','GoudyOlSt-BT',Georgia,serif",
        direction: isAr ? 'rtl' : 'ltr',
      }}
    >
      {/* ══ Hero slider (100vh) ═══════════════════════════════════════════ */}
      <div
        style={{
          position: 'relative',
          height: '100vh',
          overflow: 'hidden',
          background: '#0e0d0b',
        }}
      >
        {/* Background media */}
        {MEDIA_ITEMS.map((item, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              opacity: i === current ? 1 : 0,
              transition: 'opacity .7s ease',
            }}
          >
            {item.type === 'video' ? (
              <video
                ref={videoRef}
                src={item.src}
                autoPlay
                muted
                playsInline
                onEnded={next}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.src}
                alt={item.alt ?? ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>
        ))}

        {/* Slide arrows */}
        <button
          onClick={isAr ? next : prev}
          aria-label="Previous slide"
          style={{
            position: 'absolute',
            [isAr ? 'right' : 'left']: SIDEBAR_W + 20,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,.85)',
            fontSize: 66,
            lineHeight: 1,
            cursor: 'pointer',
            padding: '0 8px',
            transition: 'color .2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'rgba(255,255,255,.85)')
          }
        >
          {isAr ? '›' : '‹'}
        </button>

        <button
          onClick={isAr ? prev : next}
          aria-label="Next slide"
          style={{
            position: 'absolute',
            [isAr ? 'left' : 'right']: 28,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,.85)',
            fontSize: 66,
            lineHeight: 1,
            cursor: 'pointer',
            padding: '0 8px',
            transition: 'color .2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'rgba(255,255,255,.85)')
          }
        >
          {isAr ? '‹' : '›'}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          CONTENT SECTIONS
      ═══════════════════════════════════════════════════════════════════ */}
      {(upcoming.length > 0 || news.length > 0 || offers.length > 0) && (
        <div
          style={{
            [isAr ? 'marginRight' : 'marginLeft']: SIDEBAR_W,
            background: '#f2f2f2',
          }}
        >
          {upcoming.length > 0 && (
            <ContentGroup
              title={isAr ? 'القادم' : 'Upcoming'}
              items={upcoming}
              layout="text-left"
              isAr={isAr}
            />
          )}
          {news.length > 0 && (
            <ContentGroup
              title={isAr ? 'الأخبار' : 'News'}
              items={news}
              layout="text-right"
              isAr={isAr}
            />
          )}
          {offers.length > 0 && (
            <ContentGroup
              title={isAr ? 'العروض' : 'Offers'}
              items={offers}
              layout="text-left"
              isAr={isAr}
            />
          )}
        </div>
      )}
    </section>
  );
}

// ─── Content section helpers ──────────────────────────────────────────────────

interface ContentGroupProps {
  title: string;
  items: ContentItem[];
  layout: 'text-left' | 'text-right';
  isAr: boolean;
}

function ContentGroup({ title, items, layout, isAr }: ContentGroupProps) {
  const textOnLeft = layout === 'text-left';
  return (
    <section style={{ padding: '96px 80px', direction: isAr ? 'rtl' : 'ltr' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2
          style={{
            margin: '0 0 64px',
            fontSize: 13,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: '#888888',
            fontWeight: 400,
            textAlign: textOnLeft ? 'right' : 'left',
          }}
        >
          {title}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
          {items.map((item) => (
            <ContentRow key={item.id} item={item} layout={layout} isAr={isAr} />
          ))}
        </div>
      </div>
    </section>
  );
}

interface ContentRowProps {
  item: ContentItem;
  layout: 'text-left' | 'text-right';
  isAr: boolean;
}

function ContentRow({ item, layout, isAr }: ContentRowProps) {
  const videoSrc = item.videoUrls[0] ?? null;
  const imageSrc = item.mediaUrls[0] ?? item.thumbnailUrl ?? null;
  const textFirst = layout === 'text-left';
  const textAlign: 'left' | 'right' = textFirst ? 'right' : 'left';
  const hasMedia = !!(videoSrc || imageSrc);

  const [hovered, setHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightboxOpen]);

  const textBlock = (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: textFirst ? 'flex-end' : 'flex-start',
        gap: 18,
        padding: '16px 0',
        textAlign,
      }}
    >
      {item.badgeLabel && (
        <span
          style={{
            display: 'inline-block',
            fontSize: 10,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: '#888888',
            borderBottom: '1px solid rgba(0,0,0,.15)',
            paddingBottom: 4,
          }}
        >
          {item.badgeLabel}
        </span>
      )}
      <h3
        style={{
          margin: 0,
          fontSize: 30,
          fontWeight: 400,
          color: '#1a1a1a',
          lineHeight: 1.25,
          letterSpacing: '.01em',
        }}
      >
        {item.title}
      </h3>
      {item.subtitle && (
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: '#555555',
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          {item.subtitle}
        </p>
      )}
      {item.description && (
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: '#666666',
            lineHeight: 1.8,
            maxWidth: 500,
          }}
        >
          {item.description}
        </p>
      )}
      {item.eventDate && (
        <time
          style={{ fontSize: 12, color: '#999999', letterSpacing: '.08em' }}
        >
          {new Date(item.eventDate).toLocaleDateString(
            isAr ? 'ar-SA' : 'en-GB',
            { day: 'numeric', month: 'long', year: 'numeric' },
          )}
        </time>
      )}
      {item.linkUrl && (
        <a
          href={item.linkUrl}
          target={item.isExternal ? '_blank' : undefined}
          rel={item.isExternal ? 'noopener noreferrer' : undefined}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 4,
            fontSize: 12,
            letterSpacing: '.14em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: '#1a1a1a',
            borderBottom: '1px solid rgba(0,0,0,.3)',
            paddingBottom: 2,
            transition: 'border-color .2s, color .2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#555555';
            (e.currentTarget as HTMLElement).style.borderColor =
              'rgba(0,0,0,.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#1a1a1a';
            (e.currentTarget as HTMLElement).style.borderColor =
              'rgba(0,0,0,.3)';
          }}
        >
          {item.linkLabel ?? (isAr ? 'اقرأ المزيد' : 'Learn more')}
        </a>
      )}
    </div>
  );

  // FIX 2: Replace scale zoom with border+padding frame effect on hover
  const mediaBlock = hasMedia ? (
    <div
      style={{
        flex: 1,
        // The outer wrapper grows a border + padding frame on hover
        padding: hovered ? '18px' : '0px',
        outline: hovered
          ? '2px solid rgba(160,160,160,0.5)'
          : '2px solid transparent',
        borderRadius: 4,
        transition:
          'padding .45s cubic-bezier(.4,0,.2,1), outline-color .45s ease',
        cursor: 'pointer',
        // Prevent layout shift by reserving the outline space always
        boxSizing: 'border-box',
      }}
      onClick={() => setLightboxOpen(true)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          overflow: 'hidden',
          borderRadius: 2,
          width: '100%',
          height: '100%',
        }}
      >
        {videoSrc ? (
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc!}
            alt={item.title}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        )}
      </div>
    </div>
  ) : null;

  const lightbox =
    lightboxOpen && typeof window !== 'undefined'
      ? createPortal(
          <div
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              background: 'rgba(0,0,0,.88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(false);
              }}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 24,
                right: 28,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,.7)',
                padding: 8,
                lineHeight: 1,
                transition: 'color .2s',
                zIndex: 2001,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(255,255,255,.7)')
              }
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '85vw',
                maxHeight: '85vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {videoSrc ? (
                <video
                  src={videoSrc}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '85vh',
                    borderRadius: 4,
                    display: 'block',
                  }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageSrc!}
                  alt=""
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '85vh',
                    borderRadius: 4,
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: textFirst ? 'row' : 'row-reverse',
          gap: 80,
          alignItems: 'center',
        }}
      >
        {textBlock}
        {mediaBlock}
      </div>
      {lightbox}
    </>
  );
}
