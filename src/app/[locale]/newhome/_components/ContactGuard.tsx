'use client';

type Props = {
  onClose: () => void;
  locale: string;
  isAr: boolean;
  fontFamily: string;
};

const TEXT = {
  en: {
    title: 'What is best for you?',
    whatsapp: 'WhatsApp',
    calling: 'Calling',
    mobile: 'Mobile',
    landline: 'Landline',
    support: 'Support Page',
  },
  ar: {
    title: 'ما الأنسب لك؟',
    whatsapp: 'واتساب',
    calling: 'اتصال',
    mobile: 'جوال',
    landline: 'هاتف أرضي',
    support: 'صفحة الدعم',
  },
};

export default function ContactGuard({ onClose, locale, isAr, fontFamily }: Props) {
  const t = TEXT[isAr ? 'ar' : 'en'];
  const dir = isAr ? 'rtl' : 'ltr';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          borderRadius: 24,
          padding: '32px 28px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
          background: '#e4d0b5',
          direction: dir,
          fontFamily,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '0.02em',
            margin: '0 0 24px',
            color: '#000',
            textAlign: isAr ? 'right' : 'left',
          }}
        >
          {t.title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* WhatsApp */}
          <a
            href="https://wa.me/96893276767"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderRadius: 16,
              padding: '13px 18px',
              background: '#25D366',
              color: '#fff',
              textDecoration: 'none',
            }}
            onClick={onClose}
          >
            <span style={{ fontSize: 14, fontWeight: 500 }}>{t.whatsapp}</span>
            <span style={{ fontSize: 12, opacity: 0.9 }}>+968 9327 6767</span>
          </a>

          {/* Calling — mobile + landline */}
          <div
            style={{
              borderRadius: 16,
              padding: '13px 18px',
              background: '#111',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(228,208,181,0.55)',
                marginBottom: 10,
              }}
            >
              {t.calling}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a
                href="tel:+96893276767"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#e4d0b5',
                  textDecoration: 'none',
                  fontSize: 13,
                }}
                onClick={onClose}
              >
                <span style={{ opacity: 0.55 }}>{t.mobile}</span>
                <span>+968 9327 6767</span>
              </a>
              <a
                href="tel:+96824497033"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#e4d0b5',
                  textDecoration: 'none',
                  fontSize: 13,
                }}
                onClick={onClose}
              >
                <span style={{ opacity: 0.55 }}>{t.landline}</span>
                <span>+968 2449 7033</span>
              </a>
            </div>
          </div>

          {/* Support Page */}
          <a
            href={`/${locale}/support`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 16,
              padding: '13px 18px',
              background: 'transparent',
              color: '#000',
              textDecoration: 'none',
              border: '1.5px solid #111',
              fontSize: 14,
              fontWeight: 500,
            }}
            onClick={onClose}
          >
            {t.support}
          </a>
        </div>
      </div>
    </div>
  );
}
