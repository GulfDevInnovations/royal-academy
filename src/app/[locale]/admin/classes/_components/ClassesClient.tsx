"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  BookOpen,
  Loader2,
  GraduationCap,
} from "lucide-react";
import type { SerializedClass, SerializedSubClass, SerializedProgram } from "../page";
import {
  deleteClass,
  deleteSubClass,
  deleteProgram,
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
import ProgramFormModal from "./ProgramFormModal";
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
  | { type: "deleteSub"; data: SerializedSubClass }
  | { type: "addProgram"; parentSub: SerializedSubClass }
  | { type: "editProgram"; parentSub: SerializedSubClass; data: SerializedProgram }
  | { type: "deleteProgram"; data: SerializedProgram };

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
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<Modal | null>(null);
  const t = useTranslations("admin");

  const toggleExpand = (id: string) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const toggleExpandSub = (id: string) =>
    setExpandedSubs((prev) => ({ ...prev, [id]: !prev[id] }));

  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();

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
      handleSuccess();
    }
    return result;
  };

  const handleDeleteSubClass = async (id: string) => {
    const result = await deleteSubClass(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else {
      handleSuccess();
    }
    return result;
  };

  const handleDeleteProgram = async (id: string) => {
    const result = await deleteProgram(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else {
      handleSuccess();
    }
    return result;
  };

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
        subtitle="Manage class categories, sub-classes, and programs"
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
                <span style={{ color: adminColors.textMuted }}>
                  {expanded[cls.id] ? (
                    <ChevronDown size={19} />
                  ) : (
                    <ChevronRight size={19} />
                  )}
                </span>

                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(245,158,11,0.1)" }}
                >
                  <BookOpen size={18} style={{ color: "#f59e0b" }} />
                </div>

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

                <span
                  className="text-l px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(0,0,0,0.05)",
                    color: adminColors.textSecondary,
                  }}
                >
                  {cls.subClasses.length} sub-class
                  {cls.subClasses.length !== 1 ? "es" : ""}
                </span>

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
                    className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-black/5 transition-colors"
                    title="Edit class"
                  >
                    <Pencil size={20} />
                  </button>
                  <button
                    onClick={() => setModal({ type: "deleteClass", data: cls })}
                    className="p-1.5 rounded-lg text-red-800 hover:text-red-500 hover:bg-black/5 transition-colors"
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
                      <p className="text-l" style={{ color: adminColors.textMuted }}>
                        {t("noSubClasses")}{" "}
                        <button
                          className="underline"
                          style={{ color: "#f59e0b" }}
                          onClick={() => setModal({ type: "addSub", data: cls })}
                        >
                          Add one
                        </button>
                      </p>
                    </div>
                  ) : (
                    <AdminTable>
                      <AdminThead>
                        <AdminTh> </AdminTh>
                        <AdminTh>{t("name")}</AdminTh>
                        <AdminTh>{t("type")}</AdminTh>
                        <AdminTh>{t("teacher")}</AdminTh>
                        <AdminTh>{t("level")}</AdminTh>
                        <AdminTh>{t("age")}</AdminTh>
                        <AdminTh>{t("duration")}</AdminTh>
                        <AdminTh>Per Session</AdminTh>
                        <AdminTh>{t("status")}</AdminTh>
                        <AdminTh className="text-right">{t("actions")}</AdminTh>
                      </AdminThead>
                      <AdminTbody>
                        {cls.subClasses.map((sub) => (
                          <Fragment key={sub.id}>
                            {/* SubClass row */}
                            <AdminTr>
                              {/* Expand toggle for programs */}
                              <AdminTd>
                                <button
                                  onClick={() => toggleExpandSub(sub.id)}
                                  className="p-1 rounded hover:bg-black/5 transition-colors"
                                  title={
                                    sub.programs.length > 0
                                      ? `${sub.programs.length} program${sub.programs.length !== 1 ? "s" : ""}`
                                      : "No programs"
                                  }
                                  style={{ color: adminColors.textMuted }}
                                >
                                  {expandedSubs[sub.id] ? (
                                    <ChevronDown size={15} />
                                  ) : (
                                    <ChevronRight size={15} />
                                  )}
                                </button>
                              </AdminTd>
                              <AdminTd>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="font-medium"
                                    style={{ color: adminColors.textPrimary }}
                                  >
                                    {sub.name}
                                  </span>
                                  {sub.programs.length > 0 && (
                                    <span
                                      className="text-[11px] px-1.5 py-0.5 rounded-full"
                                      style={{
                                        background: "rgba(99,102,241,0.15)",
                                        color: "#818cf8",
                                      }}
                                    >
                                      {sub.programs.length} program{sub.programs.length !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                </div>
                              </AdminTd>
                              <AdminTd>
                                <AdminBadge
                                  variant={
                                    SESSION_TYPE_VARIANT[sub.sessionType] ?? "default"
                                  }
                                >
                                  {SESSION_TYPE_LABELS[sub.sessionType] ?? sub.sessionType}
                                </AdminBadge>
                              </AdminTd>
                              <AdminTd>
                                {sub.teachers && sub.teachers.length > 0 ? (
                                  sub.teachers
                                    .map(
                                      (t: {
                                        teacher: { firstName: string; lastName: string };
                                      }) => `${t.teacher.firstName} ${t.teacher.lastName}`
                                    )
                                    .join(", ")
                                ) : (
                                  <span style={{ color: adminColors.textMuted }}>—</span>
                                )}
                              </AdminTd>
                              <AdminTd>
                                {sub.level ?? (
                                  <span style={{ color: adminColors.textMuted }}>—</span>
                                )}
                              </AdminTd>
                              <AdminTd>
                                {sub.ageGroup ?? (
                                  <span style={{ color: adminColors.textMuted }}>—</span>
                                )}
                              </AdminTd>
                              <AdminTd>{sub.durationMinutes} min</AdminTd>
                              <AdminTd>
                                <span style={{ color: sub.programs.length > 0 ? adminColors.textMuted : "#f59e0b" }}>
                                  {sub.programs.length > 0
                                    ? "see programs"
                                    : `${Number(sub.price).toFixed(3)} OMR`}
                                </span>
                              </AdminTd>
                              <AdminTd>
                                <AdminBadge variant={sub.isActive ? "success" : "default"}>
                                  {sub.isActive ? t("active") : "Inactive"}
                                </AdminBadge>
                              </AdminTd>
                              <AdminTd className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() =>
                                      setModal({ type: "addProgram", parentSub: sub })
                                    }
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium hover:bg-black/5 transition-colors"
                                    title="Add program"
                                    style={{ color: "#818cf8" }}
                                  >
                                    <GraduationCap size={13} />
                                    Add Program
                                  </button>
                                  <button
                                    onClick={() =>
                                      setModal({
                                        type: "editSub",
                                        parentClass: cls,
                                        data: sub,
                                      })
                                    }
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors"
                                    title="Edit sub-class"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setModal({ type: "deleteSub", data: sub })
                                    }
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/8 transition-colors"
                                    title="Delete sub-class"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </AdminTd>
                            </AdminTr>

                            {/* Programs expanded rows */}
                            {expandedSubs[sub.id] && (
                              <tr
                                style={{ background: "rgba(99,102,241,0.04)" }}
                              >
                                <td colSpan={10} className="px-0 py-0">
                                  {sub.programs.length === 0 ? (
                                    <div className="px-10 py-4 flex items-center gap-3">
                                      <p
                                        className="text-l"
                                        style={{ color: adminColors.textMuted }}
                                      >
                                        No programs yet.{" "}
                                        <button
                                          className="underline"
                                          style={{ color: "#818cf8" }}
                                          onClick={() =>
                                            setModal({ type: "addProgram", parentSub: sub })
                                          }
                                        >
                                          Add one
                                        </button>
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="px-8 py-3">
                                      <div
                                        className="rounded-xl overflow-hidden border"
                                        style={{ borderColor: "rgba(99,102,241,0.2)" }}
                                      >
                                        <table className="w-full text-l">
                                          <thead>
                                            <tr
                                              style={{
                                                background: "rgba(99,102,241,0.1)",
                                                color: "#818cf8",
                                              }}
                                            >
                                              <th className="text-left px-4 py-2 font-medium text-[11px] uppercase tracking-wider">
                                                Program
                                              </th>
                                              <th className="text-left px-4 py-2 font-medium text-[11px] uppercase tracking-wider">
                                                Type
                                              </th>
                                              <th className="text-left px-4 py-2 font-medium text-[11px] uppercase tracking-wider">
                                                Teacher
                                              </th>
                                              <th className="text-left px-4 py-2 font-medium text-[11px] uppercase tracking-wider">
                                                Level
                                              </th>
                                              <th className="text-left px-4 py-2 font-medium text-[11px] uppercase tracking-wider">
                                                Age
                                              </th>
                                              <th className="text-left px-4 py-2 font-medium text-[11px] uppercase tracking-wider">
                                                Duration
                                              </th>
                                              <th className="text-left px-4 py-2 font-medium text-[11px] uppercase tracking-wider">
                                                Price
                                              </th>
                                              <th className="text-left px-4 py-2 font-medium text-[11px] uppercase tracking-wider">
                                                Status
                                              </th>
                                              <th className="text-right px-4 py-2 font-medium text-[11px] uppercase tracking-wider">
                                                Actions
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {sub.programs.map((prog, idx) => (
                                              <tr
                                                key={prog.id}
                                                style={{
                                                  borderTop:
                                                    idx > 0
                                                      ? `1px solid rgba(99,102,241,0.12)`
                                                      : "none",
                                                }}
                                              >
                                                <td
                                                  className="px-4 py-2.5 font-medium"
                                                  style={{ color: adminColors.textPrimary }}
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <GraduationCap size={13} style={{ color: "#818cf8" }} />
                                                    {prog.name}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                  <AdminBadge
                                                    variant={
                                                      SESSION_TYPE_VARIANT[prog.sessionType] ?? "default"
                                                    }
                                                  >
                                                    {SESSION_TYPE_LABELS[prog.sessionType] ?? prog.sessionType}
                                                  </AdminBadge>
                                                </td>
                                                <td
                                                  className="px-4 py-2.5"
                                                  style={{ color: adminColors.textSecondary }}
                                                >
                                                  {prog.teachers && prog.teachers.length > 0
                                                    ? prog.teachers.map((pt) => `${pt.teacher.firstName} ${pt.teacher.lastName}`).join(", ")
                                                    : <span style={{ color: adminColors.textMuted }}>—</span>
                                                  }
                                                </td>
                                                <td
                                                  className="px-4 py-2.5"
                                                  style={{ color: adminColors.textSecondary }}
                                                >
                                                  {prog.level ?? "—"}
                                                </td>
                                                <td
                                                  className="px-4 py-2.5"
                                                  style={{ color: adminColors.textSecondary }}
                                                >
                                                  {prog.ageGroup ?? "—"}
                                                </td>
                                                <td
                                                  className="px-4 py-2.5"
                                                  style={{ color: adminColors.textSecondary }}
                                                >
                                                  {prog.durationMinutes} min
                                                </td>
                                                <td className="px-4 py-2.5">
                                                  <span style={{ color: "#f59e0b" }}>
                                                    {Number(prog.price).toFixed(3)} OMR
                                                  </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                  <AdminBadge
                                                    variant={prog.isActive ? "success" : "default"}
                                                  >
                                                    {prog.isActive ? "Active" : "Inactive"}
                                                  </AdminBadge>
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                  <div className="flex items-center justify-end gap-1">
                                                    <button
                                                      onClick={() =>
                                                        setModal({
                                                          type: "editProgram",
                                                          parentSub: sub,
                                                          data: prog,
                                                        })
                                                      }
                                                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-black/5 transition-colors"
                                                      title="Edit program"
                                                    >
                                                      <Pencil size={14} />
                                                    </button>
                                                    <button
                                                      onClick={() =>
                                                        setModal({ type: "deleteProgram", data: prog })
                                                      }
                                                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/8 transition-colors"
                                                      title="Delete program"
                                                    >
                                                      <Trash2 size={14} />
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                      <div className="mt-2 mb-1 flex justify-end">
                                        <button
                                          onClick={() =>
                                            setModal({ type: "addProgram", parentSub: sub })
                                          }
                                          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-colors hover:bg-indigo-500/10"
                                          style={{ color: "#818cf8" }}
                                        >
                                          <Plus size={12} />
                                          Add Program
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
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
        <ClassFormModal onClose={() => setModal(null)} onSuccess={handleSuccess} />
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

      {modal?.type === "addProgram" && (
        <ProgramFormModal
          parentSubClass={modal.parentSub}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modal?.type === "editProgram" && (
        <ProgramFormModal
          parentSubClass={modal.parentSub}
          editing={modal.data}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}

      {modal?.type === "deleteProgram" && (
        <DeleteConfirmModal
          title={`Delete "${modal.data.name}"?`}
          description="This will permanently delete the program. This cannot be undone."
          onConfirm={() => handleDeleteProgram(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
