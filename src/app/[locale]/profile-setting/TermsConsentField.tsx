"use client";

import { useEffect, useState, type ChangeEvent } from "react";

type TermsSection = {
  title: string;
  items: string[];
};

type TermsConsentFieldProps = {
  defaultChecked: boolean;
  checkboxClassName: string;
  label: string;
  viewTermsText: string;
  modalTitle: string;
  modalIntro: string;
  sections: TermsSection[];
  confirmLine: string;
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

export default function TermsConsentField({
  defaultChecked,
  checkboxClassName,
  label,
  viewTermsText,
  modalTitle,
  modalIntro,
  sections,
  confirmLine,
  cancelText,
  confirmText,
  acceptedHint,
  inputId = "agreePolicy",
  inputName = "agreePolicy",
  fieldA11y,
}: TermsConsentFieldProps) {
  const [agreed, setAgreed] = useState(defaultChecked);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [modalConfirmChecked, setModalConfirmChecked] = useState(false);

  useEffect(() => {
    setAgreed(defaultChecked);
  }, [defaultChecked]);

  useEffect(() => {
    const checkbox = document.getElementById(inputId) as HTMLInputElement | null;
    if (!checkbox) return;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
  }, [agreed, inputId]);

  useEffect(() => {
    if (!isPanelOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPanelOpen(false);
        setModalConfirmChecked(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPanelOpen]);

  const openModal = () => {
    setModalConfirmChecked(false);
    setIsPanelOpen(true);
  };

  const handleMainCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      openModal();
      return;
    }
    setAgreed(false);
  };

  const confirmTerms = () => {
    if (!modalConfirmChecked) return;
    setAgreed(true);
    setIsPanelOpen(false);
    setModalConfirmChecked(false);
  };

  return (
    <>
      <div className="space-y-2">
        <label htmlFor={inputId} className="flex items-start gap-3">
          <input
            id={inputId}
            type="checkbox"
            name={inputName}
            className={checkboxClassName}
            checked={agreed}
            onChange={handleMainCheckboxChange}
            required
            {...fieldA11y}
          />
          <span>
            {label} <span style={{ color: "#f87171" }}>*</span>
          </span>
        </label>
        <button
          type="button"
          onClick={openModal}
          className="text-xs underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]"
          style={{ color: "rgba(228,208,181,0.85)" }}
        >
          {viewTermsText}
        </button>
        {agreed && (
          <p className="text-xs" style={{ color: "#86efac" }}>
            {acceptedHint}
          </p>
        )}
      </div>

      {isPanelOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="terms-modal-title"
          className="mt-3 w-full rounded-3xl liquid-glass overflow-hidden"
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
                className="rounded-xl liquid-glass p-3"
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

            <div className="rounded-xl liquid-glass p-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className={checkboxClassName}
                  checked={modalConfirmChecked}
                  onChange={(event) => setModalConfirmChecked(event.target.checked)}
                />
                <span className="text-sm" style={{ color: "#f7e8cf" }}>
                  {confirmLine}
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-5 py-4">
            <button
              type="button"
              onClick={() => {
                setIsPanelOpen(false);
                setModalConfirmChecked(false);
              }}
              className="rounded-xl px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5] liquid-glass"
              style={{ color: "rgba(228,208,181,0.9)" }}
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={confirmTerms}
              disabled={!modalConfirmChecked}
              className="rounded-xl px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5] disabled:cursor-not-allowed disabled:opacity-50 liquid-glass-gold shimmer"
              style={{
                color: "#e4d0b5",
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
