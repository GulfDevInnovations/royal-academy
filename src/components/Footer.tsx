'use client';

import { useNewsletterForm } from '@/context/useNewsletterForm';
import {
  faInstagram,
  faLinkedinIn,
  faTiktok,
  faWhatsapp,
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

const PHONES = [
  {
    labelEn: 'English Inquiries & WhatsApp',
    labelAr: 'استفسارات الإنجليزية وواتساب',
    value: '+968 9327 6767',
    href: 'tel:+96893276767',
  },
  {
    labelEn: 'Landline',
    labelAr: 'الهاتف الأرضي',
    value: '+968 2449 7033',
    href: 'tel:+96824497033',
  },
];

const SOCIALS = [
  { label: 'WhatsApp', href: 'https://wa.me/96893276767', icon: faWhatsapp },
  {
    label: 'Instagram',
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

export default function Footer({ locale }: { locale: string }) {
  const isAr = locale === 'ar';
  const year = new Date().getFullYear();
  const brand = isAr ? 'الأكاديمية الملكية' : 'Royal Academy';
  const dir = isAr ? 'rtl' : 'ltr';
  const isMobile = useIsMobile();

  const { email, setEmail, state, errorMsg, handleSubmit } =
    useNewsletterForm('sidebar');

  return (
    <footer
      style={{
        /* background: 'transparent', */
        background: '#000000',
        color: '#ffffff',
        direction: dir,
        fontFamily: isAr
          ? "'Layla','Noto Naskh Arabic',serif"
          : "'Goudy Old Style','GoudyOlSt-BT',Georgia,serif",
      }}
    >
      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1800,
          margin: '0 auto',
          padding: isMobile ? '40px 30px 42px' : '64px 42px 58px',
          display: 'grid',
          gridTemplateColumns: isMobile
            ? '1fr'
            : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: isMobile ? '36px 0' : '48px 40px',
        }}
      >
        {/* Brand + address + socials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: '#ff751f',
            }}
          >
            {isAr ? 'الأكاديمية الملكية' : 'Royal Academy'}
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'rgba(255,255,255,.55)',
              lineHeight: 1.7,
            }}
          >
            {isAr
              ? 'شارع 18 نوفمبر، مسقط، سلطنة عُمان'
              : '18th November St, Muscat, Sultanate of Oman'}
          </p>
          {/* Social icons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {SOCIALS.map((s) => (
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
                  width: 34,
                  height: 34,
                  color: 'rgba(255,255,255,.5)',
                  fontSize: 17,
                  textDecoration: 'none',
                  transition: 'color .2s, transform .2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = '#ffffff';
                  (e.currentTarget as HTMLElement).style.transform =
                    'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color =
                    'rgba(255,255,255,.5)';
                  (e.currentTarget as HTMLElement).style.transform = 'none';
                }}
              >
                <FontAwesomeIcon icon={s.icon} />
              </a>
            ))}
          </div>
        </div>

        {/* Contact numbers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: '#ff751f',
              marginBottom: 4,
            }}
          >
            {isAr ? 'اتصل بنا' : 'Contact'}
          </span>
          {PHONES.map((p) => (
            <a
              key={p.href}
              href={p.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                textDecoration: 'none',
                padding: '6px 0',
                borderBottom: '1px solid rgba(255,255,255,.07)',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,.35)',
                }}
              >
                {isAr ? p.labelAr : p.labelEn}
              </span>
              <span
                style={{
                  fontSize: 15,
                  color: 'rgba(255,255,255,.85)',
                  fontFamily: 'monospace',
                  letterSpacing: '.06em',
                  transition: 'color .18s',
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = '#ffffff')
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color =
                    'rgba(255,255,255,.85)')
                }
              >
                {p.value}
              </span>
            </a>
          ))}
        </div>

        {/* Legal links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: '#ff751f',
              marginBottom: 4,
            }}
          >
            {isAr ? 'قانوني وآخر' : 'Legal & More'}
          </span>
          {[
            {
              href: `/${locale}/privacy`,
              labelEn: 'Privacy Policy',
              labelAr: 'سياسة الخصوصية',
            },
            {
              href: `/${locale}/terms`,
              labelEn: 'Terms of Use',
              labelAr: 'شروط الاستخدام',
            },
            {
              href: `/${locale}/carrier`,
              labelEn: 'Careers',
              labelAr: 'الوظائف',
            },
            {
              href: `/${locale}/support`,
              labelEn: 'Support',
              labelAr: 'الدعم',
            },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: 13,
                color: 'rgba(255,255,255,.55)',
                textDecoration: 'none',
                transition: 'color .2s',
                padding: '3px 0',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = '#ffffff')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  'rgba(255,255,255,.55)')
              }
            >
              {isAr ? link.labelAr : link.labelEn}
            </Link>
          ))}
        </div>

        {/* Newsletter subscription */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span
            style={{
              fontSize: 11,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: '#ff751f',
            }}
          >
            {isAr ? 'اشترك في نشرتنا' : 'Stay in touch'}
          </span>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'rgba(255,255,255,.45)',
              lineHeight: 1.65,
            }}
          >
            {isAr
              ? 'اشترك لتلقّي آخر الأخبار والعروض من الأكاديمية الملكية.'
              : 'Subscribe to receive the latest news and offers from Royal Academy.'}
          </p>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            <div style={{ display: 'flex' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAr ? 'بريدك الإلكتروني' : 'Your email'}
                disabled={state === 'loading' || state === 'success'}
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
                  opacity: state === 'success' ? 0.6 : 1,
                }}
              />
              <button
                type="submit"
                disabled={state === 'loading' || state === 'success'}
                style={{
                  padding: '7px 12px',
                  background: state === 'success' ? '#22c55e' : '#888888',
                  border: 'none',
                  color: '#fff',
                  fontSize: 11,
                  cursor:
                    state === 'loading' || state === 'success'
                      ? 'default'
                      : 'pointer',
                  letterSpacing: '.08em',
                  fontFamily: 'inherit',
                  borderRadius: isAr ? '2px 0 0 2px' : '0 2px 2px 0',
                  transition: 'background .2s',
                  minWidth: 48,
                }}
                onMouseEnter={(e) => {
                  if (state === 'idle')
                    e.currentTarget.style.background = '#555555';
                }}
                onMouseLeave={(e) => {
                  if (state === 'idle')
                    e.currentTarget.style.background = '#888888';
                }}
              >
                {state === 'loading'
                  ? '...'
                  : state === 'success'
                    ? isAr
                      ? '✓'
                      : '✓'
                    : isAr
                      ? 'أرسل'
                      : 'Send'}
              </button>
            </div>

            {/* Feedback messages */}
            {state === 'success' && (
              <span style={{ fontSize: 10, color: '#22c55e', paddingLeft: 2 }}>
                {isAr ? 'تم الاشتراك!' : 'Subscribed!'}
              </span>
            )}
            {state === 'error' && (
              <span style={{ fontSize: 10, color: '#ef4444', paddingLeft: 2 }}>
                {errorMsg}
              </span>
            )}
          </form>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,.08)',
          padding: isMobile ? '18px 30px 28px' : '18px 42px 28px',
          maxWidth: 1800,
          margin: '0 auto',
          display: 'flex',
          flexDirection: isAr ? 'row-reverse' : 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            fontSize: 11,
            color: 'rgba(255,255,255,.35)',
          }}
        >
          <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
            © {year}
          </span>
          <span>{brand}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span>
            {isAr ? 'تم التطوير بواسطة' : 'Developed by'}{' '}
            <a
              href="https://www.gulfdev.io"
              target="_blank"
              rel="noreferrer"
              style={{
                color: 'rgba(255,255,255,.55)',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                transition: 'color .2s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = '#ffffff')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  'rgba(255,255,255,.55)')
              }
            >
              Gulf Dev
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 11px',
  background: 'rgba(255,255,255,.07)',
  border: '1px solid rgba(255,255,255,.12)',
  color: '#ffffff',
  fontSize: 12,
  fontFamily: 'inherit',
  outline: 'none',
  borderRadius: 1,
  transition: 'border-color .2s',
};

const linkStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,.4)',
  textDecoration: 'none',
  textTransform: 'uppercase',
  transition: 'color .2s',
};
