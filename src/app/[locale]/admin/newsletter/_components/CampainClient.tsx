'use client';

import { ToastContainer } from '@/components/admin/Toast';
import {
  AdminButton,
  AdminCard,
  adminColors,
  AdminPageHeader,
} from '@/components/admin/ui';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  ImageIcon,
  Loader2,
  Send,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useRef } from 'react';
import { useState } from 'react';
import { useToast } from '../../hooks/useToast';

// ── Types ─────────────────────────────────────────────────────────────────────

type Stats = {
  totalActive: number;
  bySidebar: number;
  byFooter: number;
};

type SendState = 'idle' | 'loading' | 'success' | 'error';

// ── Small helpers ─────────────────────────────────────────────────────────────

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      style={{
        fontSize: 11,
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        color: adminColors.textMuted,
        display: 'block',
        marginBottom: 6,
      }}
    >
      {children}
      {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
    </label>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.04)',
  border: `1px solid ${adminColors.border}`,
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 13,
  color: adminColors.textPrimary,
  outline: 'none',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

// ── Stat pill ─────────────────────────────────────────────────────────────────

function AudiencePill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        padding: '12px 16px',
        borderRadius: 10,
        border: `1px solid ${active ? '#6366f1' : adminColors.border}`,
        background: active ? 'rgba(99,102,241,0.08)' : 'rgba(0,0,0,0.03)',
        cursor: 'pointer',
        transition: 'all .15s',
        minWidth: 120,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: adminColors.textMuted,
          letterSpacing: '.08em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: active ? '#818cf8' : adminColors.textPrimary,
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ── Preview modal ─────────────────────────────────────────────────────────────

function PreviewPane({
  subject,
  heading,
  body,
  imageUrl,
  onClose,
}: {
  subject: string;
  heading: string;
  body: string;
  imageUrl: string | null;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          maxWidth: 600,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Email preview header */}
        <div
          style={{
            background: '#111118',
            padding: '28px 36px',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              color: 'rgba(107,114,128,1)',
            }}
          >
            Royal Academy
          </p>
          {heading && (
            <h2
              style={{
                margin: '10px 0 0',
                fontSize: 22,
                fontWeight: 600,
                color: '#fff',
              }}
            >
              {heading}
            </h2>
          )}
        </div>

        {/* Image */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            style={{ width: '100%', display: 'block', maxHeight: 300, objectFit: 'cover' }}
          />
        )}

        {/* Body */}
        <div style={{ padding: '32px 36px', background: '#fff' }}>
          {body ? (
            body
              .split('\n')
              .filter((l) => l.trim())
              .map((line, i) => (
                <p
                  key={i}
                  style={{
                    margin: '0 0 14px',
                    fontSize: 14,
                    lineHeight: 1.7,
                    color: '#374151',
                  }}
                >
                  {line}
                </p>
              ))
          ) : (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>
              No body content yet.
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '20px 36px',
            background: '#f9f9fb',
            borderTop: '1px solid #e5e7eb',
            borderRadius: '0 0 12px 12px',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: '#9ca3af',
              textAlign: 'center',
            }}
          >
            You are receiving this because you subscribed · <u>Unsubscribe</u>
          </p>
        </div>

        <div style={{ padding: '12px 36px 24px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#111118',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Close preview
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CampaignClient({ stats }: { stats: Stats }) {
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [heading, setHeading] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [source, setSource] = useState('all');
  const [sendState, setSendState] = useState<SendState>('idle');
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toasts, toast, remove } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageFile = async (file: File) => {
    setImageError(null);
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'newsletter');
      const res = await fetch('/api/media/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      setImageUrl(json.data.url);
    } catch (e) {
      setImageError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const audienceCount =
    source === 'all'
      ? stats.totalActive
      : source === 'sidebar'
        ? stats.bySidebar
        : stats.byFooter;

  const canSend =
    subject.trim() && body.trim() && audienceCount > 0 && sendState === 'idle';

  const handleSend = async () => {
    if (!canSend) return;
    setSendState('loading');
    setSendResult(null);

    try {
      const res = await fetch('/api/newsletter/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, previewText, heading, body, source, imageUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? 'Failed to send.', 'error');
        setSendState('error');
        setTimeout(() => setSendState('idle'), 3000);
        return;
      }

      setSendResult({ sent: data.sent, failed: data.failed });
      setSendState('success');
      // Reset form
      setSubject('');
      setPreviewText('');
      setHeading('');
      setBody('');
      setImageUrl(null);
    } catch {
      toast('Network error. Please try again.', 'error');
      setSendState('error');
      setTimeout(() => setSendState('idle'), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AdminPageHeader
        title="Send Campaign"
        subtitle="Compose and send an email to your subscribers"
      />

      {/* Success banner */}
      {sendState === 'success' && sendResult && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderRadius: 10,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.2)',
          }}
        >
          <CheckCircle size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: '#22c55e',
                fontWeight: 500,
              }}
            >
              Campaign sent successfully
            </p>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 12,
                color: adminColors.textMuted,
              }}
            >
              {sendResult.sent} delivered
              {sendResult.failed > 0 && `, ${sendResult.failed} failed`}
            </p>
          </div>
          <button
            onClick={() => setSendState('idle')}
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: adminColors.textMuted,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ── Left: compose ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AdminCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: adminColors.textMuted,
                }}
              >
                Email content
              </p>

              <Field>
                <Label required>Subject line</Label>
                <input
                  style={inputStyle}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. New workshops available this month"
                  maxLength={150}
                />
              </Field>

              <Field>
                <Label>Preview text</Label>
                <input
                  style={inputStyle}
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Short teaser shown in inbox preview (optional)"
                  maxLength={200}
                />
              </Field>

              <Field>
                <Label>Email heading</Label>
                <input
                  style={inputStyle}
                  value={heading}
                  onChange={(e) => setHeading(e.target.value)}
                  placeholder="Large heading shown at the top of the email (optional)"
                  maxLength={100}
                />
              </Field>

              <Field>
                <Label required>Body</Label>
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: 220,
                    resize: 'vertical',
                    lineHeight: 1.7,
                  }}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    'Write your message here.\n\nEach paragraph on a new line will be spaced nicely in the email.'
                  }
                />
                <span
                  style={{
                    fontSize: 11,
                    color: adminColors.textMuted,
                    marginTop: 4,
                  }}
                >
                  Each line break becomes a new paragraph in the email.
                </span>
              </Field>

              {/* ── Image upload ── */}
              <Field>
                <Label>Campaign image (optional)</Label>
                {imageUrl ? (
                  <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `1px solid ${adminColors.border}` }}>
                    <img
                      src={imageUrl}
                      alt="campaign"
                      style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => { setImageUrl(null); setImageError(null); if (fileRef.current) fileRef.current.value = ''; }}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: 6,
                        padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        color: '#fca5a5',
                      }}
                    >
                      <X size={13} />
                    </button>
                    <div style={{
                      position: 'absolute', bottom: 8, left: 8,
                      background: 'rgba(0,0,0,0.55)', borderRadius: 6,
                      padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4,
                      fontSize: 11, color: 'rgba(31,41,55,0.9)',
                    }}>
                      <ImageIcon size={10} /> image
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={imageUploading}
                    style={{
                      ...inputStyle,
                      height: 80,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: imageUploading ? 'not-allowed' : 'pointer',
                      borderStyle: 'dashed',
                      opacity: imageUploading ? 0.6 : 1,
                    }}
                  >
                    {imageUploading ? (
                      <Loader2 size={16} style={{ color: adminColors.textMuted, animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Upload size={16} style={{ color: adminColors.textMuted }} />
                    )}
                    <span style={{ fontSize: 11, color: adminColors.textMuted }}>
                      {imageUploading ? 'Uploading…' : 'Click to upload an image'}
                    </span>
                  </button>
                )}
                {imageError && (
                  <span style={{ fontSize: 11, color: '#f87171', marginTop: 4 }}>{imageError}</span>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                />
              </Field>
            </div>
          </AdminCard>
        </div>

        {/* ── Right: audience + send ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Audience */}
          <AdminCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={14} style={{ color: adminColors.textMuted }} />
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    color: adminColors.textMuted,
                  }}
                >
                  Audience
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AudiencePill
                  label="All subscribers"
                  count={stats.totalActive}
                  active={source === 'all'}
                  onClick={() => setSource('all')}
                />
                <AudiencePill
                  label="Sidebar signups"
                  count={stats.bySidebar}
                  active={source === 'sidebar'}
                  onClick={() => setSource('sidebar')}
                />
                <AudiencePill
                  label="Footer signups"
                  count={stats.byFooter}
                  active={source === 'footer'}
                  onClick={() => setSource('footer')}
                />
              </div>

              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  background: 'rgba(99,102,241,0.06)',
                  border: '1px solid rgba(99,102,241,0.15)',
                }}
              >
                <p style={{ margin: 0, fontSize: 12, color: '#818cf8' }}>
                  <strong>{audienceCount}</strong> recipient
                  {audienceCount !== 1 ? 's' : ''} will receive this email
                </p>
              </div>
            </div>
          </AdminCard>

          {/* Actions */}
          <AdminCard>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AdminButton
                variant="ghost"
                onClick={() => setShowPreview(true)}
                disabled={!body.trim()}
                className="w-full justify-center"
              >
                <Eye size={14} />
                Preview email
              </AdminButton>

              <AdminButton
                variant="primary"
                onClick={handleSend}
                disabled={!canSend}
                className="w-full justify-center"
              >
                {sendState === 'loading' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Send to {audienceCount} subscriber
                    {audienceCount !== 1 ? 's' : ''}
                  </>
                )}
              </AdminButton>

              {audienceCount === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={12} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: 11, color: '#f59e0b' }}>
                    No active subscribers in this segment
                  </span>
                </div>
              )}
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <PreviewPane
          subject={subject}
          heading={heading}
          body={body}
          imageUrl={imageUrl}
          onClose={() => setShowPreview(false)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
