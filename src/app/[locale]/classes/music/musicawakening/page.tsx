"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";

export default function MusicAwakeningPage() {
  const [isOpen, setIsOpen] = useState(false);
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "en";
  const isArabic = locale === "ar";
  const reservationHref = `/${locale}/reservation/sub-musicawakening`;
  const content = isArabic
    ? {
        trigger: "ما هي صحوة الموسيقى؟",
        closeLabel: "إغلاق",
        title: "صحوة الموسيقى (الأعمار 4-6)",
        body:
          "في صف صحوة الموسيقى يكتشف الأطفال الصغار متعة الموسيقى من خلال أنشطة مرحة وجذابة مصممة خصيصًا لأعمارهم. من خلال الغناء والحركة وألعاب الإيقاع والآلات البسيطة مثل الطبول والخشخيشات، يطوّر الطلاب إحساسًا طبيعيًا بالنبض والإيقاع ودرجات الصوت والتناسق الحركي، مع التعبير عن أنفسهم بطريقة إبداعية. وبإرشاد معلمة محبة وفي بيئة ممتعة وملونة، يبني الأطفال الثقة ومهارات الاستماع وحب الموسيقى، بينما يتعلمون الأسس التي ستدعم رحلتهم الموسيقية في المستقبل.",
        reserveCta: "التسجيل",
      }
    : {
        trigger: "What is Music Awakening?",
        closeLabel: "Close",
        title: "Music Awakening (Ages 4-6)",
        body:
          "In our Music Awakening class, young children discover the joy of music through playful, engaging activities designed just for their age. Through singing, movement, rhythm games, and simple instruments like drums and shakers, students develop a natural sense of beat, pitch, and coordination while expressing themselves creatively. Guided by a caring teacher in a fun and colorful environment, children build confidence, listening skills, and a love for music, all while learning the foundations that will support their future musical journey.",
        reserveCta: "Enrollment",
      };

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-4 sm:px-6"
      style={{ backgroundImage: "url('/images/musicawakening.png')" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,248,233,0.08)_0%,rgba(0,0,0,0.16)_58%,rgba(0,0,0,0.32)_100%)]" />

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="shimmer relative z-10 max-w-full rounded-full border border-yellow-200/60 bg-[linear-gradient(160deg,rgba(255,244,110,0.82)_0%,rgba(255,230,46,0.72)_52%,rgba(255,214,10,0.66)_100%)] px-5 py-3 text-center font-goudy text-[0.95rem] text-[#3a2500] shadow-[0_18px_38px_rgba(255,214,10,0.28),inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-[10px] transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 sm:px-9 sm:py-3.5 sm:text-[1.15rem]"
      >
        {content.trigger}
      </button>

      {isOpen ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center overflow-y-auto bg-black/55 px-4 py-6 sm:px-6 sm:py-8">
          <div
            className="relative my-auto w-full max-w-2xl rounded-[1.5rem] border border-yellow-200/60 bg-[linear-gradient(160deg,rgba(255,244,110,0.84)_0%,rgba(255,230,46,0.76)_52%,rgba(255,214,10,0.68)_100%)] px-5 py-5 text-[#3a2500] shadow-[0_28px_80px_rgba(255,214,10,0.22),inset_0_1px_0_rgba(255,255,255,0.42)] backdrop-blur-[14px] sm:rounded-[1.8rem] sm:px-8 sm:py-8"
            dir={isArabic ? "rtl" : "ltr"}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label={content.closeLabel}
              className={`absolute top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#3a2500]/15 bg-white/20 text-base text-[#3a2500]/80 transition-colors duration-200 hover:bg-white/30 hover:text-[#3a2500] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 sm:top-4 sm:h-9 sm:w-9 sm:text-lg ${
                isArabic ? "left-3 sm:left-4" : "right-3 sm:right-4"
              }`}
            >
              ×
            </button>

            <p
              className={`font-goudy text-[1.2rem] leading-tight text-[#3a2500] sm:text-[1.85rem] ${
                isArabic ? "pl-8 text-right sm:pl-10" : "pr-8 sm:pr-10"
              }`}
            >
              {content.title}
            </p>

            <p
              className={`mt-3 text-[14px] leading-6 text-[#3a2500]/90 sm:mt-4 sm:text-[16px] sm:leading-8 ${
                isArabic ? "text-right" : ""
              }`}
            >
              {content.body}
            </p>

            <div className={`mt-5 flex ${isArabic ? "justify-start" : "justify-end"} sm:mt-6`}>
              <Link
                href={reservationHref}
                className="shimmer inline-flex max-w-full items-center rounded-full border border-[#3a2500]/20 bg-white/20 px-4 py-2.5 text-center font-goudy text-[0.9rem] text-[#3a2500] shadow-[0_12px_28px_rgba(255,214,10,0.18),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-[10px] transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/80 sm:px-5 sm:text-[0.95rem]"
              >
                {content.reserveCta}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
