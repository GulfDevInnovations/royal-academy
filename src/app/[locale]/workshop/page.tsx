import Link from "next/link";

export default async function WorkshopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const content = isArabic
    ? {
        title: "ورش العمل",
        subtitle: "قريباً — سيتم الإعلان عن ورش العمل القادمة هنا.",
        back: "العودة إلى الرئيسية",
      }
    : {
        title: "Workshops",
        subtitle: "Coming soon — upcoming workshops will be announced here.",
        back: "Back to Home",
      };

  return (
    <main className="min-h-screen bg-royal-dark px-4 py-24">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/pattern.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "1200px auto",
          opacity: 0.02,
          filter: "sepia(1) saturate(0.6) brightness(2)",
        }}
      />

      <section className="relative z-10 mx-auto w-full max-w-3xl rounded-3xl p-6 md:p-10 liquid-glass-green">
        <h1
          className="text-3xl md:text-4xl font-light tracking-widest"
          style={{ color: "var(--royal-green)" }}
        >
          {content.title}
        </h1>
        <p className="mt-3 text-sm" style={{ color: "rgba(139,174,130,0.7)" }}>
          {content.subtitle}
        </p>
        <div className="mt-8 border-t border-white/10 pt-5">
          <Link
            href={`/${locale}`}
            className="text-xs tracking-widest uppercase transition-opacity hover:opacity-70"
            style={{ color: "rgba(139,174,130,0.65)" }}
          >
            {content.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
