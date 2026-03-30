"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { NavbarStateProvider } from "./NavbarStateContext";
import { HomeNavProvider } from "@/context/HomeNavigationContext";
import Footer from "@/components/Footer";
import { useLocale } from "next-intl";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = useLocale();

  const noNavPage =
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/verify-email") ||
    pathname.includes("/admin");

  // Home is /en or /ar or /en/ or /ar/
  const isHome = /^\/[a-z]{2}(\/)?$/.test(pathname);

  return (
    <HomeNavProvider>
      <NavbarStateProvider>
        {!noNavPage && <Navbar />}
        {children}
        {!noNavPage && !isHome && <Footer locale={locale} />}
      </NavbarStateProvider>
    </HomeNavProvider>
  );
}
