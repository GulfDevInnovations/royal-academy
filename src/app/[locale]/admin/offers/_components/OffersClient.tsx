"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Filter,
  Tag,
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

import ContentFormModal from "../../upcoming/_components/ContentFormModal";
import {
  deleteOffer,
  toggleOfferActive,
} from "@/lib/actions/admin/content.actions";
import { useTranslations } from "next-intl";

// ── Types ────────────────────────────────────────────────────────────────────

export type SerializedOffer = {
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
  createdAt: string;
  updatedAt: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_TRIAL" | null;
  discountValue: string | null; // serialized Decimal
  promoCode: string | null;
  subClassIds: string[];
  classIds: string[];
  title_ar?: string | null;
  subtitle_ar?: string | null;
  description_ar?: string | null;
};

type Modal =
  | { type: "create" }
  | { type: "edit"; data: SerializedOffer }
  | { type: "delete"; data: SerializedOffer };

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "info" | "danger"
> = {
  ACTIVE: "success",
  DRAFT: "warning",
  EXPIRED: "danger",
  ARCHIVED: "default",
};

export type ClassWithSubClasses = {
  id: string;
  name: string;
  subClasses: { id: string; name: string }[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function OffersClient({
  initialItems,
  classes,
}: {
  initialItems: SerializedOffer[];
  classes: ClassWithSubClasses[];
}) {
  const [modal, setModal] = useState<Modal | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const { toasts, toast, remove } = useToast();
  const t = useTranslations("admin");

  const handleSuccess = () => {
    setModal(null);
    startRefresh(() => router.refresh());
  };

  const handleDelete = async (id: string) => {
    const result = await deleteOffer(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else {
      handleSuccess();
    }
    return result;
  };

  const handleToggle = async (item: SerializedOffer) => {
    const result = await toggleOfferActive(item.id, !item.isActive);
    if (result.error) toast(result.error, "error");
    else startRefresh(() => router.refresh());
  };

  const filtered = initialItems.filter(
    (i) => filterStatus === "ALL" || i.status === filterStatus,
  );

  return (
    <div className="space-y-6 max-w-8xl mx-auto">
      {isRefreshing && (
        <div className="absolute inset-0 z-10 flex items-start justify-end pointer-events-none">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-2xl mt-1"
            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
          >
            <Loader2 size={16} className="animate-spin" />
            Updating...
          </div>
        </div>
      )}

      <AdminPageHeader
        title="offers"
        subtitle="Manage offers shown on the home page"
        action={
          <AdminButton
            variant="primary"
            onClick={() => setModal({ type: "create" })}
          >
            <Plus size={17} />
            New offer
          </AdminButton>
        }
      />

      {/* Filters */}
      <AdminCard>
        <div className="flex items-center gap-3 flex-wrap">
          <Filter size={15} style={{ color: adminColors.textMuted }} />
          <span className="text-2xl" style={{ color: adminColors.textMuted }}>
            {t("filter")}
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-2xl rounded-lg border px-2.5 py-1.5 outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: adminColors.border,
              color: adminColors.textSecondary,
            }}
          >
            <option value="ALL">{t("allStatuses")}</option>
            <option value="ACTIVE">{t("active")}</option>
            <option value="DRAFT">{t("draft")}</option>
            <option value="EXPIRED">{t("expired")}</option>
            <option value="ARCHIVED">{t("archived")}</option>
          </select>
          <span
            className="ml-auto text-l"
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
            title="No offer items yet"
            description="Create your first offer event to display it on the home page."
            action={
              <AdminButton
                variant="primary"
                onClick={() => setModal({ type: "create" })}
              >
                <Plus size={15} />
                New Offer
              </AdminButton>
            }
          />
        </AdminCard>
      ) : (
        <AdminCard noPadding>
          <AdminTable>
            <AdminThead>
              <AdminTh>{t("thumbnail")}</AdminTh>
              <AdminTh>{t("name")}</AdminTh>
              <AdminTh>{t("eventDate")}</AdminTh>
              <AdminTh>{t("discount")}</AdminTh>
              <AdminTh>{t("promoCode")}</AdminTh>
              <AdminTh>{t("publishWindow")}</AdminTh>
              <AdminTh>{t("status")}</AdminTh>
              <AdminTh>{t("active")}</AdminTh>
              <AdminTh>{t("sort")}</AdminTh>
              <AdminTh className="text-right">{t("actions")}</AdminTh>
            </AdminThead>
            <AdminTbody>
              {filtered.map((item) => (
                <AdminTr key={item.id}>
                  {/* Thumbnail */}
                  <AdminTd>
                    <div
                      className="w-14 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
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
                        <Tag
                          size={18}
                          style={{ color: adminColors.textMuted }}
                        />
                      )}
                    </div>
                  </AdminTd>

                  {/* Title */}
                  <AdminTd>
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="text-l font-medium"
                        style={{ color: adminColors.textPrimary }}
                      >
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span
                          className="text-[16px]"
                          style={{ color: adminColors.textMuted }}
                        >
                          {item.subtitle}
                        </span>
                      )}
                      {item.badgeLabel && (
                        <AdminBadge variant="info">
                          {item.badgeLabel}
                        </AdminBadge>
                      )}
                    </div>
                  </AdminTd>

                  {/* Event Date */}
                  <AdminTd>
                    <span
                      className="text-l"
                      style={{ color: adminColors.textSecondary }}
                    >
                      {item.eventDate
                        ? new Date(item.eventDate).toLocaleDateString()
                        : "—"}
                    </span>
                  </AdminTd>

                  <AdminTd>
                    {item.discountType ? (
                      <div className="flex flex-col gap-0.5">
                        <AdminBadge variant="info">
                          {item.discountType}
                        </AdminBadge>
                        {item.discountValue && (
                          <span
                            className="text-[16px]"
                            style={{ color: adminColors.textMuted }}
                          >
                            {item.discountType === "PERCENTAGE"
                              ? `${item.discountValue}%`
                              : `${item.discountValue} OMR`}
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </AdminTd>

                  <AdminTd>
                    <span
                      className="text-l font-mono"
                      style={{ color: adminColors.textMuted }}
                    >
                      {item.promoCode ?? "—"}
                    </span>
                  </AdminTd>

                  {/* Publish Window */}
                  <AdminTd>
                    <div
                      className="flex flex-col gap-0.5 text-[16px]"
                      style={{ color: adminColors.textMuted }}
                    >
                      <span>
                        From:{" "}
                        {item.publishAt
                          ? new Date(item.publishAt).toLocaleDateString()
                          : "—"}
                      </span>
                      <span>
                        Until:{" "}
                        {item.expireAt
                          ? new Date(item.expireAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </AdminTd>

                  {/* Status */}
                  <AdminTd>
                    <AdminBadge variant={STATUS_VARIANT[item.status]}>
                      {item.status}
                    </AdminBadge>
                  </AdminTd>

                  {/* Active toggle */}
                  <AdminTd>
                    <button
                      onClick={() => handleToggle(item)}
                      style={{
                        color: item.isActive
                          ? "#22c55e"
                          : adminColors.textMuted,
                      }}
                    >
                      {item.isActive ? (
                        <ToggleRight size={19} />
                      ) : (
                        <ToggleLeft size={19} />
                      )}
                    </button>
                  </AdminTd>

                  {/* Sort order */}
                  <AdminTd>
                    <span
                      className="text-l"
                      style={{ color: adminColors.textMuted }}
                    >
                      {item.sortOrder}
                    </span>
                  </AdminTd>

                  {/* Actions */}
                  <AdminTd className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <AdminButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setModal({ type: "edit", data: item })}
                      >
                        <Pencil size={18} />
                      </AdminButton>
                      <AdminButton
                        variant="danger"
                        size="sm"
                        onClick={() => setModal({ type: "delete", data: item })}
                      >
                        <Trash2 size={18} />
                      </AdminButton>
                    </div>
                  </AdminTd>
                </AdminTr>
              ))}
            </AdminTbody>
          </AdminTable>
        </AdminCard>
      )}

      {/* Modals */}
      {(modal?.type === "create" || modal?.type === "edit") && (
        <ContentFormModal
          kind="offers"
          data={modal.type === "edit" ? modal.data : null}
          classes={classes} // ← was subClasses
          onSuccess={handleSuccess}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "delete" && (
        <DeleteConfirmModal
          title="Delete offer item"
          description={`Are you sure you want to delete "${modal.data.title}"? This cannot be undone.`}
          onConfirm={() => handleDelete(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
