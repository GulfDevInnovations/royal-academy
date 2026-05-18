'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Props = {
  formId: string;
  leaveLabel?: string;
  stayLabel?: string;
  title?: string;
  body?: string;
};

function normalizeForm(form: HTMLFormElement) {
  const pairs: string[] = [];
  new FormData(form).forEach((value, key) => {
    pairs.push(`${key}:${String(value)}`);
  });
  return pairs.sort().join('|');
}

export default function UnsavedChangesGuard({
  formId,
  leaveLabel = 'Leave',
  stayLabel = 'Stay',
  title = 'Unsaved Changes',
  body = 'You have unsaved changes. Are you sure you want to leave?',
}: Props) {
  const router = useRouter();
  const isDirtyRef = useRef(false);
  const initialSnapshotRef = useRef('');
  const isSubmittingRef = useRef(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    initialSnapshotRef.current = normalizeForm(form);

    const updateDirty = () => {
      isDirtyRef.current = normalizeForm(form) !== initialSnapshotRef.current;
    };

    const onSubmit = () => {
      isSubmittingRef.current = true;
      isDirtyRef.current = false;
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current || isSubmittingRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };

    const onDocumentClick = (e: MouseEvent) => {
      if (!isDirtyRef.current || isSubmittingRef.current) return;
      const anchor = (e.target as Element)?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
    };

    form.addEventListener('input', updateDirty);
    form.addEventListener('change', updateDirty);
    form.addEventListener('submit', onSubmit);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onDocumentClick, true);

    return () => {
      form.removeEventListener('input', updateDirty);
      form.removeEventListener('change', updateDirty);
      form.removeEventListener('submit', onSubmit);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onDocumentClick, true);
    };
  }, [formId]);

  function handleLeave() {
    if (!pendingHref) return;
    isDirtyRef.current = false;
    setPendingHref(null);
    router.push(pendingHref);
  }

  function handleStay() {
    setPendingHref(null);
  }

  if (!pendingHref) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={handleStay}
    >
      <div
        className="w-full max-w-sm rounded-3xl px-8 py-8 shadow-2xl"
        style={{ background: '#e4d0b5' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className="text-lg font-semibold tracking-wide mb-2"
          style={{ color: '#000' }}
        >
          {title}
        </h2>
        <p className="text-sm mb-8" style={{ color: '#111' }}>
          {body}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleLeave}
            className="flex-1 rounded-2xl py-2.5 text-sm tracking-widest uppercase transition-opacity hover:opacity-70"
            style={{ background: '#111', color: '#e4d0b5' }}
          >
            {leaveLabel}
          </button>
          <button
            type="button"
            onClick={handleStay}
            className="flex-1 rounded-2xl py-2.5 text-sm tracking-widest uppercase border transition-opacity hover:opacity-70"
            style={{ borderColor: '#111', color: '#000', background: 'transparent' }}
          >
            {stayLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
