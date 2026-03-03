"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SubClassCard } from "@/lib/actions/classes";
import { Clock, Star, Users, ChevronRight } from "lucide-react";

const CLASS_ACCENT: Record<string, string> = {
  Music: "#C9A84C",
  "Dance & Wellness": "#A855F7",
  Art: "#F97316",
  Ballet: "#EC4899",
  Workshops: "#10B981",
  default: "#94A3B8",
};

const CLASS_GLOW: Record<string, string> = {
  Music: "rgba(201,168,76,0.15)",
  "Dance & Wellness": "rgba(168,85,247,0.15)",
  Art: "rgba(249,115,22,0.15)",
  Ballet: "rgba(236,72,153,0.15)",
  Workshops: "rgba(16,185,129,0.15)",
  default: "rgba(148,163,184,0.15)",
};

const SESSION_TYPE_LABEL: Record<string, string> = {
  PUBLIC: "Monthly",
  MUSIC: "Monthly",
  TRIAL: "Trial",
  WORKSHOP: "Workshop",
  PRIVATE: "Private",
};

interface SubClassCardTileProps {
  subClass: SubClassCard;
}

export function SubClassCardTile({ subClass }: SubClassCardTileProps) {
  const accent = CLASS_ACCENT[subClass.class.name] ?? CLASS_ACCENT.default;
  const glow = CLASS_GLOW[subClass.class.name] ?? CLASS_GLOW.default;

  const lowestPrice =
    subClass.oncePriceMonthly ?? subClass.twicePriceMonthly ?? null;

  return (
    <Link href={`/reservation/${subClass.id}`} className="block group">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="relative rounded-2xl overflow-hidden border border-royal-cream/10 cursor-pointer h-full"
        style={{
          background: `linear-gradient(145deg, #1a1610, #100e0c)`,
        }}
      >
        {/* Glow on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${glow}, transparent 70%)`,
          }}
        />

        {/* Gold shimmer border on hover */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 1px ${accent}40` }}
        />

        {/* Cover image or gradient placeholder */}
        <div className="relative h-44 overflow-hidden">
          {subClass.coverUrl ? (
            <img
              src={subClass.coverUrl}
              alt={subClass.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${accent}22, ${accent}08)`,
              }}
            >
              {/* Ornamental pattern */}
              <div className="relative">
                <div
                  className="text-5xl opacity-20 font-goudy font-bold"
                  style={{ color: accent }}
                >
                  {subClass.name[0]}
                </div>
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ color: accent }}
                >
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 80 80"
                    fill="none"
                    opacity="0.08"
                  >
                    <circle
                      cx="40"
                      cy="40"
                      r="38"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                    <path
                      d="M40 2 L40 78 M2 40 L78 40"
                      stroke="currentColor"
                      strokeWidth="0.5"
                    />
                    <rect
                      x="28"
                      y="28"
                      width="24"
                      height="24"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      transform="rotate(45 40 40)"
                    />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Gradient fade to card */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1a1610] to-transparent" />

          {/* Session type badge */}
          <div className="absolute top-3 left-3">
            <span
              className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{
                background: `${accent}22`,
                color: accent,
                border: `1px solid ${accent}40`,
              }}
            >
              {SESSION_TYPE_LABEL[subClass.sessionType] ?? subClass.sessionType}
            </span>
          </div>

          {/* Trial badge */}
          {subClass.isTrialAvailable && (
            <div className="absolute top-3 right-3">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-royal-gold/20 text-royal-gold border border-royal-gold/30">
                Trial
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
            style={{ color: accent }}
          >
            {subClass.class.name}
          </p>

          {/* Name */}
          <h3 className="text-lg font-bold text-royal-cream font-goudy leading-tight mb-1 group-hover:text-royal-gold transition-colors duration-300">
            {subClass.name}
          </h3>

          {/* Teacher */}
          {subClass.teacher && (
            <div className="flex items-center gap-2 mb-3">
              {subClass.teacher.photoUrl ? (
                <img
                  src={subClass.teacher.photoUrl}
                  alt={subClass.teacher.firstName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-royal-dark"
                  style={{ background: accent }}
                >
                  {subClass.teacher.firstName[0]}
                </div>
              )}
              <span className="text-xs text-royal-cream/50">
                {subClass.teacher.firstName} {subClass.teacher.lastName}
              </span>
            </div>
          )}

          {/* Pills row */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {subClass.level && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-royal-cream/50">
                {subClass.level}
              </span>
            )}
            {subClass.ageGroup && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-royal-cream/50">
                {subClass.ageGroup}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-royal-cream/50">
              <Clock className="w-2.5 h-2.5" />
              {subClass.durationMinutes}min
            </span>
          </div>

          {/* Divider */}
          <div
            className="h-px mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(90deg, ${accent}40, transparent)`,
            }}
          />
          <div className="h-px mb-4 bg-white/5 group-hover:hidden" />

          {/* Price + CTA */}
          <div className="flex items-end justify-between">
            <div>
              {lowestPrice ? (
                <>
                  <p className="text-[10px] text-royal-cream/30 uppercase tracking-wider">
                    from
                  </p>
                  <p
                    className="text-xl font-bold font-goudy"
                    style={{ color: accent }}
                  >
                    {lowestPrice}{" "}
                    <span className="text-xs font-normal text-royal-cream/40">
                      {subClass.currency}/mo
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[10px] text-royal-cream/30 uppercase tracking-wider">
                    trial
                  </p>
                  <p
                    className="text-xl font-bold font-goudy"
                    style={{ color: accent }}
                  >
                    {subClass.trialPrice}{" "}
                    <span className="text-xs font-normal text-royal-cream/40">
                      {subClass.currency}
                    </span>
                  </p>
                </>
              )}
            </div>

            <div
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                background: `${accent}20`,
                border: `1px solid ${accent}40`,
                color: accent,
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Bottom accent bar — slides in on hover */}
        <div
          className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-b-2xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />
      </motion.div>
    </Link>
  );
}
