"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "next-intl";
import Link from "next/link";
import { ArrowDown, ArrowUp, Layers } from "lucide-react";

const ROTATE_MS = 7500;
const ENTER_EXIT_S = 0.95;

type ColumnKey = "offers" | "news" | "upcomings";

type Props = {
  active: boolean;
  onScrollUp: () => void;
  onScrollDown: () => void;
};

type LocalizedText = {
  en: string;
  ar?: string;
};

type MediaItem =
  | {
      type: "image";
      src: string;
      alt: string;
    }
  | {
      type: "video";
      src: string;
      poster?: string;
    };

type ShowcaseItem = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  date: string;
  link: {
    href: string;
    label?: LocalizedText;
  };
  media: MediaItem[];
};

function pickText(locale: string, text: LocalizedText) {
  if (locale === "ar" && text.ar) return text.ar;
  return text.en;
}

function useRotatingIndex(options: {
  length: number;
  intervalMs: number;
  initialDelayMs: number;
  paused: boolean;
}) {
  const { length, intervalMs, initialDelayMs, paused } = options;
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    if (length <= 1) return;

    timeoutRef.current = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % length);
      intervalRef.current = window.setInterval(() => {
        setIndex((prev) => (prev + 1) % length);
      }, intervalMs);
    }, initialDelayMs);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      timeoutRef.current = null;
      intervalRef.current = null;
    };
  }, [paused, length, intervalMs, initialDelayMs]);

  useEffect(() => {
    if (index >= length) setIndex(0);
  }, [index, length]);

  return { index, setIndex };
}

function clampIndex(nextIndex: number, length: number) {
  if (length <= 0) return 0;
  const raw = nextIndex % length;
  return raw < 0 ? raw + length : raw;
}

function formatDate(locale: string, iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  } catch {
    return iso;
  }
}

function normalizeHref(locale: string, href: string) {
  if (/^(https?:\/\/|mailto:|tel:)/i.test(href)) return href;
  if (/^\/[a-z]{2}(\/|$)/i.test(href)) return href;
  if (!href.startsWith("/")) return `/${locale}/${href}`;
  return `/${locale}${href}`;
}

function GlassCard({
  item,
  title,
  locale,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  item: ShowcaseItem;
  title: string;
  locale: string;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const heroMedia = item.media[0];

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="group relative h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-black/15 text-left shadow-2xl shadow-black/55 transition-transform duration-300 hover:-translate-y-px focus:outline-none"
    >
      {/* Media fills the entire card */}
      <div className="absolute inset-0">
        {heroMedia?.type === "image" ? (
          <Image
            src={heroMedia.src}
            alt={heroMedia.alt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        ) : heroMedia?.type === "video" ? (
          <video
            className="h-full w-full object-cover"
            src={heroMedia.src}
            poster={heroMedia.poster}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : null}

        {item.media.length > 1 ? (
          <div className="absolute right-4 top-4 z-20 rounded-full border border-white/12 bg-black/30 p-2 text-white/85 backdrop-blur-md">
            <Layers className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">
              {locale === "ar" ? "وسائط متعددة" : "Multiple media"}
            </span>
          </div>
        ) : null}

        {/* Readability gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent" />

        {/* Subtle highlight */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,170,0.18)_0%,transparent_60%)]" />
        </div>
      </div>

      {/* Overlay content (glass + gradient feel) */}
      <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5">
        <div />

        <div className="rounded-3xl border border-white/12 liquid-glass px-4 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.38)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
            {formatDate(locale, item.date)}
          </p>
          <h3 className="mt-2 line-clamp-2 font-goudy text-3xl leading-tight text-white/95">
            {pickText(locale, item.title)}
          </h3>
        </div>
      </div>
    </button>
  );
}

function ShowcaseModal({
  open,
  onClose,
  items,
  index,
  setIndex,
  categoryLabel,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  items: ShowcaseItem[];
  index: number;
  setIndex: (nextIndex: number) => void;
  categoryLabel: string;
  locale: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setMediaIndex(0);
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex(clampIndex(index + 1, items.length));
      if (e.key === "ArrowLeft") setIndex(clampIndex(index - 1, items.length));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, index, items.length, setIndex]);

  if (!mounted) return null;
  if (!open) return null;

  const item = items[index];
  const activeMedia = item.media[clampIndex(mediaIndex, item.media.length)];

  const content = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-9999 flex items-center justify-center px-4 py-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/65 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 18, opacity: 0, scale: 0.99 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl overflow-hidden rounded-4xl border border-white/12 liquid-glass"
          dir={locale === "ar" ? "rtl" : "ltr"}
        >
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-2">
            <div className="relative min-h-65 bg-black/20 lg:min-h-130">
              {activeMedia?.type === "image" ? (
                <Image
                  src={activeMedia.src}
                  alt={activeMedia.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : activeMedia?.type === "video" ? (
                <video
                  className="h-full w-full object-cover"
                  src={activeMedia.src}
                  poster={activeMedia.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                />
              ) : null}
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/10 to-transparent" />

              {item.media.length > 1 ? (
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setMediaIndex((prev) => clampIndex(prev - 1, item.media.length))}
                    className="rounded-full border border-white/12 bg-black/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/85 transition-colors hover:bg-black/35"
                  >
                    {locale === "ar" ? "وسائط" : "Media"} ←
                  </button>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                    {locale === "ar"
                      ? `${item.media.length} من ${clampIndex(mediaIndex, item.media.length) + 1}`
                      : `${clampIndex(mediaIndex, item.media.length) + 1} of ${item.media.length}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMediaIndex((prev) => clampIndex(prev + 1, item.media.length))}
                    className="rounded-full border border-white/12 bg-black/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/85 transition-colors hover:bg-black/35"
                  >
                    → {locale === "ar" ? "وسائط" : "Media"}
                  </button>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/65">
                    {categoryLabel}
                  </p>
                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                    {formatDate(locale, item.date)}
                  </p>
                  <h3 className="mt-3 font-goudy text-3xl leading-tight text-white/95">
                    {pickText(locale, item.title)}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/75 transition-colors hover:bg-black/30"
                >
                  {locale === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>

              <p className="mt-5 text-sm leading-7 text-white/80">
                {pickText(locale, item.description)}
              </p>

              <div className="mt-6">
                <Link
                  href={normalizeHref(locale, item.link.href)}
                  className="inline-flex items-center justify-center rounded-full border border-white/12 bg-black/25 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 transition-colors hover:bg-black/35"
                >
                  {pickText(
                    locale,
                    item.link.label ?? { en: "Open Link", ar: "فتح الرابط" },
                  )}
                </Link>
              </div>

              <div className="mt-auto flex flex-col gap-3 pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                  {locale === "ar"
                    ? `${items.length} من ${index + 1}`
                    : `${index + 1} of ${items.length}`}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIndex(clampIndex(index - 1, items.length))}
                    className="rounded-full border border-white/12 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/75 transition-colors hover:bg-black/30"
                  >
                    {locale === "ar" ? "السابق" : "Previous"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIndex(clampIndex(index + 1, items.length))}
                    className="rounded-full border border-white/12 bg-black/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/85 transition-colors hover:bg-black/35"
                  >
                    {locale === "ar" ? "التالي" : "Next"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}

export default function HomeTrioShowcaseFloor({
  active,
  onScrollUp,
  onScrollDown,
}: Props) {
  const locale = useLocale();
  const [mobileKey, setMobileKey] = useState<ColumnKey>("offers");

  const marqueeMessages =
    locale === "ar"
      ? [
          "أهلاً بكم في رويال أكاديمي — عروض هذا الشهر • أخبار جديدة • فعاليات قادمة",
          "إطلاق حصة الربيع التجريبية — احجز مكانك لتجربة مميزة في الموسيقى والرقص",
        ]
      : [
          "Welcome to Royal Academy — First Ever Dance Academy in the Region to offer Authentic certifications in Ballet",
          "Launching our Spring Trial Class — Book your spot for a transformative experience in music and dance",
        ];

  const offers: ShowcaseItem[] = useMemo(
    () => [
      {
        id: "offer-1",
        title: { en: "Spring Trial Class", ar: "حصة تجريبية للربيع" },
        description: {
          en: "Book a trial session this spring and explore your instrument with our teachers.",
          ar: "احجز حصة تجريبية هذا الربيع واكتشف آلتك مع أساتذتنا.",
        },
        date: "2026-03-28",
        link: { href: "/reservation", label: { en: "Reserve", ar: "احجز" } },
        media: [
          { type: "image", src: "/images/pianoroom.png", alt: "Piano room" },
          { type: "image", src: "/images/initial-room.png", alt: "Royal room" },
        ],
      },
      {
        id: "offer-2",
        title: { en: "Monthly Plan Bonus", ar: "ميزة للاشتراك الشهري" },
        description: {
          en: "Enroll monthly and receive an extra coaching touchpoint during your first month.",
          ar: "اشترك شهرياً واحصل على متابعة إضافية خلال الشهر الأول.",
        },
        date: "2026-04-03",
        link: { href: "/payment/monthly", label: { en: "View Plans", ar: "عرض الخطط" } },
        media: [
          { type: "image", src: "/images/guitarroom.png", alt: "Guitar room" },
          { type: "image", src: "/images/initial-room2.png", alt: "Royal room" },
        ],
      },
      {
        id: "offer-3",
        title: { en: "Dance & Wellness Pack", ar: "باقة الرقص والعافية" },
        description: {
          en: "A curated pack of sessions designed to build strength, flow, and confidence.",
          ar: "باقة مختارة من الجلسات لبناء القوة والانسجام والثقة.",
        },
        date: "2026-04-09",
        link: {
          href: "/dance-wellness",
          label: { en: "Explore", ar: "استكشف" },
        },
        media: [
          { type: "image", src: "/images/dance-hero.jpg", alt: "Dance & Wellness" },
          { type: "image", src: "/images/ballet-hero.jpg", alt: "Ballet" },
        ],
      },
    ],
    [],
  );

  const news: ShowcaseItem[] = useMemo(
    () => [
      {
        id: "news-1",
        title: { en: "New Teachers Joining", ar: "انضمام أساتذة جدد" },
        description: {
          en: "We’re expanding our teaching team across music and dance disciplines.",
          ar: "نوسع فريق التدريس لدينا عبر الموسيقى والرقص.",
        },
        date: "2026-03-18",
        link: { href: "/teachers", label: { en: "Meet Teachers", ar: "تعرف عليهم" } },
        media: [
          { type: "image", src: "/images/about-1.jpg", alt: "Academy" },
          { type: "image", src: "/images/about-2.jpg", alt: "Academy" },
        ],
      },
      {
        id: "news-2",
        title: { en: "Gallery Updates", ar: "تحديثات المعرض" },
        description: {
          en: "Fresh highlights are being added to the gallery timeline each week.",
          ar: "تضاف أبرز اللقطات إلى خط زمن المعرض أسبوعياً.",
        },
        date: "2026-03-22",
        link: { href: "/aesthetics", label: { en: "Open Gallery", ar: "فتح المعرض" } },
        media: [
          { type: "image", src: "/images/about-2.jpg", alt: "Gallery" },
          { type: "image", src: "/images/about-3.jpg", alt: "Gallery" },
        ],
      },
      {
        id: "news-3",
        title: { en: "New Rooms", ar: "قاعات جديدة" },
        description: {
          en: "We’re preparing new spaces designed for better acoustics and comfort.",
          ar: "نجهز مساحات جديدة لتحسين الصوت والراحة.",
        },
        date: "2026-03-30",
        link: { href: "/about", label: { en: "Learn More", ar: "اعرف أكثر" } },
        media: [
          { type: "image", src: "/images/initial-room4.png", alt: "Rooms" },
          { type: "image", src: "/images/initial-room3.png", alt: "Rooms" },
        ],
      },
    ],
    [],
  );

  const upcomings: ShowcaseItem[] = useMemo(
    () => [
      {
        id: "upcoming-1",
        title: { en: "Open House Week", ar: "أسبوع الأبواب المفتوحة" },
        description: {
          en: "Meet the team, explore the space, and get recommendations for your path.",
          ar: "تعرف على الفريق واستكشف المكان واحصل على توصيات لمسارك.",
        },
        date: "2026-04-12",
        link: { href: "/contact", label: { en: "Contact", ar: "تواصل" } },
        media: [
          {
            type: "video",
            src: "/images/animateddrummer.mp4",
            poster: "/images/drumsroom.png",
          },
          { type: "image", src: "/images/drumsroom.png", alt: "Drums room" },
        ],
      },
      {
        id: "upcoming-2",
        title: { en: "Student Showcase", ar: "عرض الطلاب" },
        description: {
          en: "A small stage moment for students to share progress and celebrate together.",
          ar: "لحظة على المسرح لعرض التقدم والاحتفال معاً.",
        },
        date: "2026-05-05",
        link: { href: "/aesthetics", label: { en: "See Moments", ar: "شاهد" } },
        media: [
          { type: "image", src: "/images/music-hero.jpg", alt: "Showcase" },
          { type: "image", src: "/images/initial-room.png", alt: "Royal room" },
        ],
      },
      {
        id: "upcoming-3",
        title: { en: "New Workshop Series", ar: "سلسلة ورش جديدة" },
        description: {
          en: "Focused sessions on technique, rhythm, and musicality — for all levels.",
          ar: "جلسات مركزة على التقنية والإيقاع والذوق الموسيقي — لجميع المستويات.",
        },
        date: "2026-05-20",
        link: { href: "/classes", label: { en: "Browse Classes", ar: "الصفوف" } },
        media: [
          { type: "image", src: "/images/drums.png", alt: "Workshops" },
          { type: "image", src: "/images/oud.png", alt: "Oud" },
        ],
      },
    ],
    [],
  );

  const delaysRef = useRef<Record<ColumnKey, number> | null>(null);
  if (!delaysRef.current) {
    delaysRef.current = {
      offers: Math.floor(Math.random() * ROTATE_MS),
      news: Math.floor(Math.random() * ROTATE_MS),
      upcomings: Math.floor(Math.random() * ROTATE_MS),
    };
  }

  const [modal, setModal] = useState<
    | {
        key: ColumnKey;
        index: number;
      }
    | null
  >(null);

  const [hoveredColumn, setHoveredColumn] = useState<ColumnKey | null>(null);

  const basePaused = !active || modal !== null;

  const offersRotation = useRotatingIndex({
    length: offers.length,
    intervalMs: ROTATE_MS,
    initialDelayMs: delaysRef.current.offers,
    paused: basePaused || hoveredColumn === "offers",
  });

  const newsRotation = useRotatingIndex({
    length: news.length,
    intervalMs: ROTATE_MS,
    initialDelayMs: delaysRef.current.news,
    paused: basePaused || hoveredColumn === "news",
  });

  const upcomingsRotation = useRotatingIndex({
    length: upcomings.length,
    intervalMs: ROTATE_MS,
    initialDelayMs: delaysRef.current.upcomings,
    paused: basePaused || hoveredColumn === "upcomings",
  });

  const columnOrder: Array<{ key: ColumnKey; label: LocalizedText }> = [
    { key: "offers", label: { en: "Offers", ar: "العروض" } },
    { key: "news", label: { en: "News", ar: "الأخبار" } },
    { key: "upcomings", label: { en: "Upcomings", ar: "القادم" } },
  ];

  const variants = {
    initial: { y: 48, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -44, opacity: 0 },
  };

  const mobileSelected =
    mobileKey === "offers"
      ? { key: "offers" as const, items: offers, rotation: offersRotation, label: { en: "Offers", ar: "العروض" } }
      : mobileKey === "news"
        ? { key: "news" as const, items: news, rotation: newsRotation, label: { en: "News", ar: "الأخبار" } }
        : { key: "upcomings" as const, items: upcomings, rotation: upcomingsRotation, label: { en: "Upcomings", ar: "القادم" } };

  const mobileCurrent = mobileSelected.items[mobileSelected.rotation.index];

  return (
    <section
      className="relative h-screen w-screen overflow-hidden bg-royal-purple text-royal-cream"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,215,170,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,235,180,0.05)_0%,transparent_40%,rgba(255,235,180,0.03)_100%)]" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-8xl flex-col px-4 pt-25 sm:px-6 sm:p5-20 lg:px-10 lg:pt-30 lg:pb-10">
        <div className="relative z-20 mb-3 w-full sm:mb-5 lg:mb-6">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/15 px-4 py-2 backdrop-blur-xl">
            <div dir="ltr" className="relative overflow-hidden">
              <motion.div
                style={{ willChange: "transform" }}
                className="inline-flex w-max items-center"
                animate={{ x: ["0%", "-50%"] }}
                transition={{
                  duration: 35,
                  ease: "linear",
                  repeat: Infinity,
                }}
              >
                {[...marqueeMessages, ...marqueeMessages].map((message, index) => (
                  <div
                    key={`marquee-message-${index}`}
                    className="flex shrink-0 items-center whitespace-nowrap"
                  >
                    <span className="text-[16px] font-semibold uppercase tracking-[0.26em] text-royal-cream/80 sm:text-[20px] sm:tracking-[0.3em] lg:text-[25px] lg:tracking-[0.32em]">
                      {message}
                    </span>
                    <span aria-hidden className="inline-block w-screen" />
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile / tablet: one large card with tabs (bigger media) */}
        <div className="flex flex-1 min-h-0 flex-col lg:hidden">
          <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/10 p-2 backdrop-blur-xl">
            {(
              [
                { key: "offers" as const, label: { en: "Offers", ar: "العروض" } },
                { key: "news" as const, label: { en: "News", ar: "الأخبار" } },
                { key: "upcomings" as const, label: { en: "Upcomings", ar: "القادم" } },
              ]
            ).map((tab) => {
              const activeTab = mobileKey === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMobileKey(tab.key)}
                  aria-pressed={activeTab}
                  className={
                    "flex-1 rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors " +
                    (activeTab
                      ? "border-white/18 bg-black/30 text-white/90"
                      : "border-white/10 bg-black/10 text-white/65 hover:bg-black/20")
                  }
                >
                  {pickText(locale, tab.label)}
                </button>
              );
            })}
          </div>

          <div className="relative flex flex-1 min-h-0 flex-col overflow-hidden rounded-3xl border border-white/8 bg-black/10 p-4 backdrop-blur-xl">
            {/* Engraved logo watermark */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,235,180,0.07)_0%,transparent_58%)]" />
              <div className="absolute inset-0 opacity-5">
                <Image
                  src="/images/Logo-gray-cropped.png"
                  alt="Royal Academy"
                  fill
                  sizes="100vw"
                  className="object-contain grayscale mix-blend-overlay"
                  priority={false}
                />
              </div>
              <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-12px_24px_rgba(0,0,0,0.25)]" />
            </div>

            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-gold/70">
                {pickText(locale, mobileSelected.label)}
              </p>
            </div>

            <div className="relative z-10 flex-1 min-h-0">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mobileCurrent.id}
                  variants={variants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{
                    duration: ENTER_EXIT_S,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute inset-0"
                >
                  <GlassCard
                    item={mobileCurrent}
                    title={pickText(locale, mobileSelected.label)}
                    locale={locale}
                    onClick={() =>
                      setModal({ key: mobileSelected.key, index: mobileSelected.rotation.index })
                    }
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              <button
                type="button"
                onClick={() =>
                  mobileSelected.rotation.setIndex((prev) =>
                    clampIndex(prev - 1, mobileSelected.items.length),
                  )
                }
                className="rounded-full border border-white/10 bg-black/15 px-3 py-2 transition-colors hover:bg-black/25"
              >
                <ArrowUp className="hover:cursor-pointer" />
              </button>
              <button
                type="button"
                onClick={() =>
                  mobileSelected.rotation.setIndex((prev) =>
                    clampIndex(prev + 1, mobileSelected.items.length),
                  )
                }
                className="rounded-full border border-white/10 bg-black/15 px-3 py-2 transition-colors hover:bg-black/25"
              >
                <ArrowDown className="hover:cursor-pointer" />
              </button>
            </div>
          </div>

          <ShowcaseModal
            open={modal !== null}
            onClose={() => setModal(null)}
            items={
              modal?.key === "offers"
                ? offers
                : modal?.key === "news"
                  ? news
                  : upcomings
            }
            index={modal?.index ?? 0}
            setIndex={(nextIndex) => {
              if (!modal) return;
              const itemsForKey =
                modal.key === "offers" ? offers : modal.key === "news" ? news : upcomings;
              const next = clampIndex(nextIndex, itemsForKey.length);
              setModal({ key: modal.key, index: next });
            }}
            categoryLabel={
              modal?.key === "offers"
                ? pickText(locale, { en: "Offers", ar: "العروض" })
                : modal?.key === "news"
                  ? pickText(locale, { en: "News", ar: "الأخبار" })
                  : pickText(locale, { en: "Upcomings", ar: "القادم" })
            }
            locale={locale}
          />
        </div>

        {/* Desktop: three columns */}
        <div className="hidden flex-1 grid-cols-1 gap-5 lg:grid lg:grid-cols-3 lg:gap-6">
          {columnOrder.map((col) => {
            const rotation =
              col.key === "offers"
                ? offersRotation
                : col.key === "news"
                  ? newsRotation
                  : upcomingsRotation;

            const items =
              col.key === "offers" ? offers : col.key === "news" ? news : upcomings;

            const current = items[rotation.index];

            return (
              <div
                key={col.key}
                className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/8 bg-black/10 p-5 backdrop-blur-xl sm:p-6 lg:p-10"
              >
                {/* Engraved logo watermark behind the sliding card */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,235,180,0.07)_0%,transparent_58%)]" />
                  <div className="absolute inset-0 opacity-5">
                    <Image
                      src="/images/Logo-gray-cropped.png"
                      alt="Royal Academy"
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-contain grayscale mix-blend-overlay"
                      priority={false}
                    />
                  </div>
                  <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-12px_24px_rgba(0,0,0,0.25)]" />
                </div>

                <div className="mb-2 flex items-center justify-between sm:mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-royal-gold/70">
                    {pickText(locale, col.label)}
                  </p>
                </div>

                <div className="relative z-10 flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={current.id}
                      variants={variants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{
                        duration: ENTER_EXIT_S,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="absolute inset-0"
                    >
                      <GlassCard
                        item={current}
                        title={pickText(locale, col.label)}
                        locale={locale}
                        onClick={() => setModal({ key: col.key, index: rotation.index })}
                        onMouseEnter={() => setHoveredColumn(col.key)}
                        onMouseLeave={() =>
                          setHoveredColumn((currentHovered) =>
                            currentHovered === col.key ? null : currentHovered,
                          )
                        }
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="relative z-10 mt-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45 sm:mt-4">
                  <button
                    type="button"
                    onClick={() =>
                      rotation.setIndex((prev) => clampIndex(prev - 1, items.length))
                    }
                    className="rounded-full border border-white/10 bg-black/15 px-2 py-1.5 transition-colors hover:bg-black/25 sm:px-3 sm:py-2"
                  >
                    <ArrowUp className="hover:cursor-pointer"/> 
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      rotation.setIndex((prev) => clampIndex(prev + 1, items.length))
                    }
                    className="rounded-full border border-white/10 bg-black/15 px-2 py-1.5 transition-colors hover:bg-black/25 sm:px-3 sm:py-2"
                  >
                    <ArrowDown className="hover:cursor-pointer"/>
                  </button>
                </div>

                <ShowcaseModal
                  open={modal?.key === col.key}
                  onClose={() => setModal(null)}
                  items={items}
                  index={(modal?.key === col.key ? modal.index : rotation.index) ?? rotation.index}
                  setIndex={(nextIndex) => {
                    const next = clampIndex(nextIndex, items.length);
                    setModal({ key: col.key, index: next });
                  }}
                  categoryLabel={pickText(locale, col.label)}
                  locale={locale}
                />
              </div>
            );
          })}
        </div>

        {/* <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2 py-2 backdrop-blur-xl">
            <button
              type="button"
              onClick={onScrollUp}
              className="rounded-full border border-white/10 bg-black/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75 transition-colors hover:bg-black/25"
            >
              {locale === "ar" ? "القسم السابق" : "Prev Section"}
            </button>
            <button
              type="button"
              onClick={onScrollDown}
              className="rounded-full border border-white/10 bg-black/15 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75 transition-colors hover:bg-black/25"
            >
              {locale === "ar" ? "القسم التالي" : "Next Section"}
            </button>
          </div>
        </div> */}
      </div>
    </section>
  );
}
