"use client";

import Link from "next/link";

export default function Footer({ locale }: { locale: string }) {
  const isArabic = locale === "ar";
  const year = new Date().getFullYear();

  const headingClass = "text-sm md:text-base font-semibold tracking-wide text-royal-cream";
  const itemClass = "text-sm md:text-base text-royal-cream/75 hover:text-royal-cream transition-colors";

  return (
    <footer className="mt-auto border-t border-white/10">
      {/* Main footer content */}
      <div className="px-4 sm:px-6 md:px-8 py-10 md:py-5">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2">
          {/* Brand / note */}
          <div className={isArabic ? "text-right" : "text-left"}>
            <div className={headingClass}>{isArabic ? "الأكاديمية الملكية" : "Royal Academy"}</div>
            <p className="mt-0 text-sm md:text-base leading-relaxed text-royal-cream/70">
              {isArabic
                ? "مساحة للإبداع والانضباط — حيث يلتقي التراث بالتميّز."
                : "A home for discipline and creativity — where heritage meets excellence."}
            </p>
          </div>

          {/* Working hours */}
          {/* <div className={isArabic ? "text-right" : "text-left"}>
            <div className={headingClass}>{isArabic ? "ساعات العمل" : "Working Hours"}</div>
            <div className="mt-3 space-y-2 text-sm md:text-base text-royal-cream/75">
              <div className={"flex items-center justify-between gap-4 " + (isArabic ? "flex-row-reverse" : "")}> 
                <span className="opacity-80">{isArabic ? "الأحد – الخميس" : "Sun – Thu"}</span>
                <span className="whitespace-nowrap">9:00 AM – 8:00 PM</span>
              </div>
              <div className={"flex items-center justify-between gap-4 " + (isArabic ? "flex-row-reverse" : "")}> 
                <span className="opacity-80">{isArabic ? "الجمعة" : "Fri"}</span>
                <span className="whitespace-nowrap">4:00 PM – 8:00 PM</span>
              </div>
              <div className={"flex items-center justify-between gap-4 " + (isArabic ? "flex-row-reverse" : "")}> 
                <span className="opacity-80">{isArabic ? "السبت" : "Sat"}</span>
                <span className="whitespace-nowrap">10:00 AM – 6:00 PM</span>
              </div>
            </div>
            <p className="mt-3 text-xs md:text-sm text-royal-cream/55">
              {isArabic
                ? "يمكن تعديل الأوقات من لوحة الإعدادات لاحقًا."
                : "Hours can be adjusted later if needed."}
            </p>
          </div> */}

          {/* Links */}
          <div className={isArabic ? "text-right" : "text-left"}>
            <div className={headingClass}>{isArabic ? "روابط" : "Links"}</div>
            <div className="mt-3 grid grid-cols-5 gap-10 md:w-max">
              <Link href={`/${locale}/reservation`} className={itemClass}>
                {isArabic ? "الحجز" : "Reservation"}
              </Link>
              <Link href={`/${locale}/about`} className={itemClass}>
                {isArabic ? "عن الأكاديمية" : "About"}
              </Link>
              <Link href={`/${locale}/aesthetics`} className={itemClass}>
                {isArabic ? "المعرض" : "Gallery"}
              </Link>
              <Link href={`/${locale}/contact`} className={itemClass}>
                {isArabic ? "تواصل" : "Contact"}
              </Link>
              <Link href={`/${locale}/support`} className={itemClass}>
                {isArabic ? "الدعم" : "Support"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom legal bar (must stay at the very bottom) */}
      <div className="bg-black px-4 sm:px-6 md:px-8 py-4">
        <div
          className={
            "mx-auto flex max-w-7xl flex-col gap-2 text-xs md:text-sm text-royal sm:flex-row sm:items-center sm:justify-between " +
            (isArabic ? "sm:flex-row-reverse" : "")
          }
        >
          <div className={"flex items-center gap-2 whitespace-nowrap " + (isArabic ? "flex-row-reverse" : "")}>
            <span>© {year} Royal Academy</span>
            <span className="opacity-40">•</span>
            <span>{isArabic ? "تم التطوير بواسطة" : "Developed by"} Royal Academy</span>
          </div>

          <div className={"flex items-center gap-3 whitespace-nowrap " + (isArabic ? "flex-row-reverse" : "")}>
            <Link href={`/${locale}/privacy`} className="hover:text-royal-cream transition-colors">
              {isArabic ? "الخصوصية" : "Privacy"}
            </Link>
            <span className="opacity-40">•</span>
            <Link href={`/${locale}/terms`} className="hover:text-royal-cream transition-colors">
              {isArabic ? "شروط الاستخدام" : "Terms of Use"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
