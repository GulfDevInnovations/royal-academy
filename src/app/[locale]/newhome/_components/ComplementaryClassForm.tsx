'use client';

import { useEffect, useRef, useState } from 'react';
import DatePicker from '@/components/date-time/DatePicker';
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Shared data ─────────────────────────────────────────────────────────────

interface SubClass {
  id: string;
  name: string;
  name_ar: string | null;
}

const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_AR = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const DAYS_VAL = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export const COPY = {
  title: { en: 'Book Your Free 15-Minute Class', ar: 'احجز حصتك المجانية لمدة 15 دقيقة' },
  subtitle: {
    en: 'Fill in the form below and our team will get back to you shortly.',
    ar: 'أكمل النموذج أدناه وسيتواصل معك فريقنا قريبًا.',
  },
  name: { en: 'Student Full Name', ar: 'الاسم الكامل للطالب' },
  dob: { en: 'Date of Birth', ar: 'تاريخ الميلاد' },
  program: { en: 'Music Program', ar: 'البرنامج الموسيقي' },
  selectProgram: { en: 'Select a program…', ar: 'اختر البرنامج…' },
  background: { en: 'Experience Level', ar: 'مستوى الخبرة' },
  lessThan: { en: 'Less than a year of experience', ar: 'أقل من سنة خبرة' },
  moreThan: { en: 'More than a year of experience', ar: 'أكثر من سنة خبرة' },
  contact: { en: 'Contact Number', ar: 'رقم التواصل' },
  email: { en: 'Email Address (optional)', ar: 'البريد الإلكتروني (اختياري)' },
  preferredDays: { en: 'Preferred Days', ar: 'الأيام المفضلة' },
  submit: { en: 'Submit Request', ar: 'إرسال الطلب' },
  submitting: { en: 'Submitting…', ar: 'جارٍ الإرسال…' },
  successTitle: { en: 'Request Submitted!', ar: 'تم إرسال الطلب!' },
  successBody: {
    en: 'Thank you! Our team will contact you soon to confirm your free class.',
    ar: 'شكرًا لك! سيتواصل معك فريقنا قريبًا لتأكيد حصتك المجانية.',
  },
  loadingPrograms: { en: 'Loading programs…', ar: 'جارٍ تحميل البرامج…' },
  errorPrograms: { en: 'Could not load programs.', ar: 'تعذّر تحميل البرامج.' },
  back: { en: 'Back', ar: 'رجوع' },
  close: { en: 'Close', ar: 'إغلاق' },
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  isAr: boolean;
  fontFamily: string;
  /** shown when inline (mobile): collapses back to the card */
  onCancel?: () => void;
  /** shown after success to dismiss */
  onClose?: () => void;
  mobile?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ComplementaryClassForm({
  isAr,
  fontFamily,
  onCancel,
  onClose,
  mobile = false,
}: Props) {
  const t = (key: keyof typeof COPY) => COPY[key][isAr ? 'ar' : 'en'];

  const [subClasses, setSubClasses] = useState<SubClass[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [programsError, setProgramsError] = useState('');
  const [dob, setDob] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch('/api/complementary-class')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setProgramsError(data.error);
        else setSubClasses(data.subClasses ?? []);
      })
      .catch(() => setProgramsError('Failed to load.'))
      .finally(() => setLoadingPrograms(false));
  }, []);

  const toggleDay = (val: string) =>
    setSelectedDays((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val],
    );

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError('');
    if (!dob) {
      setError(isAr ? 'يرجى اختيار تاريخ الميلاد.' : 'Please select a date of birth.');
      return;
    }
    if (selectedDays.length === 0) {
      setError(
        isAr
          ? 'يرجى اختيار يوم مفضل واحد على الأقل.'
          : 'Please select at least one preferred day.',
      );
      return;
    }

    const form = formRef.current!;
    const payload = {
      studentName: (form.querySelector('[name="studentName"]') as HTMLInputElement).value.trim(),
      dateOfBirth: dob,
      subClassId: (form.querySelector('[name="subClassId"]') as HTMLSelectElement).value,
      background: (form.querySelector('[name="background"]') as HTMLSelectElement).value,
      contactNumber: (form.querySelector('[name="contactNumber"]') as HTMLInputElement).value.trim(),
      email: (form.querySelector('[name="email"]') as HTMLInputElement).value.trim(),
      preferredDays: selectedDays,
    };

    setSubmitting(true);
    try {
      const res = await fetch('/api/complementary-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        setError(result.error ?? 'Submission failed. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid rgba(0,0,0,0.12)',
    background: 'rgba(255,255,255,0.65)',
    fontSize: mobile ? 13 : 14,
    color: '#111',
    outline: 'none',
    fontFamily,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 10,
    fontWeight: 600,
    color: 'rgba(0,0,0,0.5)',
    marginBottom: 5,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: mobile ? '20px 0 4px' : '28px 0' }}>
        <CheckCircle2
          size={mobile ? 36 : 48}
          color="#22c55e"
          style={{ margin: '0 auto 12px', display: 'block' }}
        />
        <h3
          style={{
            margin: '0 0 8px',
            fontSize: mobile ? 17 : 20,
            fontWeight: 400,
            color: '#111',
            fontFamily,
          }}
        >
          {t('successTitle')}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: mobile ? 12 : 14,
            color: 'rgba(0,0,0,0.5)',
            lineHeight: 1.7,
            fontFamily,
          }}
        >
          {t('successBody')}
        </p>
        {(onClose || onCancel) && (
          <button
            onClick={onClose ?? onCancel}
            style={{
              marginTop: 18,
              padding: '9px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#ff751f',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily,
            }}
          >
            {t('close')}
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: mobile ? 13 : 16 }}
    >
      {/* Back button (inline / mobile only) */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          style={{
            alignSelf: isAr ? 'flex-end' : 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            padding: '2px 0',
            fontSize: 12,
            color: 'rgba(0,0,0,0.4)',
            cursor: 'pointer',
            fontFamily,
            marginBottom: 2,
          }}
        >
          {isAr ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          {t('back')}
        </button>
      )}

      {/* Student Name */}
      <div>
        <label style={labelStyle}>{t('name')} *</label>
        <input
          name="studentName"
          required
          placeholder={isAr ? 'الاسم الكامل' : 'Full name'}
          style={inputStyle}
        />
      </div>

      {/* Date of Birth */}
      <div>
        <label style={labelStyle}>{t('dob')} *</label>
        <DatePicker
          id="comp-dob"
          name="dateOfBirth"
          locale={isAr ? 'ar' : 'en'}
          theme="sand"
          fieldClassName="w-full rounded-lg border text-sm focus:outline-none transition-colors"
          inputStyle={{ ...inputStyle, padding: '9px 12px' }}
          onChange={(iso) => setDob(iso)}
        />
      </div>

      {/* Program */}
      <div>
        <label style={labelStyle}>{t('program')} *</label>
        {loadingPrograms ? (
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.4)', fontFamily }}>
            {t('loadingPrograms')}
          </p>
        ) : programsError ? (
          <p style={{ margin: 0, fontSize: 12, color: '#dc2626', fontFamily }}>
            {t('errorPrograms')}
          </p>
        ) : (
          <select name="subClassId" required style={{ ...inputStyle, appearance: 'auto' }}>
            <option value="">{t('selectProgram')}</option>
            {subClasses.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {isAr && sc.name_ar ? sc.name_ar : sc.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Background */}
      <div>
        <label style={labelStyle}>{t('background')} *</label>
        <select name="background" required style={{ ...inputStyle, appearance: 'auto' }}>
          <option value="">{isAr ? 'اختر…' : 'Select…'}</option>
          <option value="LESS_THAN_ONE_YEAR">{t('lessThan')}</option>
          <option value="MORE_THAN_ONE_YEAR">{t('moreThan')}</option>
        </select>
      </div>

      {/* Contact Number */}
      <div>
        <label style={labelStyle}>{t('contact')} *</label>
        <input
          name="contactNumber"
          required
          type="tel"
          placeholder="+968 XXXX XXXX"
          style={inputStyle}
        />
      </div>

      {/* Email */}
      <div>
        <label style={labelStyle}>{t('email')}</label>
        <input
          name="email"
          type="email"
          placeholder="example@email.com"
          style={inputStyle}
        />
      </div>

      {/* Preferred Days */}
      <div>
        <label style={labelStyle}>{t('preferredDays')} *</label>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 7,
            flexDirection: isAr ? 'row-reverse' : 'row',
          }}
        >
          {DAYS_VAL.map((val, i) => {
            const selected = selectedDays.includes(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => toggleDay(val)}
                style={{
                  padding: mobile ? '5px 10px' : '6px 14px',
                  borderRadius: 20,
                  border: `1px solid ${selected ? '#ff751f' : 'rgba(0,0,0,0.12)'}`,
                  background: selected ? 'rgba(255,117,31,0.1)' : 'transparent',
                  color: selected ? '#ff751f' : 'rgba(0,0,0,0.5)',
                  fontSize: mobile ? 11 : 12,
                  fontWeight: selected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily,
                }}
              >
                {isAr ? DAYS_AR[i] : DAYS_EN[i]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            color: '#dc2626',
            background: 'rgba(220,38,38,0.06)',
            padding: '7px 11px',
            borderRadius: 6,
            fontFamily,
          }}
        >
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        style={{
          marginTop: 2,
          padding: mobile ? '10px 20px' : '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: submitting ? 'rgba(255,117,31,0.5)' : '#ff751f',
          color: '#fff',
          fontSize: mobile ? 13 : 14,
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily,
          transition: 'background 0.2s',
        }}
      >
        {submitting && <Loader2 size={14} className="animate-spin" />}
        {submitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
