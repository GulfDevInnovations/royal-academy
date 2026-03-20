"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubClass {
  id: string;
  name: string;
  class: { id: string; name: string };
}

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  bio: string | null;
  specialties: string[];
  photoUrl: string | null;
  isAvailable: boolean;
  subClassTeachers: { subClass: SubClass }[];
  _count: { subClassTeachers: number; classSchedules: number };
}

// ─── Department colours (legend) ─────────────────────────────────────────────
const DEPT_COLORS: Record<
  string,
  { border: string; glow: string; label: string }
> = {
  Ballet: {
    border: "#d4a843",
    glow: "rgba(212,168,67,0.40)",
    label: "#e8c05a",
  },
  Dance: { border: "#c44a4a", glow: "rgba(196,74,74,0.40)", label: "#d96060" },
  Music: { border: "#4a7fc4", glow: "rgba(74,127,196,0.40)", label: "#6094d9" },
  Art: { border: "#4ab87a", glow: "rgba(74,184,122,0.40)", label: "#5dd494" },
};
function getDept(teacher: Teacher): string {
  const name = teacher.subClassTeachers[0]?.subClass?.class?.name ?? "";
  return (
    Object.keys(DEPT_COLORS).find((d) =>
      name.toLowerCase().includes(d.toLowerCase()),
    ) ?? "Ballet"
  );
}

// ─── Typing effect hook ───────────────────────────────────────────────────────
function useTyping(text: string, speed = 55, active = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const tick = () => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i < text.length) {
        rafRef.current = setTimeout(tick, speed);
      } else {
        setDone(true);
      }
    };
    rafRef.current = setTimeout(tick, 60);
    return () => {
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, [text, speed, active]);

  return { displayed, done };
}

// ─── Teacher card (main slide) ────────────────────────────────────────────────
function TeacherSlide({
  teacher,
  onDone,
  isArabic,
  onViewClasses,
}: {
  teacher: Teacher;
  onDone: () => void;
  isArabic: boolean;
  onViewClasses: (teacherId: string) => void;
}) {
  const dept = getDept(teacher);
  const color = DEPT_COLORS[dept] ?? DEPT_COLORS.Ballet;
  const fullName = `${teacher.firstName} ${teacher.lastName}`;
  const bio =
    teacher.bio ??
    "A dedicated educator bringing passion and expertise to every lesson.";
  const role =
    teacher.subClassTeachers.map((s) => s.subClass.name).join(" · ") || dept;

  const { displayed: nameTyped, done: nameDone } = useTyping(fullName, 100);
  const { displayed: roleTyped, done: roleDone } = useTyping(
    role,
    80,
    nameDone,
  );
  const { displayed: bioTyped, done: bioDone } = useTyping(bio, 38, roleDone);

  // Auto-advance after bio is done
  useEffect(() => {
    if (!bioDone) return;
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [bioDone, onDone]);

  return (
    <div
      className="w-full h-full flex"
      style={{ background: "var(--royal-dark)" }}
    >
      {/* ── Left 2/3 — typed info ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-16 py-12 relative overflow-hidden">
        {/* Subtle background grain */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            pointerEvents: "none",
          }}
        />

        {/* Dept legend pill */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 32,
            alignSelf: "flex-start",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color.border,
              boxShadow: `0 0 8px ${color.glow}`,
            }}
          />
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "0.65rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: color.label,
            }}
          >
            {dept}
          </span>
        </motion.div>

        {/* Name */}
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "clamp(2.2rem, 4vw, 3.5rem)",
            fontWeight: 400,
            lineHeight: 1.1,
            color: "rgba(222,194,171,0.97)",
            letterSpacing: "-0.01em",
            marginBottom: 12,
            minHeight: "4.5rem",
          }}
        >
          {nameTyped}
          {!nameDone && (
            <span
              style={{
                opacity: 0.6,
                animation: "blink 0.8s step-end infinite",
              }}
            >
              |
            </span>
          )}
        </div>

        {/* Role */}
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontSize: "1.05rem",
            letterSpacing: "0.04em",
            color: color.label,
            marginBottom: 36,
            minHeight: "1.6rem",
            opacity: nameDone ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        >
          {roleTyped}
          {nameDone && !roleDone && (
            <span
              style={{
                opacity: 0.6,
                animation: "blink 0.8s step-end infinite",
              }}
            >
              |
            </span>
          )}
        </div>

        <button
          onClick={() => onViewClasses(teacher.id)}
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "0.7rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: color.label,
            border: `1px solid ${color.border}`,
            padding: "12px 32px",
            borderRadius: 9999,
            background: `${color.glow}`,
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              color.border;
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--royal-dark)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              color.glow;
            (e.currentTarget as HTMLButtonElement).style.color = color.label;
          }}
        >
          {isArabic ? "عرض الفصول" : "View Classes"}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>

        {/* Gold rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: roleDone ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            height: 1,
            marginBottom: 32,
            background: `linear-gradient(to right, ${color.border}, transparent)`,
            transformOrigin: "left",
          }}
        />

        {/* Bio */}
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "1rem",
            lineHeight: 1.85,
            color: "rgba(222,194,171,0.65)",
            maxWidth: 560,
            minHeight: "7rem",
            opacity: roleDone ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        >
          {bioTyped}
          {roleDone && !bioDone && (
            <span
              style={{
                opacity: 0.6,
                animation: "blink 0.8s step-end infinite",
              }}
            >
              |
            </span>
          )}
        </div>

        {/* Specialties */}
        <AnimatePresence>
          {bioDone && teacher.specialties.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 28,
              }}
            >
              {teacher.specialties.map((s) => (
                <span
                  key={s}
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: color.label,
                    border: `1px solid ${color.border}44`,
                    padding: "5px 14px",
                    borderRadius: 9999,
                    background: `${color.glow}`,
                  }}
                >
                  {s}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <AnimatePresence>
          {bioDone && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ display: "flex", gap: 40, marginTop: 36 }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "1.8rem",
                    color: color.label,
                    lineHeight: 1,
                  }}
                >
                  {teacher._count.classSchedules}
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "rgba(222,194,171,0.4)",
                    marginTop: 4,
                  }}
                >
                  {isArabic ? "الحصص" : "Classes"}
                </div>
              </div>
              <div style={{ width: 1, background: "rgba(196,168,130,0.15)" }} />
              <div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "1.8rem",
                    color: color.label,
                    lineHeight: 1,
                  }}
                >
                  {teacher._count.subClassTeachers}
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "rgba(222,194,171,0.4)",
                    marginTop: 4,
                  }}
                >
                  {isArabic ? "التخصصات" : "Specializations"}
                </div>
              </div>
              <div style={{ width: 1, background: "rgba(196,168,130,0.15)" }} />
              <div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "1.8rem",
                    color: teacher.isAvailable ? "#8fa67a" : "#9e7070",
                    lineHeight: 1,
                  }}
                >
                  {teacher.isAvailable
                    ? isArabic
                      ? "متاح"
                      : "Open"
                    : isArabic
                      ? "مكتمل"
                      : "Full"}
                </div>
                <div
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    color: "rgba(222,194,171,0.4)",
                    marginTop: 4,
                  }}
                >
                  {isArabic ? "الحالة" : "Enrollment"}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right 1/3 — teacher photo ─────────────────────────────────────── */}
      <div
        style={{
          width: "33.333%",
          position: "relative",
          flexShrink: 0,
          borderLeft: `1px solid ${color.border}33`,
        }}
      >
        {/* Colour glow behind image */}
        {/* <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to bottom left, ${color.glow}, transparent 60%)`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        /> */}

        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {teacher.photoUrl ? (
            <Image
              src={teacher.photoUrl}
              alt={fullName}
              fill
              unoptimized
              style={{ objectFit: "cover", objectPosition: "top" }}
            />
          ) : (
            // Placeholder — elegant monogram
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // background: `linear-gradient(160deg, rgba(89,44,65,0.6) 0%, var(--royal-dark) 100%)`,
                background: "royal-dark",
              }}
            >
              <div
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "7rem",
                  fontWeight: 300,
                  color: color.border,
                  opacity: 0.35,
                  lineHeight: 1,
                  letterSpacing: "-0.05em",
                }}
              >
                {teacher.firstName[0]}
                {teacher.lastName[0]}
              </div>
            </div>
          )}
        </div>

        {/* Bottom fade into dark */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40%",
            zIndex: 2,
            background:
              "linear-gradient(to top, var(--royal-dark), transparent)",
          }}
        />

        {/* Name overlay at bottom of photo */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            left: 24,
            right: 24,
            zIndex: 3,
          }}
        >
          <div
            style={{
              width: 32,
              height: 1,
              marginBottom: 10,
              background: color.border,
            }}
          />
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "0.6rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: color.label,
            }}
          >
            {dept} · Royal Academy
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Thumbnail strip ──────────────────────────────────────────────────────────
function TeacherStrip({
  teachers,
  activeIndex,
  onSelect,
}: {
  teachers: Teacher[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        height: 200,
        background:
          "linear-gradient(to top, rgba(10,15,44,0.98) 0%, rgba(10,15,44,0.7) 100%)",
        borderTop: "1px solid rgba(196,168,130,0.12)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: 0,
        overflowX: "auto",
      }}
    >
      {teachers.map((t, i) => {
        const dept = getDept(t);
        const color = DEPT_COLORS[dept] ?? DEPT_COLORS.Ballet;
        const isActive = i === activeIndex;
        return (
          <motion.button
            key={t.id}
            onClick={() => onSelect(i)}
            whileHover={{ scale: 1.08, zIndex: 10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "relative",
              width: `${100 / teachers.length}%`,
              minWidth: 72,
              maxWidth: 120,
              height: 200,
              flexShrink: 0,
              borderRadius: 6,
              overflow: "hidden",
              border: isActive
                ? `2px solid ${color.border}`
                : "2px solid transparent",
              boxShadow: isActive ? `0 0 16px ${color.glow}` : "none",
              transition: "border 0.3s ease, box-shadow 0.3s ease",
              cursor: "pointer",
              background: "rgba(89,44,65,0.4)",
              margin: "0 4px",
            }}
          >
            {t.photoUrl ? (
              <Image
                src={t.photoUrl}
                alt={t.firstName}
                fill
                unoptimized
                style={{ objectFit: "cover", objectPosition: "top" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `linear-gradient(160deg, ${color.glow}, var(--royal-dark))`,
                  fontFamily: "Georgia, serif",
                  fontSize: "1.1rem",
                  color: color.border,
                  fontWeight: 300,
                }}
              >
                {t.firstName[0]}
                {t.lastName[0]}
              </div>
            )}
            {/* Dept colour bar at bottom */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                background: color.border,
              }}
            />
            {/* Active progress bar */}
            {isActive && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: color.border,
                  transformOrigin: "left",
                }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 208,
        left: 24,
        zIndex: 20,
        display: "flex",
        gap: 16,
        alignItems: "center",
      }}
    >
      {Object.entries(DEPT_COLORS).map(([dept, color]) => (
        <div
          key={dept}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color.border,
              boxShadow: `0 0 6px ${color.glow}`,
            }}
          />
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "0.58rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: color.label,
              opacity: 0.8,
            }}
          >
            {dept}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function TeachersSection({
  isArabic = false,
  locale = "en",
  onScrollDown,
  onScrollUp,
}: {
  isArabic?: boolean;
  locale?: string;
  onScrollDown?: () => void;
  onScrollUp?: () => void;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [key, setKey] = useState(0); // force re-mount of slide for typing reset

  // Fetch teachers
  useEffect(() => {
    fetch("/api/teachers")
      .then((r) => r.json())
      .then((data) => {
        setTeachers(data.filter((t: Teacher) => t.isAvailable));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => {
      const next = (prev + 1) % teachers.length;
      setKey((k) => k + 1);
      return next;
    });
  }, [teachers.length]);

  const goTo = useCallback((i: number) => {
    setActiveIndex(i);
    setKey((k) => k + 1);
  }, []);

  const router = useRouter();

  const handleViewClasses = useCallback(
    (teacherId: string) => {
      router.push(`/${locale}/reservation?teacher=${teacherId}`);
    },
    [router, locale],
  );

  const teacher = teachers[activeIndex];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "var(--royal-dark)",
        overflow: "hidden",
      }}
    >
      {/* Top gold rule */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          zIndex: 10,
          background:
            "linear-gradient(to right, transparent, rgba(196,168,130,0.4), transparent)",
        }}
      />
      {/* Legend */}
      <Legend />
      {/* Section label top-left */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* <div
          style={{ width: 1, height: 32, background: "rgba(196,168,130,0.3)" }}
        /> */}
        <div>
          {/* <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "0.55rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "rgba(196,168,130,0.5)",
            }}
          >
            Royal Academy
          </div>
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "0.9rem",
              letterSpacing: "0.15em",
              color: "rgba(222,194,171,0.8)",
            }}
          >
            {isArabic ? "أساتذتنا" : "Our Faculty"}
          </div> */}
        </div>
      </div>
      {/* Loading state */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid rgba(196,168,130,0.3)",
              borderTopColor: "rgba(196,168,130,0.9)",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}
      {/* Empty state */}
      {!loading && teachers.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <p
            style={{
              fontFamily: "Georgia, serif",
              color: "rgba(222,194,171,0.4)",
              fontSize: "1rem",
              letterSpacing: "0.1em",
            }}
          >
            {isArabic ? "لا يوجد أساتذة متاحون" : "No faculty available"}
          </p>
        </div>
      )}
      {/* Main slide */}
      {!loading && teacher && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${teacher.id}-${key}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0, bottom: 100 }}
          >
            <TeacherSlide
              teacher={teacher}
              onDone={goToNext}
              isArabic={isArabic}
              onViewClasses={handleViewClasses}
            />
          </motion.div>
        </AnimatePresence>
      )}
      {/* Thumbnail strip */}
      {!loading && teachers.length > 0 && (
        <TeacherStrip
          teachers={teachers}
          activeIndex={activeIndex}
          onSelect={goTo}
        />
      )}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
