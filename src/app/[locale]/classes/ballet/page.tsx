"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactNode, useState } from "react";

const BASE_BALLET_SPARKLES = [
  { id: "sparkle-1", left: "8%", top: "10%", size: "0.26rem", delay: "0s", duration: "2.1s" },
  { id: "sparkle-2", left: "16%", top: "18%", size: "0.19rem", delay: "0.8s", duration: "2.5s" },
  { id: "sparkle-3", left: "26%", top: "9%", size: "0.16rem", delay: "1.4s", duration: "2.3s" },
  { id: "sparkle-4", left: "34%", top: "22%", size: "0.22rem", delay: "0.3s", duration: "2.7s" },
  { id: "sparkle-5", left: "44%", top: "12%", size: "0.29rem", delay: "1.7s", duration: "2.4s" },
  { id: "sparkle-6", left: "56%", top: "14%", size: "0.17rem", delay: "0.5s", duration: "2.6s" },
  { id: "sparkle-7", left: "66%", top: "20%", size: "0.24rem", delay: "1.1s", duration: "2.2s" },
  { id: "sparkle-8", left: "76%", top: "11%", size: "0.16rem", delay: "0.2s", duration: "2.8s" },
  { id: "sparkle-9", left: "86%", top: "17%", size: "0.26rem", delay: "1.9s", duration: "2.45s" },
  { id: "sparkle-10", left: "14%", top: "34%", size: "0.16rem", delay: "0.6s", duration: "2.55s" },
  { id: "sparkle-11", left: "28%", top: "42%", size: "0.2rem", delay: "1.5s", duration: "2.25s" },
  { id: "sparkle-12", left: "72%", top: "38%", size: "0.19rem", delay: "0.9s", duration: "2.65s" },
  { id: "sparkle-13", left: "84%", top: "46%", size: "0.16rem", delay: "1.2s", duration: "2.35s" },
  { id: "sparkle-14", left: "11%", top: "14%", size: "0.14rem", delay: "0.4s", duration: "2.45s" },
  { id: "sparkle-15", left: "20%", top: "26%", size: "0.24rem", delay: "1.1s", duration: "2.6s" },
  { id: "sparkle-16", left: "31%", top: "15%", size: "0.17rem", delay: "1.8s", duration: "2.2s" },
  { id: "sparkle-17", left: "39%", top: "31%", size: "0.16rem", delay: "0.7s", duration: "2.75s" },
  { id: "sparkle-18", left: "48%", top: "24%", size: "0.22rem", delay: "1.3s", duration: "2.3s" },
  { id: "sparkle-19", left: "53%", top: "8%", size: "0.14rem", delay: "0.1s", duration: "2.55s" },
  { id: "sparkle-20", left: "61%", top: "29%", size: "0.2rem", delay: "1.6s", duration: "2.35s" },
  { id: "sparkle-21", left: "69%", top: "13%", size: "0.16rem", delay: "0.5s", duration: "2.7s" },
  { id: "sparkle-22", left: "78%", top: "27%", size: "0.22rem", delay: "1s", duration: "2.4s" },
  { id: "sparkle-23", left: "89%", top: "23%", size: "0.14rem", delay: "1.7s", duration: "2.6s" },
  { id: "sparkle-24", left: "22%", top: "48%", size: "0.16rem", delay: "0.2s", duration: "2.25s" },
  { id: "sparkle-25", left: "58%", top: "41%", size: "0.19rem", delay: "1.4s", duration: "2.65s" },
  { id: "sparkle-26", left: "76%", top: "44%", size: "0.17rem", delay: "0.9s", duration: "2.45s" },
] as const;

const shiftPercent = (value: string, delta: number) => {
  const numericValue = Number.parseFloat(value);
  return `${Math.min(94, Math.max(4, numericValue + delta))}%`;
};

const shiftSeconds = (value: string, delta: number) => `${(Number.parseFloat(value) + delta).toFixed(2)}s`;

const BALLET_SPARKLES = [
  ...BASE_BALLET_SPARKLES,
  ...BASE_BALLET_SPARKLES.map((sparkle) => ({
    ...sparkle,
    id: `${sparkle.id}-b`,
    left: shiftPercent(sparkle.left, 4.5),
    top: shiftPercent(sparkle.top, 8),
    delay: shiftSeconds(sparkle.delay, 0.35),
    duration: shiftSeconds(sparkle.duration, 0.2),
  })),
  ...BASE_BALLET_SPARKLES.map((sparkle) => ({
    ...sparkle,
    id: `${sparkle.id}-c`,
    left: shiftPercent(sparkle.left, -5.5),
    top: shiftPercent(sparkle.top, 13),
    delay: shiftSeconds(sparkle.delay, 0.7),
    duration: shiftSeconds(sparkle.duration, -0.15),
  })),
];

const GROUND_SPARKLE_OFFSETS = Array.from({ length: 10 }, (_, index) => index);

const BALLET_GROUND_SPARKLES = GROUND_SPARKLE_OFFSETS.flatMap((offset) =>
  BASE_BALLET_SPARKLES.map((sparkle, index) => ({
    id: `${sparkle.id}-ground-${offset}`,
    left: `${((index * 3.7 + offset * 8.9) % 96) + 2}%`,
    top: `${89.8 + ((index + offset) % 5) * 0.45}%`,
    size:
      index % 5 === 0
        ? "0.22rem"
        : index % 3 === 0
          ? "0.18rem"
          : "0.14rem",
    delay: shiftSeconds(sparkle.delay, offset * 0.12),
    duration: shiftSeconds("1.8s", (index % 4) * 0.08),
  })),
);

function LatinShortform({ children }: { children: string }) {
  return (
    <span lang="en" dir="ltr" className="inline-block font-sans tracking-normal">
      {children}
    </span>
  );
}

export default function BalletPage() {
  const [isBabyBalletOpen, setIsBabyBalletOpen] = useState(false);
  const [isRadBalletOpen, setIsRadBalletOpen] = useState(false);
  const [isOpenBalletOpen, setIsOpenBalletOpen] = useState(false);
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const reservationHref = `/${locale}/reservation`;
  const content = isArabic
    ? {
        cardEyebrow: "الأكاديمية الملكية للرقص",
        title: "باليه",
        paragraphs: [
          <>
            بصفتنا أول مدرسة باليه مسجلة في عُمان تحت إشراف الأكاديمية الملكية للرقص
            في المملكة المتحدة (<LatinShortform>RAD</LatinShortform>)، يتم تقديم
            برنامج الباليه لدينا بما يتماشى مع منهج{" "}
            <LatinShortform>RAD</LatinShortform> المعترف به دوليًا.
          </>,
          <>
            يتلقى الطلاب المسجلون في مسار <LatinShortform>RAD</LatinShortform> تدريبًا
            منظمًا ومتدرجًا، ويخضعون لامتحانات رسمية سنوية، ويحصلون على شهادات
            معتمدة دوليًا.
          </>,
          "يُنظَّم العام الأكاديمي إلى ثلاثة فصول دراسية، مع إجراء الامتحانات سنويًا في شهر مايو والحفل الختامي في شهر يونيو.",
          "أما الأفراد الذين يسعون إلى الباليه بدافع الشغف أو اللياقة أو المتعة الفنية، فنقدم لهم صفوف الباليه المفتوحة. وتحافظ هذه الصفوف على المعايير المهنية نفسها في التدريس ولكن دون متطلبات الامتحانات أو الشهادات.",
        ],
        radTrack: "المسار المعتمد",
        radTitle: (
          <>
            باليه <LatinShortform>RAD</LatinShortform>
          </>
        ),
        radDescription:
          "يُقدَّم وفق منهج الأكاديمية الملكية للرقص (لندن)، ويوفر مسارًا منظمًا ومعترفًا به دوليًا.",
        babyTrack: "المسار التمهيدي",
        babyTitle: "باليه الأطفال",
        babyDescription:
          "للطلاب الجدد الذين ليست لديهم خبرة سابقة أو لديهم ما يصل إلى 4 أشهر من التدريب في الباليه.",
        openTrack: "المسار المفتوح",
        openTitle: "صف الباليه المفتوح",
        openDescription:
          "للطلاب المتحمسين والشغوفين الذين يرغبون في الاستمتاع بالباليه دون اتباع مسار الامتحانات أو الشهادات.",
        reservationLabel: "الحجز",
      }
    : {
        cardEyebrow: "Royal Academy of Dance",
        title: "Ballet",
        paragraphs: [
          "As the first registered ballet school in Oman under the Royal Academy of Dance, UK (RAD), our Ballet Program is delivered in alignment with the internationally recognized RAD syllabus.",
          "Students enrolled in the RAD track receive structured, progressive training, undertake official annual examinations, and earn internationally accredited certification.",
          "The academic year is organized into three semesters, with examinations conducted annually in May and recital in June.",
          "For individuals pursuing ballet for passion, fitness, or artistic enjoyment, we offer Open Ballet Classes. These classes uphold the same professional teaching standards while operating without examination or certification requirements.",
        ],
        radTrack: "Certified Track",
        radTitle: "RAD Ballet",
        radDescription:
          "Delivered under the Royal Academy of Dance (London) syllabus, offering a structured and internationally recognized pathway.",
        babyTrack: "Beginner Track",
        babyTitle: "Baby Ballet",
        babyDescription:
          "For new students with no previous experience or up to 4 months of ballet training.",
        openTrack: "Open Track",
        openTitle: "Open Ballet Class",
        openDescription:
          "For enthusiastic and passionate students who wish to enjoy ballet without following an examination or certification track.",
        reservationLabel: "Reservation",
      };

  return (
    <main
      className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[#111111] text-white sm:h-screen sm:overflow-y-hidden"
      style={{ direction: "ltr" }}
    >
      <div
        className="absolute inset-0 scale-105 bg-cover bg-right bg-no-repeat blur-sm"
        style={{
          backgroundImage: "url('/images/ballet.png')",
          backgroundPosition: "calc(100% + 50px) center",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#111111_0%,rgba(17,17,17,0.98)_24%,rgba(20,20,20,0.84)_44%,rgba(24,24,24,0.32)_68%,rgba(24,24,24,0)_84%),linear-gradient(180deg,rgba(14,14,14,0.22)_0%,rgba(18,18,18,0.12)_35%,rgba(12,12,12,0.3)_100%)]" />
      <div
        className="absolute inset-0 bg-cover bg-right bg-no-repeat sm:bg-contain"
        style={{
          backgroundImage: "url('/images/ballet.png')",
          backgroundPosition: "calc(100% + 50px) center",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
        style={{ direction: "ltr" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.14)_0%,rgba(236,241,248,0.05)_26%,transparent_58%)]" />
        {BALLET_SPARKLES.map((sparkle) => (
          <span
            key={sparkle.id}
            className="ballet-violin-sparkle absolute block rounded-full"
            style={{
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
              animationDelay: sparkle.delay,
              animationDuration: sparkle.duration,
            }}
          >
            <span className="ballet-violin-sparkle-cross" />
          </span>
        ))}
        {BALLET_GROUND_SPARKLES.map((sparkle) => (
          <span
            key={sparkle.id}
            className="ballet-violin-sparkle ballet-ground-sparkle absolute block rounded-full"
            style={{
              left: sparkle.left,
              top: sparkle.top,
              width: sparkle.size,
              height: sparkle.size,
              animationDelay: sparkle.delay,
              animationDuration: sparkle.duration,
            }}
          >
            <span className="ballet-violin-sparkle-cross" />
          </span>
        ))}
        <div className="ballet-ground-sparkle-haze absolute inset-x-0 bottom-[30px] h-[8%]" />
      </div>

      <div
        className="relative z-20 flex min-h-screen flex-col items-start px-4 pb-20 pt-[104px] sm:h-screen sm:min-h-0 sm:block sm:px-6 sm:pb-6 sm:pt-[96px] lg:px-10"
        style={{ direction: "ltr" }}
      >
        <article
          dir={isArabic ? "rtl" : "ltr"}
          className="w-full max-w-[22rem] rounded-[1.6rem] border border-white/9 bg-[linear-gradient(180deg,rgba(26,26,26,0.195)_0%,rgba(17,17,17,0.17)_100%)] px-4 py-4 shadow-[0_24px_64px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl sm:absolute sm:left-6 sm:bottom-7 sm:max-w-[27rem] sm:px-5 sm:py-4 lg:left-10 lg:max-w-[28rem] xl:ml-0"
        >
          <p
            className={`text-[0.62rem] text-white/55 ${
              isArabic
                ? "font-layla text-right tracking-[0.08em]"
                : "uppercase tracking-[0.34em]"
            }`}
          >
            {content.cardEyebrow}
          </p>
          <h1
            className={`mt-2 text-[1.72rem] leading-none text-white sm:text-[2.05rem] ${
              isArabic ? "font-layla text-right" : "font-goudy"
            }`}
          >
            {content.title}
          </h1>
          <div
            className={`mt-3.5 space-y-2.5 text-[0.8rem] leading-[1.35rem] text-white/82 sm:text-[0.81rem] sm:leading-[1.32rem] ${
              isArabic ? "text-right" : ""
            }`}
          >
            {(content.paragraphs as ReactNode[]).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </article>

        <div className="relative z-20 mt-6 w-full sm:fixed sm:right-7 sm:bottom-7 sm:mt-0 sm:w-auto">
          <div className="flex w-full flex-row items-center justify-between gap-2 sm:flex-col sm:items-end sm:justify-start sm:gap-3">
          <div className="relative flex items-end justify-end">
            {isRadBalletOpen ? (
              <div
                dir={isArabic ? "rtl" : "ltr"}
                className="absolute bottom-full right-0 mb-3 w-[min(18rem,calc(100vw-2rem))] rounded-[1.25rem] border border-white/12 bg-[linear-gradient(180deg,rgba(24,24,24,0.78)_0%,rgba(12,12,12,0.72)_100%)] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl sm:bottom-0 sm:right-full sm:mb-0 sm:mr-3 sm:w-[20rem] sm:p-5"
              >
                <button
                  type="button"
                  onClick={() => setIsRadBalletOpen(false)}
                  className={`absolute top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm text-white/72 transition-colors duration-200 hover:bg-white/14 hover:text-white ${
                    isArabic ? "left-3" : "right-3"
                  }`}
                  aria-label="Close RAD Ballet details"
                >
                  ×
                </button>
                <p
                  className={`text-[0.72rem] text-white/45 ${
                    isArabic
                      ? "pl-8 font-layla text-right tracking-[0.06em]"
                      : "pr-8 uppercase tracking-[0.28em]"
                  }`}
                >
                  {content.radTrack}
                </p>
                <h2
                  className={`mt-2 text-[1.5rem] leading-none text-white ${
                    isArabic ? "font-layla text-right" : "font-goudy"
                  }`}
                >
                  {content.radTitle}
                </h2>
                <p className={`mt-3 text-[0.92rem] leading-6 text-white/82 ${isArabic ? "text-right" : ""}`}>
                  {content.radDescription}
                </p>
                <Link
                  href={reservationHref}
                  className="mt-4 inline-flex items-center rounded-full border border-white/14 bg-white/10 px-4 py-2 text-[0.88rem] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-200 hover:scale-[1.02] hover:bg-white/14"
                >
                  {content.reservationLabel}
                </Link>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setIsRadBalletOpen((open) => !open);
                setIsBabyBalletOpen(false);
                setIsOpenBalletOpen(false);
              }}
              className={`inline-flex min-w-0 whitespace-nowrap items-center justify-center rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.08)_100%)] px-2.5 py-2 text-[0.7rem] text-white shadow-[0_18px_40px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl transition-transform duration-200 hover:scale-[1.02] sm:max-w-none sm:px-4 sm:py-2.5 sm:text-[1rem] ${
                isArabic ? "font-layla" : "font-goudy"
              }`}
            >
              {content.radTitle}
            </button>
          </div>

          <div className="relative flex items-end justify-end">
            {isBabyBalletOpen ? (
              <div
                dir={isArabic ? "rtl" : "ltr"}
                className="absolute bottom-full right-0 mb-3 w-[min(18rem,calc(100vw-2rem))] rounded-[1.25rem] border border-white/12 bg-[linear-gradient(180deg,rgba(24,24,24,0.78)_0%,rgba(12,12,12,0.72)_100%)] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl sm:bottom-0 sm:right-full sm:mb-0 sm:mr-3 sm:w-[20rem] sm:p-5"
              >
                <button
                  type="button"
                  onClick={() => setIsBabyBalletOpen(false)}
                  className={`absolute top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm text-white/72 transition-colors duration-200 hover:bg-white/14 hover:text-white ${
                    isArabic ? "left-3" : "right-3"
                  }`}
                  aria-label="Close Baby Ballet details"
                >
                  ×
                </button>
                <p
                  className={`text-[0.72rem] text-white/45 ${
                    isArabic
                      ? "pl-8 font-layla text-right tracking-[0.06em]"
                      : "pr-8 uppercase tracking-[0.28em]"
                  }`}
                >
                  {content.babyTrack}
                </p>
                <h2
                  className={`mt-2 text-[1.5rem] leading-none text-white ${
                    isArabic ? "font-layla text-right" : "font-goudy"
                  }`}
                >
                  {content.babyTitle}
                </h2>
                <p className={`mt-3 text-[0.92rem] leading-6 text-white/82 ${isArabic ? "text-right" : ""}`}>
                  {content.babyDescription}
                </p>
                <Link
                  href={reservationHref}
                  className="mt-4 inline-flex items-center rounded-full border border-white/14 bg-white/10 px-4 py-2 text-[0.88rem] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-200 hover:scale-[1.02] hover:bg-white/14"
                >
                  {content.reservationLabel}
                </Link>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setIsBabyBalletOpen((open) => !open);
                setIsRadBalletOpen(false);
                setIsOpenBalletOpen(false);
              }}
              className={`inline-flex min-w-0 whitespace-nowrap items-center justify-center rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.08)_100%)] px-2.5 py-2 text-[0.7rem] text-white shadow-[0_18px_40px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl transition-transform duration-200 hover:scale-[1.02] sm:max-w-none sm:px-4 sm:py-2.5 sm:text-[1rem] ${
                isArabic ? "font-layla" : "font-goudy"
              }`}
            >
              {content.babyTitle}
            </button>
          </div>

          <div className="relative flex items-end justify-end">
            {isOpenBalletOpen ? (
              <div
                dir={isArabic ? "rtl" : "ltr"}
                className="absolute bottom-full right-0 mb-3 w-[min(18rem,calc(100vw-2rem))] rounded-[1.25rem] border border-white/12 bg-[linear-gradient(180deg,rgba(24,24,24,0.78)_0%,rgba(12,12,12,0.72)_100%)] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl sm:bottom-0 sm:right-full sm:mb-0 sm:mr-3 sm:w-[20rem] sm:p-5"
              >
                <button
                  type="button"
                  onClick={() => setIsOpenBalletOpen(false)}
                  className={`absolute top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/8 text-sm text-white/72 transition-colors duration-200 hover:bg-white/14 hover:text-white ${
                    isArabic ? "left-3" : "right-3"
                  }`}
                  aria-label="Close Open Ballet Class details"
                >
                  ×
                </button>
                <p
                  className={`text-[0.72rem] text-white/45 ${
                    isArabic
                      ? "pl-8 font-layla text-right tracking-[0.06em]"
                      : "pr-8 uppercase tracking-[0.28em]"
                  }`}
                >
                  {content.openTrack}
                </p>
                <h2
                  className={`mt-2 text-[1.5rem] leading-none text-white ${
                    isArabic ? "font-layla text-right" : "font-goudy"
                  }`}
                >
                  {content.openTitle}
                </h2>
                <p className={`mt-3 text-[0.92rem] leading-6 text-white/82 ${isArabic ? "text-right" : ""}`}>
                  {content.openDescription}
                </p>
                <Link
                  href={reservationHref}
                  className="mt-4 inline-flex items-center rounded-full border border-white/14 bg-white/10 px-4 py-2 text-[0.88rem] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-200 hover:scale-[1.02] hover:bg-white/14"
                >
                  {content.reservationLabel}
                </Link>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setIsOpenBalletOpen((open) => !open);
                setIsBabyBalletOpen(false);
                setIsRadBalletOpen(false);
              }}
              className={`inline-flex min-w-0 whitespace-nowrap items-center justify-center rounded-full border border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.08)_100%)] px-2.5 py-2 text-[0.7rem] text-white shadow-[0_18px_40px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-xl transition-transform duration-200 hover:scale-[1.02] sm:max-w-none sm:px-4 sm:py-2.5 sm:text-[1rem] ${
                isArabic ? "font-layla" : "font-goudy"
              }`}
            >
              {content.openTitle}
            </button>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
