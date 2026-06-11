'use client';

import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal';
import { ToastContainer } from '@/components/admin/Toast';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  adminColors,
  AdminEmptyState,
  AdminPageHeader,
  AdminTable,
  AdminTbody,
  AdminTd,
  AdminTh,
  AdminThead,
  AdminTr,
} from '@/components/admin/ui';
import {
  deleteSubscriber,
  exportSubscribersCSV,
  reactivateSubscriber,
  unsubscribeSubscriber,
} from '@/lib/actions/admin/newsletter.actions';
import {
  Download,
  Filter,
  Loader2,
  Mail,
  Send,
  ToggleLeft,
  ToggleRight,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useToast } from '../../hooks/useToast';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SerializedSubscriber = {
  id: string;
  email: string;
  source: string;
  status: string;
  subscribedAt: string;
  unsubscribedAt: string | null;
};

type Modal = { type: 'delete'; data: SerializedSubscriber };

const STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'info' | 'danger'
> = {
  active: 'success',
  unsubscribed: 'default',
  bounced: 'danger',
};

const SOURCE_LABEL: Record<string, string> = {
  sidebar: 'Sidebar',
  footer: 'Footer',
  other: 'Other',
};

// ── Stats Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: 'rgba(0,0,0,0.03)',
        border: `1px solid ${adminColors.border}`,
      }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg"
        style={{ background: `${color}18` }}
      >
        <Icon size={15} style={{ color }} />
      </div>
      <div>
        <div className="text-[11px]" style={{ color: adminColors.textMuted }}>
          {label}
        </div>
        <div
          className="text-[17px] font-semibold"
          style={{ color: adminColors.textPrimary }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewsletterClient({
  initialItems,
}: {
  initialItems: SerializedSubscriber[];
}) {
  const [modal, setModal] = useState<Modal | null>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const { toasts, toast, remove } = useToast();
  const { locale } = useParams();

  const refresh = () => startRefresh(() => router.refresh());

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total = initialItems.length;
  const active = initialItems.filter((i) => i.status === 'active').length;
  const unsubscribed = initialItems.filter(
    (i) => i.status === 'unsubscribed',
  ).length;

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = initialItems.filter((i) => {
    const statusMatch = filterStatus === 'ALL' || i.status === filterStatus;
    const sourceMatch = filterSource === 'ALL' || i.source === filterSource;
    return statusMatch && sourceMatch;
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const result = await deleteSubscriber(id);
    if (result.error) toast(result.error, 'error');
    else {
      setModal(null);
      refresh();
    }
    return result;
  };

  const handleToggle = async (item: SerializedSubscriber) => {
    const result =
      item.status === 'active'
        ? await unsubscribeSubscriber(item.id)
        : await reactivateSubscriber(item.id);
    if (result.error) toast(result.error, 'error');
    else refresh();
  };

  const handleExport = async () => {
    setIsExporting(true);
    const result = await exportSubscribersCSV();
    setIsExporting(false);
    if (result.error) {
      toast(result.error, 'error');
      return;
    }
    // Trigger CSV download in browser
    const blob = new Blob([result.csv!], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported successfully', 'success');
  };

  return (
    <div className="space-y-6 max-w-8xl mx-auto">
      {isRefreshing && (
        <div className="absolute inset-0 z-10 flex items-start justify-end pointer-events-none">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-l mt-1"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
          >
            <Loader2 size={12} className="animate-spin" />
            Updating...
          </div>
        </div>
      )}

      <AdminPageHeader
        title="Newsletter"
        subtitle="Manage newsletter subscribers"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <AdminButton
              variant="primary"
              onClick={() =>
                router.push(`/${locale}/admin/newsletter/campaign`)
              }
              className="px-5"
            >
              <Send size={14} />
              Send Campaign
            </AdminButton>

            <AdminButton
              variant="ghost"
              onClick={handleExport}
              className="px-5"
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Export CSV
            </AdminButton>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="Total" value={total} color="#6366f1" />
        <StatCard
          icon={UserCheck}
          label="Active"
          value={active}
          color="#22c55e"
        />
        <StatCard
          icon={UserX}
          label="Unsubscribed"
          value={unsubscribed}
          color="#6b7280"
        />
      </div>

      {/* Filters */}
      <AdminCard>
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={16} style={{ color: adminColors.textMuted }} />
          <span className="text-xl" style={{ color: adminColors.textMuted }}>
            Filter
          </span>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-l rounded-lg border px-2.5 py-1.5 outline-none"
            style={{
              background: 'rgba(0,0,0,0.04)',
              borderColor: adminColors.border,
              color: adminColors.textSecondary,
            }}
          >
            <option className="text-black" value="ALL">
              All statuses
            </option>
            <option className="text-black" value="active">
              Active
            </option>
            <option className="text-black" value="unsubscribed">
              Unsubscribed
            </option>
            <option className="text-black" value="bounced">
              Bounced
            </option>
          </select>

          {/* Source filter */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="text-l rounded-lg border px-2.5 py-1.5 outline-none"
            style={{
              background: 'rgba(0,0,0,0.04)',
              borderColor: adminColors.border,
              color: adminColors.textSecondary,
            }}
          >
            <option className="text-black" value="ALL">
              All sources
            </option>
            <option className="text-black" value="sidebar">
              Sidebar
            </option>
            <option className="text-black" value="footer">
              Footer
            </option>
            <option className="text-black" value="other">
              Other
            </option>
          </select>

          <span
            className="ml-auto text-l"
            style={{ color: adminColors.textMuted }}
          >
            {filtered.length} subscriber{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </AdminCard>

      {/* Table */}
      {filtered.length === 0 ? (
        <AdminCard>
          <AdminEmptyState
            title="No subscribers yet"
            description="Subscribers will appear here once someone signs up via the newsletter form."
            action={
              <div
                className="flex items-center gap-2 text-l"
                style={{ color: adminColors.textMuted }}
              >
                <Mail size={14} />
                Waiting for signups…
              </div>
            }
          />
        </AdminCard>
      ) : (
        <AdminCard noPadding>
          <AdminTable>
            <AdminThead>
              <AdminTh>Email</AdminTh>
              <AdminTh>Source</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh>Subscribed</AdminTh>
              <AdminTh>Unsubscribed</AdminTh>
              <AdminTh>Active</AdminTh>
              <AdminTh className="text-right">Actions</AdminTh>
            </AdminThead>
            <AdminTbody>
              {filtered.map((item) => (
                <AdminTr key={item.id}>
                  {/* Email */}
                  <AdminTd>
                    <div className="flex items-center gap-2">
                      <Mail
                        size={13}
                        style={{ color: adminColors.textMuted }}
                      />
                      <span
                        className="text-l font-medium"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {item.email}
                      </span>
                    </div>
                  </AdminTd>

                  {/* Source */}
                  <AdminTd>
                    <AdminBadge variant="info">
                      {SOURCE_LABEL[item.source] ?? item.source}
                    </AdminBadge>
                  </AdminTd>

                  {/* Status */}
                  <AdminTd>
                    <AdminBadge
                      variant={STATUS_VARIANT[item.status] ?? 'default'}
                    >
                      {item.status}
                    </AdminBadge>
                  </AdminTd>

                  {/* Subscribed at */}
                  <AdminTd>
                    <span
                      className="text-[16px]"
                      style={{ color: adminColors.textMuted }}
                    >
                      {new Date(item.subscribedAt).toLocaleDateString()}
                    </span>
                  </AdminTd>

                  {/* Unsubscribed at */}
                  <AdminTd>
                    <span
                      className="text-[16px]"
                      style={{ color: adminColors.textMuted }}
                    >
                      {item.unsubscribedAt
                        ? new Date(item.unsubscribedAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </AdminTd>

                  {/* Toggle active */}
                  <AdminTd>
                    <button
                      onClick={() => handleToggle(item)}
                      style={{
                        color:
                          item.status === 'active'
                            ? '#22c55e'
                            : adminColors.textMuted,
                      }}
                    >
                      {item.status === 'active' ? (
                        <ToggleRight size={20} />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>
                  </AdminTd>

                  {/* Actions */}
                  <AdminTd className="text-right">
                    <AdminButton
                      variant="danger"
                      size="sm"
                      onClick={() => setModal({ type: 'delete', data: item })}
                    >
                      <Trash2 size={18} />
                    </AdminButton>
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTbody>
          </AdminTable>
        </AdminCard>
      )}

      {/* Delete modal */}
      {modal?.type === 'delete' && (
        <DeleteConfirmModal
          title="Remove subscriber"
          description={`Are you sure you want to permanently remove "${modal.data.email}"? This cannot be undone.`}
          onConfirm={() => handleDelete(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
