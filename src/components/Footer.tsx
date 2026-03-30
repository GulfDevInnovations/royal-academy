"use client";

import Link from "next/link";

export default function Footer({ locale }: { locale: string }) {
  const isArabic = locale === "ar";
  const year = new Date().getFullYear();
  const brand = isArabic ? "الأكاديمية الملكية" : "Royal Academy";

  return (
    <div className="relative bg-black px-4 sm:px-6 md:px-8 py-2.5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-linear-to-t from-white/30 via-black/55 to-transparent"
      />
      <div className="mx-auto w-full max-w-7xl text-xs text-royal md:text-sm">
        <div
          className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isArabic ? "sm:flex-row-reverse" : ""}`}
        >
          <div
            className={`flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:gap-2 ${isArabic ? "sm:flex-row-reverse" : ""}`}
          >
            <span>
              <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
                © {year}
              </span>{" "}
              {brand}
            </span>
            <span className="hidden opacity-40 sm:inline">•</span>
            <span>
              {isArabic ? "تم التطوير بواسطة" : "Developed by"} {brand}
            </span>
          </div>

          <div
            className={`grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3 ${isArabic ? "sm:flex-row-reverse" : ""}`}
          >
            <Link
              href={`/${locale}/privacy`}
              className="text-center transition-colors hover:text-royal-cream"
            >
              {isArabic ? "الخصوصية" : "Privacy"}
            </Link>
            <span className="hidden opacity-40 sm:inline">•</span>
            <Link
              href={`/${locale}/terms`}
              className="text-center transition-colors hover:text-royal-cream"
            >
              {isArabic ? "شروط الاستخدام" : "Terms of Use"}
            </Link>
            <span className="hidden opacity-40 sm:inline">•</span>
            <Link
              href={`/${locale}/carrier`}
              className="text-center transition-colors hover:text-royal-cream"
            >
              {isArabic ? "الوظائف" : "Careers"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
