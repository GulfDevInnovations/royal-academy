"use client";

import { useState } from "react";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  BookOpen,
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
import DeleteConfirmModal from "./DeleteConfirmModal";
import { ToastContainer } from "@/components/admin/Toast";
import { useToast } from "../../hooks/useToast";

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
  MUSIC: "Music",
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
  const [classes, setClasses] = useState<SerializedClass[]>(initialClasses);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<Modal | null>(null);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // After any mutation, router.refresh() won't work here since we're client-only.
  // We trigger a full reload of the data via window.location.reload() for simplicity,
  // or you can use router.refresh() if you pass router in.
  const handleSuccess = () => {
    setModal(null);
    window.location.reload();
  };

  const findParentClass = (subClassId: string) =>
    classes.find((c) => c.subClasses.some((s) => s.id === subClassId));

  const { toasts, toast, remove } = useToast();

  const handleDeleteClass = async (id: string) => {
    const result = await deleteClass(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    }
    return result;
  };

  const handleDeleteSubClass = async (id: string) => {
    const result = await deleteSubClass(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    }
    return result;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AdminPageHeader
        title="Classes"
        subtitle="Manage class categories and their sub-classes"
        action={
          <AdminButton
            variant="primary"
            onClick={() => setModal({ type: "addClass" })}
          >
            <Plus size={14} />
            New Class
          </AdminButton>
        }
      />

      {classes.length === 0 ? (
        <AdminCard>
          <AdminEmptyState
            title="No classes yet"
            description="Create your first class category to get started."
            action={
              <AdminButton
                variant="primary"
                onClick={() => setModal({ type: "addClass" })}
              >
                <Plus size={14} />
                New Class
              </AdminButton>
            }
          />
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <AdminCard key={cls.id} noPadding>
              {/* ── Class Row ── */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
                onClick={() => toggleExpand(cls.id)}
              >
                {/* Expand toggle */}
                <span style={{ color: adminColors.textMuted }}>
                  {expanded[cls.id] ? (
                    <ChevronDown size={15} />
                  ) : (
                    <ChevronRight size={15} />
                  )}
                </span>

                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(245,158,11,0.1)" }}
                >
                  <BookOpen size={14} style={{ color: "#f59e0b" }} />
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: adminColors.textPrimary }}
                    >
                      {cls.name}
                    </span>
                    <AdminBadge variant={cls.isActive ? "success" : "default"}>
                      {cls.isActive ? "Active" : "Inactive"}
                    </AdminBadge>
                  </div>
                  {cls.description && (
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: adminColors.textMuted }}
                    >
                      {cls.description}
                    </p>
                  )}
                </div>

                {/* Sub-class count */}
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
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
                  className="flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AdminButton
                    size="sm"
                    variant="ghost"
                    onClick={() => setModal({ type: "addSub", data: cls })}
                  >
                    <Plus size={13} />
                    Sub-class
                  </AdminButton>
                  <button
                    onClick={() => setModal({ type: "editClass", data: cls })}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
                    title="Edit class"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => setModal({ type: "deleteClass", data: cls })}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
                    title="Delete class"
                  >
                    <Trash2 size={13} />
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
                        className="text-xs"
                        style={{ color: adminColors.textMuted }}
                      >
                        No sub-classes yet.{" "}
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
                        <AdminTh>Name</AdminTh>
                        <AdminTh>Type</AdminTh>
                        <AdminTh>Teacher</AdminTh>
                        <AdminTh>Level</AdminTh>
                        <AdminTh>Age</AdminTh>
                        <AdminTh>Duration</AdminTh>
                        <AdminTh>Price</AdminTh>
                        <AdminTh>Status</AdminTh>
                        <AdminTh className="text-right">Actions</AdminTh>
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
                              {sub.teacher ? (
                                `${sub.teacher.firstName} ${sub.teacher.lastName}`
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
                                {sub.isActive ? "Active" : "Inactive"}
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
                                  className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors"
                                  title="Edit sub-class"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={() =>
                                    setModal({ type: "deleteSub", data: sub })
                                  }
                                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
                                  title="Delete sub-class"
                                >
                                  <Trash2 size={13} />
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
