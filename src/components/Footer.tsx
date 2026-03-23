import Link from "next/link";

export default function Footer({ locale }: { locale: string }) {
  const isArabic = locale === "ar";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 px-4 sm:px-6 md:px-8 py-4">
      <div
        className={
          "mx-auto flex max-w-7xl items-center justify-between gap-3 text-[11px] text-royal " +
          (isArabic ? "flex-row-reverse" : "")
        }
      >
        <span className="whitespace-nowrap">
          © {year} Royal Academy
        </span>

        <div
          className={
            "flex items-center gap-3 whitespace-nowrap " +
            (isArabic ? "flex-row-reverse" : "")
          }
        >
          <Link
            href={`/${locale}/privacy`}
            className="hover:text-royal-cream transition-colors"
          >
            {isArabic ? "الخصوصية" : "Privacy"}
          </Link>
          <span className="opacity-40">•</span>
          <Link
            href={`/${locale}/terms`}
            className="hover:text-royal-cream transition-colors"
          >
            {isArabic ? "شروط الاستخدام" : "Terms of Use"}
          </Link>
        </div>
      </div>
    </footer>
  );
}
