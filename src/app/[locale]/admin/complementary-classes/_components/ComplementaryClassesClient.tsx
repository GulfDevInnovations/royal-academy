'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Mail,
  MessageSquare,
  Bell,
  Download,
  Search,
  Filter,
  Trash2,
  ChevronDown,
  Loader2,
  X,
  Send,
  CheckCircle2,
} from 'lucide-react';
import {
  AdminCard,
  AdminPageHeader,
  AdminButton,
  AdminTable,
  AdminThead,
  AdminTh,
  AdminTbody,
  AdminTr,
  AdminTd,
  AdminEmptyState,
  adminColors,
} from '@/components/admin/ui';
import { ToastContainer } from '@/components/admin/Toast';
import { useToast } from '../../hooks/useToast';
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import {
  updateRequestStatus,
  deleteComplementaryRequest,
  sendEmailToRequester,
  sendSmsToRequester,
  sendInAppNotification,
  getComplementaryRequestsForExport,
} from '@/lib/actions/admin/complementaryClass.actions';
import type { SerializedComplementaryRequest } from '../page';

// ─── Types ────────────────────────────────────────────────────────────────────

type ComplementaryRequestStatus = 'PENDING' | 'CONTACTED' | 'COMPLETED' | 'CANCELLED';

type ContactType = 'email' | 'sms' | 'inapp';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: ComplementaryRequestStatus[] = [
  'PENDING',
  'CONTACTED',
  'COMPLETED',
  'CANCELLED',
];

const STATUS_LABEL: Record<ComplementaryRequestStatus, string> = {
  PENDING: 'Pending',
  CONTACTED: 'Contacted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex flex-col gap-1 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(0,0,0,0.03)', border: `1px solid ${adminColors.border}` }}
    >
      <span className="text-[11px]" style={{ color: adminColors.textMuted }}>{label}</span>
      <span className="text-xl font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── Contact Modal ────────────────────────────────────────────────────────────

function ContactModal({
  request,
  onClose,
  onDone,
}: {
  request: SerializedComplementaryRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const [tab, setTab] = useState<ContactType>('email');
  const [subject, setSubject] = useState('Regarding Your Free 15-Minute Class Request');
  const [message, setMessage] = useState(
    `Dear ${request.studentName},\n\nThank you for your interest in our complementary 15-minute class. We would like to schedule your session.\n\nBest regards,\nRoyal Academy Team`,
  );
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  const handleSend = () => {
    setError('');
    setSending(true);
    startTransition(async () => {
      let result: { error?: string };
      if (tab === 'email') {
        result = await sendEmailToRequester(request.id, subject, message);
      } else if (tab === 'sms') {
        result = await sendSmsToRequester(request.id, message);
      } else {
        result = await sendInAppNotification(request.id, subject, message);
      }
      setSending(false);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
        setTimeout(() => { onDone(); onClose(); }, 1400);
      }
    });
  };

  const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none transition-colors';
  const inputSty = { borderColor: adminColors.border, color: adminColors.textPrimary, background: '#fafafa' };

  const tabs: { key: ContactType; label: string; icon: React.ReactNode }[] = [
    { key: 'email', label: 'Email', icon: <Mail size={14} /> },
    { key: 'sms', label: 'SMS', icon: <MessageSquare size={14} /> },
    { key: 'inapp', label: 'In-App', icon: <Bell size={14} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: '100%', maxWidth: 500, maxHeight: '90vh', border: `1px solid ${adminColors.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: adminColors.border }}>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: adminColors.accent }}>Contact</p>
            <h3 className="font-semibold text-base mt-0.5" style={{ color: adminColors.textPrimary }}>
              {request.studentName}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: adminColors.textMuted }}>
              {request.contactNumber}{request.email ? ` · ${request.email}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
            style={{ color: adminColors.textMuted }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError(''); setSent(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: tab === t.key ? `${adminColors.accent}18` : 'transparent',
                color: tab === t.key ? adminColors.accent : adminColors.textMuted,
                border: `1px solid ${tab === t.key ? adminColors.accent + '40' : 'transparent'}`,
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 px-5 py-4 overflow-y-auto flex-1">
          {tab === 'email' && !request.email && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(245,158,11,0.08)', color: '#b45309', border: '1px solid rgba(245,158,11,0.25)' }}>
              This requester did not provide an email address.
            </p>
          )}
          {(tab === 'email' || tab === 'inapp') && (
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: adminColors.textSecondary }}>Subject</label>
              <input
                className={inputCls}
                style={inputSty}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1 flex-1">
            <label className="text-xs font-medium" style={{ color: adminColors.textSecondary }}>Message</label>
            <textarea
              className={inputCls}
              style={{ ...inputSty, minHeight: 140, resize: 'vertical' }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(220,38,38,0.06)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.15)' }}>
              {error}
            </p>
          )}
          {sent && (
            <div className="flex items-center gap-2 text-sm" style={{ color: '#16a34a' }}>
              <CheckCircle2 size={15} /> Sent successfully!
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t" style={{ borderColor: adminColors.border }}>
          <AdminButton variant="ghost" size="sm" onClick={onClose}>Cancel</AdminButton>
          <AdminButton
            variant="primary"
            size="sm"
            onClick={handleSend}
            disabled={sending || sent}
          >
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {sending ? 'Sending…' : 'Send'}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

interface Props {
  initialRequests: SerializedComplementaryRequest[];
}

export default function ComplementaryClassesClient({ initialRequests }: Props) {
  const { toasts, toast, remove } = useToast();
  const [isPending, startTransition] = useTransition();

  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ComplementaryRequestStatus | 'all'>('all');

  const [contactTarget, setContactTarget] = useState<SerializedComplementaryRequest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SerializedComplementaryRequest | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Stats
  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === 'PENDING').length,
    contacted: requests.filter((r) => r.status === 'CONTACTED').length,
    completed: requests.filter((r) => r.status === 'COMPLETED').length,
  }), [requests]);

  // Filter
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        !search ||
        r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        r.contactNumber.includes(search) ||
        (r.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        r.subClass.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [requests, search, filterStatus]);

  const handleStatusChange = (id: string, status: ComplementaryRequestStatus) => {
    startTransition(async () => {
      const res = await updateRequestStatus(id, status as any);
      if (res.error) { toast(res.error, 'error'); }
      else {
        setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
        toast('Status updated.', 'success');
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteComplementaryRequest(deleteTarget.id);
      if (res.error) { toast(res.error, 'error'); }
      else {
        setRequests((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        toast('Request deleted.', 'success');
      }
      setDeleteTarget(null);
    });
  };

  const handleExcel = async () => {
    setExportLoading(true);
    try {
      const rows = await getComplementaryRequestsForExport();
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Requests');
      XLSX.writeFile(wb, `complementary-class-requests-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch {
      toast('Failed to export.', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ToastContainer toasts={toasts} onRemove={remove} />

      <AdminPageHeader
        title="Complementary Class Requests"
        subtitle="Free 15-minute music class bookings submitted via the website"
        action={
          <AdminButton
            variant="ghost"
            size="sm"
            onClick={handleExcel}
            disabled={exportLoading}
          >
            {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export Excel
          </AdminButton>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} color={adminColors.textPrimary} />
        <StatCard label="Pending" value={stats.pending} color="#d97706" />
        <StatCard label="Contacted" value={stats.contacted} color="#2563eb" />
        <StatCard label="Completed" value={stats.completed} color="#16a34a" />
      </div>

      {/* Filters + Table */}
      <AdminCard noPadding>
        <div className="flex flex-wrap gap-3 items-center px-4 py-3 border-b" style={{ borderColor: adminColors.border }}>
          {/* Search */}
          <div className="relative flex-1 min-w-45">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: adminColors.textMuted }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm focus:outline-none"
              style={{ borderColor: adminColors.border, color: adminColors.textPrimary, background: '#fafafa' }}
            />
          </div>
          {/* Status filter */}
          <div className="relative">
            <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: adminColors.textMuted }} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ComplementaryRequestStatus | 'all')}
              className="pl-7 pr-8 py-2 rounded-lg border text-sm focus:outline-none appearance-none"
              style={{ borderColor: adminColors.border, color: adminColors.textPrimary, background: '#fafafa' }}
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: adminColors.textMuted }} />
          </div>
        </div>

        <AdminTable>
          <AdminThead>
            <AdminTh>Student</AdminTh>
            <AdminTh>Program</AdminTh>
            <AdminTh>Background</AdminTh>
            <AdminTh>Contact</AdminTh>
            <AdminTh>Preferred Days</AdminTh>
            <AdminTh>DOB</AdminTh>
            <AdminTh>Submitted</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh>Actions</AdminTh>
          </AdminThead>
          <AdminTbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <AdminEmptyState
                    title="No requests found"
                    description="Requests submitted through the website will appear here."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((req) => (
                <AdminTr key={req.id}>
                  <AdminTd>
                    <span className="font-medium text-sm" style={{ color: adminColors.textPrimary }}>{req.studentName}</span>
                  </AdminTd>
                  <AdminTd>
                    <span className="text-sm" style={{ color: adminColors.textSecondary }}>{req.subClass.name}</span>
                  </AdminTd>
                  <AdminTd>
                    <span className="text-xs" style={{ color: adminColors.textMuted }}>
                      {req.background === 'MORE_THAN_ONE_YEAR' ? '> 1 year' : '< 1 year'}
                    </span>
                  </AdminTd>
                  <AdminTd>
                    <div>
                      <p className="text-sm" style={{ color: adminColors.textPrimary }}>{req.contactNumber}</p>
                      {req.email && <p className="text-xs" style={{ color: adminColors.textMuted }}>{req.email}</p>}
                    </div>
                  </AdminTd>
                  <AdminTd>
                    <div className="flex flex-wrap gap-1">
                      {req.preferredDays.map((d: string) => (
                        <span
                          key={d}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: `${adminColors.accent}14`, color: adminColors.accent }}
                        >
                          {DAY_SHORT[d] ?? d}
                        </span>
                      ))}
                    </div>
                  </AdminTd>
                  <AdminTd>
                    <span className="text-xs" style={{ color: adminColors.textMuted }}>{fmtDate(req.dateOfBirth)}</span>
                  </AdminTd>
                  <AdminTd>
                    <span className="text-xs" style={{ color: adminColors.textMuted }}>{fmtDate(req.createdAt)}</span>
                  </AdminTd>
                  <AdminTd>
                    <div className="relative">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value as ComplementaryRequestStatus)}
                        disabled={isPending}
                        className="text-xs pr-6 py-1 pl-2 rounded-lg border appearance-none focus:outline-none"
                        style={{ borderColor: adminColors.border, color: adminColors.textPrimary, background: '#fafafa' }}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                      <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: adminColors.textMuted }} />
                    </div>
                  </AdminTd>
                  <AdminTd>
                    <div className="flex items-center gap-1">
                      <button
                        title="Email"
                        onClick={() => setContactTarget(req)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-amber-50"
                        style={{ color: adminColors.accent }}
                      >
                        <Mail size={13} />
                      </button>
                      <button
                        title="SMS"
                        onClick={() => setContactTarget(req)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-blue-50"
                        style={{ color: '#2563eb' }}
                      >
                        <MessageSquare size={13} />
                      </button>
                      <button
                        title="In-App Notification"
                        onClick={() => setContactTarget(req)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-purple-50"
                        style={{ color: '#7c3aed' }}
                      >
                        <Bell size={13} />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setDeleteTarget(req)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-50"
                        style={{ color: '#dc2626' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))
            )}
          </AdminTbody>
        </AdminTable>
      </AdminCard>

      {/* Contact Modal */}
      {contactTarget && (
        <ContactModal
          request={contactTarget}
          onClose={() => setContactTarget(null)}
          onDone={() => window.location.reload()}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Request"
          description={`Delete the complementary class request from "${deleteTarget.studentName}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
