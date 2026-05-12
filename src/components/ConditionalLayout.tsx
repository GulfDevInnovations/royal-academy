'use client';
import Footer from '@/components/Footer';
import type { NavClass, SessionUser } from '@/components/SidebarNav';
import SidebarNav, {
  MOBILE_TOPBAR_H,
  SIDEBAR_W,
} from '@/components/SidebarNav';
import { HomeNavProvider } from '@/context/HomeNavigationContext';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

function useIsMobile(breakpoint = 768) {
  // matchMedia mirrors exactly what CSS media queries use, so DevTools
  // device emulation triggers re-renders — unlike 'resize' events which
  // DevTools emulation does not reliably dispatch.
  const query = `(max-width: ${breakpoint - 1}px)`;
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setIsMobile(mql.matches); // sync in case viewport changed before mount
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return isMobile;
}

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
  const isAr = locale === 'ar';
  const isMobile = useIsMobile(768);

  const noNavPage =
    pathname.includes('/login') ||
    pathname.includes('/signup') ||
    pathname.includes('/verify-email') ||
    pathname.includes('/admin');

  const isHome = /^\/[a-z]{2}(\/)?$/.test(pathname);

  // Mobile: all nav pages need paddingTop to clear the fixed top bar.
  // Desktop non-home: pad the sidebar side so content isn't hidden behind it.
  // Desktop home: HeroSection/AboutSection manage their own marginLeft internally.
  const contentStyle: React.CSSProperties = noNavPage
    ? {}
    : isMobile
      ? { paddingTop: MOBILE_TOPBAR_H }
      : isHome
        ? {}
        : { [isAr ? 'paddingRight' : 'paddingLeft']: SIDEBAR_W };

  return (
    <HomeNavProvider>
      {!noNavPage && (
        <SidebarNav sessionUser={sessionUser} navClasses={navClasses} />
      )}
      <div className="min-h-svh" style={contentStyle}>
        {children}
        {!noNavPage && !isHome && <Footer locale={locale} />}
      </div>
    </HomeNavProvider>
  );
}
