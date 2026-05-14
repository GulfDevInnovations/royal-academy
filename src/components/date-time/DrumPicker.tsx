"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

// ─── Theme tokens ─────────────────────────────────────────────────────────────

export const PICKER_THEMES = {
  sand: {
    popup: {
      background:
        "linear-gradient(135deg, rgba(228,208,181,0.97) 0%, rgba(220,198,168,0.95) 100%)",
      backdropFilter: "blur(24px) saturate(1.3)",
      WebkitBackdropFilter: "blur(24px) saturate(1.3)",
      border: "1px solid rgba(75,48,68,0.18)",
      boxShadow:
        "0 24px 56px rgba(0,0,0,0.22), inset 0 1px 1px rgba(255,255,255,0.35)",
    } as CSSProperties,
    track: "rgba(75,48,68,0.07)",
    selected: {
      background: "rgba(75,48,68,0.1)",
      border: "1px solid rgba(75,48,68,0.18)",
    } as CSSProperties,
    text: "#4b3044",
    textMuted: "rgba(75,48,68,0.35)",
    separator: "rgba(75,48,68,0.15)",
    chevron: "rgba(75,48,68,0.45)",
    chevronHover: "#4b3044",
    columnLabel: "rgba(75,48,68,0.5)",
    iconStroke: "rgba(75,48,68,0.55)",
    placeholder: "rgba(75,48,68,0.38)",
    triggerText: "#4b3044",
    fadeTop:
      "linear-gradient(to bottom, rgba(228,208,181,0.97) 0%, transparent 100%)",
    fadeBottom:
      "linear-gradient(to top, rgba(228,208,181,0.97) 0%, transparent 100%)",
  },
  dark: {
    popup: {
      background: "rgba(16,16,24,0.98)",
      backdropFilter: "blur(24px) saturate(1.1)",
      WebkitBackdropFilter: "blur(24px) saturate(1.1)",
      border: "1px solid rgba(255,255,255,0.07)",
      boxShadow:
        "0 24px 56px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.03)",
    } as CSSProperties,
    track: "rgba(255,255,255,0.04)",
    selected: {
      background: "rgba(245,158,11,0.15)",
      border: "1px solid rgba(245,158,11,0.3)",
    } as CSSProperties,
    text: "rgba(255,255,255,0.88)",
    textMuted: "rgba(255,255,255,0.25)",
    separator: "rgba(255,255,255,0.08)",
    chevron: "rgba(255,255,255,0.3)",
    chevronHover: "rgba(245,158,11,0.9)",
    columnLabel: "rgba(255,255,255,0.3)",
    iconStroke: "rgba(255,255,255,0.35)",
    placeholder: "rgba(255,255,255,0.25)",
    triggerText: "rgba(255,255,255,0.85)",
    fadeTop:
      "linear-gradient(to bottom, rgba(16,16,24,0.98) 0%, transparent 100%)",
    fadeBottom:
      "linear-gradient(to top, rgba(16,16,24,0.98) 0%, transparent 100%)",
  },
} as const;

export type PickerTheme = keyof typeof PICKER_THEMES;

// ─── Single drum-roll column ──────────────────────────────────────────────────

const ITEM_HEIGHT = 44; // px per row
const VISIBLE_ITEMS = 5; // rows shown (selected is centre = index 2)

type ColumnProps = {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  theme: PickerTheme;
  label?: string;
};

export function DrumColumn({
  items,
  selectedIndex,
  onSelect,
  theme,
  label,
}: ColumnProps) {
  const t = PICKER_THEMES[theme];
  const listRef = useRef<HTMLUListElement>(null);
  const [hoveredChevron, setHoveredChevron] = useState<"up" | "down" | null>(
    null,
  );

  // Scroll list so selected item is centred
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    list.scrollTop = selectedIndex * ITEM_HEIGHT;
  }, [selectedIndex]);

  // Snap to nearest item on scroll end
  const handleScroll = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const rawIndex = list.scrollTop / ITEM_HEIGHT;
    const snapped = Math.round(rawIndex);
    const clamped = Math.max(0, Math.min(items.length - 1, snapped));
    if (clamped !== selectedIndex) onSelect(clamped);
  }, [items.length, onSelect, selectedIndex]);

  const step = (delta: number) => {
    const next = Math.max(0, Math.min(items.length - 1, selectedIndex + delta));
    onSelect(next);
  };

  const containerHeight = ITEM_HEIGHT * VISIBLE_ITEMS;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      {/* Column label */}
      {label && (
        <span
          className="text-xs tracking-widest uppercase pb-1"
          style={{ color: t.columnLabel, letterSpacing: "0.12em" }}
        >
          {label}
        </span>
      )}

      {/* Up chevron */}
      <button
        type="button"
        aria-label="previous"
        onMouseEnter={() => setHoveredChevron("up")}
        onMouseLeave={() => setHoveredChevron(null)}
        onClick={() => step(-1)}
        className="flex items-center justify-center w-8 h-6 rounded-lg transition-colors duration-150 focus:outline-none"
        style={{ color: hoveredChevron === "up" ? t.chevronHover : t.chevron }}
      >
        <svg
          viewBox="0 0 12 8"
          fill="none"
          className="w-3.5 h-3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 7l5-5 5 5" />
        </svg>
      </button>

      {/* Scroll drum */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{ height: containerHeight, width: 72 }}
      >
        {/* Selected highlight */}
        <div
          className="absolute left-0 right-0 pointer-events-none rounded-xl z-10"
          style={{
            top: ITEM_HEIGHT * 2,
            height: ITEM_HEIGHT,
            ...t.selected,
          }}
        />

        {/* Fade top */}
        <div
          className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
          style={{ height: ITEM_HEIGHT * 1.5, background: t.fadeTop }}
        />

        {/* Fade bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          style={{ height: ITEM_HEIGHT * 1.5, background: t.fadeBottom }}
        />

        {/* Scrollable list */}
        <ul
          ref={listRef}
          onScroll={handleScroll}
          className="absolute inset-0 overflow-y-scroll"
          style={{
            scrollSnapType: "y mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            // padding so first/last items can reach centre
            paddingTop: ITEM_HEIGHT * 2,
            paddingBottom: ITEM_HEIGHT * 2,
          }}
        >
          {items.map((item, i) => (
            <li
              key={item}
              onClick={() => onSelect(i)}
              className="flex items-center justify-center cursor-pointer transition-all duration-150"
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
                fontSize: i === selectedIndex ? "1.25rem" : "0.95rem",
                fontWeight: i === selectedIndex ? 600 : 400,
                color:
                  i === selectedIndex
                    ? t.text
                    : Math.abs(i - selectedIndex) === 1
                      ? t.textMuted
                      : "transparent",
                fontFamily: "Tahoma, Arial, sans-serif",
                transition: "font-size 0.15s, color 0.15s, font-weight 0.15s",
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Down chevron */}
      <button
        type="button"
        aria-label="next"
        onMouseEnter={() => setHoveredChevron("down")}
        onMouseLeave={() => setHoveredChevron(null)}
        onClick={() => step(1)}
        className="flex items-center justify-center w-8 h-6 rounded-lg transition-colors duration-150 focus:outline-none"
        style={{
          color: hoveredChevron === "down" ? t.chevronHover : t.chevron,
        }}
      >
        <svg
          viewBox="0 0 12 8"
          fill="none"
          className="w-3.5 h-3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1l5 5 5-5" />
        </svg>
      </button>
    </div>
  );
}

// ─── Separator (dot or colon) ─────────────────────────────────────────────────

export function DrumSeparator({
  char,
  theme,
}: {
  char: "." | ":";
  theme: PickerTheme;
}) {
  return (
    <span
      className="text-xl font-light pb-1 self-center"
      style={{ color: PICKER_THEMES[theme].separator, userSelect: "none" }}
    >
      {char}
    </span>
  );
}
