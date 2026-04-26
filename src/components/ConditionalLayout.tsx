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
  const isClassRoute = pathname.includes("/classes/");

  // Home is /en or /ar or /en/ or /ar/
  const isHome = /^\/[a-z]{2}(\/)?$/.test(pathname);
  const contentClassName = isClassRoute
    ? "class-route-shell h-[calc(100svh-4rem-4.5rem)] min-h-0 overflow-x-hidden overflow-y-auto sm:h-[calc(100svh-4rem-3.75rem)] md:h-[calc(100svh-5rem-3.1rem)] md:overflow-hidden"
    : "";

  return (
    <HomeNavProvider>
      <NavbarStateProvider>
        <div className="flex min-h-screen flex-col">
          {!noNavPage && <Navbar />}
          <div className="flex-1">{children}</div>
          {!noNavPage && !isHome && <Footer locale={locale} />}
        </div>
      </NavbarStateProvider>
    </HomeNavProvider>
  );
}
