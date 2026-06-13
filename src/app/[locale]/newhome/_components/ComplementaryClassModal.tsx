'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import ComplementaryClassForm, { COPY } from './ComplementaryClassForm';

interface Props {
  onClose: () => void;
  isAr: boolean;
  fontFamily: string;
}

export default function ComplementaryClassModal({ onClose, isAr, fontFamily }: Props) {
  const dir = isAr ? 'rtl' : 'ltr';
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        fontFamily,
        direction: dir,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, #fefdf9 0%, #faf8f3 55%, #f6f3ec 100%)',
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: 540,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '22px 24px 18px',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#ff751f',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Royal Academy
            </div>
            <h2
              style={{ margin: 0, fontSize: 19, fontWeight: 400, color: '#111', lineHeight: 1.3 }}
            >
              {COPY.title[isAr ? 'ar' : 'en']}
            </h2>
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 13,
                color: 'rgba(0,0,0,0.45)',
                lineHeight: 1.6,
              }}
            >
              {COPY.subtitle[isAr ? 'ar' : 'en']}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid rgba(0,0,0,0.1)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(0,0,0,0.5)',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px 24px', flex: 1 }}>
          <ComplementaryClassForm
            isAr={isAr}
            fontFamily={fontFamily}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
