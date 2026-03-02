"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "@fortawesome/free-solid-svg-icons";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const isArabic = locale === "ar";
  const loginHref = `/${locale}/login?redirectTo=${encodeURIComponent(pathname)}`;


  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
  const supabase = createClient();
  let mounted = true;

  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!mounted) return;
    setUser(user ?? null);
    setAuthLoading(false);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
      if (!session?.user) setUserMenuOpen(false);
    setAuthLoading(false);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

  const switchLanguage = () => {
    const newLocale = isArabic ? "en" : "ar";
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    router.push(`/${newLocale}${pathWithoutLocale}`);
    setMenuOpen(false);
  };

  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/verify-email");

  if (isAuthPage) return null;

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
      href: "/profile",
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
                src="/images/Logo-White.png"
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
            <Image
              src="/images/user.png"
              alt="User"
              width={22}
              height={22}
              className="object-contain opacity-80 w-12"
            />
          </motion.button>
        )}
        </div>

        {/* Right Side Pills */}
        <div
          className={`flex items-center gap-3 ${isArabic ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Chat With Us */}
          <motion.div
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href={`/${locale}/contact`}
              className="liquid-glass-gold shimmer flex items-center justify-center gap-3 px-8 py-4 rounded-full transition-all duration-300 cursor-pointer"
            >
              <span className="text-royal-gold text-sm tracking-widest uppercase font-medium whitespace-nowrap">
                {isArabic ? "تواصل معنا" : "Chat With Us"}
              </span>
            </Link>
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
                        className={`relative z-10 text-royal-cream text-3xl font-light tracking-wide -translate-x-1 group-hover:-translate-x-5 transition-all duration-300 ease-out group-hover:text-royal-gold`}
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
              <div className="w-12 h-12 rounded-full liquid-glass flex items-center justify-center">
                <Image
                  src="/images/user.png"
                  alt="User"
                  width={28}
                  height={28}
                  className="object-contain opacity-80"
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
                      <span className="relative z-10 text-royal-mauve group-hover:text-royal-cream text-2xl tracking-wide transition-all duration-300 group-hover:translate-x-1">
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
      <span className="relative z-10 text-royal-mauve group-hover:text-royal-cream text-2xl tracking-wide transition-all duration-300 group-hover:translate-x-1">
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
