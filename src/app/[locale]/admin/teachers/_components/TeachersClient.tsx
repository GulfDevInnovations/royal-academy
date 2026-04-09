"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  CheckCircle2,
  XCircle,
  MessageSquare,
  CheckSquare,
  Square,
  Download,
  X,
  UserCheck,
  UserX,
} from "lucide-react";
import type { SerializedTeacher, ClassWithSubsForAssignment } from "../page";
import {
  deleteTeacher,
  sendSmsToTeachers,
} from "@/lib/actions/admin/teachers.actions";
import { ToastContainer } from "@/components/admin/Toast";
import { useToast } from "../../hooks/useToast";
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
import TeacherFormModal from "./TeacherFormModal";
import DeleteConfirmModal from "../../../../../components/admin/DeleteConfirmModal";
import SmsModal, {
  type SmsRecipient,
} from "../../students/_components/SmsModal";
import { useTranslations } from "next-intl";
import { color } from "framer-motion";

type Modal =
  | { type: "add" }
  | { type: "edit"; data: SerializedTeacher }
  | { type: "delete"; data: SerializedTeacher }
  | { type: "sms"; ids: string[] };

interface Props {
  initialTeachers: SerializedTeacher[];
  allClasses: ClassWithSubsForAssignment[];
}

export default function TeachersClient({ initialTeachers, allClasses }: Props) {
  const router = useRouter();
  const { toasts, toast, remove } = useToast();
  const [, startRefresh] = useTransition();
  const [modal, setModal] = useState<Modal | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const t = useTranslations("admin");

  // ── Helpers ──
  const handleSuccess = () => {
    setModal(null);
    setSelected(new Set());
    startRefresh(() => {
      router.refresh();
    });
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTeacher(id);
    if (result.error) {
      setModal(null);
      toast(result.error, "error");
    } else handleSuccess();
    return result;
  };

  // ── Selection ──
  const allSelected =
    initialTeachers.length > 0 &&
    initialTeachers.every((t) => selected.has(t.id));
  const someSelected = selected.size > 0;
  const toggleAll = () =>
    allSelected
      ? setSelected(new Set())
      : setSelected(new Set(initialTeachers.map((t) => t.id)));
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const selectedTeachers = initialTeachers.filter((t) => selected.has(t.id));

  // ── Excel export ──
  const exportToExcel = (teachers: SerializedTeacher[]) => {
    const rows = teachers.map((t) => ({
      "First Name": t.firstName,
      "Last Name": t.lastName,
      Email: t.user?.email ?? "",
      Phone: t.user?.phone ?? "",
      Specialties: t.specialties.join(", "),
      "Sub-classes": t.subClasses.map((s) => s.name).join(", "),
      Availability: t.isAvailable ? "Available" : "Unavailable",
      Status: t.isActive ? "Active" : "Inactive",
      Bio: t.bio ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");

    const colWidths = Object.keys(rows[0] ?? {}).map((k) => ({
      wch: Math.max(
        k.length,
        ...rows.map((r) => String(r[k as keyof typeof r] ?? "").length),
        10,
      ),
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(
      wb,
      `teachers-${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast("Excel file exported.", "success");
  };

  return (
    <div className="space-y-4 max-w-8xl mx-auto">
      <AdminPageHeader
        title="Teachers"
        subtitle={`${initialTeachers.length} teacher${initialTeachers.length !== 1 ? "s" : ""}`}
        action={
          <div className="flex items-center gap-2">
            <button
              className="gap-1 flex items-center justify-center px-5 py-2 rounded-xl border cursor-pointer hover:bg-white/5 transition-colors"
              style={{ color: adminColors.blueText }}
              onClick={() => exportToExcel(initialTeachers)}
            >
              <Download size={18} /> {t("export")}
            </button>
            <AdminButton
              variant="primary"
              onClick={() => setModal({ type: "add" })}
            >
              <Plus size={18} /> {t("newTeacher")}
            </AdminButton>
          </div>
        }
      />

      {/* ── Bulk action bar ── */}
      {someSelected && (
        <div
          className="flex items-center gap-3 px-5 py-3 rounded-xl border shadow-xl"
          style={{ background: "#1e2130", borderColor: "rgba(245,158,11,0.3)" }}
        >
          <span className="text-xl font-semibold" style={{ color: "#f59e0b" }}>
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={() => setModal({ type: "sms", ids: [...selected] })}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-l font-medium border transition-colors"
            style={{
              borderColor: "rgba(96,165,250,0.3)",
              color: "#60a5fa",
              background: "rgba(96,165,250,0.08)",
            }}
          >
            <MessageSquare size={16} /> Send SMS
          </button>
          <button
            onClick={() => exportToExcel(selectedTeachers)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-l font-medium border transition-colors"
            style={{
              borderColor: adminColors.border,
              color: adminColors.textSecondary,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <Download size={16} /> {t("exportSelected")}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: adminColors.textMuted }}
          >
            <X size={16} style={{ color: adminColors.pinkText }} />
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <AdminCard noPadding>
        {initialTeachers.length === 0 ? (
          <AdminEmptyState
            title="No teachers yet"
            description="Add your first teacher to start assigning classes."
            action={
              <AdminButton
                variant="primary"
                onClick={() => setModal({ type: "add" })}
              >
                <Plus size={16} /> {t("newTeacher")}
              </AdminButton>
            }
          />
        ) : (
          <AdminTable>
            <AdminThead>
              <AdminTh>
                <button
                  onClick={toggleAll}
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare size={19} />
                  ) : (
                    <Square size={19} />
                  )}
                </button>
              </AdminTh>
              <AdminTh>{t("teacher")}</AdminTh>
              <AdminTh>{t("subClass")}</AdminTh>
              <AdminTh>{t("schedule")}</AdminTh>
              <AdminTh>{t("availability")}</AdminTh>
              <AdminTh>{t("status")}</AdminTh>
              <AdminTh className="text-right">{t("actions")}</AdminTh>
            </AdminThead>
            <AdminTbody>
              {initialTeachers.map((teacher) => {
                const isSelected = selected.has(teacher.id);
                return (
                  <AdminTr key={teacher.id}>
                    {/* Checkbox */}
                    <AdminTd>
                      <button
                        onClick={() => toggleOne(teacher.id)}
                        className="transition-colors"
                        style={{
                          color: isSelected
                            ? "#f59e0b"
                            : "rgba(255,255,255,0.25)",
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare size={19} />
                        ) : (
                          <Square size={19} />
                        )}
                      </button>
                    </AdminTd>

                    {/* Name + photo */}
                    <AdminTd>
                      <div className="flex items-center gap-3">
                        {teacher.photoUrl ? (
                          <img
                            src={teacher.photoUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{
                              background: "rgba(245,158,11,0.15)",
                              color: "#f59e0b",
                            }}
                          >
                            {teacher.firstName.charAt(0)}
                            {teacher.lastName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p
                            className="text-xl font-medium"
                            style={{ color: adminColors.textPrimary }}
                          >
                            {teacher.firstName} {teacher.lastName}
                          </p>
                          <p
                            className="text-l"
                            style={{ color: adminColors.textMuted }}
                          >
                            {teacher.user?.phone ? (
                              teacher.user?.phone
                            ) : (
                              <span style={{ color: "rgba(248,113,113,0.6)" }}>
                                {t("noPhone")}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </AdminTd>

                    {/* Sub-classes */}
                    <AdminTd>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subClasses.length > 0 ? (
                          teacher.subClasses.map((s) => (
                            <AdminBadge key={s.id} variant="warning">
                              {s.name}
                            </AdminBadge>
                          ))
                        ) : (
                          <span style={{ color: adminColors.textMuted }}>
                            —
                          </span>
                        )}
                      </div>
                    </AdminTd>

                    {/* Schedule count */}
                    <AdminTd>
                      <span style={{ color: adminColors.textSecondary }}>
                        {teacher._count.classSchedules}
                      </span>
                    </AdminTd>

                    {/* Availability */}
                    <AdminTd>
                      {teacher.isAvailable ? (
                        <span
                          className="flex items-center gap-1.5 text-l"
                          style={{ color: "#34d399" }}
                        >
                          <CheckCircle2 size={19} /> {t("available")}
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1.5 text-l"
                          style={{ color: "#f87171" }}
                        >
                          <XCircle size={19} /> {t("unavailable")}
                        </span>
                      )}
                    </AdminTd>

                    {/* Status */}
                    <AdminTd>
                      <AdminBadge
                        variant={teacher.isActive ? "success" : "default"}
                      >
                        {teacher.isActive ? t("active") : "Inactive"}
                      </AdminBadge>
                    </AdminTd>

                    {/* Actions */}
                    <AdminTd className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            setModal({ type: "sms", ids: [teacher.id] })
                          }
                          className="p-1.5 rounded-lg transition-colors text-purple-600 hover:text-purple-400 hover:bg-blue-500/[0.08]"
                          title="Send SMS"
                        >
                          <MessageSquare size={20} />
                        </button>
                        <button
                          onClick={() =>
                            setModal({ type: "edit", data: teacher })
                          }
                          className="p-1.5 rounded-lg transition-colors text-blue-400 hover:text-blue-600 hover:bg-white/5"
                          title="Edit"
                        >
                          <Pencil size={20} />
                        </button>
                        <button
                          onClick={() =>
                            setModal({ type: "delete", data: teacher })
                          }
                          className="p-1.5 rounded-lg transition-colors text-red-800 hover:text-red-500 hover:bg-white/5"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </AdminTd>
                  </AdminTr>
                );
              })}
            </AdminTbody>
          </AdminTable>
        )}
      </AdminCard>

      {/* ── Modals ── */}
      {modal?.type === "add" && (
        <TeacherFormModal
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
          allClasses={allClasses}
        />
      )}
      {modal?.type === "edit" && (
        <TeacherFormModal
          editing={modal.data}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
          allClasses={allClasses}
        />
      )}
      {modal?.type === "delete" && (
        <DeleteConfirmModal
          title={`Delete ${modal.data.firstName} ${modal.data.lastName}?`}
          description="This permanently deletes the teacher account. Sub-classes will be unassigned."
          onConfirm={() => handleDelete(modal.data.id)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "sms" && (
        <SmsModal
          students={initialTeachers
            .filter((t) => modal.ids.includes(t.id))
            .map(
              (t): SmsRecipient => ({
                id: t.id,
                firstName: t.firstName,
                lastName: t.lastName,
                user: { phone: t.user?.phone ?? null },
              }),
            )}
          onClose={() => setModal(null)}
          onSuccess={(count) => {
            setModal(null);
            toast(
              `SMS queued for ${count} teacher${count !== 1 ? "s" : ""}.`,
              "success",
            );
          }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
