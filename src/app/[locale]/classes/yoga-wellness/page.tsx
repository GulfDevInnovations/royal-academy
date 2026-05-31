'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function YogaWellnessPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'en';
  const isArabic = locale === 'ar';

  const content = isArabic
    ? {
        eyebrow: 'اليوغا والعافية',
        title: 'اليوغا والعافية',
        description:
          'برامج شاملة تجمع بين اليوغا والبيلاتس ومرونة الجسم والإطالة — لتحقيق التوازن الجسدي والذهني.',
        classes: [
          { label: 'يوغا', href: `/${locale}/classes/yoga-wellness/yoga` },
          { label: 'بيلاتس', href: `/${locale}/classes/yoga-wellness/pilates` },
          { label: 'مرونة الجسم', href: `/${locale}/classes/yoga-wellness/body-flexibility` },
          { label: 'التمدد والإطالة', href: `/${locale}/classes/yoga-wellness/stretching` },
        ],
        enrollment: 'التسجيل',
      }
    : {
        eyebrow: 'Yoga & Wellness',
        title: 'Yoga & Wellness',
        description:
          'Holistic programs combining yoga, Pilates, body flexibility, and stretching — for physical and mental balance.',
        classes: [
          { label: 'Yoga', href: `/${locale}/classes/yoga-wellness/yoga` },
          { label: 'Pilates', href: `/${locale}/classes/yoga-wellness/pilates` },
          { label: 'Body Flexibility', href: `/${locale}/classes/yoga-wellness/body-flexibility` },
          { label: 'Stretching', href: `/${locale}/classes/yoga-wellness/stretching` },
        ],
        enrollment: 'Enrollment',
      };

  return (
    <main
      className="relative min-h-screen overflow-x-hidden bg-royal-purple text-white"
      style={{ direction: 'ltr' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(91,58,36,0.3)_0%,rgba(24,16,11,0.9)_50%,rgba(9,6,4,1)_100%)]" />

      <div
        className="relative z-10 flex min-h-screen flex-col items-start px-4 pb-20 pt-28 sm:px-6 lg:px-10"
        style={{ direction: 'ltr' }}
      >
        <article
          dir={isArabic ? 'rtl' : 'ltr'}
          className="w-full max-w-[22rem] rounded-[1.6rem] border border-white/9 bg-[linear-gradient(180deg,rgba(26,26,26,0.2)_0%,rgba(17,17,17,0.17)_100%)] px-4 py-4 shadow-[0_24px_64px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl sm:max-w-[27rem] sm:px-5 sm:py-4"
        >
          <p
            className={`text-[0.62rem] text-white/55 ${
              isArabic ? 'font-layla text-right tracking-[0.08em]' : 'uppercase tracking-[0.34em]'
            }`}
          >
            {content.eyebrow}
          </p>
          <h1
            className={`mt-2 text-[1.72rem] leading-none text-white sm:text-[2.05rem] ${
              isArabic ? 'font-layla text-right' : 'font-goudy'
            }`}
          >
            {content.title}
          </h1>
          <p
            className={`mt-3.5 text-[0.8rem] leading-[1.35rem] text-white/82 sm:text-[0.81rem] ${
              isArabic ? 'text-right' : ''
            }`}
          >
            {content.description}
          </p>
        </article>

        <div className="mt-5 flex flex-wrap gap-3">
          {content.classes.map((cls) => (
            <Link
              key={cls.href}
              href={cls.href}
              className={`inline-flex items-center justify-center rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.08)_100%)] px-4 py-2.5 text-[0.9rem] text-white shadow-[0_18px_40px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl transition-transform duration-200 hover:scale-[1.02] ${
                isArabic ? 'font-layla' : 'font-goudy'
              }`}
            >
              {cls.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
