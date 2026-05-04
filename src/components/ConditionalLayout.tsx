"use client";
import { usePathname } from "next/navigation";
import { HomeNavProvider } from "@/context/HomeNavigationContext";
import Footer from "@/components/Footer";
import SidebarNav, { SIDEBAR_W } from "@/components/SidebarNav";
import type { SessionUser, NavClass } from "@/components/SidebarNav";
import { useLocale } from "next-intl";

export default function ConditionalLayout({
  children,
  sessionUser,
  navClasses,
}: {
  children: React.ReactNode;
  sessionUser?: SessionUser | null;
  navClasses?: NavClass[];
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const isAr = locale === "ar";

  const noNavPage =
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/verify-email") ||
    pathname.includes("/admin");

  const isHome = /^\/[a-z]{2}(\/)?$/.test(pathname);

  // On non-home client pages add padding so content clears the fixed sidebar
  const sidebarPadStyle: React.CSSProperties =
    !noNavPage && !isHome
      ? { [isAr ? "paddingRight" : "paddingLeft"]: SIDEBAR_W }
      : {};

  return (
    <HomeNavProvider>
      {!noNavPage && <SidebarNav sessionUser={sessionUser} navClasses={navClasses} />}
      <div className="min-h-svh" style={sidebarPadStyle}>
        {children}
        {!noNavPage && !isHome && <Footer locale={locale} />}
      </div>
    </HomeNavProvider>
  );
}
