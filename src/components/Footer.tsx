"use client";

import {
  faLinkedinIn,
  faTiktok,
  faWhatsapp,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useState } from "react";

const PHONES = [
  { labelEn: "English Inquiries & WhatsApp", labelAr: "استفسارات الإنجليزية وواتساب", value: "+968 9327 6767", href: "tel:+96893276767" },
  { labelEn: "Arabic Inquiries", labelAr: "استفسارات العربية", value: "+968 9886 2343", href: "tel:+96898862343" },
  { labelEn: "Landline", labelAr: "الهاتف الأرضي", value: "+968 2449 7033", href: "tel:+96824497033" },
];

const SOCIALS = [
  { label: "WhatsApp", href: "https://wa.me/96893276767", icon: faWhatsapp },
  { label: "YouTube", href: "https://www.youtube.com/channel/UCBltWo91oBYJkW9k4r9iZCg", icon: faYoutube },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/royal-academy-4729aa3a9", icon: faLinkedinIn },
  { label: "TikTok", href: "https://www.tiktok.com/@royalacademymct?is_from_webapp=1&sender_device=pc", icon: faTiktok },
];

export default function Footer({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const year = new Date().getFullYear();
  const brand = isAr ? "الأكاديمية الملكية" : "Royal Academy";
  const dir = isAr ? "rtl" : "ltr";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setFirstName("");
    setLastName("");
    setEmail("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <footer
      style={{
        background: "#0a0a0a",
        color: "#ffffff",
        direction: dir,
        fontFamily: isAr
          ? "'Layla','Noto Naskh Arabic',serif"
          : "'Goudy Old Style','GoudyOlSt-BT',Georgia,serif",
      }}
    >
      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "64px 32px 48px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "48px 40px",
        }}
      >
        {/* Brand + address + socials */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.38)",
            }}
          >
            {isAr ? "الأكاديمية الملكية" : "Royal Academy"}
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "rgba(255,255,255,.55)",
              lineHeight: 1.7,
            }}
          >
            {isAr
              ? "شارع 18 نوفمبر، مسقط، سلطنة عُمان"
              : "18th November St, Muscat, Sultanate of Oman"}
          </p>
          {/* Social icons */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                title={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 34,
                  height: 34,
                  color: "rgba(255,255,255,.5)",
                  fontSize: 17,
                  textDecoration: "none",
                  transition: "color .2s, transform .2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "#ffffff";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.5)";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                <FontAwesomeIcon icon={s.icon} />
              </a>
            ))}
          </div>
        </div>

        {/* Contact numbers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.38)",
              marginBottom: 4,
            }}
          >
            {isAr ? "اتصل بنا" : "Contact"}
          </span>
          {PHONES.map((p) => (
            <a
              key={p.href}
              href={p.href}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                textDecoration: "none",
                padding: "6px 0",
                borderBottom: "1px solid rgba(255,255,255,.07)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,.35)",
                }}
              >
                {isAr ? p.labelAr : p.labelEn}
              </span>
              <span
                style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,.85)",
                  fontFamily: "monospace",
                  letterSpacing: ".06em",
                  transition: "color .18s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = "#ffffff")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = "rgba(255,255,255,.85)")
                }
              >
                {p.value}
              </span>
            </a>
          ))}
        </div>

        {/* Newsletter subscription */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,.38)",
            }}
          >
            {isAr ? "اشترك في نشرتنا" : "Stay in touch"}
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: "rgba(255,255,255,.45)",
              lineHeight: 1.65,
            }}
          >
            {isAr
              ? "اشترك لتلقّي آخر الأخبار والعروض من الأكاديمية الملكية."
              : "Subscribe to receive the latest news and offers from Royal Academy."}
          </p>
          {submitted ? (
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,.7)",
                letterSpacing: ".06em",
              }}
            >
              {isAr ? "شكراً على اشتراكك!" : "Thank you for subscribing!"}
            </p>
          ) : (
            <form
              onSubmit={handleSubscribe}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={isAr ? "الاسم الأول" : "First name"}
                  style={inputStyle}
                />
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={isAr ? "اسم العائلة" : "Last name"}
                  style={inputStyle}
                />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAr ? "البريد الإلكتروني" : "Email address"}
                style={{ ...inputStyle, width: "100%" }}
              />
              <button
                type="submit"
                style={{
                  padding: "9px 18px",
                  background: "#ffffff",
                  color: "#0a0a0a",
                  border: "none",
                  fontSize: 11,
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background .2s, color .2s",
                  alignSelf: isAr ? "flex-end" : "flex-start",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.85)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#ffffff";
                }}
              >
                {isAr ? "اشتراك" : "Subscribe"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,.08)",
          padding: "18px 32px",
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: isAr ? "row-reverse" : "row",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            fontSize: 11,
            color: "rgba(255,255,255,.35)",
          }}
        >
          <span dir="ltr" style={{ unicodeBidi: "isolate" }}>
            © {year}
          </span>
          <span>{brand}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>
            {isAr ? "تم التطوير بواسطة" : "Developed by"}{" "}
            <a
              href="https://www.gulfdev.io"
              target="_blank"
              rel="noreferrer"
              style={{
                color: "rgba(255,255,255,.55)",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                transition: "color .2s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "#ffffff")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.55)")
              }
            >
              Gulf Dev
            </a>
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 11,
            letterSpacing: ".1em",
          }}
        >
          <Link
            href={`/${locale}/privacy`}
            style={linkStyle}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#ffffff")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.4)")
            }
          >
            {isAr ? "الخصوصية" : "Privacy"}
          </Link>
          <span style={{ color: "rgba(255,255,255,.2)" }}>•</span>
          <Link
            href={`/${locale}/terms`}
            style={linkStyle}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#ffffff")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.4)")
            }
          >
            {isAr ? "شروط الاستخدام" : "Terms"}
          </Link>
          <span style={{ color: "rgba(255,255,255,.2)" }}>•</span>
          <Link
            href={`/${locale}/carrier`}
            style={linkStyle}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "#ffffff")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.4)")
            }
          >
            {isAr ? "الوظائف" : "Careers"}
          </Link>
        </div>
      </div>
    </footer>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 11px",
  background: "rgba(255,255,255,.07)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "#ffffff",
  fontSize: 12,
  fontFamily: "inherit",
  outline: "none",
  borderRadius: 1,
  transition: "border-color .2s",
};

const linkStyle: React.CSSProperties = {
  color: "rgba(255,255,255,.4)",
  textDecoration: "none",
  textTransform: "uppercase",
  transition: "color .2s",
};
