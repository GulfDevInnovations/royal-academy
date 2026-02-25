"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const isArabic = locale === "ar";

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

  const switchLanguage = () => {
    const newLocale = isArabic ? "en" : "ar";
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    router.push(`/${newLocale}${pathWithoutLocale}`);
    setMenuOpen(false);
  };

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/teachers", label: t("teachers") },
    { href: "/classes", label: t("classes") },
    { href: "/schedule", label: t("schedule") },
    { href: "/gallery", label: t("gallery") },
    { href: "/about", label: t("about") },
  ];

  // Seal unfold — originates from top-right corner
  const sealVariants = {
    hidden: {
      clipPath: "circle(0% at 100% 0%)",
      opacity: 0,
      scale: 0.92,
    },
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

  // Stagger children inside menu
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.06, delayChildren: 0.25 },
    },
    exit: {
      transition: { staggerChildren: 0.03, staggerDirection: -1 },
    },
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

  return (
    <>
      {/* Top Bar */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="fixed top-4 left-0 right-0 z-50 px-8 py-5 flex items-center justify-between"
      >
        {/* Logo */}
        <Link href={`/${locale}`} onClick={() => setMenuOpen(false)}>
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

        {/* Right Side Pills */}
        <div
          className={`flex items-center gap-3 ${isArabic ? "flex-row" : "flex-row"}`}
        >
          {/* Chat With Us */}
          <motion.div
            whileTap={{ scale: 0.96, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
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
            <span className="text-royal-cream text-lg tracking-widest uppercase whitespace-nowrap">
              {isArabic ? "EN" : "عربي"}
            </span>
          </motion.button>

          {/* Menu Button */}
          <motion.button
            onClick={() => setMenuOpen(!menuOpen)}
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

      {/* Invisible backdrop to close menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Box — seal unfold from top-right */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            variants={sealVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              fixed z-50 top-28 w-105
              ${isArabic ? "left-8" : "right-8"}
              rounded-3xl overflow-hidden
              liquid-glass
              shadow-2xl shadow-black/60
            `}
          >
            {/* Gold top line */}
            <div className="h-px w-full bg-linear-to-r from-transparent via-royal-gold/50 to-transparent" />

            <div className="px-10 py-10">
              <motion.nav
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className={`flex flex-col ${isArabic ? "items-end" : "items-start"} gap-0`}
              >
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    variants={itemVariants}
                    className="w-full"
                  >
                    <Link
                      href={`/${locale}${link.href}`}
                      onClick={() => setMenuOpen(false)}
                      className={`
                        group flex items-center gap-5 py-5 w-full
                        border-b border-white/5 last:border-0
                        ${isArabic ? "flex-row" : "flex-row"}
                      `}
                    >
                      <span
                        className="text-royal-gold opacity-0 group-hover:opacity-70
                        transition-all duration-300 text-xl"
                      >
                        {isArabic ? "←" : "→"}
                      </span>
                      <span
                        className="text-royal-cream text-3xl font-light tracking-wide
                        group-hover:text-royal-gold transition-colors duration-300"
                      >
                        {link.label}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </motion.nav>
            </div>

            {/* Gold bottom line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-royal-gold/50 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
