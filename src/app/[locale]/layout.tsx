import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import localFont from "next/font/local";
import "../globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import { PreloaderProvider } from "@/context/PreloaderContext";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  applicationName: "Royal Academy",
  manifest: "/manifest.webmanifest",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Royal Academy",
  },
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

  // ── Session for sidebar ───────────────────────────────────────────────────
  const session = await auth();
  let sessionUser: { id: string; name: string; image: string | null; role: string | null } | null = null;

  if (session?.user?.id) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          image: true,
          studentProfile: { select: { firstName: true } },
          teacherProfile: { select: { firstName: true } },
          adminProfile: { select: { firstName: true } },
        },
      });
      const firstName =
        dbUser?.adminProfile?.firstName ??
        dbUser?.teacherProfile?.firstName ??
        dbUser?.studentProfile?.firstName ??
        session.user.name ??
        session.user.email?.split("@")[0] ??
        (isArabic ? "المستخدم" : "User");

      sessionUser = {
        id: session.user.id,
        name: firstName,
        image: dbUser?.image ?? null,
        role: (session.user as { role?: string }).role ?? null,
      };
    } catch {
      // non-fatal — sidebar renders without user info
    }
  }

  // ── Nav classes for sidebar ───────────────────────────────────────────────
  type NavClass = {
    id: string;
    name: string;
    name_ar: string | null;
    subClasses: { id: string; name: string; name_ar: string | null }[];
  };
  let navClasses: NavClass[] = [];
  try {
    navClasses = await prisma.class.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        name_ar: true,
        subClasses: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, name_ar: true },
        },
      },
    });
  } catch {
    // non-fatal — sidebar shows without classes
  }

  return (
    <html
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className={`${goudy.variable} ${layla.variable}`}
    >
      <body>
        <ServiceWorkerRegister />
        <PreloaderProvider>
          <div className="min-h-screen bg-black text-royal-cream flex flex-col">
            <NextIntlClientProvider messages={messages}>
              <ConditionalLayout sessionUser={sessionUser} navClasses={navClasses}>
                <main className="flex-1">{children}</main>
              </ConditionalLayout>
            </NextIntlClientProvider>
          </div>
        </PreloaderProvider>
      </body>
    </html>
  );
}
