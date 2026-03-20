"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
// import PatternBackground from "./PatternBackground";
import { NavbarStateProvider } from "./NavbarStateContext";
import { HomeNavProvider } from "@/context/HomeNavigationContext";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const noNavPage =
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/verify-email") ||
    pathname.includes("/admin");

  return (
    <HomeNavProvider>
      <NavbarStateProvider>
        {!noNavPage && <Navbar />}
        {children}
      </NavbarStateProvider>
    </HomeNavProvider>
  );
}
