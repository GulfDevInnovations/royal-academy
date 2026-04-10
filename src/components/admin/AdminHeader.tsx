"use client";

import { Bell, Search, ChevronDown, LogOut, User } from "lucide-react";
import { useState } from "react";
import { signOut } from "@/lib/actions/auth.actions";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
interface AdminHeaderProps {
  adminName?: string;
  locale: string;
}

export default function AdminHeader({
  adminName = "Admin",
  locale,
}: AdminHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const t = useTranslations("admin");
  const router = useRouter();
  const pathname = usePathname();
  const isArabic = locale === "ar";
  const [active, setActive] = useState<"en" | "ar">(isArabic ? "ar" : "en");

  const switchLanguage = () => {
    const newLocale = isArabic ? "en" : "ar";
    const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  const activeStyle = {
    background: "rgba(251,191,36,0.15)",
    color: "#fbbf24",
    border: "0.5px solid rgba(251,191,36,0.35)",
  } as const;

  const inactiveStyle = {
    background: "transparent",
    color: "rgba(255,255,255,0.45)",
    border: "0.5px solid transparent",
  } as const;

  const handleSelect = (lang: "en" | "ar") => {
    setActive(lang);
    switchLanguage(); // your existing function
  };

  return (
    <header
      className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-white/6"
      style={{ background: "#13161f" }}
    >
      {/* ── Search ── */}
      <div className="relative w-64">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
          style={{ color: "rgba(255,255,255,0.2)" }}
        />
        <input
          type="text"
          placeholder={t("search")}
          className="
            w-full pl-9 pr-4 py-1.5 text-sm rounded-lg
            border border-white/[0.07] bg-white/4
            text-white/70 placeholder-white/20
            focus:outline-none focus:border-amber-500/40 focus:bg-white/6
            transition-all duration-150
          "
        />
      </div>

      {/* ── Right side ── */}
      <div className="flex items-center gap-2">
        {/* Language switcher */}
        <div
          className="flex justify-end gap-1 p-1 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.1)",
          }}
        >
          <button
            onClick={() => handleSelect("en")}
            className="flex items-center gap-2 px-2 py-1 rounded-[9px] text-xs transition-all duration-200"
            style={active === "en" ? activeStyle : inactiveStyle}
          >
            EN
          </button>

          <button
            onClick={() => handleSelect("ar")}
            className="flex items-center gap-2 px-2 py-1 rounded-[9px] text-xs transition-all duration-200"
            style={active === "ar" ? activeStyle : inactiveStyle}
          >
            عربي
          </button>
        </div>
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors">
          <Bell size={16} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "#f59e0b" }}
          />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            {/* Avatar */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
              }}
            >
              {adminName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-white/60">
              {adminName}
            </span>
            <ChevronDown size={13} className="text-white/25" />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-xl z-20 py-1 overflow-hidden shadow-2xl border border-white/[0.08]"
                style={{ background: "#1a1d27" }}
              >
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-white/50 hover:text-white/80 hover:bg-white/[0.05] transition-colors">
                  <User size={14} className="text-white/30" />
                  {t("profile")}
                </button>
                <div className="my-1 border-t border-white/[0.06]" />
                {/* Server action — needs a form to pass locale */}
                <form action={signOut}>
                  <input type="hidden" name="locale" value={locale} />
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors"
                    style={{ color: "rgba(251,191,36,0.7)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(245,158,11,0.08)";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "rgba(251,191,36,1)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                      (e.currentTarget as HTMLButtonElement).style.color =
                        "rgba(251,158,11,0.7)";
                    }}
                  >
                    <LogOut size={14} />
                    {t("signOut")}
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
