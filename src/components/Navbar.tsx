"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { signOut } from "@/lib/actions/auth.actions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCaretRight,
  faCaretLeft,
  faUser,
  faPalette,
  faBookOpen,
  faCreditCard,
  faPowerOff,
  faXmark,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import {
  faLinkedinIn,
  faTiktok,
  faWhatsapp,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import NotificationBell from "./NotificationBell";
import { useNavbarState } from "@/components/NavbarStateContext";
import { useHomeNav, NAV_FLOOR_MAP } from "@/context/HomeNavigationContext";
import { usePreloader } from "@/context/PreloaderContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { navSolid } = useNavbarState();
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>("User");
  const [authLoading, setAuthLoading] = useState(true);
  const [prismaUserId, setPrismaUserId] = useState<string | null>(null);
  const { navigateToFloor } = useHomeNav();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { isDone } = usePreloader();

  // Social panel state
  const [socialOpen, setSocialOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const socialRef = useRef<HTMLDivElement>(null);

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("nav");
  const isArabic = locale === "ar";
  const loginHref = `/${locale}/login?redirectTo=${encodeURIComponent(pathname)}`;
  const avatarSrc = userImageUrl || "/images/user.png";
  const isExternalAvatar = avatarSrc.startsWith("http");
  const searchParamsKey = searchParams.toString();
  const isAdmin =
    (user?.app_metadata as { role?: string } | undefined)?.role === "ADMIN";
  const adminHref = `/${locale}/admin`;
  const greetingText = isArabic
    ? `مرحباً عزيزنا ${userDisplayName}!`
    : `Welcome dear ${userDisplayName}!`;
  const greetingSizeClass =
    greetingText.length > 36
      ? "text-xs md:text-sm"
      : greetingText.length > 26
        ? "text-sm md:text-base"
        : greetingText.length > 18
          ? "text-base md:text-xl"
          : "text-xl md:text-3xl";

  // ── Detect mobile ──────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // ── Close social panel on outside tap (mobile) ────────────────────────────
  useEffect(() => {
    if (!socialOpen || !isMobile) return;
    const onOutside = (e: TouchEvent | MouseEvent) => {
      if (socialRef.current && !socialRef.current.contains(e.target as Node)) {
        setSocialOpen(false);
      }
    };
    document.addEventListener("touchstart", onOutside);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("touchstart", onOutside);
      document.removeEventListener("mousedown", onOutside);
    };
  }, [socialOpen, isMobile]);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    const floor = NAV_FLOOR_MAP[href];
    if (floor === undefined) return;
    e.preventDefault();
    const isHomePath = /^\/[a-z]{2}(\/)?$/.test(pathname);
    if (isHomePath) {
      navigateToFloor(floor);
    } else {
      router.push(`/${locale}?floor=${floor}`);
    }
    setMenuOpen(false);
  };

  // ── 1. Body scroll lock ────────────────────────────────────────────────────
  useEffect(() => {
    if (menuOpen || userMenuOpen || contactModalOpen || notificationOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [menuOpen, userMenuOpen, contactModalOpen, notificationOpen]);

  // ── 2. Escape key closes contact modal ────────────────────────────────────
  useEffect(() => {
    if (!contactModalOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContactModalOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [contactModalOpen]);

  // ── 3. Auth + avatar ───────────────────────────────────────────────────────
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const loadUserAvatar = async () => {
      try {
        const res = await fetch("/api/auth/avatar", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          authenticated?: boolean;
          imageUrl?: string | null;
          displayName?: string | null;
        };
        if (!mounted) return;
        setUserImageUrl(data.authenticated ? (data.imageUrl ?? null) : null);
        setUserDisplayName(
          data.authenticated && data.displayName
            ? data.displayName
            : isArabic
              ? "المستخدم"
              : "User",
        );
      } catch {
        if (!mounted) return;
        setUserImageUrl(null);
        setUserDisplayName(isArabic ? "المستخدم" : "User");
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setUser(user ?? null);
      setPrismaUserId(user?.id ?? null);
      if (user) void loadUserAvatar();
      else {
        setUserImageUrl(null);
        setUserDisplayName(isArabic ? "المستخدم" : "User");
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setPrismaUserId(session?.user?.id ?? null);
      if (session?.user) void loadUserAvatar();
      else {
        setUserImageUrl(null);
        setUserDisplayName(isArabic ? "المستخدم" : "User");
      }
      if (!session?.user) setUserMenuOpen(false);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, searchParamsKey, isArabic]);

  const switchLanguage = () => {
    const newLocale = isArabic ? "en" : "ar";
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    router.push(`/${newLocale}${pathWithoutLocale}`);
    setMenuOpen(false);
    setContactModalOpen(false);
  };

  const noNavPage =
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/verify-email") ||
    pathname.includes("/admin");

  if (noNavPage) return null;

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/reservation", label: t("Enrollment") },
    { href: "/about", label: t("about") },
    { href: "/gallery", label: t("gallery") },
  ];

  const userLinks = [
    {
      href: "/profile-setting",
      label: isArabic ? "الملف الشخصي" : "Profile Settings",
      icon: faUser,
    },
    {
      href: "/my-classes",
      label: isArabic ? "دروسي" : "My Classes",
      icon: faBookOpen,
    },
    {
      href: "/payments",
      label: isArabic ? "المدفوعات" : "Payments",
      icon: faCreditCard,
    },
  ];

  if (isAdmin) {
    userLinks.unshift({
      href: "/admin",
      label: isArabic ? "لوحة التحكم" : "Admin Panel",
      icon: faPalette,
    });
  }

  const contactContent = isArabic
    ? {
        title: "تواصل معنا",
        subtitle: "يمكنك التواصل مع الأكاديمية عبر الأرقام والمنصات التالية.",
        phone1: "استفسارات الإنجليزية وواتساب",
        phone2: "استفسارات العربية",
        landline: "الهاتف الأرضي",
        email: "البريد الإلكتروني",
        platforms: "المنصات",
      }
    : {
        title: "Contact Us",
        subtitle:
          "Reach Royal Academy through the following contact numbers and platforms.",
        phone1: "English Inquiries & WhatsApp",
        phone2: "Arabic Inquiries",
        landline: "Landline",
        email: "Email",
        platforms: "Platforms",
      };

  const contactPhones = [
    {
      label: contactContent.phone1,
      value: "+968 9327 6767",
      href: "tel:+96893276767",
    },
    {
      label: contactContent.phone2,
      value: "+968 9886 2343",
      href: "tel:+96898862343",
    },
    {
      label: contactContent.landline,
      value: "+968 2449 7033",
      href: "tel:+96824497033",
    },
  ];

  const contactPlatforms: Array<{
    label: string;
    href: string;
    icon: IconDefinition;
  }> = [
    {
      label: isArabic ? "واتساب" : "WhatsApp",
      href: "https://wa.me/96893276767",
      icon: faWhatsapp,
    },
    {
      label: "YouTube",
      href: "https://www.youtube.com/channel/UCBltWo91oBYJkW9k4r9iZCg",
      icon: faYoutube,
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/royal-academy-4729aa3a9",
      icon: faLinkedinIn,
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@royalacademymct?is_from_webapp=1&sender_device=pc",
      icon: faTiktok,
    },
  ];

  // Social icons — phone first (call), then platforms
  const socialIcons: Array<{
    label: string;
    href: string;
    icon: IconDefinition;
  }> = [
    {
      label: isArabic ? "اتصل بنا" : "Call Us",
      href: "tel:+96893276767",
      icon: faPhone,
    },
    ...contactPlatforms,
  ];

  const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const EASE_IN: [number, number, number, number] = [0.55, 0, 0.8, 0.2];

  const sealVariants: Variants = {
    hidden: { clipPath: "circle(0% at 100% 0%)", opacity: 0, scale: 0.92 },
    visible: {
      clipPath: "circle(150% at 100% 0%)",
      opacity: 1,
      scale: 1,
      transition: {
        clipPath: { duration: 0.65, ease: EASE_OUT },
        opacity: { duration: 0.2 },
        scale: { duration: 0.65, ease: EASE_OUT },
      },
    },
    exit: {
      clipPath: "circle(0% at 100% 0%)",
      opacity: 0,
      scale: 0.95,
      transition: {
        clipPath: { duration: 0.45, ease: EASE_IN },
        opacity: { duration: 0.3 },
        scale: { duration: 0.45 },
      },
    },
  };

  const userSealVariants: Variants = {
    hidden: { clipPath: "circle(0% at 0% 0%)", opacity: 0, scale: 0.92 },
    visible: {
      clipPath: "circle(150% at 0% 0%)",
      opacity: 1,
      scale: 1,
      transition: {
        clipPath: { duration: 0.55, ease: EASE_OUT },
        opacity: { duration: 0.2 },
        scale: { duration: 0.55, ease: EASE_OUT },
      },
    },
    exit: {
      clipPath: "circle(0% at 0% 0%)",
      opacity: 0,
      scale: 0.95,
      transition: {
        clipPath: { duration: 0.35, ease: EASE_IN },
        opacity: { duration: 0.25 },
      },
    },
  };

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  };

  const userContainerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: isArabic ? 20 : -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: EASE_OUT },
    },
    exit: { opacity: 0, x: isArabic ? 20 : -20, transition: { duration: 0.2 } },
  };

  const userItemVariants: Variants = {
    hidden: { opacity: 0, x: -16 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: EASE_OUT },
    },
    exit: { opacity: 0, x: -16, transition: { duration: 0.2 } },
  };

  const glassHoverStyle = {
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.07) 100%)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: `
      0 4px 20px rgba(0,0,0,0.2),
      inset 0 1px 1px rgba(255,255,255,0.22),
      inset 0 -1px 1px rgba(0,0,0,0.12),
      inset 1px 0 1px rgba(255,255,255,0.09),
      inset -1px 0 1px rgba(0,0,0,0.08)
    `,
  };

  const handleNotificationToggle = (isOpen: boolean) => {
    if (isOpen) {
      setMenuOpen(false);
      setUserMenuOpen(false);
    }
    setNotificationOpen(isOpen);
  };

  // ── Workshop href ──────────────────────────────────────────────────────────
  const workshopHref = `/${locale}/reservation`;
  const workshopLabel = isArabic ? "ورشة عمل" : "Workshops";

  return (
    <>
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: isDone ? 0 : -12, opacity: isDone ? 1 : 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-3 md:top-4 left-0 right-0 z-50 px-4 sm:px-6 md:px-8 py-3 md:py-5 flex items-center justify-between"
      >
        {/* ── Left side: Logo + User pill + Workshop (EN) + Bell ── */}
        <div
          className={`flex items-center gap-2 md:gap-3 min-w-0 ${isArabic ? "flex-row" : "flex-row"}`}
        >
          {/* Logo */}
          <AnimatePresence>
            {navSolid && (
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={`/${locale}`}
                  onClick={() => {
                    setMenuOpen(false);
                    setUserMenuOpen(false);
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Image
                      src="/images/logo/Logo-gray-cropped.png"
                      alt="Royal Academy"
                      width={80}
                      height={80}
                      className="object-contain w-12 h-12 md:w-20 md:h-20"
                      priority
                    />
                  </motion.div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User pill */}
          <motion.div
            animate={{ x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {authLoading ? (
              <div className="liquid-glass backdrop-blur-xs px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-royal-cream/70 text-xs sm:text-sm">
                ...
              </div>
            ) : !user ? (
              <Link
                href={loginHref}
                onClick={() => {
                  setMenuOpen(false);
                  setUserMenuOpen(false);
                }}
                className="liquid-glass-gold backdrop-blur-xs shimmer flex items-center justify-center gap-3 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-300 cursor-pointer"
              >
                <span className="text-royal-gold text-xs sm:text-sm tracking-widest uppercase font-medium whitespace-nowrap">
                  {isArabic ? "انضم إلينا" : "Join Us"}
                </span>
              </Link>
            ) : (
              <motion.button
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setMenuOpen(false);
                  setNotificationOpen(false);
                }}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center shimmer backdrop-blur-xs justify-center gap-3 px-1.5 md:px-2 py-1 rounded-full transition-all duration-300 cursor-pointer ${userMenuOpen ? "liquid-glass-gold" : "liquid-glass"}`}
              >
                <span className="relative h-9 w-9 md:h-12 md:w-12 overflow-hidden rounded-full bg-white/10">
                  <Image
                    src={avatarSrc}
                    alt="User"
                    fill
                    sizes="48px"
                    className="object-contain opacity-90"
                    unoptimized={isExternalAvatar}
                  />
                </span>
              </motion.button>
            )}
          </motion.div>

          {/* Notification Bell — only when logged in */}
          {user && prismaUserId && (
            <NotificationBell
              userId={prismaUserId}
              isArabic={isArabic}
              open={notificationOpen}
              onToggle={handleNotificationToggle}
            />
          )}
        </div>

        {/* ── Right side: Enrollment + Admin + Language + Menu ── */}
        <div
          className={`flex items-center gap-2 md:gap-3 ${isArabic ? "flex-row" : "flex-row"}`}
        >
          {/* Workshop button — EN: left of bell | AR: right of bell (handled by flex-row-reverse) */}
          {/* Desktop + tablet only — hidden on mobile (shown in menu instead) */}
          <motion.div
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            className="hidden sm:block"
          >
            <Link
              href={workshopHref}
              onClick={() => {
                setMenuOpen(false);
                setUserMenuOpen(false);
              }}
              className="liquid-glass-green backdrop-blur-xs shimmer flex items-center justify-center px-4 md:px-6 py-2 md:py-2.5 rounded-full transition-all duration-300 cursor-pointer"
            >
              <span
                className={`text-royal-green text-xs md:text-sm tracking-widest uppercase font-medium whitespace-nowrap ${isArabic ? "scale-125 inline-block" : ""}`}
              >
                {workshopLabel}
              </span>
            </Link>
          </motion.div>
          {/* Enrollment — desktop only */}
          <motion.div
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block"
          >
            <button
              type="button"
              onClick={() => router.push(`/${locale}/reservation`)}
              className="liquid-glass-gold backdrop-blur-xs shimmer flex items-center justify-center gap-3 px-6 lg:px-8 py-3 lg:py-4 rounded-full transition-all duration-300 cursor-pointer"
            >
              <span
                className={`text-royal-gold text-sm tracking-widest uppercase whitespace-nowrap inline-block ${isArabic ? "scale-150" : ""}`}
              >
                {t("Enrollment")}
              </span>
            </button>
          </motion.div>

          {/* Admin — desktop only */}
          {user && isAdmin && (
            <motion.div
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
              className="hidden md:block"
            >
              <Link
                href={adminHref}
                onClick={() => {
                  setMenuOpen(false);
                  setUserMenuOpen(false);
                }}
                className="liquid-glass backdrop-blur-xs shimmer flex items-center justify-center gap-3 px-5 lg:px-6 py-2.5 lg:py-3 rounded-full transition-all duration-300 cursor-pointer"
              >
                <span className="text-royal-cream text-xs lg:text-sm tracking-widest uppercase font-medium whitespace-nowrap">
                  {isArabic ? "لوحة التحكم" : "Admin"}
                </span>
              </Link>
            </motion.div>
          )}

          {/* Language switcher */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            onClick={switchLanguage}
            className="liquid-glass backdrop-blur-xs shimmer flex items-center justify-center gap-3 px-4 sm:px-5 md:px-8 py-2 md:py-3 rounded-full transition-all duration-300 cursor-pointer"
          >
            <span
              className={`text-royal-cream text-sm sm:text-base tracking-widest uppercase whitespace-nowrap inline-block ${isArabic ? "" : "scale-150"}`}
            >
              {isArabic ? "EN" : "عربي"}
            </span>
          </motion.button>

          {/* Menu button — shows text on md+, hamburger-only on mobile */}
          <motion.button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setUserMenuOpen(false);
              setNotificationOpen(false);
            }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            aria-label={
              menuOpen
                ? isArabic
                  ? "إغلاق"
                  : "Close"
                : isArabic
                  ? "القائمة"
                  : "Menu"
            }
            className={`shimmer backdrop-blur-xs flex items-center justify-center gap-2 md:gap-3 px-3 sm:px-4 md:px-8 py-2.5 md:py-4 rounded-full transition-all duration-300 cursor-pointer ${menuOpen ? "liquid-glass-gold" : "liquid-glass"}`}
          >
            {/* Hamburger / X icon — always visible */}
            <div className="flex flex-col gap-1.5">
              <motion.span
                animate={
                  menuOpen
                    ? { rotate: 45, y: 7.5, width: 20 }
                    : { rotate: 0, y: 0, width: 20 }
                }
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="block h-[1.5px] bg-royal-cream origin-center"
                style={{ width: 20 }}
              />
              <motion.span
                animate={
                  menuOpen
                    ? { opacity: 0, width: 0 }
                    : { opacity: 1, width: 13 }
                }
                transition={{ duration: 0.3 }}
                className="block h-[1.5px] bg-royal-cream/70"
                style={{ width: 13 }}
              />
              <motion.span
                animate={
                  menuOpen
                    ? { rotate: -45, y: -7.5, width: 20 }
                    : { rotate: 0, y: 0, width: 20 }
                }
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="block h-[1.5px] bg-royal-cream origin-center"
                style={{ width: 20 }}
              />
            </div>

            {/* Text label — hidden on mobile */}
            <AnimatePresence mode="wait">
              <motion.span
                key={menuOpen ? "close" : "menu"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className={`md:inline text-royal-cream text-sm tracking-widest uppercase whitespace-nowrap inline-block ${isArabic ? "scale-150" : ""}`}
              >
                {menuOpen
                  ? isArabic
                    ? "إغلاق"
                    : "Close"
                  : isArabic
                    ? "القائمة"
                    : "Menu"}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.header>

      {/* ── DESKTOP SOCIAL PANEL — fixed right edge, vertically centered ─────── */}
      {/* Hidden on mobile — mobile uses the floating button below */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: isDone ? 1 : 0, x: isDone ? 0 : 20 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-2 pr-3"
      >
        {socialIcons.map((item, i) => (
          <motion.a
            key={item.label}
            href={item.href}
            target={item.href.startsWith("tel") ? "_self" : "_blank"}
            rel="noopener noreferrer"
            aria-label={item.label}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.45,
              delay: 0.5 + i * 0.07,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ scale: 1.12, x: -3 }}
            whileTap={{ scale: 0.94 }}
            className="liquid-glass backdrop-blur-xs shimmer flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 cursor-pointer group"
            title={item.label}
          >
            <FontAwesomeIcon
              icon={item.icon}
              className="text-royal-gold/70 group-hover:text-royal-gold transition-colors duration-200 text-sm"
            />
          </motion.a>
        ))}
      </motion.div>

      {/* ── MOBILE FLOATING SOCIAL BUTTON — bottom-right, iPhone dock style ──── */}
      {/* Only on mobile */}
      <div
        ref={socialRef}
        className="md:hidden fixed bottom-6 right-5 z-50 flex flex-col-reverse items-center gap-3"
      >
        {/* Fanned icons — animate upward when open */}
        <AnimatePresence>
          {socialOpen &&
            socialIcons.map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("tel") ? "_self" : "_blank"}
                rel="noopener noreferrer"
                aria-label={item.label}
                initial={{ opacity: 0, y: 20, scale: 0.7 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    duration: 0.38,
                    delay: i * 0.055,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
                exit={{
                  opacity: 0,
                  y: 16,
                  scale: 0.75,
                  transition: {
                    duration: 0.22,
                    delay: (socialIcons.length - 1 - i) * 0.04,
                    ease: [0.55, 0, 0.8, 0.2],
                  },
                }}
                whileTap={{ scale: 0.9 }}
                className="liquid-glass-gold backdrop-blur-xs shimmer flex items-center justify-center w-12 h-12 rounded-full cursor-pointer shadow-lg shadow-black/30"
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="text-royal-gold text-base"
                />
              </motion.a>
            ))}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          onClick={() => setSocialOpen((v) => !v)}
          whileTap={{ scale: 0.92 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-label={socialOpen ? "Close social links" : "Open social links"}
          className={`flex items-center justify-center w-14 h-14 rounded-full shadow-xl shadow-black/40 cursor-pointer transition-all duration-300 ${socialOpen ? "liquid-glass-gold" : "liquid-glass"}`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={socialOpen ? "close" : "phone"}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <FontAwesomeIcon
                icon={socialOpen ? faXmark : faPhone}
                className={`text-lg transition-colors duration-200 ${socialOpen ? "text-royal-gold" : "text-royal-cream/80"}`}
              />
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      {/* ── Invisible backdrop ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {(menuOpen || userMenuOpen || notificationOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => {
              setMenuOpen(false);
              setUserMenuOpen(false);
              setNotificationOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Contact Modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {contactModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-70 px-4 py-8 md:py-10 bg-black/75 backdrop-blur-[2px]"
            onClick={() => setContactModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="mx-auto flex backdrop-blur-sm bg-black/70 max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-white/25 shadow-[0_35px_90px_rgba(0,0,0,0.55)] overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/15 px-6 py-5">
                <div>
                  <h2
                    className="text-2xl tracking-wider"
                    style={{ color: "#f2dfc1" }}
                  >
                    {contactContent.title}
                  </h2>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "rgba(245,236,222,0.9)" }}
                  >
                    {contactContent.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="h-9 w-9 rounded-full border border-white/20 text-[#f2dfc1] transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]"
                  aria-label={isArabic ? "إغلاق" : "Close"}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <div className="grid gap-5 overflow-y-auto px-6 py-6 md:grid-cols-2">
                <section
                  className="rounded-2xl border border-white/15 p-4"
                  style={{
                    boxShadow:
                      "0 12px 30px rgba(0,0,0,0.22), inset 0 1px 1px rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="space-y-4">
                    {contactPhones.map((item) => (
                      <div key={item.label}>
                        <p
                          className="text-[11px] uppercase tracking-wider"
                          style={{ color: "rgba(228,208,181,0.65)" }}
                        >
                          {item.label}
                        </p>
                        <a
                          href={item.href}
                          className="text-base transition-opacity hover:opacity-80"
                          style={{ color: "#f3e5cf" }}
                        >
                          {item.value}
                        </a>
                      </div>
                    ))}
                    <div>
                      <p
                        className="text-[11px] uppercase tracking-wider"
                        style={{ color: "rgba(228,208,181,0.65)" }}
                      >
                        {contactContent.email}
                      </p>
                      <a
                        href="mailto:Admin@royalacademymct.com"
                        className="text-base break-all transition-opacity hover:opacity-80"
                        style={{ color: "#f3e5cf" }}
                      >
                        Admin@royalacademymct.com
                      </a>
                    </div>
                  </div>
                </section>

                <section
                  className="rounded-2xl border border-white/15 p-4"
                  style={{
                    boxShadow:
                      "0 12px 30px rgba(0,0,0,0.22), inset 0 1px 1px rgba(255,255,255,0.08)",
                  }}
                >
                  <h3
                    className="text-sm uppercase tracking-wider"
                    style={{ color: "rgba(228,208,181,0.75)" }}
                  >
                    {contactContent.platforms}
                  </h3>
                  <ul className="mt-4 grid grid-cols-2 gap-3">
                    {contactPlatforms.map((platform) => (
                      <li key={platform.label} className="w-full">
                        <a
                          href={platform.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 rounded-2xl border border-white/10 px-3 py-3 transition-all duration-300 hover:border-white/20 hover:bg-white/5"
                          aria-label={platform.label}
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl liquid-glass text-royal-gold/80 group-hover:text-royal-gold transition-colors">
                            <FontAwesomeIcon icon={platform.icon} />
                          </span>
                          <span className="text-sm font-medium tracking-wide text-royal-cream">
                            {platform.label}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Nav Menu ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={sealVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed z-50 top-24 sm:top-28 ${isArabic ? "left-4 sm:left-8 w-[calc(100vw-2rem)] max-w-sm sm:w-96" : "right-4 sm:right-8 w-[calc(100vw-2rem)] max-w-sm sm:w-96"} rounded-3xl liquid-glass backdrop-blur-xs shadow-2xl shadow-black/60`}
            style={{ clipPath: "inset(0 round 1.5rem)" }}
          >
            <div className="h-px w-full bg-linear-to-r from-transparent via-royal-gold/50 to-transparent" />
            <div className="px-6 py-8 sm:px-10 sm:py-10">
              <motion.nav
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`flex flex-col ${isArabic ? "items-start" : "items-end"} gap-0`}
              >
                {navLinks.map((link) => (
                  <motion.div
                    key={link.href}
                    variants={itemVariants}
                    className="w-full"
                  >
                    <Link
                      href={`/${locale}${link.href}`}
                      onClick={(e) => {
                        handleNavClick(e, link.href);
                        setMenuOpen(false);
                      }}
                      className={`group relative flex items-center gap-1 py-5 w-full border-b border-white/5 last:border-0 ${isArabic ? "flex-row-reverse" : "flex-row-reverse"}`}
                    >
                      <span
                        className="absolute inset-0 -mx-4 rounded-2xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 -translate-x-3 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none"
                        style={glassHoverStyle}
                      />
                      <span
                        className={`relative z-10 text-royal-cream text-2xl font-bold opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all duration-300 ease-out ${isArabic ? "translate-x-0 group-hover:translate-x-2" : "translate-x-0 group-hover:-translate-x-2"}`}
                      >
                        <FontAwesomeIcon
                          icon={isArabic ? faCaretRight : faCaretLeft}
                        />
                      </span>
                      <span
                        className={`relative z-10 text-royal-cream text-3xl font-light tracking-wide -translate-x-1 transition-all duration-300 ease-out group-hover:text-royal-gold ${isArabic ? "group-hover:translate-x-5" : "group-hover:-translate-x-5"}`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}

                {/* Workshop — mobile only (hidden on sm+ since it's in the left cluster there) */}
                <motion.div
                  variants={itemVariants}
                  className="w-full sm:hidden"
                >
                  <Link
                    href={workshopHref}
                    onClick={() => setMenuOpen(false)}
                    className={`group relative flex items-center gap-1 py-5 w-full border-b border-white/5 ${isArabic ? "flex-row-reverse" : "flex-row-reverse"}`}
                  >
                    <span
                      className="absolute inset-0 -mx-4 rounded-2xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 -translate-x-3 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none"
                      style={glassHoverStyle}
                    />
                    <span
                      className={`relative z-10 text-royal-cream text-2xl font-bold opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all duration-300 ease-out ${isArabic ? "translate-x-0 group-hover:translate-x-2" : "translate-x-0 group-hover:-translate-x-2"}`}
                    >
                      <FontAwesomeIcon
                        icon={isArabic ? faCaretRight : faCaretLeft}
                      />
                    </span>
                    <span
                      className={`relative z-10 text-royal-gold text-3xl font-light tracking-wide -translate-x-1 transition-all duration-300 ease-out group-hover:text-royal-gold ${isArabic ? "group-hover:translate-x-5" : "group-hover:-translate-x-5"}`}
                    >
                      {workshopLabel}
                    </span>
                  </Link>
                </motion.div>

                {/* Contact Us */}
                <motion.div variants={itemVariants} className="w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setContactModalOpen(true);
                      setMenuOpen(false);
                      setUserMenuOpen(false);
                    }}
                    className={`group relative flex items-center gap-1 py-5 w-full border-b border-white/5 last:border-0 ${isArabic ? "flex-row-reverse" : "flex-row-reverse"}`}
                  >
                    <span
                      className="absolute inset-0 -mx-4 rounded-2xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 -translate-x-3 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none"
                      style={glassHoverStyle}
                    />
                    <span className="relative z-10 text-royal-cream text-2xl font-bold opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 translate-x-0 group-hover:-translate-x-2 transition-all duration-300 ease-out">
                      <FontAwesomeIcon
                        icon={isArabic ? faCaretRight : faCaretLeft}
                      />
                    </span>
                    <span
                      className={`relative z-10 text-royal-cream text-3xl font-light tracking-wide -translate-x-1 transition-all duration-300 ease-out group-hover:text-royal-gold ${isArabic ? "group-hover:translate-x-5" : "group-hover:-translate-x-5"}`}
                    >
                      {isArabic ? "تواصل معنا" : "Contact Us"}
                    </span>
                  </button>
                </motion.div>

                {/* Admin — mobile only (already in right cluster on desktop) */}
                {user && isAdmin && (
                  <motion.div
                    variants={itemVariants}
                    className="w-full md:hidden"
                  >
                    <Link
                      href={adminHref}
                      onClick={() => {
                        setMenuOpen(false);
                        setUserMenuOpen(false);
                      }}
                      className={`group relative flex items-center gap-1 py-5 w-full border-b border-white/5 last:border-0 ${isArabic ? "flex-row-reverse" : "flex-row-reverse"}`}
                    >
                      <span
                        className="absolute inset-0 -mx-4 rounded-2xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 -translate-x-3 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none"
                        style={glassHoverStyle}
                      />
                      <span className="relative z-10 text-royal-cream text-2xl font-bold opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 translate-x-0 group-hover:-translate-x-2 transition-all duration-300 ease-out">
                        <FontAwesomeIcon
                          icon={isArabic ? faCaretRight : faCaretLeft}
                        />
                      </span>
                      <span
                        className={`relative z-10 text-royal-cream text-3xl font-light tracking-wide -translate-x-1 transition-all duration-300 ease-out group-hover:text-royal-gold ${isArabic ? "group-hover:translate-x-5" : "group-hover:-translate-x-5"}`}
                      >
                        {isArabic ? "لوحة التحكم" : "Admin Panel"}
                      </span>
                    </Link>
                  </motion.div>
                )}
              </motion.nav>
            </div>
            <div className="h-px w-full bg-linear-to-r from-transparent via-royal-gold/50 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── User Menu ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {userMenuOpen && user && (
          <motion.div
            variants={userSealVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`absolute z-50 top-24 sm:top-28 rounded-3xl liquid-glass shadow-2xl shadow-black/60 ${isArabic ? "right-4 sm:right-8 w-[calc(100vw-2rem)] max-w-sm sm:w-80" : "left-4 sm:left-8 w-[calc(100vw-2rem)] max-w-xs sm:w-72"}`}
            style={{ clipPath: "inset(0 round 1.5rem)" }}
          >
            <div className="h-px w-full bg-linear-to-r from-transparent via-royal-gold/50 to-transparent" />
            <div className="px-8 pt-8 pb-4 flex items-center gap-4 border-b border-white/5">
              <div className="relative w-12 h-12 shrink-0 rounded-full liquid-glass backdrop-blur-xs overflow-hidden">
                <Image
                  src={avatarSrc}
                  alt="User"
                  fill
                  sizes="48px"
                  className="object-contain opacity-90"
                  unoptimized={isExternalAvatar}
                />
              </div>
              <div>
                <p
                  className={`max-w-48 wrap-break-word leading-tight text-royal-cream tracking-wide ${greetingSizeClass} ${isArabic ? "px-6" : "px-0"}`}
                >
                  {greetingText}
                </p>
              </div>
            </div>

            <div className="px-6 py-6">
              <motion.nav
                variants={userContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-1"
              >
                {userLinks.map((link) => (
                  <motion.div key={link.href} variants={userItemVariants}>
                    <Link
                      href={`/${locale}${link.href}`}
                      onClick={() => setUserMenuOpen(false)}
                      className="group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300"
                    >
                      <span
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none"
                        style={glassHoverStyle}
                      />
                      <span
                        className={`relative z-10 rounded-xl liquid-glass flex items-center justify-center text-royal-gold/70 group-hover:text-royal-gold transition-colors duration-300 text-sm ${isArabic ? "p-1" : "p-3"}`}
                      >
                        <FontAwesomeIcon icon={link.icon} />
                      </span>
                      <span
                        className={`relative z-10 text-royal-cream group-hover:text-royal-cream text-2xl tracking-wide transition-all duration-300 group-hover:translate-x-1 ${isArabic ? "px-5" : "px-0"}`}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
                <motion.div variants={userItemVariants}>
                  <form action={signOut}>
                    <input type="hidden" name="locale" value={locale} />
                    <button
                      type="submit"
                      className="group relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 w-full text-left"
                    >
                      <span
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none"
                        style={glassHoverStyle}
                      />
                      <span
                        className={`relative z-10 rounded-xl liquid-glass flex items-center justify-center text-royal-gold/70 group-hover:text-royal-gold transition-colors duration-300 text-sm ${isArabic ? "p-1" : "p-3"}`}
                      >
                        <FontAwesomeIcon icon={faPowerOff} />
                      </span>
                      <span
                        className={`relative z-10 text-royal-cream group-hover:text-royal-cream text-2xl tracking-wide transition-all duration-300 group-hover:translate-x-1 ${isArabic ? "px-5" : "px-0"}`}
                      >
                        {isArabic ? "تسجيل الخروج" : "Sign Out"}
                      </span>
                    </button>
                  </form>
                </motion.div>
              </motion.nav>
            </div>
            <div className="h-px w-full bg-linear-to-r from-transparent via-royal-gold/50 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
