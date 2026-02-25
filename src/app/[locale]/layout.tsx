import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import localFont from "next/font/local";
import "../globals.css";
import Navbar from "@/components/Navbar.tsx";

const goudy = localFont({
  src: [
    {
      path: "../../../public/fonts/goudy/GoudyCatalog-BT.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/goudy/GoudyOlSt-BT-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../../public/fonts/goudy/GoudyOlSt-BT-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../../public/fonts/goudy/GoudyOlSt-BT-Bold-Italic.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../../public/fonts/goudy/GoudyOlSt-XBd-BT-Extra-Bold.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../../public/fonts/goudy/GoudyHvyface-BT.ttf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../../public/fonts/goudy/GoudyHvyface-Cn-BT.ttf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../../public/fonts/goudy/GoudyOlSt-BT-Roman.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../../public/fonts/goudy/GoudyHandtooled-BT.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-goudy",
});

const layla = localFont({
  src: [
    {
      path: "../../../public/fonts/layla/layla-arabic-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../../public/fonts/layla/layla-arabic-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/layla/layla-arabic-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/fonts/layla/layla-arabic-Semi-Bold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/fonts/layla/layla-arabic-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-layla",
});

export const metadata: Metadata = {
  title: "Royal Academy",
  description: "Excellence in Education | التميز في التعليم",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const isArabic = locale === "ar";

  return (
    <html
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className={`${goudy.variable} ${layla.variable}`}
    >
      <body
        className={`
          antialiased min-h-screen
          bg-royal-dark text-royal-cream
          ${isArabic ? "font-layla" : "font-goudy"}
        `}
      >
        <NextIntlClientProvider messages={messages}>
          <Navbar />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
