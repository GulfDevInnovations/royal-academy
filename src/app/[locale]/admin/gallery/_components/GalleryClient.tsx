"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Images,
  Tag,
  FolderOpen,
  Loader2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Pencil,
  Trash2,
  Video,
  ImageIcon,
  Filter,
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
import GalleryUploadModal from "./GalleryUploadModal";
import GalleryEditModal from "./GalleryEditModal";
import CategoryModal from "./CategoryModal";
import PersonModal from "./PersonModal";
import {
  deleteGalleryItem,
  toggleGalleryVisibility,
  toggleFeatured,
  deleteGalleryCategory,
  deleteGalleryPerson,
} from "@/lib/actions/admin/gallery.actions";
import { useTranslations } from "next-intl";

// ── Types ────────────────────────────────────────────────────────────────────

export type SerializedGalleryItem = {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  title: string | null;
  description: string | null;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  visibility: "PUBLISHED" | "DRAFT" | "ARCHIVED";
  isFeatured: boolean;
  sortOrder: number;
  takenAt: string | null;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  category: { id: string; name: string; slug: string } | null;
  persons: {
    person: {
      id: string;
      displayName: string;
      role: string | null;
      photoUrl: string | null;
      teacherId: string | null;
    };
  }[];
};

export type SerializedCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { items: number };
};

export type SerializedPerson = {
  id: string;
  displayName: string;
  role: string | null;
  photoUrl: string | null;
  teacherId: string | null;
};

export type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const VISIBILITY_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "info" | "danger"
> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "default",
};

type Tab = "items" | "categories" | "persons";

type Modal =
  | { type: "upload" }
  | { type: "editItem"; data: SerializedGalleryItem }
  | { type: "deleteItem"; data: SerializedGalleryItem }
  | { type: "addCategory" }
  | { type: "editCategory"; data: SerializedCategory }
  | { type: "deleteCategory"; data: SerializedCategory }
  | { type: "addPerson" }
  | { type: "editPerson"; data: SerializedPerson }
  | { type: "deletePerson"; data: SerializedPerson };

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  initialItems: SerializedGalleryItem[];
  initialCategories: SerializedCategory[];
  initialPersons: SerializedPerson[];
  teachers: Teacher[];
}

export default function GalleryClient({
  initialItems,
  initialCategories,
  initialPersons,
  teachers,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("items");
  const [modal, setModal] = useState<Modal | null>(null);
  const [filterVisibility, setFilterVisibility] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const t = useTranslations("admin");

  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const { toasts, toast, remove } = useToast();

  const handleSuccess = () => {
    setModal(null);
    startRefresh(() => router.refresh());
  };

  // ── Item actions ────────────────────────────────────────────────────────

  const handleDeleteItem = async (id: string) => {
    const result = await deleteGalleryItem(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else {
      handleSuccess();
    }
    return result;
  };

  const handleToggleVisibility = async (
    item: SerializedGalleryItem,
    next: "PUBLISHED" | "DRAFT" | "ARCHIVED",
  ) => {
    const result = await toggleGalleryVisibility(item.id, next);
    if (result.error) toast(result.error, "error");
    else startRefresh(() => router.refresh());
  };

  const handleToggleFeatured = async (item: SerializedGalleryItem) => {
    const result = await toggleFeatured(item.id, !item.isFeatured);
    if (result.error) toast(result.error, "error");
    else startRefresh(() => router.refresh());
  };

  // ── Category actions ─────────────────────────────────────────────────────

  const handleDeleteCategory = async (id: string) => {
    const result = await deleteGalleryCategory(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else {
      handleSuccess();
    }
    return result;
  };

  // ── Person actions ───────────────────────────────────────────────────────

  const handleDeletePerson = async (id: string) => {
    const result = await deleteGalleryPerson(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else {
      handleSuccess();
    }
    return result;
  };

  // ── Filtered items ────────────────────────────────────────────────────────

  const filteredItems = initialItems.filter((item) => {
    if (filterVisibility !== "ALL" && item.visibility !== filterVisibility)
      return false;
    if (filterCategory !== "ALL" && item.categoryId !== filterCategory)
      return false;
    if (filterType !== "ALL" && item.mediaType !== filterType) return false;
    return true;
  });

  // ── Tabs ──────────────────────────────────────────────────────────────────

  const tabs: {
    key: Tab;
    label: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
    {
      key: "items",
      label: "Media",
      count: initialItems.length,
      icon: <Images size={18} />,
    },
    {
      key: "categories",
      label: "Categories",
      count: initialCategories.length,
      icon: <FolderOpen size={18} />,
    },
    {
      key: "persons",
      label: "People",
      count: initialPersons.length,
      icon: <Tag size={18} />,
    },
  ];

  return (
    <div className="space-y-6 max-w-8xl mx-auto">
      {isRefreshing && (
        <div className="absolute inset-0 z-10 flex items-start justify-end pointer-events-none">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-l mt-1"
            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}
          >
            <Loader2 size={16} className="animate-spin" />
            Updating...
          </div>
        </div>
      )}

      <AdminPageHeader
        title="Gallery"
        subtitle="Manage photos, videos, categories and tagged people"
        action={
          activeTab === "items" ? (
            <AdminButton
              variant="primary"
              onClick={() => setModal({ type: "upload" })}
            >
              <Plus size={18} />
              {t("uploadMedia")}
            </AdminButton>
          ) : activeTab === "categories" ? (
            <AdminButton
              variant="primary"
              onClick={() => setModal({ type: "addCategory" })}
            >
              <Plus size={18} />
              {t("newCategory")}
            </AdminButton>
          ) : (
            <AdminButton
              variant="primary"
              onClick={() => setModal({ type: "addPerson" })}
            >
              <Plus size={18} />
              {t("newPerson")}
            </AdminButton>
          )
        }
      />

      {/* ── Tabs ── */}
      <div
        className="flex items-center gap-1 border-b"
        style={{ borderColor: adminColors.border }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-2 px-4 py-2.5 text-l font-medium border-b-2 transition-colors -mb-px"
            style={{
              borderColor: activeTab === tab.key ? "#f59e0b" : "transparent",
              color:
                activeTab === tab.key ? "#f59e0b" : adminColors.textSecondary,
            }}
          >
            {tab.icon}
            {tab.label}
            <span
              className="px-1.5 py-0.5 rounded-full text-[15px]"
              style={{
                background:
                  activeTab === tab.key
                    ? "rgba(245,158,11,0.15)"
                    : "rgba(255,255,255,0.05)",
                color:
                  activeTab === tab.key ? "#f59e0b" : adminColors.textMuted,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── MEDIA TAB ── */}
      {activeTab === "items" && (
        <div className="space-y-4">
          {/* Filters */}
          <AdminCard>
            <div className="flex items-center gap-3 flex-wrap">
              <Filter size={16} style={{ color: adminColors.textMuted }} />
              <span className="text-l" style={{ color: adminColors.textMuted }}>
                {t("filter")}
              </span>

              {/* Visibility filter */}
              <select
                value={filterVisibility}
                onChange={(e) => setFilterVisibility(e.target.value)}
                className="text-l rounded-lg border px-2.5 py-1.5 outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: adminColors.border,
                  color: adminColors.textSecondary,
                }}
              >
                <option value="ALL">{t("allVisibility")}</option>
                <option value="PUBLISHED">{t("published")}</option>
                <option value="DRAFT">{t("draft")}</option>
                <option value="ARCHIVED">{t("archived")}</option>
              </select>

              {/* Type filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-l rounded-lg border px-2.5 py-1.5 outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: adminColors.border,
                  color: adminColors.textSecondary,
                }}
              >
                <option value="ALL">{t("allTypes")}</option>
                <option value="IMAGE">{t("images")}</option>
                <option value="VIDEO">{t("videos")}</option>
              </select>

              {/* Category filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="text-l rounded-lg border px-2.5 py-1.5 outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  borderColor: adminColors.border,
                  color: adminColors.textSecondary,
                }}
              >
                <option value="ALL">{t("allCategories")}</option>
                {initialCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <span
                className="ml-auto text-l"
                style={{ color: adminColors.textMuted }}
              >
                {filteredItems.length} item
                {filteredItems.length !== 1 ? "s" : ""}
              </span>
            </div>
          </AdminCard>

          {/* Items Table */}
          {filteredItems.length === 0 ? (
            <AdminCard>
              <AdminEmptyState
                title="No media yet"
                description="Upload your first photo or video to get started."
                action={
                  <AdminButton
                    variant="primary"
                    onClick={() => setModal({ type: "upload" })}
                  >
                    <Plus size={18} />
                    {t("uploadMedia")}
                  </AdminButton>
                }
              />
            </AdminCard>
          ) : (
            <AdminCard noPadding>
              <AdminTable>
                <AdminThead>
                  <AdminTh>{t("preview")}</AdminTh>
                  <AdminTh>{t("titleDescription")}</AdminTh>
                  <AdminTh>{t("type")}</AdminTh>
                  <AdminTh>{t("category")}</AdminTh>
                  <AdminTh>{t("people")}</AdminTh>
                  <AdminTh>{t("visibility")}</AdminTh>
                  <AdminTh>{t("featured")}</AdminTh>
                  <AdminTh className="text-right">{t("actions")}</AdminTh>
                </AdminThead>
                <AdminTbody>
                  {filteredItems.map((item) => (
                    <AdminTr key={item.id}>
                      {/* Preview */}
                      <AdminTd>
                        <div
                          className="w-14 h-10 rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                          style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                          {item.mediaType === "IMAGE" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.url}
                              alt={item.altText ?? item.title ?? ""}
                              className="w-full h-full object-cover"
                            />
                          ) : item.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title ?? ""}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Video
                              size={19}
                              style={{ color: adminColors.textMuted }}
                            />
                          )}
                        </div>
                      </AdminTd>

                      {/* Title / Description */}
                      <AdminTd>
                        <div className="max-w-45">
                          <p
                            className="text-l font-medium truncate"
                            style={{ color: adminColors.textPrimary }}
                          >
                            {item.title || (
                              <span style={{ color: adminColors.textMuted }}>
                                Untitled
                              </span>
                            )}
                          </p>
                          {item.description && (
                            <p
                              className="text-l truncate mt-0.5"
                              style={{ color: adminColors.textMuted }}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
                      </AdminTd>

                      {/* Type */}
                      <AdminTd>
                        <div
                          className="flex items-center gap-1.5"
                          style={{ color: adminColors.textSecondary }}
                        >
                          {item.mediaType === "IMAGE" ? (
                            <ImageIcon size={17} />
                          ) : (
                            <Video size={17} />
                          )}
                          <span className="text-l">{item.mediaType}</span>
                        </div>
                      </AdminTd>

                      {/* Category */}
                      <AdminTd>
                        {item.category ? (
                          <AdminBadge variant="info">
                            {item.category.name}
                          </AdminBadge>
                        ) : (
                          <span style={{ color: adminColors.textMuted }}>
                            —
                          </span>
                        )}
                      </AdminTd>

                      {/* People */}
                      <AdminTd>
                        {item.persons.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-35">
                            {item.persons.slice(0, 2).map((p) => (
                              <span
                                key={p.person.id}
                                className="text-[15px] px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  color: adminColors.textSecondary,
                                }}
                              >
                                {p.person.displayName}
                              </span>
                            ))}
                            {item.persons.length > 2 && (
                              <span
                                className="text-[15px] px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  color: adminColors.textMuted,
                                }}
                              >
                                +{item.persons.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: adminColors.textMuted }}>
                            —
                          </span>
                        )}
                      </AdminTd>

                      {/* Visibility */}
                      <AdminTd>
                        <div className="flex items-center gap-1.5">
                          <AdminBadge
                            variant={VISIBILITY_VARIANT[item.visibility]}
                          >
                            {item.visibility}
                          </AdminBadge>
                          <button
                            title="Toggle visibility"
                            onClick={() =>
                              handleToggleVisibility(
                                item,
                                item.visibility === "PUBLISHED"
                                  ? "DRAFT"
                                  : "PUBLISHED",
                              )
                            }
                            className="p-1 rounded text-white/20 hover:text-white/60 transition-colors"
                          >
                            {item.visibility === "PUBLISHED" ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </AdminTd>

                      {/* Featured */}
                      <AdminTd>
                        <button
                          onClick={() => handleToggleFeatured(item)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{
                            color: item.isFeatured
                              ? "#f59e0b"
                              : "rgba(255,255,255,0.2)",
                          }}
                          title={
                            item.isFeatured
                              ? "Remove from featured"
                              : "Mark as featured"
                          }
                        >
                          {item.isFeatured ? (
                            <Star size={17} fill="currentColor" />
                          ) : (
                            <StarOff size={17} />
                          )}
                        </button>
                      </AdminTd>

                      {/* Actions */}
                      <AdminTd className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              setModal({ type: "editItem", data: item })
                            }
                            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-white/5 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={20} />
                          </button>
                          <button
                            onClick={() =>
                              setModal({ type: "deleteItem", data: item })
                            }
                            className="p-1.5 rounded-lg text-red-800 hover:text-red-500 hover:bg-white/5 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </AdminTd>
                    </AdminTr>
                  ))}
                </AdminTbody>
              </AdminTable>
            </AdminCard>
          )}
        </div>
      )}

      {/* ── CATEGORIES TAB ── */}
      {activeTab === "categories" && (
        <div className="space-y-3">
          {initialCategories.length === 0 ? (
            <AdminCard>
              <AdminEmptyState
                title="No categories yet"
                description="Create categories to organise your gallery (e.g. Dance, Music, Events)."
                action={
                  <AdminButton
                    variant="primary"
                    onClick={() => setModal({ type: "addCategory" })}
                  >
                    <Plus size={17} />
                    {t("newCategory")}
                  </AdminButton>
                }
              />
            </AdminCard>
          ) : (
            <AdminCard noPadding>
              <AdminTable>
                <AdminThead>
                  <AdminTh>{t("name")}</AdminTh>
                  <AdminTh>{t("slug")}</AdminTh>
                  <AdminTh>Items</AdminTh>
                  <AdminTh>{t("order")}</AdminTh>
                  <AdminTh>{t("status")}</AdminTh>
                  <AdminTh className="text-right">{t("actions")}</AdminTh>
                </AdminThead>
                <AdminTbody>
                  {initialCategories.map((cat) => (
                    <AdminTr key={cat.id}>
                      <AdminTd>
                        <span
                          className="text-xl font-medium"
                          style={{ color: adminColors.textPrimary }}
                        >
                          {cat.name}
                        </span>
                      </AdminTd>
                      <AdminTd>
                        <code
                          className="text-l px-2 py-0.5 rounded"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            color: adminColors.textSecondary,
                          }}
                        >
                          {cat.slug}
                        </code>
                      </AdminTd>
                      <AdminTd>
                        <span style={{ color: adminColors.textSecondary }}>
                          {cat._count.items}
                        </span>
                      </AdminTd>
                      <AdminTd>
                        <span style={{ color: adminColors.textMuted }}>
                          {cat.sortOrder}
                        </span>
                      </AdminTd>
                      <AdminTd>
                        <AdminBadge
                          variant={cat.isActive ? "success" : "default"}
                        >
                          {cat.isActive ? t("active") : "Inactive"}
                        </AdminBadge>
                      </AdminTd>
                      <AdminTd className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              setModal({ type: "editCategory", data: cat })
                            }
                            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-white/5 transition-colors"
                          >
                            <Pencil size={20} />
                          </button>
                          <button
                            onClick={() =>
                              setModal({ type: "deleteCategory", data: cat })
                            }
                            className="p-1.5 rounded-lg text-red-800 hover:text-red-500 hover:bg-white/5 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </AdminTd>
                    </AdminTr>
                  ))}
                </AdminTbody>
              </AdminTable>
            </AdminCard>
          )}
        </div>
      )}

      {/* ── PERSONS TAB ── */}
      {activeTab === "persons" && (
        <div className="space-y-3">
          {initialPersons.length === 0 ? (
            <AdminCard>
              <AdminEmptyState
                title="No people yet"
                description="Add people to tag them in gallery photos and videos."
                action={
                  <AdminButton
                    variant="primary"
                    onClick={() => setModal({ type: "addPerson" })}
                  >
                    <Plus size={17} />
                    {t("newPerson")}
                  </AdminButton>
                }
              />
            </AdminCard>
          ) : (
            <AdminCard noPadding>
              <AdminTable>
                <AdminThead>
                  <AdminTh>{t("name")}</AdminTh>
                  <AdminTh>{t("role")}</AdminTh>
                  <AdminTh>{t("linkedTeacher")}</AdminTh>
                  <AdminTh className="text-right">{t("actions")}</AdminTh>
                </AdminThead>
                <AdminTbody>
                  {initialPersons.map((person) => (
                    <AdminTr key={person.id}>
                      <AdminTd>
                        <span
                          className="font-medium text-xl"
                          style={{ color: adminColors.textPrimary }}
                        >
                          {person.displayName}
                        </span>
                      </AdminTd>
                      <AdminTd>
                        {person.role ? (
                          <AdminBadge variant="info">{person.role}</AdminBadge>
                        ) : (
                          <span style={{ color: adminColors.textMuted }}>
                            —
                          </span>
                        )}
                      </AdminTd>
                      <AdminTd>
                        {person.teacherId ? (
                          <span
                            className="text-l"
                            style={{ color: adminColors.textSecondary }}
                          >
                            Linked ✓
                          </span>
                        ) : (
                          <span style={{ color: adminColors.textMuted }}>
                            —
                          </span>
                        )}
                      </AdminTd>
                      <AdminTd className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() =>
                              setModal({ type: "editPerson", data: person })
                            }
                            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-white/5 transition-colors"
                          >
                            <Pencil size={20} />
                          </button>
                          <button
                            onClick={() =>
                              setModal({ type: "deletePerson", data: person })
                            }
                            className="p-1.5 rounded-lg text-red-800 hover:text-red-500 hover:bg-white/5 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </AdminTd>
                    </AdminTr>
                  ))}
                </AdminTbody>
              </AdminTable>
            </AdminCard>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.type === "upload" && (
        <GalleryUploadModal
          categories={initialCategories}
          persons={initialPersons}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modal?.type === "editItem" && (
        <GalleryEditModal
          item={modal.data}
          categories={initialCategories}
          persons={initialPersons}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modal?.type === "deleteItem" && (
        <DeleteConfirmModal
          title={`Delete "${modal.data.title || "this item"}"?`}
          description="This will permanently delete the media file. This cannot be undone."
          onConfirm={() => handleDeleteItem(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}

      {(modal?.type === "addCategory" || modal?.type === "editCategory") && (
        <CategoryModal
          editing={modal.type === "editCategory" ? modal.data : undefined}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modal?.type === "deleteCategory" && (
        <DeleteConfirmModal
          title={`Delete "${modal.data.name}"?`}
          description={
            modal.data._count.items > 0
              ? `This category has ${modal.data._count.items} item(s). Remove or reassign them first.`
              : "This will permanently delete this category."
          }
          onConfirm={() => handleDeleteCategory(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}

      {(modal?.type === "addPerson" || modal?.type === "editPerson") && (
        <PersonModal
          editing={modal.type === "editPerson" ? modal.data : undefined}
          teachers={teachers}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modal?.type === "deletePerson" && (
        <DeleteConfirmModal
          title={`Delete "${modal.data.displayName}"?`}
          description="This will remove them from all tagged gallery items too."
          onConfirm={() => handleDeletePerson(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
