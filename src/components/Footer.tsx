"use client";

import Link from "next/link";

export default function Footer({ locale }: { locale: string }) {
  const isArabic = locale === "ar";
  const year = new Date().getFullYear();
  const brand = isArabic ? "الأكاديمية الملكية" : "Royal Academy";

  return (
    <div className="relative shrink-0 bg-black px-4 py-1 sm:px-6 sm:py-1.5 md:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-4 h-4 bg-linear-to-t from-white/30 via-black/55 to-transparent"
      />
      <div className="mx-auto w-full max-w-7xl text-xs text-royal md:text-sm">
        <div
          className={`flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between ${isArabic ? "sm:flex-row-reverse" : ""}`}
        >
          <div
            className={`flex flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:gap-1.5 ${isArabic ? "sm:flex-row-reverse" : ""}`}
          >
            <span>
              <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
                © {year}
              </span>{" "}
              {brand}
            </span>
            <span className="hidden opacity-40 sm:inline">•</span>
            <span>
              {isArabic ? "تم التطوير بواسطة" : "Developed by"}{" "}
              <a
                href="https://www.gulfdev.io"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline decoration-royal-cream/70 underline-offset-3 transition-colors hover:text-royal-cream hover:decoration-royal-cream"
              >
                Gulf Dev
              </a>
            </span>
          </div>

          <div
            className={`grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2 ${isArabic ? "sm:flex-row-reverse" : ""}`}
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
