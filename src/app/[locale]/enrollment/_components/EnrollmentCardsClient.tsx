'use client';

import { SubClassCard } from '@/lib/actions/classes';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PrivateClassCard } from './PrivateClassCard';
import { SubClassCardTile } from './SubClassCardtile';

const FILTER_KEYS = [
  'All',
  'Music',
  'Yoga & Wellness',
  'Art',
  'Dance',
  'Ballet',
] as const;

const CLASS_COLORS: Record<
  string,
  { from: string; to: string; border: string }
> = {
  Music: { from: '#FFE49922', to: '#FFE49908', border: '#FFE49950' },
  'Yoga & Wellness': {
    from: '#86EFCB22',
    to: '#86EFCB08',
    border: '#86EFCB50',
  },
  Art: { from: '#FDB98A22', to: '#FDB98A08', border: '#FDB98A50' },
  Dance: { from: '#E4C1FF22', to: '#E4C1FF08', border: '#E4C1FF50' },
  Ballet: { from: '#FBCFE822', to: '#FBCFE808', border: '#FBCFE850' },
  default: { from: '#E2E8F022', to: '#E2E8F008', border: '#E2E8F050' },
};

export { CLASS_COLORS };

interface EnrollmentCardsClientProps {
  subClasses: SubClassCard[];
}

export function EnrollmentCardsClient({
  subClasses,
}: EnrollmentCardsClientProps) {
  const t = useTranslations('enrollment');
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filterLabel = (key: string) => {
    switch (key) {
      case 'All': return t('filters.all');
      case 'Music': return t('filters.music');
      case 'Yoga & Wellness': return t('filters.yogaWellness');
      case 'Art': return t('filters.art');
      case 'Dance': return t('filters.dance');
      case 'Ballet': return t('filters.ballet');
      default: return key;
    }
  };
  // teacherId from ?teacher= param — null means no filter
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);

  // Optional deep-linking from the home hero:
  //   /enrollment?dept=music&q=Guitar
  // Initializes local UI state then removes these params from the URL.
  useEffect(() => {
    const dept = searchParams.get('dept');
    const q = searchParams.get('q');
    if (!dept && !q) return;

    if (dept) {
      const mapped =
        dept === 'music'
          ? 'Music'
          : dept === 'yoga'
            ? 'Yoga & Wellness'
            : dept === 'dance'
              ? 'Dance'
              : dept === 'ballet'
                ? 'Ballet'
                : dept === 'art'
                  ? 'Art'
                  : 'All';
      setActiveFilter(mapped);
    }

    if (q) setSearch(q);

    // Clean URL (keep other params like ?teacher=)
    const url = new URL(window.location.href);
    url.searchParams.delete('dept');
    url.searchParams.delete('q');
    window.history.replaceState({}, '', url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Read ?teacher=id on mount and whenever searchParams changes
  useEffect(() => {
    const paramId = searchParams.get('teacher');
    if (!paramId) {
      setTeacherId(null);
      setTeacherName(null);
      return;
    }
    setTeacherId(paramId);
    setTeacherName('');

  }, [searchParams, subClasses]);

  const filtered = useMemo(() => {
    return subClasses.filter((s) => {
      const matchesFilter =
        activeFilter === 'All' || s.class.name === activeFilter;
      const matchesSearch =
        search.trim() === '' ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.class.name.toLowerCase().includes(search.toLowerCase()) ||
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
    url.searchParams.delete('teacher');
    window.history.replaceState({}, '', url.toString());
  };

  return (
    <main
      className="min-h-screen pt-28 pb-24"
      style={{ background: '#757575' }}
    >
      {/* Background pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/pattern.svg')",
          backgroundRepeat: 'repeat',
          backgroundSize: '1600px auto',
          opacity: 0.005,
          filter: 'sepia(1) saturate(0.5) brightness(2)',
        }}
      />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          {/* Ornamental line */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 bg-linear-to-r from-transparent to-royal-gold/60" />
            <div className="w-1.5 h-1.5 rotate-45 bg-royal-gold" />
            <div className="h-px w-16 bg-linear-to-l from-transparent to-royal-gold/60" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-royal-gold mb-3">
            {t('page.subtitle')}
          </p>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-royal-cream font-goudy leading-none">
            {t('page.heading')}
          </h1>
          <p className="text-royal-cream/50 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
            {t('page.description')}
          </p>

          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-px w-8 bg-linear-to-r from-transparent to-royal-gold/40" />
            <div className="w-1 h-1 rotate-45 bg-royal-gold/40" />
            <div className="h-px w-24 bg-royal-gold/40" />
            <div className="w-1 h-1 rotate-45 bg-royal-gold/40" />
            <div className="h-px w-8 bg-linear-to-l from-transparent to-royal-gold/40" />
          </div>
        </motion.div>

        {/* ── Active package filter banner ── */}
        <AnimatePresence>
          {teacherId && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 mb-6 px-5 py-3 rounded-2xl border border-royal-gold/25"
              style={{ background: 'rgba(196,168,130,0.07)' }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-royal-gold" />
              <span className="text-royal-cream/70 text-sm font-goudy tracking-wide">
                {t('teacherBanner.filtered')}
              </span>
              <button
                onClick={clearTeacherFilter}
                className="ml-auto flex items-center gap-1.5 text-royal-cream/40 hover:text-royal-cream/80 transition-colors text-xs tracking-widest uppercase"
              >
                <X className="w-3 h-3" />
                {t('teacherBanner.clear')}
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
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full pl-11 pr-4 py-3.5 rounded-xl
                bg-white/4 border border-royal-cream/10
                text-royal-cream placeholder-royal-cream/30
                text-sm focus:outline-none focus:border-royal-gold/50
                focus:bg-white/6 transition-all duration-200
                font-goudy tracking-wide
              "
            />
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <SlidersHorizontal className="w-4 h-4 text-royal-cream/30 shrink-0" />
            {FILTER_KEYS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`
                  shrink-0 px-4 py-2 rounded-full text-xs font-semibold
                  uppercase tracking-widest transition-all duration-200
                  ${
                    activeFilter === f
                      ? 'bg-royal-gold text-royal-dark shadow-lg shadow-royal-gold/20'
                      : 'bg-white/4 border border-royal-cream/10 text-royal-cream/50 hover:border-royal-gold/30 hover:text-royal-cream/80'
                  }
                `}
              >
                {filterLabel(f)}
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
                {t('empty.title')}
              </p>
              <p className="text-royal-cream/25 text-sm mt-1">
                {teacherId
                  ? t('empty.noTeacherClasses')
                  : t('empty.adjustSearch')}
              </p>
              {teacherId && (
                <button
                  onClick={clearTeacherFilter}
                  className="mt-6 text-royal-gold/60 hover:text-royal-gold text-xs tracking-widest uppercase transition-colors"
                >
                  {t('empty.clearFilter')}
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
                  {activeFilter === 'All' && (
                    <motion.div
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIdx * 0.05 }}
                      className="flex items-center gap-4 mb-8"
                    >
                      <h2 className="text-4xl sm:text-5xl font-extrabold text-royal-cream font-goudy whitespace-nowrap tracking-tight">
                        {className}
                      </h2>
                      <div className="h-px flex-1 bg-linear-to-r from-royal-gold/30 to-transparent" />
                    </motion.div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
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

              {activeFilter === 'All' && !teacherId && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-royal-cream font-goudy whitespace-nowrap tracking-tight">
                      {t('privateClassesSection')}
                    </h2>
                    <div className="h-px flex-1 bg-linear-to-r from-royal-gold/30 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
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
