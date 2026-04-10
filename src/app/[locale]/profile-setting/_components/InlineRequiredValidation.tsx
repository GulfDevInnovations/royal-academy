"use client";

import { useEffect } from "react";

type InlineRequiredValidationProps = {
  fieldIds: string[];
};

function isFieldEmpty(
  field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
) {
  if (field instanceof HTMLInputElement && field.type === "checkbox") {
    return !field.checked;
  }
  return field.value.trim().length === 0;
}

export default function InlineRequiredValidation({
  fieldIds,
}: InlineRequiredValidationProps) {
  useEffect(() => {
    const touched = new Set<string>();
    const cleanupFns: Array<() => void> = [];

    fieldIds.forEach((id) => {
      const field = document.getElementById(id) as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | null;
      const message = document.getElementById(`${id}__required`);

      if (!field || !message) return;

      const initiallyVisible = message.dataset.initialVisible === "1";

      const update = () => {
        const show = (initiallyVisible || touched.has(id)) && isFieldEmpty(field);
        message.style.display = show ? "block" : "none";
        if (show) {
          field.setAttribute("aria-invalid", "true");
          field.setAttribute("aria-describedby", `${id}__required`);
        } else {
          field.removeAttribute("aria-invalid");
          field.removeAttribute("aria-describedby");
        }
      };

      const onInput = () => {
        touched.add(id);
        update();
      };

      const onBlur = () => {
        touched.add(id);
        update();
      };

      field.addEventListener("input", onInput);
      field.addEventListener("change", onInput);
      field.addEventListener("blur", onBlur);
      update();

      cleanupFns.push(() => {
        field.removeEventListener("input", onInput);
        field.removeEventListener("change", onInput);
        field.removeEventListener("blur", onBlur);
      });
    });

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [fieldIds]);

  return null;
}
