"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  BookOpen,
  Loader2,
} from "lucide-react";
import type { SerializedClass, SerializedSubClass } from "../page";
import {
  deleteClass,
  deleteSubClass,
} from "@/lib/actions/admin/classes.actions";
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
import ClassFormModal from "./ClassFormModal";
import SubClassFormModal from "./SubClassFormModal";
import DeleteConfirmModal from "../../../../../components/admin/DeleteConfirmModal";
import { ToastContainer } from "@/components/admin/Toast";
import { useToast } from "../../hooks/useToast";
import { useTranslations } from "next-intl";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  initialClasses: SerializedClass[];
  teachers: Teacher[];
}

type Modal =
  | { type: "addClass" }
  | { type: "editClass"; data: SerializedClass }
  | { type: "deleteClass"; data: SerializedClass }
  | { type: "addSub"; data: SerializedClass }
  | { type: "editSub"; parentClass: SerializedClass; data: SerializedSubClass }
  | { type: "deleteSub"; data: SerializedSubClass };

const SESSION_TYPE_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  TRIAL: "Trial",
  WORKSHOP: "Workshop",
  PRIVATE: "Private",
};

const SESSION_TYPE_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "info" | "danger"
> = {
  PUBLIC: "success",
  MUSIC: "info",
  TRIAL: "warning",
  WORKSHOP: "warning",
  PRIVATE: "default",
};

export default function ClassesClient({ initialClasses, teachers }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<Modal | null>(null);
  const t = useTranslations("admin");

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

  // After any mutation, router.refresh() won't work here since we're client-only.
  // We trigger a full reload of the data via window.location.reload() for simplicity,
  // or you can use router.refresh() if you pass router in.
  const handleSuccess = () => {
    setModal(null);
    startRefresh(() => {
      router.refresh();
    });
  };

  const handleDeleteClass = async (id: string) => {
    const result = await deleteClass(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else {
      handleSuccess(); // ← was missing on success path
    }
    return result;
  };

  const handleDeleteSubClass = async (id: string) => {
    const result = await deleteSubClass(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else {
      handleSuccess(); // ← was missing on success path
    }
    return result;
  };

  const findParentClass = (subClassId: string) =>
    initialClasses.find((c) => c.subClasses.some((s) => s.id === subClassId));

  const { toasts, toast, remove } = useToast();

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
        title="Classes"
        subtitle="Manage class categories and their sub-classes"
        action={
          <AdminButton
            variant="primary"
            onClick={() => setModal({ type: "addClass" })}
          >
            <Plus size={17} />
            {t("newClass")}
          </AdminButton>
        }
      />

      {initialClasses.length === 0 ? (
        <AdminCard>
          <AdminEmptyState
            title="No classes yet"
            description="Create your first class category to get started."
            action={
              <AdminButton
                variant="primary"
                onClick={() => setModal({ type: "addClass" })}
              >
                <Plus size={17} />
                {t("newClass")}
              </AdminButton>
            }
          />
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {initialClasses.map((cls) => (
            <AdminCard key={cls.id} noPadding>
              {/* ── Class Row ── */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
                onClick={() => toggleExpand(cls.id)}
              >
                {/* Expand toggle */}
                <span style={{ color: adminColors.textMuted }}>
                  {expanded[cls.id] ? (
                    <ChevronDown size={19} />
                  ) : (
                    <ChevronRight size={19} />
                  )}
                </span>

                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(245,158,11,0.1)" }}
                >
                  <BookOpen size={18} style={{ color: "#f59e0b" }} />
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xl font-semibold"
                      style={{ color: adminColors.textPrimary }}
                    >
                      {cls.name}
                    </span>
                    <AdminBadge variant={cls.isActive ? "success" : "default"}>
                      {cls.isActive ? t("active") : "Inactive"}
                    </AdminBadge>
                  </div>
                  {cls.description && (
                    <p
                      className="text-2xl mt-0.5 truncate"
                      style={{ color: adminColors.textMuted }}
                    >
                      {cls.description}
                    </p>
                  )}
                </div>

                {/* Sub-class count */}
                <span
                  className="text-l px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    color: adminColors.textSecondary,
                  }}
                >
                  {cls.subClasses.length} sub-class
                  {cls.subClasses.length !== 1 ? "es" : ""}
                </span>

                {/* Actions — stop propagation so clicks don't toggle expand */}
                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AdminButton
                    size="md"
                    style={{
                      color: adminColors.textPrimary,
                      background: adminColors.pinkText,
                    }}
                    onClick={() => setModal({ type: "addSub", data: cls })}
                  >
                    <Plus size={16} />
                    {t("subClass")}
                  </AdminButton>
                  <button
                    onClick={() => setModal({ type: "editClass", data: cls })}
                    className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-white/5 transition-colors"
                    title="Edit class"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => setModal({ type: "deleteClass", data: cls })}
                    className="p-1.5 rounded-lg text-red-800 hover:text-red-500 hover:bg-white/5 transition-colors"
                    title="Delete class"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* ── SubClasses Table ── */}
              {expanded[cls.id] && (
                <div
                  className="border-t"
                  style={{ borderColor: adminColors.border }}
                >
                  {cls.subClasses.length === 0 ? (
                    <div className="px-5 py-6 text-center">
                      <p
                        className="text-l"
                        style={{ color: adminColors.textMuted }}
                      >
                        {t("noSubClasses")}{" "}
                        <button
                          className="underline"
                          style={{ color: "#f59e0b" }}
                          onClick={() =>
                            setModal({ type: "addSub", data: cls })
                          }
                        >
                          Add one
                        </button>
                      </p>
                    </div>
                  ) : (
                    <AdminTable>
                      <AdminThead>
                        <AdminTh>{t("name")}</AdminTh>
                        <AdminTh>{t("type")}</AdminTh>
                        <AdminTh>{t("teacher")}</AdminTh>
                        <AdminTh>{t("level")}</AdminTh>
                        <AdminTh>{t("age")}</AdminTh>
                        <AdminTh>{t("duration")}</AdminTh>
                        <AdminTh>{t("price")}</AdminTh>
                        <AdminTh>{t("status")}</AdminTh>
                        <AdminTh className="text-right">{t("actions")}</AdminTh>
                      </AdminThead>
                      <AdminTbody>
                        {cls.subClasses.map((sub) => (
                          <AdminTr key={sub.id}>
                            <AdminTd>
                              <span
                                className="font-medium"
                                style={{ color: adminColors.textPrimary }}
                              >
                                {sub.name}
                              </span>
                            </AdminTd>
                            <AdminTd>
                              <AdminBadge
                                variant={
                                  SESSION_TYPE_VARIANT[sub.sessionType] ??
                                  "default"
                                }
                              >
                                {SESSION_TYPE_LABELS[sub.sessionType] ??
                                  sub.sessionType}
                              </AdminBadge>
                            </AdminTd>
                            <AdminTd>
                              {sub.teachers && sub.teachers.length > 0 ? (
                                sub.teachers
                                  .map(
                                    (t: {
                                      teacher: {
                                        firstName: string;
                                        lastName: string;
                                      };
                                    }) =>
                                      `${t.teacher.firstName} ${t.teacher.lastName}`,
                                  )
                                  .join(", ")
                              ) : (
                                <span style={{ color: adminColors.textMuted }}>
                                  —
                                </span>
                              )}
                            </AdminTd>
                            <AdminTd>
                              {sub.level ?? (
                                <span style={{ color: adminColors.textMuted }}>
                                  —
                                </span>
                              )}
                            </AdminTd>
                            <AdminTd>
                              {sub.ageGroup ?? (
                                <span style={{ color: adminColors.textMuted }}>
                                  —
                                </span>
                              )}
                            </AdminTd>
                            <AdminTd>{sub.durationMinutes} min</AdminTd>
                            <AdminTd>
                              <span style={{ color: "#f59e0b" }}>
                                {Number(sub.price).toFixed(3)} OMR
                              </span>
                            </AdminTd>
                            <AdminTd>
                              <AdminBadge
                                variant={sub.isActive ? "success" : "default"}
                              >
                                {sub.isActive ? t("active") : "Inactive"}
                              </AdminBadge>
                            </AdminTd>
                            <AdminTd className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() =>
                                    setModal({
                                      type: "editSub",
                                      parentClass: cls,
                                      data: sub,
                                    })
                                  }
                                  className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                                  title="Edit sub-class"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    setModal({ type: "deleteSub", data: sub })
                                  }
                                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/8 transition-colors"
                                  title="Delete sub-class"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </AdminTd>
                          </AdminTr>
                        ))}
                      </AdminTbody>
                    </AdminTable>
                  )}
                </div>
              )}
            </AdminCard>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.type === "addClass" && (
        <ClassFormModal
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modal?.type === "editClass" && (
        <ClassFormModal
          editing={modal.data}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modal?.type === "deleteClass" && (
        <DeleteConfirmModal
          title={`Delete "${modal.data.name}"?`}
          description="This will permanently delete the class. All sub-classes must be removed first."
          onConfirm={() => handleDeleteClass(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "addSub" && (
        <SubClassFormModal
          parentClass={modal.data}
          teachers={teachers}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modal?.type === "editSub" && (
        <SubClassFormModal
          parentClass={modal.parentClass}
          teachers={teachers}
          editing={modal.data}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modal?.type === "deleteSub" && (
        <DeleteConfirmModal
          title={`Delete "${modal.data.name}"?`}
          description="This will permanently delete the sub-class. This cannot be undone."
          onConfirm={() => handleDeleteSubClass(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
