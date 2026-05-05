'use client';

import NotificationBell from '@/components/NotificationBell';
import { signOut } from '@/lib/actions/auth.actions';
import {
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/actions/notifications/notifications.client.actions';
import {
  faInstagram,
  faLinkedinIn,
  faTiktok,
  faWhatsapp,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import {
  faBookOpen,
  faCreditCard,
  faPalette,
  faPhone,
  faPowerOff,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  labelEn: string;
  labelAr: string;
  href?: string;
  isContact?: boolean;
  children?: NavItem[];
}

export interface SessionUser {
  id: string;
  name: string;
  image: string | null;
  role: string | null;
}

export interface NavClass {
  id: string;
  name: string;
  name_ar: string | null;
  subClasses: { id: string; name: string; name_ar: string | null }[];
}

interface SidebarNavProps {
  sessionUser?: SessionUser | null;
  navClasses?: NavClass[];
}

// ─── Nav helpers ─────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Nav data ────────────────────────────────────────────────────────────────

function buildNav(locale: string, navClasses: NavClass[]): NavItem[] {
  const classChildren: NavItem[] = navClasses.map((cls) => {
    const classSlug = toSlug(cls.name);
    const classHref = `/${locale}/classes/${classSlug}`;
    const subItems: NavItem[] = cls.subClasses.map((sub) => ({
      id: `sub-${sub.id}`,
      labelEn: sub.name,
      labelAr: sub.name_ar ?? sub.name,
      href: classHref,
    }));
    return subItems.length > 0
      ? {
          id: `cls-${cls.id}`,
          labelEn: cls.name,
          labelAr: cls.name_ar ?? cls.name,
          children: subItems,
        }
      : {
          id: `cls-${cls.id}`,
          labelEn: cls.name,
          labelAr: cls.name_ar ?? cls.name,
          href: classHref,
        };
  });

  const classesEntry: NavItem =
    classChildren.length > 0
      ? {
          id: 'classes',
          labelEn: 'Classes',
          labelAr: 'الفصول',
          children: classChildren,
        }
      : {
          id: 'classes',
          labelEn: 'Classes',
          labelAr: 'الفصول',
          href: `/${locale}/enrollment`,
        };

  return [
    classesEntry,
    {
      id: 'enrollment',
      labelEn: 'Enrollment',
      labelAr: 'التسجيل',
      href: `/${locale}/enrollment`,
    },
    {
      id: 'workshops',
      labelEn: 'Workshops',
      labelAr: 'ورش العمل',
      href: `/${locale}/workshops`,
    },
    {
      id: 'gallery',
      labelEn: 'Gallery',
      labelAr: 'المعرض',
      href: `/${locale}/gallery`,
    },
    {
      id: 'our-bg',
      labelEn: 'Our Background',
      labelAr: 'خلفيتنا',
      href: `/${locale}/about`,
    },
    {
      id: 'contact-us',
      labelEn: 'Contact Us',
      labelAr: 'تواصل معنا',
      isContact: true,
    },
  ];
}

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

function buildBreadcrumbs(
  pathname: string | null,
  locale: string,
  navClasses: NavClass[],
  isAr: boolean,
): { label: string; href: string }[] {
  if (!pathname) return [];
  const isHome = /^\/[a-z]{2}(\/)?$/.test(pathname);
  if (isHome) return [];

  const crumbs: { label: string; href: string }[] = [
    { label: isAr ? 'الرئيسية' : 'Home', href: `/${locale}` },
  ];

  const segments = pathname
    .replace(new RegExp(`^\\/${locale}`), '')
    .split('/')
    .filter(Boolean);
  if (segments.length === 0) return crumbs;

  const pageLabels: Record<string, string> = {
    enrollment: isAr ? 'التسجيل' : 'Enrollment',
    workshops: isAr ? 'ورش العمل' : 'Workshops',
    gallery: isAr ? 'المعرض' : 'Gallery',
    about: isAr ? 'خلفيتنا' : 'Our Background',
    'profile-setting': isAr ? 'الملف الشخصي' : 'Profile',
    'my-classes': isAr ? 'دروسي' : 'My Classes',
    payments: isAr ? 'المدفوعات' : 'Payments',
    signup: isAr ? 'إنشاء حساب' : 'Sign Up',
    'forgot-password': isAr ? 'نسيت كلمة المرور' : 'Forgot Password',
  };

  const page = segments[0];

  if (page === 'classes') {
    crumbs.push({
      label: isAr ? 'الفصول' : 'Classes',
      href: `/${locale}/enrollment`,
    });
    if (segments[1]) {
      const slug = segments[1];
      const cls = navClasses.find((c) => toSlug(c.name) === slug);
      const name = cls ? (isAr ? cls.name_ar ?? cls.name : cls.name) : slug;
      crumbs.push({ label: name, href: pathname });
    }
  } else if (pageLabels[page]) {
    crumbs.push({ label: pageLabels[page], href: `/${locale}/${page}` });
  }

  return crumbs;
}

// ─── Widths (px) ─────────────────────────────────────────────────────────────

export const SIDEBAR_W = 150;
const D1_W = 280;
const D2_W = 240;
const D3_W = 230;
const CONTACT_W = 380;
const USER_W = 260;
const BELL_W = 340;

// ─── Notifications type ───────────────────────────────────────────────────────

interface AppNotification {
  id: string;
  subject: string | null;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  readAt: Date | string | null;
  createdAt: Date | string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SidebarNav({
  sessionUser = null,
  navClasses = [],
}: SidebarNavProps) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (params?.locale as string) ?? 'en';
  const isAr = locale === 'ar';

  const NAV_ITEMS = buildNav(locale, navClasses);

  // Drawer open states
  const [d1Open, setD1Open] = useState(false);
  const [activeL1, setActiveL1] = useState<string | null>(null);
  const [activeL2, setActiveL2] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);

  // ── Notifications ────────────────────────────────────────────────────────

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifQuery, setNotifQuery] = useState('');
  const [, startNotifTransition] = useTransition();

  const fetchNotifications = useCallback(async () => {
    if (!sessionUser) return;
    setNotifLoading(true);
    const data = await getMyNotifications(sessionUser.id);
    setNotifications(data as AppNotification[]);
    setNotifLoading(false);
  }, [sessionUser]);

  useEffect(() => {
    if (!sessionUser) return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, 300_000);
    return () => clearInterval(id);
  }, [fetchNotifications, sessionUser]);

  useEffect(() => {
    const handler = () => fetchNotifications();
    window.addEventListener('notification:new', handler);
    return () => window.removeEventListener('notification:new', handler);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!bellOpen) setNotifQuery('');
  }, [bellOpen]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleNotifClick = (n: AppNotification) => {
    if (n.linkUrl) window.open(n.linkUrl, '_blank', 'noopener,noreferrer');
    if (!n.readAt) {
      startNotifTransition(async () => {
        await markNotificationRead(n.id, sessionUser!.id);
        setNotifications((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x,
          ),
        );
      });
    }
  };

  const handleMarkAllRead = () => {
    startNotifTransition(async () => {
      await markAllNotificationsRead(sessionUser!.id);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
      );
    });
  };

  const filteredNotifs = (() => {
    const q = notifQuery.trim().toLowerCase();
    const byTime = (a: AppNotification, b: AppNotification) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (!q) return [...notifications].sort(byTime);
    const titleHits = notifications.filter((n) =>
      n.subject?.toLowerCase().includes(q),
    );
    const bodyHits = notifications.filter(
      (n) =>
        !n.subject?.toLowerCase().includes(q) &&
        n.body.toLowerCase().includes(q),
    );
    return [...titleHits.sort(byTime), ...bodyHits.sort(byTime)];
  })();

  function notifTimeAgo(date: Date | string): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return isAr ? 'الآن' : 'just now';
    if (diff < 3600)
      return isAr
        ? `${Math.floor(diff / 60)} د`
        : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400)
      return isAr
        ? `${Math.floor(diff / 3600)} س`
        : `${Math.floor(diff / 3600)}h ago`;
    return isAr
      ? `${Math.floor(diff / 86400)} ي`
      : `${Math.floor(diff / 86400)}d ago`;
  }

  // ── Misc state ───────────────────────────────────────────────────────────

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [d2FadeKey, setD2FadeKey] = useState(0);
  const [d3FadeKey, setD3FadeKey] = useState(0);

  // ── Auth-derived values ──────────────────────────────────────────────────

  const isLoggedIn = !!sessionUser;
  const isAdmin = sessionUser?.role === 'ADMIN';
  const avatarSrc = sessionUser?.image ?? '/images/user.png';
  const isExternalAvatar = avatarSrc.startsWith('http');
  const userDisplayName = sessionUser?.name ?? (isAr ? 'المستخدم' : 'User');

  // ── Outside-click handler ────────────────────────────────────────────────

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setD1Open(false);
        setActiveL1(null);
        setActiveL2(null);
        setContactOpen(false);
        setUserPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const switchLocale = () => {
    const target = isAr ? 'en' : 'ar';
    router.push(window.location.pathname.replace(`/${locale}`, `/${target}`));
  };

  const lbl = (item: NavItem) => (isAr ? item.labelAr : item.labelEn);

  const handleBurger = () => {
    setBellOpen(false);
    if (d1Open) {
      setD1Open(false);
      setActiveL1(null);
      setActiveL2(null);
      setContactOpen(false);
      setUserPanelOpen(false);
    } else {
      setD1Open(true);
      setUserPanelOpen(false);
    }
  };

  const handleL1Click = (item: NavItem) => {
    if (item.isContact) {
      setContactOpen((c) => !c);
      setActiveL1(null);
      setActiveL2(null);
      setD2FadeKey((k) => k + 1);
      setD3FadeKey((k) => k + 1);
    } else if (item.children) {
      setContactOpen(false);
      setActiveL1(activeL1 === item.id ? null : item.id);
      setActiveL2(null);
      setD2FadeKey((k) => k + 1);
      setD3FadeKey((k) => k + 1);
    } else if (item.href) {
      router.push(item.href);
      setD1Open(false);
      setActiveL1(null);
      setActiveL2(null);
      setContactOpen(false);
    }
  };

  const handleL2Click = (item: NavItem) => {
    if (item.children) {
      setActiveL2(activeL2 === item.id ? null : item.id);
      setD3FadeKey((k) => k + 1);
    } else if (item.href) {
      router.push(item.href);
      setD1Open(false);
      setActiveL1(null);
      setActiveL2(null);
    }
  };

  const handleLeaf = (href: string) => {
    router.push(href);
    setD1Open(false);
    setActiveL1(null);
    setActiveL2(null);
    setContactOpen(false);
  };

  // ── Derived values ───────────────────────────────────────────────────────

  const loginHref = `/${locale}/login?redirectTo=${encodeURIComponent(pathname ?? '/')}`;

  const userLinks = [
    {
      href: `/${locale}/profile-setting`,
      label: isAr ? 'الملف الشخصي' : 'Profile Settings',
      icon: faUser,
    },
    {
      href: `/${locale}/my-classes`,
      label: isAr ? 'دروسي' : 'My Classes',
      icon: faBookOpen,
    },
    {
      href: `/${locale}/payments`,
      label: isAr ? 'المدفوعات' : 'Payments',
      icon: faCreditCard,
    },
  ];
  if (isAdmin) {
    userLinks.unshift({
      href: `/${locale}/admin`,
      label: isAr ? 'لوحة التحكم' : 'Admin Panel',
      icon: faPalette,
    });
  }

  const socials = [
    {
      label: isAr ? 'اتصل بنا' : 'Call Us',
      href: 'tel:+96893276767',
      icon: faPhone,
    },
    {
      label: isAr ? 'واتساب' : 'WhatsApp',
      href: 'https://wa.me/96893276767',
      icon: faWhatsapp,
    },
    {
      label: isAr ? 'اینستاکرام' : 'Instagram',
      href: 'https://www.instagram.com/royal_academy_mct?igsh=MXhxdXI5OXEwbnc1ZA%3D%3D&utm_source=qr',
      icon: faInstagram,
    },
    {
      label: 'YouTube',
      href: 'https://www.youtube.com/channel/UCBltWo91oBYJkW9k4r9iZCg',
      icon: faYoutube,
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/royal-academy-4729aa3a9',
      icon: faLinkedinIn,
    },
    {
      label: 'TikTok',
      href: 'https://www.tiktok.com/@royalacademymct?is_from_webapp=1&sender_device=pc',
      icon: faTiktok,
    },
  ];

  const breadcrumbs = buildBreadcrumbs(pathname, locale, navClasses, isAr);

  const activeL1Node = NAV_ITEMS.find((i) => i.id === activeL1);
  const activeL2Node = activeL1Node?.children?.find((i) => i.id === activeL2);
  const d2Open = d1Open && !!activeL1 && !!activeL1Node?.children;
  const d3Open = d2Open && !!activeL2 && !!activeL2Node?.children;

  const contactContent = isAr
    ? {
        title: 'تواصل معنا',
        subtitle: 'يمكنك التواصل مع الأكاديمية عبر الأرقام والمنصات التالية.',
        phone1: 'استفسارات الإنجليزية وواتساب',
        phone2: 'استفسارات العربية',
        landline: 'الهاتف الأرضي',
        email: 'البريد الإلكتروني',
        platforms: 'المنصات',
        address: 'شارع 18 نوفمبر، مسقط',
      }
    : {
        title: 'Contact Us',
        subtitle:
          'Reach Royal Academy through the following contact numbers and platforms.',
        phone1: 'English Inquiries & WhatsApp',
        phone2: 'Arabic Inquiries',
        landline: 'Landline',
        email: 'Email',
        platforms: 'Platforms',
        address: '18th November St, Muscat',
      };

  const contactPhones = [
    {
      label: contactContent.phone1,
      value: '+968 9327 6767',
      href: 'tel:+96893276767',
    },
    {
      label: contactContent.phone2,
      value: '+968 9886 2343',
      href: 'tel:+96898862343',
    },
    {
      label: contactContent.landline,
      value: '+968 2449 7033',
      href: 'tel:+96824497033',
    },
  ];

  const contactPlatforms = [
    {
      label: isAr ? 'واتساب' : 'WhatsApp',
      href: 'https://wa.me/96893276767',
      icon: faWhatsapp,
    },
    {
      label: isAr ? 'اینستاکرام' : 'Instagram',
      href: 'https://www.instagram.com/royal_academy_mct?igsh=MXhxdXI5OXEwbnc1ZA%3D%3D&utm_source=qr',
      icon: faInstagram,
    },
    {
      label: 'YouTube',
      href: 'https://www.youtube.com/channel/UCBltWo91oBYJkW9k4r9iZCg',
      icon: faYoutube,
    },
    {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/royal-academy-4729aa3a9',
      icon: faLinkedinIn,
    },
    {
      label: 'TikTok',
      href: 'https://www.tiktok.com/@royalacademymct?is_from_webapp=1&sender_device=pc',
      icon: faTiktok,
    },
  ];

  // ── Translate values ─────────────────────────────────────────────────────

  const userPanelHideTranslate = isAr
    ? `translateX(${SIDEBAR_W + USER_W}px)`
    : `translateX(-${SIDEBAR_W + USER_W}px)`;
  const bellPanelHideTranslate = isAr
    ? `translateX(${SIDEBAR_W + BELL_W}px)`
    : `translateX(-${SIDEBAR_W + BELL_W}px)`;
  const contactHideTranslate = isAr
    ? `translateX(${SIDEBAR_W + D1_W + CONTACT_W}px)`
    : `translateX(-${SIDEBAR_W + D1_W + CONTACT_W}px)`;
  const d2HideTranslate = isAr
    ? `translateX(${SIDEBAR_W + D1_W + D2_W}px)`
    : `translateX(-${SIDEBAR_W + D1_W + D2_W}px)`;
  const d3HideTranslate = isAr
    ? `translateX(${SIDEBAR_W + D1_W + D2_W + D3_W}px)`
    : `translateX(-${SIDEBAR_W + D1_W + D2_W + D3_W}px)`;

  const drawerItem = (active: boolean, bg: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '14px 24px',
    background: active ? 'rgba(0,0,0,.07)' : 'transparent',
    border: 'none',
    borderLeft: !isAr
      ? active
        ? '2px solid #888888'
        : '2px solid transparent'
      : 'none',
    borderRight: isAr
      ? active
        ? '2px solid #888888'
        : '2px solid transparent'
      : 'none',
    cursor: 'pointer',
    textAlign: isAr ? 'right' : 'left',
    color: active ? '#333333' : '#1a1a1a',
    fontSize: 20,
    fontFamily: 'inherit',
    letterSpacing: '.02em',
    transition: 'background .18s, color .18s',
    // suppress unused param warning:
    ...(bg ? {} : {}),
  });

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        fontFamily: isAr
          ? "'Layla','Noto Naskh Arabic',serif"
          : "'Goudy Old Style','GoudyOlSt-BT',Georgia,serif",
        direction: isAr ? 'rtl' : 'ltr',
      }}
    >
      <div ref={sidebarRef}>
        {/* ── WHITE SIDEBAR ─────────────────────────────────────────────── */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            [isAr ? 'right' : 'left']: 0,
            width: SIDEBAR_W,
            height: '100vh',
            zIndex: 400,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: isAr
              ? '-4px 0 20px rgba(0,0,0,.08)'
              : '4px 0 20px rgba(0,0,0,.08)',
          }}
        >
          {/* Burger */}
          <button
            onClick={handleBurger}
            aria-label="Toggle menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '36px 0 18px',
              transition: 'background .2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(0,0,0,.04)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <BurgerIcon open={d1Open} />
          </button>

          {/* Lang toggle */}
          <button
            onClick={switchLocale}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 0 18px',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '.1em',
              color: '#777777',
              transition: 'color .2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#333333')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#777777')}
          >
            {isAr ? 'EN' : 'عربی'}
          </button>

          <div
            style={{ width: 20, height: 0.5, background: 'rgba(0,0,0,.12)' }}
          />

          {/* Logo + breadcrumbs */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Link href={`/${locale}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo/logo-black.png"
                alt="Royal Academy"
                style={{
                  width: 120,
                  height: 120,
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </Link>

            {breadcrumbs.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '2px 3px',
                  padding: '0 10px',
                  maxWidth: 130,
                }}
              >
                {breadcrumbs.map((crumb, i) => (
                  <span
                    key={crumb.href}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
                  >
                    {i > 0 && (
                      <span
                        style={{
                          color: 'rgba(255,117,31,0.4)',
                          fontSize: 8,
                          lineHeight: 1,
                        }}
                      >
                        /
                      </span>
                    )}
                    <Link
                      href={crumb.href}
                      style={{
                        color:
                          i === breadcrumbs.length - 1
                            ? '#ff751f'
                            : 'rgba(255,117,31,0.6)',
                        fontSize: 8.5,
                        letterSpacing: '.05em',
                        textDecoration: 'none',
                        lineHeight: 1.4,
                        textTransform: 'uppercase',
                      }}
                    >
                      {crumb.label}
                    </Link>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div
            style={{ width: 36, height: 0.5, background: 'rgba(0,0,0,.12)' }}
          />

          {/* Notification bell */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              padding: '14px 0 6px',
            }}
          >
            {isLoggedIn ? (
              <NotificationBell
                unread={unreadCount}
                open={bellOpen}
                onToggle={(v) => {
                  setBellOpen(v);
                  if (v) {
                    setD1Open(false);
                    setActiveL1(null);
                    setActiveL2(null);
                    setContactOpen(false);
                    setUserPanelOpen(false);
                  }
                }}
              />
            ) : (
              <button
                disabled
                aria-label="Notifications"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'not-allowed',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(0,0,0,.22)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
            )}
          </div>

          {/* Auth section */}
          {!isLoggedIn ? (
            <Link
              href={loginHref}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                width: '100%',
                padding: '16px 0 50px',
                textDecoration: 'none',
                fontSize: 18,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
                transition: 'background .2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(0,0,0,.05)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <FontAwesomeIcon
                icon={faUser}
                style={{ fontSize: 28, color: '#1a1a1a' }}
              />
              <span
                style={{
                  color: '#555555',
                  marginTop: 4,
                  fontSize: 11,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                }}
              >
                {isAr ? 'انضم' : 'Sign up'}
              </span>
            </Link>
          ) : (
            <button
              onClick={() => {
                setUserPanelOpen((v) => !v);
                setD1Open(false);
                setActiveL1(null);
                setActiveL2(null);
                setContactOpen(false);
                setBellOpen(false);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: '100%',
                padding: '16px 0 50px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'background .2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(0,0,0,.05)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'transparent')
              }
            >
              <FontAwesomeIcon
                icon={faUser}
                style={{
                  fontSize: 28,
                  color: userPanelOpen ? '#555555' : '#1a1a1a',
                  transition: 'color .2s',
                }}
              />
            </button>
          )}
        </div>

        {/* ── DRAWER L1 ─────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            [isAr ? 'right' : 'left']: SIDEBAR_W,
            width: D1_W,
            height: '100vh',
            zIndex: 390,
            background: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            transform: d1Open
              ? 'translateX(0)'
              : isAr
                ? `translateX(${D1_W}px)`
                : `translateX(-${D1_W}px)`,
            transition: 'transform .38s cubic-bezier(.4,0,.2,1)',
            boxShadow: isAr
              ? '-6px 0 28px rgba(0,0,0,.1)'
              : '6px 0 28px rgba(0,0,0,.1)',
            overflow: 'hidden',
          }}
        >
          <style>{`
            @keyframes ra-fade-in{from{opacity:0}to{opacity:1}}
            @keyframes ra-underline{from{transform:scaleX(0)}to{transform:scaleX(1)}}
          `}</style>

          <nav style={{ flex: 1, overflowY: 'auto', padding: '44px 0 8px' }}>
            {NAV_ITEMS.map((item) => {
              const active = item.isContact
                ? contactOpen
                : activeL1 === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleL1Click(item)}
                  style={{
                    ...drawerItem(active, '#f5f5f5'),
                    color: '#592c41',
                    borderLeft: !isAr
                      ? active
                        ? '2px solid #592c41'
                        : '2px solid transparent'
                      : 'none',
                    borderRight: isAr
                      ? active
                        ? '2px solid #592c41'
                        : '2px solid transparent'
                      : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      e.currentTarget.style.background = 'rgba(89,44,65,.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{lbl(item)}</span>
                  {(item.children || item.isContact) && (
                    <ChevronIcon isAr={isAr} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer — newsletter + socials */}
          <div
            style={{
              padding: '18px 24px 26px',
              borderTop: '.5px solid rgba(0,0,0,.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <EnvelopeIcon />
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: '.15em',
                    textTransform: 'uppercase',
                    color: '#666666',
                  }}
                >
                  {isAr ? 'اشترك في نشرتنا' : 'Subscribe to our newsletter'}
                </span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEmail('');
                }}
                style={{ display: 'flex' }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isAr ? 'بريدك الإلكتروني' : 'Your email'}
                  style={{
                    flex: 1,
                    padding: '7px 10px',
                    fontSize: 12,
                    border: '.5px solid rgba(0,0,0,.2)',
                    borderRight: isAr ? '.5px solid rgba(0,0,0,.2)' : 'none',
                    borderLeft: isAr ? 'none' : undefined,
                    background: 'rgba(255,255,255,.7)',
                    color: '#1a1a1a',
                    outline: 'none',
                    fontFamily: 'inherit',
                    borderRadius: isAr ? '0 2px 2px 0' : '2px 0 0 2px',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '7px 12px',
                    background: '#888888',
                    border: 'none',
                    color: '#fff',
                    fontSize: 11,
                    cursor: 'pointer',
                    letterSpacing: '.08em',
                    fontFamily: 'inherit',
                    borderRadius: isAr ? '2px 0 0 2px' : '0 2px 2px 0',
                    transition: 'background .2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#555555')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = '#888888')
                  }
                >
                  {isAr ? 'أرسل' : 'Send'}
                </button>
              </form>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 30,
                    height: 30,
                    color: '#777777',
                    textDecoration: 'none',
                    fontSize: 20,
                    transition: 'color .2s, transform .2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#333333';
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#777777';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  <FontAwesomeIcon icon={s.icon} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── DRAWER L2 ─────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            [isAr ? 'right' : 'left']: SIDEBAR_W + D1_W,
            width: D2_W,
            height: '100vh',
            zIndex: 380,
            background: '#e8e8e8',
            display: 'flex',
            flexDirection: 'column',
            transform: d2Open ? 'translateX(0)' : d2HideTranslate,
            transition: 'transform .34s cubic-bezier(.4,0,.2,1)',
            boxShadow: isAr
              ? '-6px 0 24px rgba(0,0,0,.1)'
              : '6px 0 24px rgba(0,0,0,.1)',
            overflow: 'hidden',
            visibility: d2Open ? 'visible' : 'hidden',
            pointerEvents: d2Open ? 'auto' : 'none',
          }}
        >
          <nav
            key={d2FadeKey}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '44px 0 8px',
              animation: 'ra-fade-in .22s ease',
            }}
          >
            {(activeL1Node?.children ?? []).map((item) => {
              const active = activeL2 === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleL2Click(item)}
                  style={{
                    ...drawerItem(active, '#e8e8e8'),
                    fontSize: 20,
                    position: 'relative',
                    overflow: 'hidden',
                    borderLeft: 'none',
                    borderRight: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active)
                      e.currentTarget.style.background = 'rgba(0,0,0,.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{lbl(item)}</span>
                  {item.children && <ChevronIcon isAr={isAr} />}
                  {active && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: 2,
                        background: '#592c41',
                        transformOrigin: isAr ? 'right center' : 'left center',
                        animation:
                          'ra-underline .35s cubic-bezier(.4,0,.2,1) forwards',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── DRAWER L3 ─────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            [isAr ? 'right' : 'left']: SIDEBAR_W + D1_W + D2_W,
            width: D3_W,
            height: '100vh',
            zIndex: 370,
            background: '#d5d5d5',
            display: 'flex',
            flexDirection: 'column',
            transform: d3Open ? 'translateX(0)' : d3HideTranslate,
            transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
            boxShadow: isAr
              ? '-6px 0 20px rgba(0,0,0,.1)'
              : '6px 0 20px rgba(0,0,0,.1)',
            overflow: 'hidden',
            visibility: d3Open ? 'visible' : 'hidden',
            pointerEvents: d3Open ? 'auto' : 'none',
          }}
        >
          <nav
            key={d3FadeKey}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '44px 0 6px',
              animation: 'ra-fade-in .22s ease',
            }}
          >
            {(activeL2Node?.children ?? []).map((item) => (
              <button
                key={item.id}
                onClick={() => item.href && handleLeaf(item.href)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 20px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: isAr ? 'right' : 'left',
                  color: '#1a1a1a',
                  fontSize: 18,
                  fontFamily: 'inherit',
                  letterSpacing: '.02em',
                  lineHeight: 1.4,
                  transition: 'background .18s, color .18s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,.06)';
                  e.currentTarget.style.color = '#333333';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#1a1a1a';
                }}
              >
                {lbl(item)}
              </button>
            ))}
          </nav>
        </div>

        {/* ── CONTACT PANEL ─────────────────────────────────────────────── */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            [isAr ? 'right' : 'left']: SIDEBAR_W + D1_W,
            width: CONTACT_W,
            height: '100vh',
            zIndex: 375,
            background: '#e8e8e8',
            display: 'flex',
            flexDirection: 'column',
            transform:
              d1Open && contactOpen ? 'translateX(0)' : contactHideTranslate,
            transition: 'transform .36s cubic-bezier(.4,0,.2,1)',
            boxShadow: isAr
              ? '-6px 0 28px rgba(0,0,0,.12)'
              : '6px 0 28px rgba(0,0,0,.12)',
            overflow: 'hidden',
            visibility: d1Open && contactOpen ? 'visible' : 'hidden',
            pointerEvents: d1Open && contactOpen ? 'auto' : 'none',
          }}
        >
          <div
            style={{ flex: 1, overflowY: 'auto', padding: '44px 28px 28px' }}
          >
            <p
              style={{
                margin: '0 0 6px',
                fontSize: 18,
                color: '#1a1a1a',
                fontFamily: 'inherit',
              }}
            >
              {contactContent.title}
            </p>
            <p
              style={{
                margin: '0 0 28px',
                fontSize: 12,
                color: '#777777',
                lineHeight: 1.6,
                letterSpacing: '.02em',
              }}
            >
              {contactContent.subtitle}
            </p>

            <div style={{ marginBottom: 26 }}>
              {contactPhones.map((p) => (
                <a
                  key={p.href}
                  href={p.href}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '10px 0',
                    borderBottom: '.5px solid rgba(0,0,0,.1)',
                    textDecoration: 'none',
                    gap: 3,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: '#777777',
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.label}
                  </span>
                  <span
                    style={{
                      fontSize: 15,
                      color: '#1a1a1a',
                      fontFamily: 'monospace',
                      letterSpacing: '.06em',
                      transition: 'color .18s',
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.color = '#888888')
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.color = '#1a1a1a')
                    }
                  >
                    {p.value}
                  </span>
                </a>
              ))}
            </div>

            <p
              style={{
                margin: '0 0 12px',
                fontSize: 10,
                color: '#777777',
                letterSpacing: '.18em',
                textTransform: 'uppercase',
              }}
            >
              {contactContent.platforms}
            </p>
            <div
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                flexWrap: 'wrap',
                marginBottom: 32,
              }}
            >
              {contactPlatforms.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    color: '#777777',
                    textDecoration: 'none',
                    fontSize: 20,
                    transition: 'color .2s, transform .2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#333333';
                    (e.currentTarget as HTMLElement).style.transform =
                      'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '#777777';
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                >
                  <FontAwesomeIcon icon={s.icon} />
                </a>
              ))}
            </div>

            <p
              style={{
                margin: '0 0 12px',
                fontSize: 10,
                color: '#777777',
                letterSpacing: '.18em',
                textTransform: 'uppercase',
              }}
            >
              {isAr ? 'الموقع' : 'Location'}
            </p>
            <p style={{ margin: '0 0 14px', fontSize: 12, color: '#333333' }}>
              {contactContent.address}
            </p>

            <div
              style={{
                width: '100%',
                height: 200,
                borderRadius: 4,
                overflow: 'hidden',
                border: '.5px solid rgba(0,0,0,.15)',
                position: 'relative',
              }}
            >
              <PastelMap
                lat={23.602072674553607}
                lng={58.368280024961884}
                isAr={isAr}
              />
            </div>
          </div>
        </div>

        {/* ── USER PANEL ────────────────────────────────────────────────── */}
        {isLoggedIn && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              [isAr ? 'right' : 'left']: SIDEBAR_W,
              width: USER_W,
              height: '100vh',
              zIndex: 395,
              background: '#f5f5f5',
              display: 'flex',
              flexDirection: 'column',
              transform: userPanelOpen
                ? 'translateX(0)'
                : userPanelHideTranslate,
              transition: 'transform .38s cubic-bezier(.4,0,.2,1)',
              boxShadow: isAr
                ? '-6px 0 28px rgba(0,0,0,.1)'
                : '6px 0 28px rgba(0,0,0,.1)',
              overflow: 'hidden',
              visibility: userPanelOpen ? 'visible' : 'hidden',
              pointerEvents: userPanelOpen ? 'auto' : 'none',
            }}
          >
            <div
              style={{
                padding: '44px 24px 18px',
                borderBottom: '.5px solid rgba(0,0,0,.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span
                style={{
                  position: 'relative',
                  display: 'block',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '2px solid rgba(0,0,0,.18)',
                }}
              >
                <Image
                  src={avatarSrc}
                  alt="User"
                  fill
                  sizes="44px"
                  style={{ objectFit: 'contain', opacity: 0.9 }}
                  unoptimized={isExternalAvatar}
                />
              </span>
              <span
                style={{
                  fontSize: 16,
                  color: '#333333',
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                }}
              >
                {isAr ? `مرحباً ${userDisplayName}` : `Hi, ${userDisplayName}`}
              </span>
            </div>

            <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0 8px' }}>
              {userLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setUserPanelOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 24px',
                    textDecoration: 'none',
                    color: '#1a1a1a',
                    fontSize: 18,
                    fontFamily: 'inherit',
                    transition: 'background .18s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(0,0,0,.06)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <span
                    style={{
                      width: 16,
                      textAlign: 'center',
                      color: '#777777',
                      flexShrink: 0,
                    }}
                  >
                    <FontAwesomeIcon icon={link.icon} />
                  </span>
                  {link.label}
                </Link>
              ))}

              <form action={signOut}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 24px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#1a1a1a',
                    fontSize: 18,
                    width: '100%',
                    textAlign: isAr ? 'right' : 'left',
                    fontFamily: 'inherit',
                    transition: 'background .18s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(0,0,0,.06)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <span
                    style={{
                      width: 16,
                      textAlign: 'center',
                      color: '#777777',
                      flexShrink: 0,
                    }}
                  >
                    <FontAwesomeIcon icon={faPowerOff} />
                  </span>
                  {isAr ? 'تسجيل الخروج' : 'Sign Out'}
                </button>
              </form>
            </nav>
          </div>
        )}
      </div>

      {/* ── NOTIFICATIONS PANEL ───────────────────────────────────────────── */}
      {isLoggedIn && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            [isAr ? 'right' : 'left']: SIDEBAR_W,
            width: BELL_W,
            height: '100vh',
            zIndex: 395,
            background: '#f5f5f5',
            display: 'flex',
            flexDirection: 'column',
            transform: bellOpen ? 'translateX(0)' : bellPanelHideTranslate,
            transition: 'transform .38s cubic-bezier(.4,0,.2,1)',
            boxShadow: isAr
              ? '-6px 0 28px rgba(0,0,0,.1)'
              : '6px 0 28px rgba(0,0,0,.1)',
            visibility: bellOpen ? 'visible' : 'hidden',
            pointerEvents: bellOpen ? 'auto' : 'none',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '44px 24px 18px',
              borderBottom: '.5px solid rgba(0,0,0,.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <span
              style={{ fontSize: 18, color: '#1a1a1a', letterSpacing: '.04em' }}
            >
              {isAr ? 'الإشعارات' : 'Notifications'}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  fontSize: 10,
                  color: '#592c41',
                  textTransform: 'uppercase',
                  letterSpacing: '.12em',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {isAr ? 'قراءة الكل' : 'Mark all read'}
              </button>
            )}
          </div>

          <div
            style={{
              padding: '12px 16px',
              borderBottom: '.5px solid rgba(0,0,0,.08)',
              flexShrink: 0,
            }}
          >
            <div style={{ position: 'relative' }}>
              <svg
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#aaa',
                  pointerEvents: 'none',
                }}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={notifQuery}
                onChange={(e) => setNotifQuery(e.target.value)}
                placeholder={
                  isAr ? 'ابحث في الإشعارات...' : 'Search notifications...'
                }
                style={{
                  width: '100%',
                  paddingLeft: 30,
                  paddingRight: notifQuery ? 28 : 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,.12)',
                  background: '#fff',
                  fontSize: 13,
                  color: '#1a1a1a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
              {notifQuery && (
                <button
                  onClick={() => setNotifQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#999',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifLoading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '48px 0',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: '2px solid rgba(89,44,65,.15)',
                    borderTopColor: '#592c41',
                    animation: 'nb-spin .7s linear infinite',
                  }}
                />
              </div>
            )}
            {!notifLoading && filteredNotifs.length === 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '56px 24px',
                  gap: 10,
                  color: '#bbb',
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span style={{ fontSize: 13, letterSpacing: '.04em' }}>
                  {notifQuery
                    ? isAr
                      ? 'لا توجد نتائج'
                      : 'No results'
                    : isAr
                      ? 'لا توجد إشعارات'
                      : 'No notifications yet'}
                </span>
              </div>
            )}
            {!notifLoading &&
              filteredNotifs.map((n) => {
                const isUnread = !n.readAt;
                const hasLink = !!n.linkUrl;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: isAr ? 'right' : 'left',
                      padding: '14px 20px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '.5px solid rgba(0,0,0,.06)',
                      cursor: hasLink ? 'pointer' : 'default',
                      transition: 'background .15s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(0,0,0,.04)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'transparent')
                    }
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        flexDirection: isAr ? 'row-reverse' : 'row',
                      }}
                    >
                      {n.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={n.imageUrl}
                          alt={n.subject ?? ''}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 6,
                            marginBottom: 3,
                            flexDirection: isAr ? 'row-reverse' : 'row',
                          }}
                        >
                          {n.subject && (
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: isUnread ? 600 : 400,
                                color: isUnread ? '#1a1a1a' : '#888',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                              }}
                            >
                              {n.subject}
                            </span>
                          )}
                          {isUnread && (
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                background: '#592c41',
                                flexShrink: 0,
                                marginTop: 4,
                              }}
                            />
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            color: isUnread ? '#555' : '#aaa',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.55,
                          }}
                        >
                          {n.body}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: '#bbb',
                            letterSpacing: '.06em',
                            marginTop: 6,
                            display: 'block',
                          }}
                        >
                          {notifTimeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>

          <style>{`@keyframes nb-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
      <rect
        y="0"
        width="22"
        height="1.5"
        rx="1"
        fill="#1a1a1a"
        style={{
          transformOrigin: '11px 0.75px',
          transform: open ? 'translateY(5.75px) rotate(45deg)' : 'none',
          transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
        }}
      />
      <rect
        y="12.5"
        width="22"
        height="1.5"
        rx="1"
        fill="#1a1a1a"
        style={{
          transformOrigin: '11px 13.25px',
          transform: open ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
          transition: 'transform .35s cubic-bezier(.4,0,.2,1)',
        }}
      />
    </svg>
  );
}

function ChevronIcon({ isAr }: { isAr: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      style={{
        transform: isAr ? 'rotate(180deg)' : 'none',
        opacity: 0.45,
        flexShrink: 0,
      }}
    >
      <path
        d="M4.5 2.5L8 6L4.5 9.5"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 16" fill="none">
      <rect
        x=".5"
        y=".5"
        width="19"
        height="15"
        rx="1.5"
        stroke="#777777"
        strokeWidth="1.2"
      />
      <path
        d="M1 1l9 8 9-8"
        stroke="#777777"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PastelMap({
  lat,
  lng,
  isAr,
}: {
  lat: number;
  lng: number;
  isAr: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  useEffect(() => {
    if (mapInstance.current || !mapRef.current) return;

    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(linkEl);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!L || !mapRef.current || mapInstance.current) return;

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      });
      mapInstance.current = map;

      L.tileLayer(
        'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png',
        { maxZoom: 19 },
      ).addTo(map);

      setTimeout(() => {
        const container = mapRef.current?.querySelector(
          '.leaflet-tile-pane',
        ) as HTMLElement | null;
        if (container)
          container.style.filter =
            'saturate(0.80) sepia(0.40) hue-rotate(2deg) brightness(1.08)';
      }, 300);

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#888888;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(isAr ? 'الأكاديمية الملكية' : 'Royal Academy', {
          closeButton: false,
        });
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstance.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstance.current as any).remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}
