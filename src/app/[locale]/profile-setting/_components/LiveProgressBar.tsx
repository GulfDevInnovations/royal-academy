'use client';

import { useEffect, useState } from 'react';

type Props = {
  initialCompleted: number;
  initialTotal: number;
  isArabic: boolean;
};

const CHECKBOX_FIELDS = new Set(['agreePolicy']);

const REQUIRED_NAMES = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'email',
  'phone',
  'emergencyContactName',
  'emergencyContactPhone',
  'emergencyRelationship',
  'country',
  'city',
  'preferredTrack',
  'experience',
  'agreePolicy',
];

function computeCompleted(form: HTMLFormElement): number {
  let filled = 0;
  for (const name of REQUIRED_NAMES) {
    if (CHECKBOX_FIELDS.has(name)) {
      const el = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (el?.checked) filled++;
    } else {
      const el = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
      if (el && String(el.value).trim().length > 0) filled++;
    }
  }
  return filled;
}

export default function LiveProgressBar({
  initialCompleted,
  initialTotal,
  isArabic,
}: Props) {
  const [completed, setCompleted] = useState(initialCompleted);

  useEffect(() => {
    const form = document.getElementById(
      'profile-settings-form',
    ) as HTMLFormElement | null;
    if (!form) return;

    function update() {
      if (form) setCompleted(computeCompleted(form));
    }

    update();
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    return () => {
      form.removeEventListener('input', update);
      form.removeEventListener('change', update);
    };
  }, []);

  const missing = initialTotal - completed;
  const percent =
    initialTotal > 0 ? Math.round((completed / initialTotal) * 100) : 0;

  return (
    <div className="mb-6 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: '#e4d0b5' }}>
          {isArabic ? 'تقدم الحقول المطلوبة' : 'Required Fields Progress'}
        </p>
        <p className="text-xs" style={{ color: 'rgba(228,208,181,0.75)' }}>
          {completed}/{initialTotal}
        </p>
      </div>
      <div
        className="mt-2 h-2 w-full rounded-full overflow-hidden"
        style={{ border: '1px solid rgba(228,208,181,0.22)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${percent}%`,
            background: 'rgba(228,208,181,0.55)',
          }}
        />
      </div>
      <p className="mt-2 text-xs" style={{ color: 'rgba(228,208,181,0.75)' }}>
        {missing === 0
          ? isArabic
            ? 'تم إكمال جميع الحقول المطلوبة.'
            : 'All required fields are complete.'
          : isArabic
            ? `يوجد ${missing} حقول مطلوبة ناقصة.`
            : `${missing} required fields missing.`}
      </p>
    </div>
  );
}
