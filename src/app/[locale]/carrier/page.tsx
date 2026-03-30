const content = {
  en: {
    label: "Careers",
    title: "Who Can Work With Us",
    intro:
      "Royal Academy brings together exceptional people who share a commitment to excellence in education. We welcome those who meet our standards — regardless of background.",
    profiles: [
      {
        index: "I",
        title: "Educators & Instructors",
        description:
          "Subject-matter experts with proven teaching experience. Whether you come from academia, professional practice, or independent instruction, we value depth of knowledge and the ability to communicate it clearly.",
        tags: ["Academic", "Professional", "Independent"],
      },
      {
        index: "II",
        title: "Curriculum Designers",
        description:
          "Specialists who can translate complex knowledge into structured, learner-centered programs. Experience in instructional design, learning outcomes, and assessment frameworks is highly valued.",
        tags: ["Instructional Design", "Assessment", "Learning Outcomes"],
      },
      {
        index: "III",
        title: "Education Technology Professionals",
        description:
          "Developers, UX designers, and digital specialists who understand the unique demands of educational platforms. We build tools that serve learners — technical excellence must serve a human purpose.",
        tags: ["Development", "UX", "EdTech"],
      },
      {
        index: "IV",
        title: "Administrative & Operations Staff",
        description:
          "Organized, detail-oriented professionals who keep institutions running smoothly. Roles in student services, academic coordination, and institutional operations are central to our mission.",
        tags: ["Operations", "Student Services", "Coordination"],
      },
      {
        index: "V",
        title: "Research & Academic Advisors",
        description:
          "Scholars and practitioners who contribute to the intellectual life of the Academy. We seek those who bring rigorous thinking, a spirit of inquiry, and genuine expertise in their field.",
        tags: ["Research", "Advisory", "Scholarship"],
      },
    ],
    requirements: {
      heading: "What We Look For in Everyone",
      items: [
        "A genuine commitment to education and learner success",
        "Professionalism and integrity in all interactions",
        "Fluency in Arabic or English (bilingual preferred)",
        "Alignment with Royal Academy's values and mission",
        "Eligibility to work in the Sultanate of Oman",
      ],
    },
    cta: "Ready to join us?",
    ctaLink: "Apply Now",
    ctaEmail: "careers@royalacademy.om",
  },
  ar: {
    label: "الوظائف",
    title: "من يمكنه العمل معنا",
    intro:
      "تجمع الأكاديمية الملكية نخبة من المتميزين الذين يشتركون في الالتزام بالتميز التعليمي. نرحب بكل من يستوفي معاييرنا — بصرف النظر عن خلفيته.",
    profiles: [
      {
        index: "١",
        title: "المعلمون والمدربون",
        description:
          "خبراء متخصصون يمتلكون خبرة تدريسية موثّقة. سواء أتيت من الأوساط الأكاديمية أو الممارسة المهنية أو التعليم المستقل، نُقدّر عمق المعرفة والقدرة على إيصالها بوضوح.",
        tags: ["أكاديمي", "مهني", "مستقل"],
      },
      {
        index: "٢",
        title: "مصممو المناهج",
        description:
          "متخصصون قادرون على تحويل المعرفة المعقدة إلى برامج منظمة تمحورت حول المتعلم. تُقدَّر الخبرة في التصميم التعليمي ونتائج التعلم وأطر التقييم تقديراً عالياً.",
        tags: ["التصميم التعليمي", "التقييم", "نتائج التعلم"],
      },
      {
        index: "٣",
        title: "متخصصو تكنولوجيا التعليم",
        description:
          "مطورون ومصممو تجربة مستخدم ومتخصصون رقميون يفهمون المتطلبات الفريدة للمنصات التعليمية. نبني أدوات تخدم المتعلمين — والتميز التقني يجب أن يخدم غرضاً إنسانياً.",
        tags: ["التطوير", "تجربة المستخدم", "تقنية التعليم"],
      },
      {
        index: "٤",
        title: "الكوادر الإدارية والتشغيلية",
        description:
          "محترفون منظمون يتقنون التفاصيل ويُديمون سير المؤسسات بسلاسة. تُشكّل أدوار خدمات الطلاب والتنسيق الأكاديمي والعمليات المؤسسية ركائز أساسية في مهمتنا.",
        tags: ["العمليات", "خدمات الطلاب", "التنسيق"],
      },
      {
        index: "٥",
        title: "الباحثون والمستشارون الأكاديميون",
        description:
          "علماء وممارسون يُسهمون في الحياة الفكرية للأكاديمية. نبحث عمّن يجلب تفكيراً رصيناً وروحاً استقصائية وخبرة حقيقية في مجاله.",
        tags: ["البحث", "الاستشارة", "الأعمال الأكاديمية"],
      },
    ],
    requirements: {
      heading: "ما نبحث عنه في الجميع",
      items: [
        "التزام حقيقي بالتعليم ونجاح المتعلم",
        "الاحترافية والنزاهة في جميع التعاملات",
        "إتقان اللغة العربية أو الإنجليزية (يُفضَّل الثنائية اللغوية)",
        "التوافق مع قيم الأكاديمية الملكية ورسالتها",
        "الأهلية للعمل في سلطنة عُمان",
      ],
    },
    cta: "مستعد للانضمام إلينا؟",
    ctaLink: "قدّم طلبك الآن",
    ctaEmail: "careers@royalacademy.om",
  },
};

export default function CareersWhoPage({ isArabic = false }) {
  const t = isArabic ? content.ar : content.en;
  const dir = isArabic ? "rtl" : "ltr";

  return (
    <div
      dir={dir}
      className="mx-auto w-full max-w-4xl px-4 sm:px-6 md:px-8 pt-28 pb-20"
    >
      {/* ── Header ── */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-6">
          <span className="block h-px w-8 bg-royal-cream/40" />
          <span className="text-xs tracking-[0.2em] uppercase text-royal-cream/50 font-light">
            {t.label}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-royal-cream leading-tight">
          {t.title}
        </h1>

        <p className="mt-5 text-royal-cream/60 text-base md:text-lg leading-relaxed max-w-2xl">
          {t.intro}
        </p>

        <div className="mt-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-royal-cream/10" />
          <div className="w-1.5 h-1.5 rounded-full bg-royal-cream/30" />
          <div className="h-px flex-1 bg-royal-cream/10" />
        </div>
      </div>

      {/* ── Profile Cards ── */}
      <div className="space-y-0 divide-y divide-royal-cream/8">
        {t.profiles.map((profile, i) => (
          <div
            key={i}
            className="group py-9 md:py-11 grid grid-cols-[auto_1fr] gap-x-8 md:gap-x-12 items-start"
          >
            {/* Roman numeral */}
            <span className="text-xs font-mono text-royal-cream/20 tracking-widest pt-1 select-none group-hover:text-royal-cream/40 transition-colors duration-300 min-w-6">
              {profile.index}
            </span>

            <div>
              <h2 className="text-base md:text-lg text-royal-cream font-medium tracking-wide mb-3">
                {profile.title}
              </h2>
              <p className="text-royal-cream/55 text-sm md:text-base leading-relaxed mb-4">
                {profile.description}
              </p>
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag, j) => (
                  <span
                    key={j}
                    className="text-[10px] tracking-widest uppercase text-royal-cream/35 border border-royal-cream/15 px-2.5 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Universal Requirements ── */}
      <div className="mt-14 pt-12 border-t border-royal-cream/10">
        <h3 className="text-sm tracking-[0.15em] uppercase text-royal-cream/50 mb-7">
          {t.requirements.heading}
        </h3>
        <ul className="space-y-3">
          {t.requirements.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-4 text-royal-cream/60 text-sm md:text-base leading-relaxed"
            >
              <span className="mt-2 block w-1 h-1 rounded-full bg-royal-cream/30 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* ── CTA ── */}
      <div className="mt-14 pt-10 border-t border-royal-cream/10 flex flex-col sm:flex-row sm:items-center gap-4">
        <span className="text-royal-cream/50 text-sm">{t.cta}</span>
        <a
          href={`mailto:${t.ctaEmail}`}
          className="inline-flex items-center gap-2 text-sm text-royal-cream/80 hover:text-royal-cream border border-royal-cream/25 hover:border-royal-cream/50 px-5 py-2.5 rounded-full transition-all duration-200"
        >
          {t.ctaLink}
          <span className="text-royal-cream/40">→</span>
        </a>
      </div>
    </div>
  );
}
