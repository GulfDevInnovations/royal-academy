"use client";

import Image from "next/image";
import { useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Wifi,
  ChevronLeft,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────
interface Workshop {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  imageUrls: string[];
  videoUrls: string[];
  startTime: string;
  endTime: string;
  eventDate: string;
  capacity: number;
  enrolledCount: number;
  price: number;
  currency: string;
  isOnline: boolean;
  onlineLink: string | null;
  isActive: boolean;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    bio: string | null;
    photoUrl: string | null;
    specialties: string[];
  } | null;
  room: {
    id: string;
    name: string;
    location: string | null;
    capacity: number;
  } | null;
}

interface Props {
  workshop: Workshop;
}

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

// ── Media viewer ──────────────────────────────────────────────
function MediaGallery({
  imageUrls,
  videoUrls,
  coverUrl,
  title,
}: {
  imageUrls: string[];
  videoUrls: string[];
  coverUrl: string | null;
  title: string;
}) {
  const allMedia = [
    ...imageUrls.map((url) => ({ type: "image" as const, url })),
    ...videoUrls.map((url) => ({ type: "video" as const, url })),
  ];
  if (allMedia.length === 0 && coverUrl) {
    allMedia.push({ type: "image", url: coverUrl });
  }

  const [active, setActive] = useState(0);
  if (allMedia.length === 0) return null;

  const current = allMedia[active];

  return (
    <div className="space-y-3">
      {/* Main viewer */}
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ aspectRatio: "16/9", background: "#111" }}
      >
        {current.type === "image" ? (
          <img
            src={current.url}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={current.url}
            controls
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Thumbnails */}
      {allMedia.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allMedia.map((m, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="flex-shrink-0 rounded-xl overflow-hidden transition-all"
              style={{
                width: 72,
                height: 52,
                border:
                  i === active
                    ? "2px solid rgba(196,168,120,0.8)"
                    : "2px solid transparent",
                opacity: i === active ? 1 : 0.6,
              }}
            >
              {m.type === "image" ? (
                <img
                  src={m.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <video src={m.url} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export default function WorkshopDetailClient({ workshop }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const seatsLeft = workshop.capacity - workshop.enrolledCount;
  const isFull = seatsLeft <= 0;
  const isPast = new Date(workshop.eventDate) < new Date();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-royal-dark, #0e0d0b)" }}
    >
      {/* Top nav bar */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b"
        style={{
          background: "rgba(14,13,11,0.85)",
          backdropFilter: "blur(12px)",
          borderColor: "rgba(196,168,120,0.12)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "rgba(222,194,158,0.7)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "rgba(222,194,158,1)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(222,194,158,0.7)")
          }
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-full transition-all"
          style={{
            background: "rgba(196,168,120,0.1)",
            border: "1px solid rgba(196,168,120,0.2)",
            color: "rgba(222,194,158,0.8)",
          }}
        >
          {copied ? <CheckCircle2 size={14} /> : <Share2 size={14} />}
          {copied ? "Copied!" : "Share"}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── Left: media ── */}
          <div className="space-y-6">
            <MediaGallery
              imageUrls={workshop.imageUrls}
              videoUrls={workshop.videoUrls}
              coverUrl={workshop.coverUrl}
              title={workshop.title}
            />
          </div>

          {/* ── Right: info + actions ── */}
          <div className="space-y-6">
            {/* Workshop badge + title */}
            <div>
              <span
                className="liquid-glass-green shimmer inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-3"
                style={{ color: "var(--color-royal-green, #1a5c3a)" }}
              >
                Workshop
              </span>

              <h1
                className="text-3xl font-bold leading-tight"
                style={{
                  fontFamily: "var(--font-text)",
                  color: "rgba(222,194,158,1)",
                }}
              >
                {workshop.title}
              </h1>
            </div>

            {/* Meta info */}
            <div className="space-y-3">
              {[
                {
                  icon: <CalendarDays size={15} />,
                  value: fmtDate(workshop.eventDate),
                },
                {
                  icon: <Clock size={15} />,
                  value: `${fmtTime(workshop.startTime)} – ${fmtTime(workshop.endTime)}`,
                },
                workshop.isOnline
                  ? { icon: <Wifi size={15} />, value: "Online Workshop" }
                  : workshop.room
                    ? {
                        icon: <MapPin size={15} />,
                        value: `${workshop.room.name}${workshop.room.location ? ` · ${workshop.room.location}` : ""}`,
                      }
                    : null,
                {
                  icon: <Users size={15} />,
                  value: isFull
                    ? "Fully booked"
                    : `${seatsLeft} seat${seatsLeft !== 1 ? "s" : ""} remaining`,
                  color: isFull ? "#f87171" : undefined,
                },
              ]
                .filter(Boolean)
                .map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      style={{ color: "rgba(196,168,120,0.6)", flexShrink: 0 }}
                    >
                      {item!.icon}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: item!.color ?? "rgba(222,194,158,0.75)" }}
                    >
                      {item!.value}
                    </span>
                  </div>
                ))}
            </div>

            {/* Price + CTA */}
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{
                background: "rgba(196,168,120,0.05)",
                border: "1px solid rgba(196,168,120,0.15)",
              }}
            >
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-bold"
                  style={{
                    color: "rgba(196,168,120,1)",
                    fontFamily: "var(--font-text)",
                  }}
                >
                  {workshop.currency} {workshop.price.toFixed(3)}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "rgba(222,194,158,0.4)" }}
                >
                  per person
                </span>
              </div>

              {/* Seat progress */}
              <div className="space-y-1.5">
                <div
                  className="flex justify-between text-xs"
                  style={{ color: "rgba(222,194,158,0.4)" }}
                >
                  <span>Availability</span>
                  <span>
                    {workshop.enrolledCount}/{workshop.capacity} enrolled
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((workshop.enrolledCount / workshop.capacity) * 100, 100)}%`,
                      background: isFull
                        ? "#f87171"
                        : "linear-gradient(to right, rgba(196,168,120,0.6), rgba(196,168,120,1))",
                    }}
                  />
                </div>
              </div>

              {/* Register button */}
              {isPast ? (
                <div
                  className="w-full py-3 rounded-xl text-center text-sm font-medium"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(222,194,158,0.35)",
                  }}
                >
                  This workshop has ended
                </div>
              ) : !workshop.isActive ? (
                <div
                  className="w-full py-3 rounded-xl text-center text-sm font-medium"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(222,194,158,0.35)",
                  }}
                >
                  Registration not available
                </div>
              ) : isFull ? (
                <div
                  className="w-full py-3 rounded-xl text-center text-sm font-medium"
                  style={{
                    background: "rgba(248,113,113,0.1)",
                    color: "#f87171",
                    border: "1px solid rgba(248,113,113,0.2)",
                  }}
                >
                  Fully Booked
                </div>
              ) : (
                <button
                  className="liquid-glass-green shimmer w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase transition-all"
                  style={{ color: "var(--color-royal-green, #1a5c3a)" }}
                >
                  Register Now
                </button>
              )}

              <p
                className="text-[11px] text-center"
                style={{ color: "rgba(222,194,158,0.3)" }}
              >
                Secure your spot · Payment on confirmation
              </p>
            </div>

            {/* Teacher */}
            {workshop.teacher && (
              <div
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{
                  background: "rgba(196,168,120,0.04)",
                  border: "1px solid rgba(196,168,120,0.1)",
                }}
              >
                {workshop.teacher.photoUrl ? (
                  <img
                    src={workshop.teacher.photoUrl}
                    alt={`${workshop.teacher.firstName} ${workshop.teacher.lastName}`}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    style={{ border: "2px solid rgba(196,168,120,0.3)" }}
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{
                      background: "rgba(196,168,120,0.15)",
                      color: "rgba(196,168,120,0.8)",
                      border: "2px solid rgba(196,168,120,0.3)",
                    }}
                  >
                    {workshop.teacher.firstName[0]}
                    {workshop.teacher.lastName[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "rgba(222,194,158,0.9)" }}
                  >
                    {workshop.teacher.firstName} {workshop.teacher.lastName}
                  </p>
                  {workshop.teacher.bio && (
                    <p
                      className="text-xs mt-1 line-clamp-3"
                      style={{ color: "rgba(222,194,158,0.5)" }}
                    >
                      {workshop.teacher.bio}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {workshop.description && (
          <div
            className="mt-10 pt-8 border-t"
            style={{ borderColor: "rgba(196,168,120,0.1)" }}
          >
            <h2
              className="text-lg font-semibold mb-4"
              style={{
                color: "rgba(222,194,158,0.9)",
                fontFamily: "var(--font-text)",
              }}
            >
              About this Workshop
            </h2>
            <p
              className="text-sm leading-relaxed whitespace-pre-line"
              style={{ color: "rgba(222,194,158,0.6)" }}
            >
              {workshop.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
