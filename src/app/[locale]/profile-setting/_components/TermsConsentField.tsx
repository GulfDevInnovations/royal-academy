"use client";

import { useEffect, useState } from "react";

type TermsSection = {
  title: string;
  items: string[];
};

type TermsConsentFieldProps = {
  defaultChecked: boolean;
  checkboxClassName: string;
  label: string;
  viewTermsText: string;
  readTermsHint: string;
  acceptText: string; // e.g. "Accept" / "أقبل"
  modalTitle: string;
  modalIntro: string;
  sections: TermsSection[];
  cancelText: string;
  confirmText: string;
  acceptedHint: string;
  inputId?: string;
  inputName?: string;
  fieldA11y?: {
    "aria-invalid"?: true;
    "aria-describedby"?: string;
  };
};

// ── Shared bevel box ──────────────────────────────────────────────────────────
function BevelBox({
  active,
  size = "sm",
  children,
}: {
  active: boolean;
  size?: "sm" | "lg";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`flex-shrink-0 rounded-md flex items-center justify-center transition-all duration-200 ${
        size === "lg" ? "h-11 px-6" : "w-6 h-6"
      }`}
      style={{
        background: active
          ? "linear-gradient(145deg, #c9b89a, #e4d0b5)"
          : "linear-gradient(145deg, #c9b89a, #f0e2cc)",
        boxShadow: active
          ? "inset 2px 2px 5px rgba(0,0,0,0.25), inset -1px -1px 3px rgba(255,255,255,0.15)"
          : "3px 3px 6px rgba(0,0,0,0.2), -2px -2px 5px rgba(255,255,255,0.15)",
        border: "1px solid rgba(75,48,68,0.2)",
      }}
    >
      {children}
    </div>
  );
}

function Checkmark() {
  return (
    <svg
      viewBox="0 0 12 10"
      fill="none"
      className="w-3.5 h-3.5"
      stroke="#4b3044"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 5l3.5 3.5L11 1" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 12 8"
      fill="none"
      className="w-3 h-3 transition-transform duration-200"
      stroke="#4b3044"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M1 1l5 5 5-5" />
    </svg>
  );
}

export default function TermsConsentField({
  defaultChecked,
  label,
  viewTermsText,
  readTermsHint,
  acceptText,
  modalTitle,
  modalIntro,
  sections,
  cancelText,
  acceptedHint,
  inputId = "agreePolicy",
  inputName = "agreePolicy",
  fieldA11y,
}: TermsConsentFieldProps) {
  const [agreed, setAgreed] = useState(defaultChecked);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    setAgreed(defaultChecked);
  }, [defaultChecked]);

  useEffect(() => {
    const checkbox = document.getElementById(
      inputId,
    ) as HTMLInputElement | null;
    if (!checkbox) return;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
  }, [agreed, inputId]);

  useEffect(() => {
    if (!isPanelOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPanelOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPanelOpen]);

  const togglePanel = () => setIsPanelOpen((prev) => !prev);

  const confirmTerms = () => {
    setAgreed(true);
    setIsPanelOpen(false);
  };

  return (
    <>
      {/* Hidden input for form submission */}
      <input
        id={inputId}
        type="checkbox"
        name={inputName}
        className="sr-only"
        checked={agreed}
        onChange={() => {}}
        required
        {...fieldA11y}
      />

      <div className="space-y-2">
        {/* ── Main row: checkbox + label + chevron ──────────────────────── */}
        <div className="flex items-start gap-3">
          {/* Bevel checkbox button */}
          <button
            type="button"
            onClick={togglePanel}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]"
            aria-label={isPanelOpen ? "Hide terms" : "Show terms"}
          >
            <BevelBox active={isPanelOpen}>
              <ChevronIcon open={isPanelOpen} />
            </BevelBox>
          </button>

          {/* Label */}
          <span className="flex-1 pt-0.5">
            {label} <span style={{ color: "#f87171" }}>*</span>
          </span>
        </div>

        {/* Hint when not yet agreed */}
        {!agreed && (
          <p
            className="text-xs pl-9"
            style={{ color: "rgba(228,208,181,0.6)" }}
          >
            {readTermsHint}
          </p>
        )}

        {/* View terms link */}
        <button
          type="button"
          onClick={togglePanel}
          className="text-xs underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]"
          style={{ color: "rgba(228,208,181,0.85)" }}
        >
          {viewTermsText}
        </button>

        {/* Success hint */}
        {agreed && (
          <p className="text-xs" style={{ color: "#86efac" }}>
            {acceptedHint}
          </p>
        )}
      </div>

      {/* ── Terms panel ──────────────────────────────────────────────────── */}
      {isPanelOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="terms-modal-title"
          className="mt-3 w-full rounded-3xl liquid-glass-gold overflow-hidden"
        >
          <div className="border-b border-white/10 px-5 py-4">
            <h3
              id="terms-modal-title"
              className="text-lg tracking-wide"
              style={{ color: "#e4d0b5" }}
            >
              {modalTitle}
            </h3>
            <p
              className="mt-1 text-sm"
              style={{ color: "rgba(245,236,222,0.9)" }}
            >
              {modalIntro}
            </p>
          </div>

          <div className="max-h-[55vh] overflow-y-auto px-5 py-4 space-y-4">
            {sections.map((section) => (
              <section
                key={section.title}
                className="rounded-xl liquid-glass-gold p-3"
              >
                <h4
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: "#f2dfc1" }}
                >
                  {section.title}
                </h4>
                <ul
                  className="mt-2 list-disc space-y-1 pl-5 text-sm"
                  style={{ color: "rgba(249,239,223,0.95)" }}
                >
                  {section.items.map((item) => (
                    <li key={`${section.title}-${item}`}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* ── Footer: cancel + accept button ───────────────────────────── */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="rounded-xl px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5] liquid-glass"
              style={{ color: "rgba(228,208,181,0.9)" }}
            >
              {cancelText}
            </button>

            {/* Accept — bevel box style, wider */}
            <button
              type="button"
              onClick={confirmTerms}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]"
            >
              <BevelBox active={false} size="lg">
                <span
                  className="text-sm font-semibold tracking-wide"
                  style={{ color: "#4b3044" }}
                >
                  {acceptText}
                </span>
              </BevelBox>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
