"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CalendarDays,
  Sparkles,
  ClipboardList,
  CreditCard,
  Bell,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Music4,
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Studio",
    items: [
      { label: "Classes", href: "/admin/classes", icon: BookOpen },
      { label: "Teachers", href: "/admin/teachers", icon: GraduationCap },
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Gallery", href: "/admin/gallery", icon: Sparkles },
    ],
  },
  {
    label: "Scheduling",
    items: [
      { label: "Schedules", href: "/admin/schedules", icon: CalendarDays },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Enrollments", href: "/admin/enrollments", icon: ClipboardList },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
    ],
  },
];

export default function AdminSidebar() {
  const locale = useLocale(); // ✅ from next-intl, no prop needed
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === "/admin") return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  return (
    <aside
      className={`
        relative flex flex-col h-full border-r border-white/6
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? "w-16" : "w-55"}
      `}
      style={{ background: "#0f1117" }}
    >
      <div>
        {/* Logo */}
        {collapsed && (
          <div className="flex m-4">
            <Link href={`/${locale}`}>
              <Image
                src="/images/Logo-gray-cropped.png"
                alt="Royal Academy"
                width={140}
                height={52}
                className="object-contain"
              />
            </Link>
          </div>
        )}

        {!collapsed && (
          <div className="flex m-4">
            <Link href={`/${locale}`}>
              <Image
                src="/images/Logo-White.png"
                alt="Royal Academy"
                width={140}
                height={52}
                className="object-contain"
              />
            </Link>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4 px-2">
        {navGroups.map((group) => (
          <div key={group.label}>
            {/* Group label */}
            {!collapsed ? (
              <p className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-white/20">
                {group.label}
              </p>
            ) : (
              <div className="mx-auto w-5 border-t border-white/[0.07] mb-2 mt-1" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={`/${locale}${item.href}`}
                    title={collapsed ? item.label : undefined}
                    className={`
                      group relative flex items-center gap-3 rounded-lg text-sm
                      transition-all duration-150 font-medium
                      ${collapsed ? "px-0 py-2.5 justify-center" : "px-3 py-2"}
                      ${
                        active
                          ? "text-amber-400"
                          : "text-white/40 hover:text-white/75 hover:bg-white/3"
                      }
                    `}
                  >
                    {/* Left accent bar */}
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                        style={{ background: "#f59e0b" }}
                      />
                    )}
                    {/* Subtle amber bg glow */}
                    {active && (
                      <span
                        className="absolute inset-0 rounded-lg"
                        style={{ background: "rgba(245,158,11,0.08)" }}
                      />
                    )}

                    <Icon
                      size={16}
                      strokeWidth={active ? 2.5 : 2}
                      className={`flex-shrink-0 transition-colors duration-150 ${
                        active
                          ? "text-amber-400"
                          : "text-white/30 group-hover:text-white/55"
                      }`}
                    />

                    {!collapsed && (
                      <span className="whitespace-nowrap relative z-10">
                        {item.label}
                      </span>
                    )}

                    {/* Collapsed tooltip */}
                    {collapsed && (
                      <div
                        className="
                          absolute left-full ml-3 px-2.5 py-1.5 rounded-md
                          text-white text-xs whitespace-nowrap z-50 shadow-xl
                          opacity-0 group-hover:opacity-100 pointer-events-none
                          transition-opacity duration-150 border border-white/10
                        "
                        style={{ background: "#1c1f2e" }}
                      >
                        {item.label}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Collapse toggle ── */}
      <div className="flex-shrink-0 px-2 py-3 border-t border-white/[0.06]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            w-full flex items-center rounded-lg py-2
            text-white/25 hover:text-white/55 hover:bg-white/[0.04]
            transition-all duration-150 text-xs font-medium
            ${collapsed ? "justify-center px-0" : "gap-2.5 px-3"}
          `}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} />
          ) : (
            <>
              <PanelLeftClose size={15} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
