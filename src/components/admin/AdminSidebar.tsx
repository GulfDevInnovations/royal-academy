'use client';

import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Mail,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navGroups = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'contents',
    items: [
      { label: 'news', href: '/admin/news', icon: Newspaper },
      { label: 'upcomings', href: '/admin/upcoming', icon: CalendarClock },
      { label: 'Offers', href: '/admin/offers', icon: Tag },
      { label: 'Gallery', href: '/admin/gallery', icon: Sparkles },
    ],
  },
  {
    label: 'Studio',
    items: [
      { label: 'Classes', href: '/admin/classes', icon: BookOpen },
      { label: 'Teachers', href: '/admin/teachers', icon: GraduationCap },
      { label: 'Students', href: '/admin/students', icon: Users },
    ],
  },
  {
    label: 'Scheduling',
    items: [
      { label: 'Schedules', href: '/admin/schedules', icon: CalendarDays },
      { label: 'Workshops', href: '/admin/workshops', icon: BriefcaseBusiness },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Enrollments', href: '/admin/enrollments', icon: ClipboardList },
      { label: 'Payments', href: '/admin/payments', icon: CreditCard },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'newsletter', href: '/admin/newsletter', icon: Mail },
    ],
  },
];

export default function AdminSidebar() {
  const locale = useLocale();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const t = useTranslations('admin');

  const isActive = (href: string) => {
    const fullPath = `/${locale}${href}`;
    if (href === '/admin') return pathname === fullPath;
    return pathname.startsWith(fullPath);
  };

  return (
    <aside
      className={`
        relative flex flex-col h-full border-r border-black/[0.07]
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-16' : 'w-55'}
      `}
      style={{ background: '#ffffff' }}
    >
      <div>
        {/* Logo */}
        {collapsed && (
          <div className="flex m-4">
            <Link href={`/${locale}`}>
              <Image
                src="/images/logo/logo-color-cropped.png"
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
                src="/images/logo/Logo-Color.png"
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
              <p className="px-2 mb-1.5 text-[20px] font-semibold tracking-widest uppercase text-gray-400">
                {t(`groups.${group.label}`)}
              </p>
            ) : (
              <div className="mx-auto w-5 border-t border-black/[0.07] mb-2 mt-1" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const label = t(`items.${item.label}`);

                return (
                  <Link
                    key={item.href}
                    href={`/${locale}${item.href}`}
                    title={collapsed ? item.label : undefined}
                    className={`
                      group relative flex items-center gap-3 rounded-lg text-sm
                      transition-all duration-150 font-medium
                      ${collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'}
                      ${
                        active
                          ? 'text-amber-600'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-black/4'
                      }
                    `}
                  >
                    {/* Left accent bar */}
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                        style={{ background: '#d97706' }}
                      />
                    )}
                    {/* Subtle amber bg */}
                    {active && (
                      <span
                        className="absolute inset-0 rounded-lg"
                        style={{ background: 'rgba(245,158,11,0.08)' }}
                      />
                    )}

                    <Icon
                      size={16}
                      strokeWidth={active ? 2.5 : 2}
                      className={`shrink-0 transition-colors duration-150 ${
                        active
                          ? 'text-amber-500'
                          : 'text-gray-400 group-hover:text-gray-600'
                      }`}
                    />

                    {!collapsed && (
                      <span className="whitespace-nowrap text-[20px] relative z-10">
                        {label}
                      </span>
                    )}

                    {/* Collapsed tooltip */}
                    {collapsed && (
                      <div
                        className="
                          absolute left-full ml-3 px-2.5 py-1.5 rounded-md
                          text-gray-700 text-xs whitespace-nowrap z-50 shadow-lg
                          opacity-0 group-hover:opacity-100 pointer-events-none
                          transition-opacity duration-150 border border-black/8
                        "
                        style={{ background: '#ffffff' }}
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
      <div className="shrink-0 px-2 py-3 border-t border-black/[0.07]">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            w-full flex items-center rounded-lg py-2
            text-gray-400 hover:text-gray-600 hover:bg-black/4
            transition-all duration-150 text-xs font-medium
            ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'}
          `}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} />
          ) : (
            <>
              <PanelLeftClose size={15} />
              <span>{t('collapse')}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
