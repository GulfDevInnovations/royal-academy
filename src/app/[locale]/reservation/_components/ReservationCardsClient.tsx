"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { SubClassCard } from "@/lib/actions/classes";
import { SubClassCardTile } from "./SubClassCardtile";
import { PrivateClassCard } from "./PrivateClassCard";
import { Search, SlidersHorizontal, X } from "lucide-react";

const FILTERS = [
  "All",
  "Music",
  "Dance & Wellness",
  "Art",
  "Ballet",
  "Workshops",
];

const CLASS_COLORS: Record<
  string,
  { from: string; to: string; border: string }
> = {
  Music: { from: "#C9A84C22", to: "#C9A84C08", border: "#C9A84C40" },
  "Dance & Wellness": {
    from: "#A855F722",
    to: "#A855F708",
    border: "#A855F740",
  },
  Art: { from: "#F9731622", to: "#F9731608", border: "#F9731640" },
  Ballet: { from: "#EC489922", to: "#EC489908", border: "#EC489940" },
  Workshops: { from: "#10B98122", to: "#10B98108", border: "#10B98140" },
  default: { from: "#94A3B822", to: "#94A3B808", border: "#94A3B840" },
};

export { CLASS_COLORS };

interface ReservationCardsClientProps {
  subClasses: SubClassCard[];
}

export function ReservationCardsClient({
  subClasses,
}: ReservationCardsClientProps) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  // teacherId from ?teacher= param — null means no filter
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);

  // Read ?teacher=id on mount and whenever searchParams changes
  useEffect(() => {
    const paramId = searchParams.get("teacher");
    if (!paramId) {
      setTeacherId(null);
      setTeacherName(null);
      return;
    }
    setTeacherId(paramId);
    // Resolve the teacher name from the subClasses data
    for (const s of subClasses) {
      const match = s.teachers.find((t) => t.id === paramId);
      if (match) {
        setTeacherName(`${match.firstName} ${match.lastName}`);
        break;
      }
    }
  }, [searchParams, subClasses]);

  const filtered = useMemo(() => {
    return subClasses.filter((s) => {
      const matchesFilter =
        activeFilter === "All" || s.class.name === activeFilter;
      const matchesSearch =
        search.trim() === "" ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.class.name.toLowerCase().includes(search.toLowerCase()) ||
        s.teachers.some(
          (t) =>
            t.firstName.toLowerCase().includes(search.toLowerCase()) ||
            t.lastName.toLowerCase().includes(search.toLowerCase()),
        ) ||
        s.level?.toLowerCase().includes(search.toLowerCase()) ||
        false;
      // Teacher filter — only show subClasses that have this teacher
      const matchesTeacher =
        !teacherId || s.teachers.some((t) => t.id === teacherId);
      return matchesFilter && matchesSearch && matchesTeacher;
    });
  }, [subClasses, search, activeFilter, teacherId]);

  // Group by class name for section headers
  const grouped = useMemo(() => {
    const map = new Map<string, SubClassCard[]>();
    for (const s of filtered) {
      if (!map.has(s.class.name)) map.set(s.class.name, []);
      map.get(s.class.name)!.push(s);
    }
    return map;
  }, [filtered]);

  const clearTeacherFilter = () => {
    setTeacherId(null);
    setTeacherName(null);
    // Clean the URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete("teacher");
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <main
      className="min-h-screen pt-28 pb-24"
      style={{ background: "#834550" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          {/* Ornamental line */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-royal-gold/60" />
            <div className="w-1.5 h-1.5 rotate-45 bg-royal-gold" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-royal-gold/60" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-royal-gold mb-3">
            Royal Academy
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-royal-cream font-goudy leading-none">
            Our Classes
          </h1>
          <p className="text-royal-cream/50 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
            Discover the art of mastery. Choose your discipline, your pace, your
            journey.
          </p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-royal-gold/40" />
            <div className="w-1 h-1 rotate-45 bg-royal-gold/40" />
            <div className="h-px w-24 bg-royal-gold/40" />
            <div className="w-1 h-1 rotate-45 bg-royal-gold/40" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-royal-gold/40" />
          </div>
        </motion.div>

        {/* ── Active teacher filter banner ── */}
        <AnimatePresence>
          {teacherId && teacherName && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 mb-6 px-5 py-3 rounded-2xl border border-royal-gold/25 bg-royal-gold/8"
              style={{ background: "rgba(196,168,130,0.07)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-royal-gold" />
              <span className="text-royal-cream/70 text-sm font-goudy tracking-wide">
                Showing classes by{" "}
                <span className="text-royal-gold font-semibold">
                  {teacherName}
                </span>
              </span>
              <button
                onClick={clearTeacherFilter}
                className="ml-auto flex items-center gap-1.5 text-royal-cream/40 hover:text-royal-cream/80 transition-colors text-xs tracking-widest uppercase"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Search + Filter bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-4 mb-10"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-royal-cream/30" />
            <input
              type="text"
              placeholder="Search classes, teachers, levels…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full pl-11 pr-4 py-3.5 rounded-xl
                bg-white/[0.04] border border-royal-cream/10
                text-royal-cream placeholder-royal-cream/30
                text-sm focus:outline-none focus:border-royal-gold/50
                focus:bg-white/[0.06] transition-all duration-200
                font-goudy tracking-wide
              "
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <SlidersHorizontal className="w-4 h-4 text-royal-cream/30 flex-shrink-0" />
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold
                  uppercase tracking-widest transition-all duration-200
                  ${
                    activeFilter === f
                      ? "bg-royal-gold text-royal-dark shadow-lg shadow-royal-gold/20"
                      : "bg-white/[0.04] border border-royal-cream/10 text-royal-cream/50 hover:border-royal-gold/30 hover:text-royal-cream/80"
                  }
                `}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Class sections ── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="text-5xl mb-4 opacity-30">✦</div>
              <p className="text-royal-cream/40 text-lg font-goudy">
                No classes found
              </p>
              <p className="text-royal-cream/25 text-sm mt-1">
                {teacherName
                  ? `${teacherName} has no available classes`
                  : "Try adjusting your search or filter"}
              </p>
              {teacherId && (
                <button
                  onClick={clearTeacherFilter}
                  className="mt-6 text-royal-gold/60 hover:text-royal-gold text-xs tracking-widest uppercase transition-colors"
                >
                  Clear teacher filter
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...grouped.entries()].map(([className, cards], groupIdx) => (
                <div key={className} className="mb-16">
                  {activeFilter === "All" && (
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIdx * 0.05 }}
                      className="flex items-center gap-4 mb-6"
                    >
                      <h2 className="text-2xl font-bold text-royal-cream font-goudy whitespace-nowrap">
                        {className}
                      </h2>
                      <div className="h-px flex-1 bg-gradient-to-r from-royal-gold/30 to-transparent" />
                    </motion.div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {cards.map((subClass, i) => (
                      <motion.div
                        key={subClass.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: groupIdx * 0.05 + i * 0.06,
                          duration: 0.35,
                        }}
                      >
                        <SubClassCardTile subClass={subClass} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}

              {activeFilter === "All" && !teacherId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-royal-cream font-goudy whitespace-nowrap">
                      Private Classes
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-royal-gold/30 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    <PrivateClassCard />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
