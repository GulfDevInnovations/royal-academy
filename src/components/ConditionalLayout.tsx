"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import PatternBackground from "./PatternBackground";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/verify-email");

  return (
    <>
      {!isAuthPage && <PatternBackground />}
      {!isAuthPage && <Navbar />}
      {children}
    </>
  );
}
