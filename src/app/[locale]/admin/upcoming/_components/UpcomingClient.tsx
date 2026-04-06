"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Plus,
  CalendarClock,
  Loader2,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Filter,
  Wrench,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  AdminCard,
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  AdminTable,
  AdminThead,
  AdminTh,
  AdminTbody,
  AdminTr,
  AdminTd,
  AdminEmptyState,
  adminColors,
} from "@/components/admin/ui";
import { ToastContainer } from "@/components/admin/Toast";
import { useToast } from "../../hooks/useToast";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import {
  deleteUpcoming,
  toggleUpcomingActive,
  updateUpcomingSortOrder,
  getUpcomingItems,
  updateUpcomingStatus,
} from "@/lib/actions/admin/content.actions";
import { toggleWorkshopActive } from "@/lib/actions/admin/Workshops.actions";
import ContentFormModal from "./ContentFormModal";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SerializedUpcoming = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  mediaUrls: string[];
  videoUrls: string[];
  thumbnailUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  isExternal: boolean;
  eventDate: string | null;
  publishAt: string | null;
  expireAt: string | null;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "ARCHIVED";
  isActive: boolean;
  sortOrder: number;
  badgeLabel: string | null;
  createdBy: string | null;
  workshopId: string | null; // non-null = this row belongs to a workshop
  createdAt: string;
  updatedAt: string;
};

type Modal =
  | { type: "create" }
  | { type: "edit"; data: SerializedUpcoming }
  | { type: "delete"; data: SerializedUpcoming };

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "info" | "danger"
> = {
  ACTIVE: "success",
  DRAFT: "warning",
  EXPIRED: "danger",
  ARCHIVED: "default",
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function UpcomingClient({
  initialItems,
}: {
  initialItems: SerializedUpcoming[];
}) {
  const [items, setItems] = useState(initialItems);
  const [modal, setModal] = useState<Modal | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isPending, startTransition] = useTransition();
  const { toasts, toast, remove } = useToast();

  const reloadItems = useCallback(async () => {
    const fresh = await getUpcomingItems();
    setItems(fresh as typeof initialItems);
  }, []);

  // ── Helpers ────────────────────────────────────────────────
  const handleSuccess = () => {
    setModal(null);
    startTransition(async () => {
      await reloadItems();
    });
  };

  // ── Toggle active ──────────────────────────────────────────
  // Workshop rows: sync both Workshop + Upcoming via workshops action.
  // Plain upcoming rows: toggle only the Upcoming record.
  const handleToggle = async (item: SerializedUpcoming) => {
    const newVal = !item.isActive;

    // Optimistic local update
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, isActive: newVal } : x)),
    );

    let result: { error?: string } | { success: boolean; error?: string };
    if (item.workshopId) {
      result = await toggleWorkshopActive(item.workshopId, newVal);
    } else {
      result = await toggleUpcomingActive(item.id, newVal);
    }

    if ((result as any).error) {
      // Revert on failure
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, isActive: !newVal } : x)),
      );
      toast((result as any).error, "error");
    } else {
      toast(newVal ? "Activated" : "Deactivated", "success");
    }
  };

  // ── Sort order ─────────────────────────────────────────────
  const moveSortOrder = async (
    item: SerializedUpcoming,
    dir: "up" | "down",
  ) => {
    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((x) => x.id === item.id);

    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const swapItem = sorted[swapIdx];
    const newA = swapItem.sortOrder;
    const newB = item.sortOrder;

    // Optimistic update
    setItems((prev) =>
      prev.map((x) => {
        if (x.id === item.id) return { ...x, sortOrder: newA };
        if (x.id === swapItem.id) return { ...x, sortOrder: newB };
        return x;
      }),
    );

    startTransition(async () => {
      const [r1, r2] = await Promise.all([
        updateUpcomingSortOrder(item.id, newA),
        updateUpcomingSortOrder(swapItem.id, newB),
      ]);
      if (r1.error || r2.error) {
        toast("Failed to update sort order", "error");
        // Revert
        setItems((prev) =>
          prev.map((x) => {
            if (x.id === item.id) return { ...x, sortOrder: newB };
            if (x.id === swapItem.id) return { ...x, sortOrder: newA };
            return x;
          }),
        );
      }
    });
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const result = await deleteUpcoming(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else {
      setItems((prev) => prev.filter((x) => x.id !== id));
      setModal(null);
      toast("Deleted", "success");
    }
    return result;
  };

  // ── Status change (workshop rows only) ───────────────────────
  const STATUS_CYCLE: SerializedUpcoming["status"][] = [
    "DRAFT",
    "ACTIVE",
    "ARCHIVED",
  ];

  const handleStatusChange = async (
    item: SerializedUpcoming,
    newStatus: SerializedUpcoming["status"],
  ) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((x) => (x.id === item.id ? { ...x, status: newStatus } : x)),
    );
    const result = await updateUpcomingStatus(item.id, newStatus);
    if (result.error) {
      // Revert
      setItems((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, status: item.status } : x)),
      );
      toast(result.error, "error");
    } else {
      toast(`Status set to ${newStatus}`, "success");
    }
  };

  // ── Filtered + sorted list ─────────────────────────────────
  const filtered = [...items]
    .filter((i) => filterStatus === "ALL" || i.status === filterStatus)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <ToastContainer toasts={toasts} onRemove={remove} />

      <AdminPageHeader
        title="Upcoming"
        subtitle="Manage upcoming events shown on the home page"
        action={
          <AdminButton
            variant="primary"
            onClick={() => setModal({ type: "create" })}
          >
            <Plus size={14} /> New Upcoming
          </AdminButton>
        }
      />

      {/* Filters */}
      <AdminCard>
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={13} style={{ color: adminColors.textMuted }} />
          <span className="text-xs" style={{ color: adminColors.textMuted }}>
            Filter:
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs rounded-lg border px-2.5 py-1.5 outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: adminColors.border,
              color: adminColors.textSecondary,
            }}
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="EXPIRED">Expired</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Legend */}
          <div
            className="flex items-center gap-1.5 ml-2 px-2.5 py-1.5 rounded-lg"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Wrench size={11} style={{ color: adminColors.accent }} />
            <span
              className="text-[11px]"
              style={{ color: adminColors.textMuted }}
            >
              Workshop — manage details from the Workshops page
            </span>
          </div>

          <span
            className="ml-auto text-xs"
            style={{ color: adminColors.textMuted }}
          >
            {filtered.length} item{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </AdminCard>

      {/* Table */}
      {filtered.length === 0 ? (
        <AdminCard>
          <AdminEmptyState
            title="No upcoming items yet"
            description="Create your first upcoming event to display it on the home page."
            action={
              <AdminButton
                variant="primary"
                onClick={() => setModal({ type: "create" })}
              >
                <Plus size={14} /> New Upcoming
              </AdminButton>
            }
          />
        </AdminCard>
      ) : (
        <AdminCard noPadding>
          <AdminTable>
            <AdminThead>
              <AdminTh>Thumbnail</AdminTh>
              <AdminTh>Title</AdminTh>
              <AdminTh>Type</AdminTh>
              <AdminTh>Event Date</AdminTh>
              <AdminTh>Status</AdminTh>
              <AdminTh>Active</AdminTh>
              <AdminTh>Sort</AdminTh>
              <AdminTh className="text-right">Actions</AdminTh>
            </AdminThead>
            <AdminTbody>
              {filtered.map((item) => {
                const isWorkshop = !!item.workshopId;

                return (
                  <AdminTr key={item.id}>
                    {/* Thumbnail */}
                    <AdminTd>
                      <div
                        className="w-14 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.04)" }}
                      >
                        {item.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <CalendarClock
                            size={16}
                            style={{ color: adminColors.textMuted }}
                          />
                        )}
                      </div>
                    </AdminTd>

                    {/* Title */}
                    <AdminTd>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="text-xs font-medium"
                          style={{ color: adminColors.textPrimary }}
                        >
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span
                            className="text-[11px]"
                            style={{ color: adminColors.textMuted }}
                          >
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </AdminTd>

                    {/* Type badge */}
                    <AdminTd>
                      {isWorkshop ? (
                        <div className="flex items-center gap-1.5">
                          <Wrench
                            size={11}
                            style={{ color: adminColors.accent }}
                          />
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: adminColors.accent }}
                          >
                            Workshop
                          </span>
                        </div>
                      ) : (
                        <span
                          className="text-[11px]"
                          style={{ color: adminColors.textMuted }}
                        >
                          Upcoming
                        </span>
                      )}
                    </AdminTd>

                    {/* Event Date */}
                    <AdminTd>
                      <span
                        className="text-xs"
                        style={{ color: adminColors.textSecondary }}
                      >
                        {item.eventDate
                          ? new Date(item.eventDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </span>
                    </AdminTd>

                    {/* Status */}
                    <AdminTd>
                      {isWorkshop ? (
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(
                              item,
                              e.target.value as SerializedUpcoming["status"],
                            )
                          }
                          className="text-[11px] rounded-lg border px-2 py-1 outline-none transition-colors"
                          style={{
                            background:
                              item.status === "ACTIVE"
                                ? "rgba(52,211,153,0.1)"
                                : item.status === "DRAFT"
                                  ? "rgba(245,158,11,0.1)"
                                  : "rgba(255,255,255,0.04)",
                            borderColor:
                              item.status === "ACTIVE"
                                ? "rgba(52,211,153,0.3)"
                                : item.status === "DRAFT"
                                  ? "rgba(245,158,11,0.3)"
                                  : "rgba(255,255,255,0.1)",
                            color:
                              item.status === "ACTIVE"
                                ? "#34d399"
                                : item.status === "DRAFT"
                                  ? adminColors.accent
                                  : adminColors.textMuted,
                          }}
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                        </select>
                      ) : (
                        <AdminBadge variant={STATUS_VARIANT[item.status]}>
                          {item.status}
                        </AdminBadge>
                      )}
                    </AdminTd>

                    {/* Active toggle — available for ALL rows */}
                    <AdminTd>
                      <button
                        onClick={() => handleToggle(item)}
                        disabled={isPending}
                        title={
                          isWorkshop ? "Syncs with Workshop page" : undefined
                        }
                        style={{
                          color: item.isActive
                            ? "#22c55e"
                            : adminColors.textMuted,
                          opacity: isPending ? 0.5 : 1,
                        }}
                      >
                        {item.isActive ? (
                          <ToggleRight size={20} />
                        ) : (
                          <ToggleLeft size={20} />
                        )}
                      </button>
                    </AdminTd>

                    {/* Sort — available for ALL rows */}
                    <AdminTd>
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveSortOrder(item, "up")}
                          disabled={isPending}
                          className="p-0.5 rounded hover:bg-white/[0.06] transition-colors"
                          style={{ color: adminColors.textMuted }}
                        >
                          <ChevronUp size={13} />
                        </button>
                        <span
                          className="text-[10px] text-center"
                          style={{ color: adminColors.textMuted }}
                        >
                          {item.sortOrder}
                        </span>
                        <button
                          onClick={() => moveSortOrder(item, "down")}
                          disabled={isPending}
                          className="p-0.5 rounded hover:bg-white/[0.06] transition-colors"
                          style={{ color: adminColors.textMuted }}
                        >
                          <ChevronDown size={13} />
                        </button>
                      </div>
                    </AdminTd>

                    {/* Actions — restricted for workshop rows */}
                    <AdminTd className="text-right">
                      {isWorkshop ? (
                        <span
                          className="text-[11px] italic"
                          style={{ color: adminColors.textMuted }}
                        >
                          Edit in Workshops
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <AdminButton
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setModal({ type: "edit", data: item })
                            }
                          >
                            <Pencil size={13} />
                          </AdminButton>
                          <AdminButton
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              setModal({ type: "delete", data: item })
                            }
                          >
                            <Trash2 size={13} />
                          </AdminButton>
                        </div>
                      )}
                    </AdminTd>
                  </AdminTr>
                );
              })}
            </AdminTbody>
          </AdminTable>
        </AdminCard>
      )}

      {/* Modals */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <ContentFormModal
          kind="upcoming"
          data={modal.type === "edit" ? modal.data : null}
          onSuccess={handleSuccess}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "delete" && (
        <DeleteConfirmModal
          title="Delete upcoming item"
          description={`Are you sure you want to delete "${modal.data.title}"? This cannot be undone.`}
          onConfirm={() => handleDelete(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
