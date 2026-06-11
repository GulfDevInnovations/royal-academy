'use client';

import { signOut } from '@/lib/actions/auth.actions';
import { ChevronDown, Home, LogOut, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
interface AdminHeaderProps {
  adminName?: string;
  locale: string;
}

export default function AdminHeader({
  adminName = 'Admin',
  locale,
}: AdminHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const t = useTranslations('admin');
  const router = useRouter();
  const pathname = usePathname();
  const isArabic = locale === 'ar';
  const [active, setActive] = useState<'en' | 'ar'>(isArabic ? 'ar' : 'en');

  const switchLanguage = () => {
    const newLocale = isArabic ? 'en' : 'ar';
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  const activeStyle = {
    background: 'rgba(245,158,11,0.12)',
    color: '#d97706',
    border: '0.5px solid rgba(245,158,11,0.30)',
  } as const;

  const inactiveStyle = {
    background: 'transparent',
    color: '#9ca3af',
    border: '0.5px solid transparent',
  } as const;

  const handleSelect = (lang: 'en' | 'ar') => {
    setActive(lang);
    switchLanguage();
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-black/[0.07]"
      style={{ background: '#ffffff' }}
    >
      {/* Language switcher */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl"
        style={{
          background: 'rgba(0,0,0,0.04)',
          border: '0.5px solid rgba(0,0,0,0.08)',
        }}
      >
        <button
          onClick={() => handleSelect('en')}
          className="flex items-center gap-2 px-4 py-2 rounded-[9px] text-sm font-medium transition-all duration-200"
          style={active === 'en' ? activeStyle : inactiveStyle}
        >
          <svg
            width="20"
            height="14"
            viewBox="0 0 60 40"
            style={{ borderRadius: 3, flexShrink: 0 }}
          >
            <rect width="60" height="40" fill="#012169" />
            <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="8" />
            <path
              d="M0,0 L60,40 M60,0 L0,40"
              stroke="#C8102E"
              strokeWidth="5"
            />
            <path d="M30,0 V40 M0,20 H60" stroke="#fff" strokeWidth="12" />
            <path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
          </svg>
          EN
        </button>

        <button
          onClick={() => handleSelect('ar')}
          className="flex items-center gap-2 px-4 py-2 rounded-[9px] text-sm font-medium transition-all duration-200"
          style={active === 'ar' ? activeStyle : inactiveStyle}
        >
          <svg
            width="20"
            height="14"
            viewBox="0 0 900 600"
            style={{ borderRadius: 3, flexShrink: 0 }}
          >
            <rect width="900" height="600" fill="#DB161B" />
            <rect width="300" height="600" fill="#fff" />
            <rect width="300" height="600" x="300" fill="#009A44" />
          </svg>
          عربي
        </button>
      </div>

      {/* ── Right side ── */}
      <div className="flex items-center gap-2">
        {/* Back to site */}
        <Link
          href={`/${locale}`}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors"
          title="Back to site"
        >
          <Home size={16} />
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
          >
            {/* Avatar */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              }}
            >
              {adminName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-600">
              {adminName}
            </span>
            <ChevronDown size={13} className="text-gray-400" />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl z-20 py-1 overflow-hidden shadow-lg border border-black/8"
                style={{ background: '#ffffff' }}
              >
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-black/5 transition-colors">
                  <User size={14} className="text-gray-400" />
                  {t('profile')}
                </button>
                <div className="my-1 border-t border-black/6" />
                <form action={signOut}>
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                    style={{ color: '#d97706' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'rgba(245,158,11,0.08)';
                      (e.currentTarget as HTMLButtonElement).style.color =
                        '#b45309';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'transparent';
                      (e.currentTarget as HTMLButtonElement).style.color =
                        '#d97706';
                    }}
                  >
                    <LogOut size={14} />
                    {t('signOut')}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
