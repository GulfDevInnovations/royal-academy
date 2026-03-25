//@ts-ignore
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const STAFF_ROWS = Array.from({ length: 8 }, (_, index) => ({
  id: `staff-row-${index + 1}`,
  top: 120 + index * 210,
}));

const BAR_LINES = [0.16, 0.34, 0.52, 0.7, 0.88] as const;

const RAINING_NOTES = [
  { id: "rain-note-1", symbol: "♪", left: "6%", delay: "0s", duration: "9.2s", size: "2.1rem" },
  { id: "rain-note-2", symbol: "♫", left: "14%", delay: "0.8s", duration: "8.6s", size: "2.4rem" },
  { id: "rain-note-3", symbol: "♬", left: "22%", delay: "1.6s", duration: "9.8s", size: "2.2rem" },
  { id: "rain-note-4", symbol: "♩", left: "31%", delay: "0.4s", duration: "8.9s", size: "2rem" },
  { id: "rain-note-5", symbol: "♪", left: "40%", delay: "2.1s", duration: "9.4s", size: "2.3rem" },
  { id: "rain-note-6", symbol: "♫", left: "49%", delay: "1.2s", duration: "8.7s", size: "2.5rem" },
  { id: "rain-note-7", symbol: "♬", left: "58%", delay: "2.8s", duration: "9.9s", size: "2.2rem" },
  { id: "rain-note-8", symbol: "♩", left: "67%", delay: "0.9s", duration: "8.5s", size: "1.95rem" },
  { id: "rain-note-9", symbol: "♪", left: "76%", delay: "1.9s", duration: "9.1s", size: "2.15rem" },
  { id: "rain-note-10", symbol: "♫", left: "85%", delay: "0.3s", duration: "8.8s", size: "2.35rem" },
  { id: "rain-note-11", symbol: "♬", left: "92%", delay: "2.5s", duration: "9.6s", size: "2.1rem" },
] as const;

const LESSON_SECTIONS = [
  {
    title: "What is Sight Reading?",
    body: [
      "That means:",
      "You see the music for the first time.",
      "And you play or sing it right away.",
      "No memorizing. No rehearsal. Just reading and performing.",
    ],
    highlighted: true,
  },
  {
    title: "What We Do in This Class",
    body: ["In sight reading class, we train your brain and eyes to understand music quickly."],
    highlighted: false,
  },
  {
    title: "1. Reading Music Notation",
    body: [
      "You'll learn how to instantly recognize:",
      "Notes (C, D, E...)",
      "Rhythms (quarter notes, eighth notes)",
      "Clefs (treble, bass)",
      "Key signatures and time signatures",
    ],
    highlighted: false,
  },
  {
    title: "2. Rhythm Practice",
    body: [
      "Before playing, we often:",
      "Clap rhythms",
      "Count beats out loud",
      "Tap patterns",
      "Because rhythm is the foundation of music.",
    ],
    highlighted: false,
  },
  {
    title: "3. Playing at First Sight",
    body: [
      "You'll be given a short piece and asked to:",
      "Look at it briefly.",
      "Then play it immediately.",
      "Don't worry about mistakes — the goal is flow, not perfection.",
    ],
    highlighted: false,
  },
  {
    title: "4. Training Your Musical Eye",
    body: [
      "You'll learn to quickly spot:",
      "Patterns (scales, chords)",
      "Repeating sections",
      "Intervals (distance between notes)",
      "This helps you read faster and smarter.",
    ],
    highlighted: false,
  },
  {
    title: "5. Listening and Predicting",
    body: [
      "You'll start to hear the music in your head before playing it.",
      "This is called audiation — a powerful skill musicians use.",
    ],
    highlighted: false,
  },
  {
    title: "Why Sight Reading is Important",
    body: [
      "Makes you learn new songs faster",
      "Helps in exams and performances",
      "Improves coordination",
      "Builds confidence",
      "Essential for professional musicians",
    ],
    highlighted: false,
  },
  {
    title: "What I Expect From You",
    body: [
      "Don't stop when you make a mistake.",
      "Keep the rhythm going.",
      "Focus on reading ahead.",
      "Practice regularly.",
    ],
    highlighted: false,
  },
  {
    title: "Think of It Like This",
    body: [
      "Sight reading is like reading a book out loud.",
      "Or speaking a new language fluently.",
      "The more you practice, the more natural it becomes.",
    ],
    highlighted: false,
  },
  {
    title: "Final Thought",
    body: [
      "In this class, mistakes are not failures — they are part of learning.",
      "So relax, stay focused, and let's make music together.",
    ],
    highlighted: false,
  },
] as const;

export default function SightReadingPage() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const content = isArabic
    ? {
        title: "مرحبًا بكم في صف القراءة الموسيقية!",
        reserveCta: "اذهب إلى الحجز",
        sections: [
          {
            title: "ما هي القراءة الموسيقية؟",
            body: [
              "هذا يعني:",
              "أن ترى الموسيقى لأول مرة.",
              "وأن تعزفها أو تغنيها مباشرة.",
              "من دون حفظ. من دون تدريب مسبق. فقط قراءة وأداء.",
            ],
            highlighted: true,
          },
          {
            title: "ماذا نفعل في هذه الحصة؟",
            body: ["في حصة القراءة الموسيقية ندرّب عينيك وذهنك على فهم الموسيقى بسرعة."],
            highlighted: false,
          },
          {
            title: "1. قراءة النوتة الموسيقية",
            body: [
              "ستتعلّم كيف تتعرّف فورًا على:",
              "النغمات (دو، ري، مي...)",
              "الإيقاعات (الربع، والثمن)",
              "المفاتيح الموسيقية (صول، فا)",
              "علامات المفتاح والميزان",
            ],
            highlighted: false,
          },
          {
            title: "2. تدريب الإيقاع",
            body: [
              "قبل العزف نقوم غالبًا بـ:",
              "التصفيق على الإيقاع",
              "عدّ النبضات بصوت عالٍ",
              "الطرق على الأنماط",
              "لأن الإيقاع هو أساس الموسيقى.",
            ],
            highlighted: false,
          },
          {
            title: "3. العزف من النظرة الأولى",
            body: [
              "سيُعطى لك لحن قصير ويُطلب منك أن:",
              "تنظر إليه سريعًا.",
              "ثم تعزفه مباشرة.",
              "لا تقلق من الأخطاء، فالهدف هو الاستمرار لا الكمال.",
            ],
            highlighted: false,
          },
          {
            title: "4. تدريب العين الموسيقية",
            body: [
              "ستتعلّم كيف تلاحظ بسرعة:",
              "الأنماط مثل السلالم والتآلفات",
              "الأجزاء المتكررة",
              "المسافات بين النغمات",
              "وهذا يساعدك على القراءة بشكل أسرع وأذكى.",
            ],
            highlighted: false,
          },
          {
            title: "5. السماع والتوقع",
            body: [
              "ستبدأ بسماع الموسيقى في ذهنك قبل أن تعزفها.",
              "وتُسمّى هذه المهارة السماع الداخلي، وهي مهارة قوية يستخدمها الموسيقيون.",
            ],
            highlighted: false,
          },
          {
            title: "لماذا القراءة الموسيقية مهمة؟",
            body: [
              "تجعلك تتعلم الأغاني الجديدة بسرعة أكبر",
              "تساعدك في الامتحانات والعروض",
              "تحسن التناسق",
              "تبني الثقة",
              "وهي أساسية للموسيقيين المحترفين",
            ],
            highlighted: false,
          },
          {
            title: "ما الذي أتوقعه منك؟",
            body: [
              "لا تتوقف عندما تخطئ.",
              "حافظ على الإيقاع مستمرًا.",
              "ركّز على القراءة المسبقة.",
              "تدرّب بانتظام.",
            ],
            highlighted: false,
          },
          {
            title: "فكّر فيها بهذه الطريقة",
            body: [
              "القراءة الموسيقية تشبه قراءة كتاب بصوت عالٍ.",
              "أو التحدث بلغة جديدة بطلاقة.",
              "كلما تدربت أكثر أصبحت أكثر طبيعية.",
            ],
            highlighted: false,
          },
          {
            title: "الفكرة الأخيرة",
            body: [
              "في هذه الحصة الأخطاء ليست فشلًا، بل جزء من التعلّم.",
              "لذلك استرخِ، وابقَ مركزًا، ولنصنع الموسيقى معًا.",
            ],
            highlighted: false,
          },
        ],
      }
    : {
        title: "Welcome to Sight Reading Class!",
        reserveCta: "Go to reservation",
        sections: LESSON_SECTIONS,
      };

  return (
    <main className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(255,239,219,0.14)_0%,rgba(67,41,35,0.66)_36%,rgba(19,12,16,0.92)_72%,rgba(10,8,12,1)_100%)] [--staff-gap:14px] [--staff-row-step:168px] [--staff-start:96px] sm:[--staff-gap:18px] sm:[--staff-row-step:188px] sm:[--staff-start:108px] xl:h-screen xl:overflow-hidden xl:[--staff-gap:22px] xl:[--staff-row-step:210px] xl:[--staff-start:120px]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,233,206,0.06)_0%,rgba(0,0,0,0.18)_100%)]" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {STAFF_ROWS.map((row, index) => (
          <div
            key={row.id}
            className="absolute left-0 right-0"
            style={{ top: `calc(var(--staff-start) + ${index} * var(--staff-row-step))` }}
          >
            {[0, 1, 2, 3, 4].map((lineIndex) => (
              <div
                key={`${row.id}-line-${lineIndex}`}
                className="absolute left-0 right-0 border-t border-[#e6b78e]/30"
                style={{ top: `calc(${lineIndex} * var(--staff-gap))` }}
              />
            ))}

            {BAR_LINES.map((position, index) => (
              <div
                key={`${row.id}-bar-${index}`}
                className={`absolute w-px bg-[#e6b78e]/30 ${
                  index % 2 === 1 ? "hidden sm:block" : ""
                }`}
                style={{
                  left: `${position * 100}%`,
                  top: 0,
                  height: "calc(var(--staff-gap) * 4)",
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {RAINING_NOTES.map((note) => (
          <span
            key={note.id}
            aria-hidden="true"
            className="absolute top-[-18%] text-[#e6b78e]/80 drop-shadow-[0_12px_18px_rgba(0,0,0,0.24)]"
            style={{
              left: note.left,
              fontSize: note.size,
              animation: `sightreading-note-rain ${note.duration} linear ${note.delay} infinite`,
            }}
          >
            {note.symbol}
          </span>
        ))}
      </div>

      <section
        className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 pb-10 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pb-12 xl:h-full xl:pb-4 xl:pt-[112px]"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <p className="text-center font-goudy text-[1.1rem] leading-tight text-[#f4dec5] sm:text-[1.25rem] lg:text-[1.4rem]">
          {content.title}
        </p>

        <div className="mt-3 flex-1 columns-1 gap-4 overflow-visible sm:columns-2 lg:columns-4 lg:gap-5 lg:overflow-hidden">
          {content.sections.map((section) => (
            <div key={section.title} className="mb-3 break-inside-avoid space-y-2">
              <p
                className={`font-goudy text-[1.15rem] leading-tight text-[#f1c89d] sm:text-[1.22rem] lg:text-[1.32rem] ${
                  isArabic ? "text-right" : ""
                }`}
              >
                {section.title}
              </p>

              {section.highlighted ? (
                <div
                  className={`space-y-1 text-[14.3px] leading-[1.45rem] text-[#f4dec5]/92 sm:text-[15px] sm:leading-[1.55rem] ${
                    isArabic ? "text-right" : ""
                  }`}
                >
                  {section.body.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              ) : (
                <div
                  className={`space-y-1 text-[14.3px] leading-[1.45rem] text-[#f4dec5]/92 sm:text-[15px] sm:leading-[1.55rem] ${
                    isArabic ? "text-right" : ""
                  }`}
                >
                  {section.body.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="absolute bottom-8 right-8 z-20">
        <Link
          href={`/${locale}/reservation/sub-sightreading`}
          className="liquid-glass-gold shimmer inline-flex items-center rounded-full px-5 py-2.5 font-goudy text-[0.95rem] text-[#f4dec5] transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-gold/70 sm:px-6 sm:text-[1rem]"
        >
          {content.reserveCta}
        </Link>
      </div>

      <style jsx>{`
        @keyframes sightreading-note-rain {
          0% {
            transform: translate3d(0, -12vh, 0) rotate(-8deg);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          55% {
            transform: translate3d(8px, 52vh, 0) rotate(5deg);
            opacity: 0.78;
          }
          100% {
            transform: translate3d(-10px, 112vh, 0) rotate(-10deg);
            opacity: 0;
          }
        }
      `}</style>
    </main>
  );
}
