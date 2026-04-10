"use client";

import { useEffect, useRef } from "react";

type UnsavedChangesGuardProps = {
  formId: string;
  message?: string;
};

function normalizeForm(form: HTMLFormElement) {
  const formData = new FormData(form);
  const pairs: string[] = [];
  formData.forEach((value, key) => {
    pairs.push(`${key}:${String(value)}`);
  });
  pairs.sort();
  return pairs.join("|");
}

export default function UnsavedChangesGuard({
  formId,
  message = "You have unsaved changes. Are you sure you want to leave?",
}: UnsavedChangesGuardProps) {
  const isDirtyRef = useRef(false);
  const initialSnapshotRef = useRef("");
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    initialSnapshotRef.current = normalizeForm(form);

    const updateDirtyState = () => {
      const current = normalizeForm(form);
      isDirtyRef.current = current !== initialSnapshotRef.current;
    };

    const onSubmit = () => {
      isSubmittingRef.current = true;
      isDirtyRef.current = false;
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current || isSubmittingRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!isDirtyRef.current || isSubmittingRef.current) return;
      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const shouldLeave = window.confirm(message);
      if (!shouldLeave) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    form.addEventListener("input", updateDirtyState);
    form.addEventListener("change", updateDirtyState);
    form.addEventListener("submit", onSubmit);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);

    return () => {
      form.removeEventListener("input", updateDirtyState);
      form.removeEventListener("change", updateDirtyState);
      form.removeEventListener("submit", onSubmit);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [formId, message]);

  return null;
}
