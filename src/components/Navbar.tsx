"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
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
} from "@fortawesome/free-solid-svg-icons";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  useEffect(() => {
    document.body.style.overflow =
      menuOpen || userMenuOpen || contactModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, userMenuOpen, contactModalOpen]);

  useEffect(() => {
    if (!contactModalOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContactModalOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [contactModalOpen]);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    const loadUserAvatar = async () => {
      try {
        const response = await fetch("/api/auth/avatar", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as {
          authenticated?: boolean;
          imageUrl?: string | null;
        };
        if (!mounted) return;
        setUserImageUrl(data.authenticated ? (data.imageUrl ?? null) : null);
      } catch {
        if (!mounted) return;
        setUserImageUrl(null);
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setUser(user ?? null);
      if (user) {
        void loadUserAvatar();
      } else {
        setUserImageUrl(null);
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        void loadUserAvatar();
      } else {
        setUserImageUrl(null);
      }
      if (!session?.user) setUserMenuOpen(false);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, searchParamsKey]);

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
    { href: "/teachers", label: t("teachers") },
    { href: "/classes", label: t("classes") },
    { href: "/schedule", label: t("schedule") },
    { href: "/gallery", label: t("gallery") },
    { href: "/about", label: t("about") },
  ];

  const userLinks = [
    {
      href: "/profile-setting",
      label: isArabic ? "الملف الشخصي" : "Profile Settings",
      icon: faUser,
    },
    {
      href: "/customization",
      label: isArabic ? "التخصيص" : "Customization",
      icon: faPalette,
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
    { label: contactContent.phone1, value: "+968 9327 6767", href: "tel:+96893276767" },
    { label: contactContent.phone2, value: "+968 9886 2343", href: "tel:+96898862343" },
    { label: contactContent.landline, value: "+968 2449 7033", href: "tel:+96824497033" },
  ];

  const contactPlatforms = [
    {
      label: "YouTube",
      href: "https://www.youtube.com/channel/UCBltWo91oBYJkW9k4r9iZCg",
    },
    {
      label: "LinkedIn",
      href: "http://www.linkedin.com/in/royal-academy-4729aa3a9",
    },
    {
      label: "TikTok",
      href: "https://www.tiktok.com/@royalacademymct?is_from_webapp=1&sender_device=pc",
    },
  ];

  // Seal from top-right for main menu
  const sealVariants = {
    hidden: { clipPath: "circle(0% at 100% 0%)", opacity: 0, scale: 0.92 },
    visible: {
      clipPath: "circle(150% at 100% 0%)",
      opacity: 1,
      scale: 1,
      transition: {
        clipPath: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.2 },
        scale: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
      },
    },
    exit: {
      clipPath: "circle(0% at 100% 0%)",
      opacity: 0,
      scale: 0.95,
      transition: {
        clipPath: { duration: 0.45, ease: [0.55, 0, 0.8, 0.2] },
        opacity: { duration: 0.3 },
        scale: { duration: 0.45 },
      },
    },
  };

  // Seal from top-left for user menu
  const userSealVariants = {
    hidden: { clipPath: "circle(0% at 0% 0%)", opacity: 0, scale: 0.92 },
    visible: {
      clipPath: "circle(150% at 0% 0%)",
      opacity: 1,
      scale: 1,
      transition: {
        clipPath: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.2 },
        scale: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      },
    },
    exit: {
      clipPath: "circle(0% at 0% 0%)",
      opacity: 0,
      scale: 0.95,
      transition: {
        clipPath: { duration: 0.35, ease: [0.55, 0, 0.8, 0.2] },
        opacity: { duration: 0.25 },
      },
    },
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  };

  const userContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: isArabic ? 20 : -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: { opacity: 0, x: isArabic ? 20 : -20, transition: { duration: 0.2 } },
  };

  const userItemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: "easeOut" },
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

  return (
    <>
      {/* Top Bar */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="fixed top-4 left-0 right-0 z-50 px-8 py-5 flex items-center justify-between"
      >
        {/* Left side — Logo + User pill */}
        <div className="flex items-center gap-3">
          {/* Logo */}
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
                src="/images/Logo-gray-cropped.png"
                alt="Royal Academy"
                width={155}
                height={58}
                className="object-contain"
                priority
              />
            </motion.div>
          </Link>

          {/* User Pill / Start Journey */}
          {authLoading ? (
            <div className="liquid-glass px-6 py-3 rounded-full text-royal-cream/70 text-sm">
              ...
            </div>
          ) : !user ? (
            <Link
              href={loginHref}
              onClick={() => {
                setMenuOpen(false);
                setUserMenuOpen(false);
              }}
              className="liquid-glass-gold shimmer flex items-center justify-center gap-3 px-6 py-3 rounded-full transition-all duration-300 cursor-pointer"
            >
              <span className="text-royal-gold text-sm tracking-widest uppercase font-medium whitespace-nowrap">
                {t("startJourney")}
              </span>
            </Link>
          ) : (
            <motion.button
              onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setMenuOpen(false);
              }}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
              className={`
              shimmer flex items-center justify-center gap-3 px-2 py-1 rounded-full
              transition-all duration-300 cursor-pointer
              ${userMenuOpen ? "liquid-glass-gold" : "liquid-glass"}
            `}
            >
              <span className="relative h-12 w-12 overflow-hidden rounded-full bg-white/10">
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
        </div>

        {/* Right Side Pills */}
        <div
          className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Contact Us */}
          <motion.div
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              onClick={() => {
                setContactModalOpen(true);
                setMenuOpen(false);
                setUserMenuOpen(false);
              }}
              className="liquid-glass-gold shimmer flex items-center justify-center gap-3 px-8 py-4 rounded-full transition-all duration-300 cursor-pointer"
            >
              <span className="text-royal-gold text-sm tracking-widest uppercase font-medium whitespace-nowrap">
                {isArabic ? "تواصل معنا" : "Contact Us"}
              </span>
            </button>
          </motion.div>

          {/* Language Switcher */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            onClick={switchLanguage}
            className="liquid-glass shimmer flex items-center justify-center gap-3 px-8 py-3 rounded-full transition-all duration-300 cursor-pointer"
          >
            <span className="text-royal-cream text-xl tracking-widest uppercase whitespace-nowrap">
              {isArabic ? "EN" : "عربي"}
            </span>
          </motion.button>

          {/* Menu Button */}
          <motion.button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setUserMenuOpen(false);
            }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            className={`
              shimmer flex items-center justify-center gap-3 px-8 py-4 rounded-full
              transition-all duration-300 cursor-pointer
              ${menuOpen ? "liquid-glass-gold" : "liquid-glass"}
            `}
          >
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
            <AnimatePresence mode="wait">
              <motion.span
                key={menuOpen ? "close" : "menu"}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-royal-cream text-sm tracking-widest uppercase whitespace-nowrap"
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

      {/* Invisible backdrop — closes any open menu */}
      <AnimatePresence>
        {(menuOpen || userMenuOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => {
              setMenuOpen(false);
              setUserMenuOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {contactModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] backdrop-blur-[2px] px-4 py-8 md:py-10"
            onClick={() => setContactModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className="mx-auto flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-white/25 shadow-[0_35px_90px_rgba(0,0,0,0.45)] overflow-hidden"
              style={{
                backdropFilter: "blur(20px) saturate(170%)",
                WebkitBackdropFilter: "blur(20px) saturate(170%)",
              }}
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
                  className="h-9 w-9 rounded-full border border-white/20 text-[#f2dfc1] transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]"
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
                  <ul className="mt-3 space-y-3">
                    {contactPlatforms.map((platform) => (
                      <li key={platform.label}>
                        <p
                          className="text-[11px] uppercase tracking-wider"
                          style={{ color: "rgba(228,208,181,0.65)" }}
                        >
                          {platform.label}
                        </p>
                        <a
                          href={platform.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm break-all transition-opacity hover:opacity-80"
                          style={{ color: "#f3e5cf" }}
                        >
                          {platform.href}
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

      {/* Main Nav Menu Box — seal from top-right */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={sealVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed z-50 top-28 w-96
              ${isArabic ? "left-8" : "right-8"}
              rounded-3xl overflow-hidden liquid-glass shadow-2xl shadow-black/60
            `}
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-royal-gold/50 to-transparent" />
            <div className="px-10 py-10">
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
                      onClick={() => setMenuOpen(false)}
                      className={`
                        group relative flex items-center gap-1 py-5 w-full
                        border-b border-white/5 last:border-0
                        ${isArabic ? "flex-row-reverse" : "flex-row-reverse"}
                      `}
                    >
                      <span
                        className="absolute inset-0 -mx-4 rounded-2xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 -translate-x-3 group-hover:translate-x-0 transition-all duration-300 ease-out pointer-events-none"
                        style={glassHoverStyle}
                      />
                      <span
                        className={`relative z-10 text-royal-cream text-2xl font-bold opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 translate-x-0 group-hover:-translate-x-2 transition-all duration-300 ease-out`}
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
              </motion.nav>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-royal-gold/50 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Menu Box — seal from top-left */}
      <AnimatePresence>
        {userMenuOpen && user && (
          <motion.div
            variants={userSealVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed z-50 top-28 left-8 w-72 rounded-3xl overflow-hidden liquid-glass shadow-2xl shadow-black/60"
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-royal-gold/50 to-transparent" />

            {/* User avatar header */}
            <div className="px-8 pt-8 pb-4 flex items-center gap-4 border-b border-white/5">
              <div className="relative w-12 h-12 rounded-full liquid-glass overflow-hidden">
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
                <p className="text-royal-cream text-3xl tracking-wide">
                  {isArabic ? "مرحباً" : "Welcome"}
                </p>
                <p className="text-royal-gold/60 text-xs tracking-widest uppercase">
                  {isArabic ? "الطالب" : "Student"}
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
                      {/* Glass hover bg */}
                      <span
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 ease-out pointer-events-none"
                        style={glassHoverStyle}
                      />
                      {/* Icon */}
                      <span className="relative z-10 w-8 h-8 rounded-xl liquid-glass flex items-center justify-center text-royal-gold/70 group-hover:text-royal-gold transition-colors duration-300 text-sm">
                        <FontAwesomeIcon icon={link.icon} />
                      </span>
                      {/* Label */}
                      <span className="relative z-10 text-royal-cream group-hover:text-royal-cream text-2xl tracking-wide transition-all duration-300 group-hover:translate-x-1">
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
                      <span className="relative z-10 w-8 h-8 rounded-xl liquid-glass flex items-center justify-center text-royal-gold/70 group-hover:text-royal-gold transition-colors duration-300 text-sm">
                        <FontAwesomeIcon icon={faPowerOff} />
                      </span>
                      <span className="relative z-10 text-royal-cream group-hover:text-royal-cream text-2xl tracking-wide transition-all duration-300 group-hover:translate-x-1">
                        {isArabic ? "تسجيل الخروج" : "Sign Out"}
                      </span>
                    </button>
                  </form>
                </motion.div>
              </motion.nav>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-royal-gold/50 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
