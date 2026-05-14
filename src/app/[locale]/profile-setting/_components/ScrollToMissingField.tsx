"use client";

import { useEffect } from "react";

type ScrollToMissingFieldProps = {
  fieldIds: string[];
};

export default function ScrollToMissingField({
  fieldIds,
}: ScrollToMissingFieldProps) {
  useEffect(() => {
    if (fieldIds.length === 0) return;

    const firstId = fieldIds[0];
    const target = document.getElementById(firstId);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      target.focus();
    }
  }, [fieldIds]);

  return null;
}
