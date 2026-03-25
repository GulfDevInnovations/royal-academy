import Link from "next/link";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isArabic = locale === "ar";

  const content = isArabic
    ? {
        title: "تواصل معنا",
        subtitle: "يمكنك التواصل مع الأكاديمية عبر الأرقام والمنصات التالية.",
        contactDetails: "بيانات التواصل",
        platforms: "المنصات",
        englishInquiries: "استفسارات الإنجليزية وواتساب",
        arabicInquiries: "استفسارات العربية",
        landline: "الهاتف الأرضي",
        email: "البريد الإلكتروني",
        back: "العودة إلى الرئيسية",
      }
    : {
        title: "Contact Us",
        subtitle:
          "Reach Royal Academy through the following contact numbers and platforms.",
        contactDetails: "Contact Details",
        platforms: "Platforms",
        englishInquiries: "English Inquiries & WhatsApp",
        arabicInquiries: "Arabic Inquiries",
        landline: "Landline",
        email: "Email",
        back: "Back to Home",
      };

  const phoneItems = [
    {
      label: content.englishInquiries,
      value: "+968 9327 6767",
      href: "tel:+96893276767",
    },
    {
      label: content.arabicInquiries,
      value: "+968 9886 2343",
      href: "tel:+96898862343",
    },
    {
      label: content.landline,
      value: "+968 2449 7033",
      href: "tel:+96824497033",
    },
  ];

  const email = "Admin@royalacademymct.com";
  const platforms = [
    {
      label: "YouTube",
      href: "https://www.youtube.com/channel/UCBltWo91oBYJkW9k4r9iZCg",
    },
    {
      label: "LinkedIn",
      href: "http://www.linkedin.com/in/royal-academy-4729aa3a9",
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@royalacademymct?is_from_webapp=1&sender_device=pc",
    },
  ];

  return (
    <main
      className="min-h-screen px-4 py-24"
      style={{ backgroundColor: "#227b81" }}
    >
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

      <section
        className="relative z-10 mx-auto w-full max-w-4xl rounded-3xl p-6 md:p-8"
        style={{
          background:
            "linear-gradient(135deg, rgba(228,208,181,0.14) 0%, rgba(228,208,181,0.05) 50%, rgba(228,208,181,0.11) 100%)",
          backdropFilter: "blur(26px) saturate(1.9)",
          WebkitBackdropFilter: "blur(26px) saturate(1.9)",
          border: "1px solid rgba(228,208,181,0.22)",
          boxShadow:
            "0 30px 90px rgba(0,0,0,0.33), inset 0 1px 1px rgba(228,208,181,0.30), inset 0 -1px 1px rgba(0,0,0,0.15)",
        }}
      >
        <h1
          className="text-3xl md:text-4xl font-light tracking-widest"
          style={{ color: "#e4d0b5" }}
        >
          {content.title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "rgba(228,208,181,0.7)" }}>
          {content.subtitle}
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div
            className="rounded-2xl p-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(228,208,181,0.09) 0%, rgba(228,208,181,0.04) 100%)",
              border: "1px solid rgba(228,208,181,0.18)",
              boxShadow:
                "0 12px 30px rgba(0,0,0,0.22), inset 0 1px 1px rgba(228,208,181,0.18)",
            }}
          >
            <h2 className="text-lg tracking-wide" style={{ color: "#e4d0b5" }}>
              {content.contactDetails}
            </h2>
            <div className="mt-4 space-y-4">
              {phoneItems.map((item) => (
                <div key={item.label}>
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "rgba(228,208,181,0.65)" }}
                  >
                    {item.label}
                  </p>
                  <Link
                    href={item.href}
                    className="text-base transition-opacity hover:opacity-80"
                    style={{ color: "#f3e5cf" }}
                  >
                    {item.value}
                  </Link>
                </div>
              ))}

              <div>
                <p
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "rgba(228,208,181,0.65)" }}
                >
                  {content.email}
                </p>
                <Link
                  href={`mailto:${email}`}
                  className="text-base break-all transition-opacity hover:opacity-80"
                  style={{ color: "#f3e5cf" }}
                >
                  {email}
                </Link>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(228,208,181,0.09) 0%, rgba(228,208,181,0.04) 100%)",
              border: "1px solid rgba(228,208,181,0.18)",
              boxShadow:
                "0 12px 30px rgba(0,0,0,0.22), inset 0 1px 1px rgba(228,208,181,0.18)",
            }}
          >
            <h2 className="text-lg tracking-wide" style={{ color: "#e4d0b5" }}>
              {content.platforms}
            </h2>
            <ul className="mt-4 space-y-4">
              {platforms.map((platform) => (
                <li key={platform.label}>
                  <p
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "rgba(228,208,181,0.65)" }}
                  >
                    {platform.label}
                  </p>
                  <a
                    href={platform.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base break-all transition-opacity hover:opacity-80"
                    style={{ color: "#f3e5cf" }}
                  >
                    {platform.href}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-5">
          <Link
            href={`/${locale}`}
            className="text-xs tracking-widest uppercase transition-opacity hover:opacity-70"
            style={{ color: "rgba(228,208,181,0.65)" }}
          >
            {content.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
