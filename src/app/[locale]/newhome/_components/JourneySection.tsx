'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// ─── useIsMobile ──────────────────────────────────────────────────────────────

function useIsMobile(breakpoint = 768): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

// ─── useScrollReveal ──────────────────────────────────────────────────────────

function useScrollReveal(
  threshold = 60,
): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0, rootMargin: `-${threshold}px 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ─── Content ──────────────────────────────────────────────────────────────────

const COPY = {
  label: { en: 'Get Started', ar: 'ابدأ الآن' },
  heading: {
    en: 'Start your creative journey with us',
    ar: 'ابدأ رحلتك الإبداعية معنا',
  },
  intro: {
    en: 'Whether you are joining for the first time or continuing your artistic journey, our team is here to guide you toward the right class.',
    ar: 'سواء كنت تنضم إلينا للمرة الأولى أو تواصل رحلتك الفنية، فريقنا هنا لإرشادك نحو الفصل المناسب.',
  },

  consultTitle: {
    en: 'Complimentary\n15-Minute Consultation',
    ar: 'استشارة مجانية\nلمدة 15 دقيقة',
  },
  consultBody: {
    en: 'A free 15-minute consultation is the best way to learn more about Royal Academy before registration. Students and parents can meet our teacher, speak with our team, discuss goals and interests, and receive guidance on the most suitable program.',
    ar: 'الاستشارة المجانية لمدة 15 دقيقة هي أفضل طريقة للتعرف على الأكاديمية الملكية قبل التسجيل. يمكن للطلاب وأولياء الأمور مقابلة المعلم، والتحدث مع الفريق، ومناقشة الأهداف.',
  },
  consultCta: {
    en: 'Contact us on WhatsApp or call our team to book your session.',
    ar: 'تواصل معنا عبر واتساب أو اتصل بفريقنا لحجز جلستك.',
  },

  contactTitle: { en: 'Contact Us', ar: 'تواصل معنا' },
  callLabel: { en: 'Call & WhatsApp', ar: 'اتصل وواتساب' },
  callNumber: '+968 9327 6767',
  landlineLabel: { en: 'Landline', ar: 'هاتف أرضي' },
  landlineNumber: '+968 2449 7033',

  locationTitle: { en: 'Find Us', ar: 'موقعنا' },
  locationBody: {
    en: 'Azaiba, 18th November Street\nMuscat, Sultanate of Oman',
    ar: 'العذيبة، شارع 18 نوفمبر\nمسقط، سلطنة عُمان',
  },

};

const SOCIAL_LINKS = [
  {
    label: { en: 'Instagram', ar: 'إنستغرام' },
    href: 'https://www.instagram.com/royal_academy_mct?igsh=MXhxdXI5OXEwbnc1ZA%3D%3D&utm_source=qr',
    icon: 'instagram' as const,
  },
  {
    label: { en: 'YouTube', ar: 'يوتيوب' },
    href: 'https://www.youtube.com/channel/UCBltWo91oBYJkW9k4r9iZCg',
    icon: 'youtube' as const,
  },
  {
    label: { en: 'LinkedIn', ar: 'لينكدإن' },
    href: 'https://www.linkedin.com/in/royal-academy-4729aa3a9',
    icon: 'linkedin' as const,
  },
  {
    label: { en: 'TikTok', ar: 'تيك توك' },
    href: 'https://www.tiktok.com/@royalacademymct?is_from_webapp=1&sender_device=pc',
    icon: 'tiktok' as const,
  },
];

// ─── PaperCard ────────────────────────────────────────────────────────────────

function PaperCard({
  children,
  rotation = 0,
}: {
  children: React.ReactNode;
  rotation?: number;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'top center',
      }}
    >
      {/* Paper surface */}
      <div
        style={{
          background:
            'linear-gradient(160deg, #fefdf9 0%, #faf8f3 55%, #f6f3ec 100%)',
          boxShadow: [
            'inset 2px 2px 0 rgba(255,255,255,0.92)',
            'inset -1px -2px 0 rgba(0,0,0,0.07)',
            '0 2px 6px rgba(0,0,0,0.07)',
            '0 8px 24px rgba(0,0,0,0.09)',
            '0 24px 60px rgba(0,0,0,0.07)',
            '4px 6px 0 rgba(0,0,0,0.04)',
          ].join(', '),
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 2,
          marginTop: 14,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function JourneySection() {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const isAr = locale === 'ar';
  const isMobileVal = useIsMobile(768);
  const isMobile = isMobileVal === true;

  const fontFamily = isAr
    ? "'Layla','Noto Naskh Arabic',serif"
    : "'Goudy Old Style','GoudyOlSt-BT',Georgia,serif";

  return isMobile ? (
    <MobileJourney isAr={isAr} fontFamily={fontFamily} />
  ) : (
    <DesktopJourney isAr={isAr} fontFamily={fontFamily} />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DESKTOP
// Left half: hero label + heading + intro (pinned in view)
// Right half: two paper cards stacked, scroll-reveal one by one
// ═══════════════════════════════════════════════════════════════════════════════

function DesktopJourney({
  isAr,
  fontFamily,
}: {
  isAr: boolean;
  fontFamily: string;
}) {
  const dir = isAr ? 'rtl' : 'ltr';

  const [ref1, vis1] = useScrollReveal(40);
  const [ref2, vis2] = useScrollReveal(40);

  const cardReveal = (visible: boolean, delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible
      ? 'translateY(0) rotate(0deg)'
      : 'translateY(28px) rotate(-1deg)',
    transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  return (
    <section
      style={{
        background: '#e5e4e2',
        fontFamily,
        direction: dir,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isAr ? '55% 45%' : '45% 55%',
          minHeight: '60vh',
        }}
      >
        {/* ── LEFT: hero text — sticky so it stays while cards scroll past ── */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isAr ? '80px 60px 80px 40px' : '80px 40px 80px 60px',
            textAlign: isAr ? 'right' : 'left',
            order: isAr ? 1 : 0,
          }}
        >
          <p
            style={{
              margin: '0 0 14px',
              fontSize: 10,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#ff751f',
              fontWeight: 500,
            }}
          >
            {COPY.label[isAr ? 'ar' : 'en']}
          </p>
          <h2
            style={{
              margin: '0 0 20px',
              fontSize: 'clamp(26px, 3.2vw, 46px)',
              fontWeight: 400,
              color: '#111',
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
            }}
          >
            {COPY.heading[isAr ? 'ar' : 'en']}
          </h2>
          <div
            style={{
              width: 32,
              height: 2,
              background: '#ff751f',
              marginBottom: 20,
              ...(isAr ? { marginRight: 0, marginLeft: 'auto' } : {}),
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 17,
              color: 'rgba(0,0,0,0.52)',
              lineHeight: 1.85,
              maxWidth: 400,
              ...(isAr ? { marginRight: 0, marginLeft: 'auto' } : {}),
            }}
          >
            {COPY.intro[isAr ? 'ar' : 'en']}
          </p>
        </div>

        {/* ── RIGHT: paper cards, scroll past the sticky left col ── */}
        <div
          style={{
            padding: isAr ? '80px 40px 120px 60px' : '80px 60px 120px 40px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            order: isAr ? 0 : 1,
          }}
        >
          {/* Card 1 — Consultation */}
          <div ref={ref1} style={{ ...cardReveal(vis1, 0) }}>
            <PaperCard rotation={-0.2}>
              <CardInner>
                <CardLabel>
                  {COPY.consultTitle[isAr ? 'ar' : 'en'].replace('\n', ' ')}
                </CardLabel>
                <CardTitle style={{ whiteSpace: 'pre-line' }}>
                  {COPY.consultTitle[isAr ? 'ar' : 'en']}
                </CardTitle>
                <CardDivider />
                <CardBody>{COPY.consultBody[isAr ? 'ar' : 'en']}</CardBody>
                <CardBody style={{ color: 'rgba(0,0,0,0.38)', marginTop: 10 }}>
                  {COPY.consultCta[isAr ? 'ar' : 'en']}
                </CardBody>
              </CardInner>
            </PaperCard>
          </div>

          {/* Card 2 — Contact Us + Find Us combined */}
          <div ref={ref2} style={{ ...cardReveal(vis2, 60) }}>
            <PaperCard rotation={0.3}>
              <CardInner>
                <CardTitle>{COPY.contactTitle[isAr ? 'ar' : 'en']}</CardTitle>
                <CardDivider />
                <ContactRow
                  label={COPY.callLabel[isAr ? 'ar' : 'en']}
                  value={COPY.callNumber}
                  isAr={isAr}
                  href={`tel:${COPY.callNumber.replace(/\s/g, '')}`}
                  whatsapp
                />
                <ContactRow
                  label={COPY.landlineLabel[isAr ? 'ar' : 'en']}
                  value={COPY.landlineNumber}
                  isAr={isAr}
                  href={`tel:${COPY.landlineNumber.replace(/\s/g, '')}`}
                />
                <div style={{ marginTop: 24 }}>
                  <CardTitle>
                    {COPY.locationTitle[isAr ? 'ar' : 'en']}
                  </CardTitle>
                  <CardDivider />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      flexDirection: isAr ? 'row-reverse' : 'row',
                    }}
                  >
                    <span
                      style={{ flexShrink: 0, marginTop: 2, color: '#ff751f' }}
                    >
                      <PinIcon />
                    </span>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 15,
                        color: 'rgba(0,0,0,0.58)',
                        lineHeight: 1.85,
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {COPY.locationBody[isAr ? 'ar' : 'en']}
                    </p>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <SocialLinks isAr={isAr} />
                  </div>
                </div>
              </CardInner>
            </PaperCard>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOBILE — heading, then cards stacked with scroll-reveal
// ═══════════════════════════════════════════════════════════════════════════════

function MobileJourney({
  isAr,
  fontFamily,
}: {
  isAr: boolean;
  fontFamily: string;
}) {
  const dir = isAr ? 'rtl' : 'ltr';
  const [ref1, vis1] = useScrollReveal(30);
  const [ref2, vis2] = useScrollReveal(30);

  const cardReveal = (visible: boolean, delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.6s ease ${delay}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  return (
    <section
      style={{
        background: '#e5e4e2',
        fontFamily,
        direction: dir,
        overflow: 'hidden',
      }}
    >
      <div style={{ height: 3, background: '#ff751f' }} />

      {/* Hero text */}
      <div
        style={{
          padding: '36px 18px 32px',
          textAlign: isAr ? 'right' : 'left',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 9,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: '#ff751f',
            fontWeight: 500,
          }}
        >
          {COPY.label[isAr ? 'ar' : 'en']}
        </p>
        <h2
          style={{
            margin: '0 0 16px',
            fontSize: 24,
            fontWeight: 400,
            color: '#111',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {COPY.heading[isAr ? 'ar' : 'en']}
        </h2>
        <div
          style={{
            width: 26,
            height: 2,
            background: '#ff751f',
            marginBottom: 14,
            ...(isAr ? { marginRight: 0, marginLeft: 'auto' } : {}),
          }}
        />
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'rgba(0,0,0,0.5)',
            lineHeight: 1.85,
          }}
        >
          {COPY.intro[isAr ? 'ar' : 'en']}
        </p>
      </div>

      {/* Cards */}
      <div
        style={{
          padding: '36px 18px 56px',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        <div ref={ref1} style={{ ...cardReveal(vis1, 0) }}>
          <PaperCard rotation={-0.05}>
            <CardInner mobile>
              <CardTitle style={{ whiteSpace: 'pre-line', fontSize: 17 }}>
                {COPY.consultTitle[isAr ? 'ar' : 'en']}
              </CardTitle>
              <CardDivider />
              <CardBody style={{ fontSize: 12 }}>
                {COPY.consultBody[isAr ? 'ar' : 'en']}
              </CardBody>
              <CardBody
                style={{
                  fontSize: 12,
                  color: 'rgba(0,0,0,0.38)',
                  marginTop: 10,
                }}
              >
                {COPY.consultCta[isAr ? 'ar' : 'en']}
              </CardBody>
            </CardInner>
          </PaperCard>
        </div>

        {/* Card 2 — Contact Us + Find Us combined */}
        <div ref={ref2} style={{ ...cardReveal(vis2, 60) }}>
          <PaperCard rotation={0.5}>
            <CardInner mobile>
              <CardTitle style={{ fontSize: 17 }}>
                {COPY.contactTitle[isAr ? 'ar' : 'en']}
              </CardTitle>
              <CardDivider />
              <ContactRow
                label={COPY.callLabel[isAr ? 'ar' : 'en']}
                value={COPY.callNumber}
                isAr={isAr}
                href={`tel:${COPY.callNumber.replace(/\s/g, '')}`}
                whatsapp
                mobile
              />
              <ContactRow
                label={COPY.landlineLabel[isAr ? 'ar' : 'en']}
                value={COPY.landlineNumber}
                isAr={isAr}
                href={`tel:${COPY.landlineNumber.replace(/\s/g, '')}`}
                mobile
              />
              <div style={{ marginTop: 18 }}>
                <CardTitle style={{ fontSize: 17 }}>
                  {COPY.locationTitle[isAr ? 'ar' : 'en']}
                </CardTitle>
                <CardDivider />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    flexDirection: isAr ? 'row-reverse' : 'row',
                  }}
                >
                  <span
                    style={{ flexShrink: 0, marginTop: 2, color: '#ff751f' }}
                  >
                    <PinIcon />
                  </span>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: 'rgba(0,0,0,0.58)',
                      lineHeight: 1.85,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {COPY.locationBody[isAr ? 'ar' : 'en']}
                  </p>
                </div>
                <div style={{ marginTop: 14 }}>
                  <SocialLinks isAr={isAr} />
                </div>
              </div>
            </CardInner>
          </PaperCard>
        </div>
      </div>
    </section>
  );
}

// ─── Card sub-components ──────────────────────────────────────────────────────

function CardInner({
  children,
  mobile,
}: {
  children: React.ReactNode;
  mobile?: boolean;
}) {
  return (
    <div style={{ padding: mobile ? '20px 18px 24px' : '28px 28px 32px' }}>
      {children}
    </div>
  );
}

function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: '0 0 10px',
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#ff751f',
        fontWeight: 500,
        display: 'none',
      }}
    >
      {children}
    </p>
  );
}

function CardTitle({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <h3
      style={{
        margin: '0',
        fontSize: 26,
        fontWeight: 400,
        color: '#111',
        lineHeight: 1.25,
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {children}
    </h3>
  );
}

function CardDivider() {
  return (
    <div
      style={{
        width: 26,
        height: 1,
        background: 'rgba(255,117,31,0.45)',
        margin: '14px 0 16px',
      }}
    />
  );
}

function CardBody({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 15,
        color: 'rgba(0,0,0,0.52)',
        lineHeight: 1.85,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

// ─── ContactRow ───────────────────────────────────────────────────────────────

function ContactRow({
  label,
  value,
  isAr,
  href,
  whatsapp,
  mobile,
}: {
  label: string;
  value: string;
  isAr: boolean;
  href: string;
  whatsapp?: boolean;
  mobile?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const waHref = `https://wa.me/${value.replace(/\s/g, '').replace('+', '')}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isAr ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <span style={{ color: '#ff751f', flexShrink: 0 }}>
        <PhoneIcon />
      </span>
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: '0 0 2px',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(0,0,0,0.35)',
            fontWeight: 500,
          }}
        >
          {label}
        </p>
        <a
          href={href}
          style={{
            fontSize: mobile ? 14 : 16,
            color: hov ? '#ff751f' : '#111',
            textDecoration: 'none',
            letterSpacing: '0.03em',
            transition: 'color 0.2s',
            display: 'block',
          }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
        >
          {value}
        </a>
      </div>
      {whatsapp && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(37,211,102,0.1)',
            border: '1px solid rgba(37,211,102,0.28)',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              'rgba(37,211,102,0.2)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              'rgba(37,211,102,0.1)';
          }}
        >
          <WhatsappIcon />
        </a>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PhoneIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#25d366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

// ─── SocialLinks ──────────────────────────────────────────────────────────────

function SocialLinks({ isAr }: { isAr: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isAr ? 'row-reverse' : 'row',
        gap: 10,
        flexWrap: 'wrap',
      }}
    >
      {SOCIAL_LINKS.map((s) => (
        <SocialPill key={s.icon} href={s.href} label={s.label[isAr ? 'ar' : 'en']} icon={s.icon} />
      ))}
    </div>
  );
}

function SocialPill({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: 'instagram' | 'youtube' | 'linkedin' | 'tiktok';
}) {
  const [hov, setHov] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 20,
        border: '1px solid rgba(0,0,0,0.12)',
        background: hov ? 'rgba(0,0,0,0.06)' : 'transparent',
        textDecoration: 'none',
        color: '#333',
        fontSize: 11,
        letterSpacing: '0.06em',
        transition: 'background 0.2s, border-color 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {icon === 'instagram' && <InstagramIcon />}
      {icon === 'youtube' && <YouTubeIcon />}
      {icon === 'linkedin' && <LinkedInIcon />}
      {icon === 'tiktok' && <TikTokIcon />}
      {label}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="#E1306C" stroke="none" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF0000">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#010101">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  );
}
