"use client";

import Link from "next/link";

export default function Footer({ locale }: { locale: string }) {
  const isArabic = locale === "ar";
  const year = new Date().getFullYear();

  return (
    <div className="bg-black px-4 sm:px-6 md:px-8 py-2">
      <div
        className={`mx-auto flex max-w-7xl flex-col gap-2 text-xs md:text-sm text-royal sm:flex-row sm:items-center sm:justify-between ${isArabic ? "sm:flex-row-reverse" : ""}`}
      >
        <div
          className={`flex items-center gap-2 whitespace-nowrap ${isArabic ? "flex-row-reverse" : ""}`}
        >
          <span>© {year} Royal Academy</span>
          <span className="opacity-40">•</span>
          <span>
            {isArabic ? "تم التطوير بواسطة" : "Developed by"} Royal Academy
          </span>
        </div>
        <div
          className={`flex items-center gap-3 whitespace-nowrap ${isArabic ? "flex-row-reverse" : ""}`}
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
          <span className="opacity-40">•</span>
          <Link
            href={`/${locale}/carrier`}
            className="hover:text-royal-cream transition-colors"
          >
            {isArabic ? "الوظائف" : "Careers"}
          </Link>
        </div>
      </div>
    </div>
  );
}
