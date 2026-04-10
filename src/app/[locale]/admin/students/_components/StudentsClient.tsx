"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Pencil,
  Eye,
  MessageSquare,
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  Download,
  UserCheck,
  UserX,
  X,
  Filter,
} from "lucide-react";
import * as XLSX from "xlsx";
import type { SerializedStudent } from "../page";
import { setStudentsActive } from "@/lib/actions/admin/students.actions";
import { ToastContainer } from "@/components/admin/Toast";
import { useToast } from "../../hooks/useToast";
import {
  AdminCard,
  AdminPageHeader,
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
import StudentEditModal from "./StudentEditModal";
import StudentViewModal from "./StudentViewModal";
import SmsModal from "./SmsModal";
import { useTranslations } from "next-intl";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey =
  | "name"
  | "email"
  | "phone"
  | "status"
  | "joinedAt"
  | "enrollments";
type SortDir = "asc" | "desc";

interface FilterState {
  search: string;
  classId: string;
  subClassId: string;
  dayOfWeek: string;
  status: string;
}

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

interface FilterOptions {
  classes: { id: string; name: string }[];
  subClasses: {
    id: string;
    name: string;
    classId: string;
    classSchedules: { dayOfWeek: string; startTime: string; endTime: string }[];
  }[];
}

interface Props {
  initialStudents: SerializedStudent[];
  filterOptions: FilterOptions;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentsClient({
  initialStudents,
  filterOptions,
}: Props) {
  const router = useRouter();
  const { toasts, toast, remove } = useToast();
  const [, startRefresh] = useTransition();
  const t = useTranslations("admin");

  // ── Modal state ──
  type Modal =
    | { type: "view"; student: SerializedStudent }
    | { type: "edit"; student: SerializedStudent }
    | { type: "sms"; students: SerializedStudent[] };
  const [modal, setModal] = useState<Modal | null>(null);

  // ── Filters ──
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    classId: "",
    subClassId: "",
    dayOfWeek: "",
    status: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  // ── Sorting ──
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // ── Selection ──
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const setFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "classId") next.subClassId = "";
      return next;
    });
    setSelected(new Set());
  };

  const filteredSubClasses = useMemo(
    () =>
      filters.classId
        ? filterOptions.subClasses.filter((s) => s.classId === filters.classId)
        : filterOptions.subClasses,
    [filters.classId, filterOptions.subClasses],
  );

  const displayedStudents = useMemo(() => {
    let list = [...initialStudents];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
          (s.user.phone ?? "").includes(q) ||
          s.user.email.toLowerCase().includes(q),
      );
    }

    if (filters.status === "active") list = list.filter((s) => s.user.isActive);
    if (filters.status === "inactive")
      list = list.filter((s) => !s.user.isActive);

    if (filters.classId) {
      list = list.filter((s) =>
        s.monthlyEnrollments.some(
          (e) =>
            filterOptions.classes.find((c) => c.id === filters.classId)
              ?.name === e.subClass.class.name,
        ),
      );
    }

    if (filters.subClassId) {
      list = list.filter((s) =>
        s.monthlyEnrollments.some((e) => e.subClassId === filters.subClassId),
      );
    }

    if (filters.dayOfWeek) {
      list = list.filter((s) =>
        s.monthlyEnrollments.some((e) =>
          e.subClass.classSchedules.some(
            (sc) => sc.dayOfWeek === filters.dayOfWeek,
          ),
        ),
      );
    }

    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") {
        av = `${a.firstName} ${a.lastName}`.toLowerCase();
        bv = `${b.firstName} ${b.lastName}`.toLowerCase();
      }
      if (sortKey === "email") {
        av = a.user.email;
        bv = b.user.email;
      }
      if (sortKey === "phone") {
        av = a.user.phone ?? "";
        bv = b.user.phone ?? "";
      }
      if (sortKey === "status") {
        av = a.user.isActive ? 1 : 0;
        bv = b.user.isActive ? 1 : 0;
      }
      if (sortKey === "joinedAt") {
        av = a.user.createdAt;
        bv = b.user.createdAt;
      }
      if (sortKey === "enrollments") {
        av = a.monthlyEnrollments.length;
        bv = b.monthlyEnrollments.length;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [initialStudents, filters, sortKey, sortDir, filterOptions.classes]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? (
        <ChevronUp size={15} />
      ) : (
        <ChevronDown size={15} />
      )
    ) : (
      <ChevronUp size={15} className="opacity-20" />
    );

  const allSelected =
    displayedStudents.length > 0 &&
    displayedStudents.every((s) => selected.has(s.id));
  const someSelected = selected.size > 0;
  const selectedStudents = initialStudents.filter((s) => selected.has(s.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(displayedStudents.map((s) => s.id)));
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSuccess = useCallback(() => {
    setModal(null);
    setSelected(new Set());
    startRefresh(() => {
      router.refresh();
    });
  }, [router]);

  // ── Bulk activate/deactivate — fixed: result always has error field now ──
  const handleBulkStatus = async (isActive: boolean) => {
    const result = await setStudentsActive([...selected], isActive);
    if (result.error) {
      toast(result.error, "error");
      return;
    }
    toast(
      `${selected.size} student${selected.size > 1 ? "s" : ""} ${isActive ? "activated" : "deactivated"}.`,
      "success",
    );
    handleSuccess();
  };

  const exportToExcel = (studentsToExport: SerializedStudent[]) => {
    const rows = studentsToExport.map((s) => ({
      "First Name": s.firstName,
      "Last Name": s.lastName,
      Email: s.user.email,
      Phone: s.user.phone ?? "",
      Gender: s.gender ?? "",
      "Date of Birth": s.dateOfBirth
        ? new Date(s.dateOfBirth).toLocaleDateString()
        : "",
      City: s.city ?? "",
      Address: s.address ?? "",
      "Emergency Contact": s.emergencyContactName ?? "",
      Status: s.user.isActive ? "Active" : "Inactive",
      Verified: s.user.isVerified ? "Yes" : "No",
      Joined: new Date(s.user.createdAt).toLocaleDateString(),
      Enrollments: s.monthlyEnrollments.map((e) => e.subClass.name).join(", "),
      Classes: [
        ...new Set(s.monthlyEnrollments.map((e) => e.subClass.class.name)),
      ].join(", "),
      Notes: s.notes ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    const colWidths = Object.keys(rows[0] ?? {}).map((k) => ({
      wch: Math.max(
        k.length,
        ...rows.map((r) => String(r[k as keyof typeof r] ?? "").length),
        10,
      ),
    }));
    ws["!cols"] = colWidths;

    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `students-${date}.xlsx`);
    toast("Excel file exported.", "success");
  };

  const activeFilterCount = [
    filters.classId,
    filters.subClassId,
    filters.dayOfWeek,
    filters.status !== "all" ? filters.status : "",
  ].filter(Boolean).length;

  return (
    <div className="space-y-4 max-w-8xl mx-auto">
      <AdminPageHeader
        title="Students"
        subtitle={`${initialStudents.length} students total`}
      />

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-55 max-w-sm">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: adminColors.textMuted }}
          />
          <input
            type="text"
            placeholder="Search by name, phone, email…"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xl rounded-lg border bg-yellow-100 text-yellow-950 placeholder:text-yellow-700 focus:outline-none focus:border-amber-500/50 transition-all"
            style={{ borderColor: adminColors.border }}
          />
        </div>

        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xl border transition-colors"
          style={{
            borderColor:
              activeFilterCount > 0
                ? "rgba(245,158,11,0.5)"
                : adminColors.border,
            color:
              activeFilterCount > 0 ? "#f59e0b" : adminColors.textSecondary,
            background:
              activeFilterCount > 0
                ? "rgba(245,158,11,0.06)"
                : "rgba(255,255,255,0.03)",
          }}
        >
          <span className="flex items-center gap-1 text-amber-200">
            <Filter size={16} />
            Filters
          </span>
          {activeFilterCount > 0 && (
            <span
              className="w-4 h-4 rounded-full text-[16px] font-bold flex items-center justify-center"
              style={{ background: "#f59e0b", color: "#000" }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          onClick={() => exportToExcel(displayedStudents)}
          className="gap-1 flex items-center justify-center px-5 py-2 rounded-xl border cursor-pointer hover:bg-white/5 transition-colors"
          style={{ color: adminColors.blueText }}
        >
          <Download size={16} />
          Export{" "}
          {displayedStudents.length !== initialStudents.length
            ? "filtered"
            : "all"}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <AdminCard className="!p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label
                className="text-l font-medium"
                style={{ color: adminColors.textSecondary }}
              >
                Class
              </label>
              <select
                value={filters.classId}
                onChange={(e) => setFilter("classId", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xl border bg-white/[0.04] text-white/70 focus:outline-none focus:border-amber-500/50"
                style={{ borderColor: adminColors.border }}
              >
                <option className="text-black" value="">
                  All classes
                </option>
                {filterOptions.classes.map((c) => (
                  <option className="text-black" key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-l font-medium"
                style={{ color: adminColors.textSecondary }}
              >
                Sub-class
              </label>
              <select
                value={filters.subClassId}
                onChange={(e) => setFilter("subClassId", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xl border bg-white/[0.04] text-white/70 focus:outline-none focus:border-amber-500/50"
                style={{ borderColor: adminColors.border }}
              >
                <option className="text-black" value="">
                  All sub-classes
                </option>
                {filteredSubClasses.map((s) => (
                  <option className="text-black" key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-l font-medium"
                style={{ color: adminColors.textSecondary }}
              >
                {t("dayOfWeek")}
              </label>
              <select
                value={filters.dayOfWeek}
                onChange={(e) => setFilter("dayOfWeek", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xl border bg-white/[0.04] text-white/70 focus:outline-none focus:border-amber-500/50"
                style={{ borderColor: adminColors.border }}
              >
                <option className="text-black" value="">
                  {t("anyDay")}
                </option>
                {DAYS.map((d) => (
                  <option className="text-black" key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-l font-medium"
                style={{ color: adminColors.textSecondary }}
              >
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilter("status", e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-xl border bg-white/[0.04] text-white/70 focus:outline-none focus:border-amber-500/50"
                style={{ borderColor: adminColors.border }}
              >
                <option className="text-black" value="all">
                  All
                </option>
                <option className="text-black" value="active">
                  Active
                </option>
                <option className="text-black" value="inactive">
                  Inactive
                </option>
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() =>
                setFilters({
                  search: "",
                  classId: "",
                  subClassId: "",
                  dayOfWeek: "",
                  status: "all",
                })
              }
              className="mt-3 flex items-center gap-1.5 text-l transition-colors"
              style={{ color: adminColors.redText }}
            >
              <X size={16} /> {t("clearAllFilters")}
            </button>
          )}
        </AdminCard>
      )}

      {/* Bulk action bar */}
      {someSelected && (
        <div
          className="sticky top-4 z-30 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl"
          style={{ background: "#1e2130", borderColor: "rgba(245,158,11,0.3)" }}
        >
          <span className="text-xl font-semibold" style={{ color: "#f59e0b" }}>
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={() =>
              setModal({ type: "sms", students: selectedStudents })
            }
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
            onClick={() => handleBulkStatus(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-l font-medium border transition-colors"
            style={{
              borderColor: "rgba(52,211,153,0.3)",
              color: "#34d399",
              background: "rgba(52,211,153,0.08)",
            }}
          >
            <UserCheck size={16} /> {t("activate")}
          </button>
          <button
            onClick={() => handleBulkStatus(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-l font-medium border transition-colors"
            style={{
              borderColor: "rgba(248,113,113,0.3)",
              color: "#f87171",
              background: "rgba(248,113,113,0.08)",
            }}
          >
            <UserX size={16} /> {t("deactivate")}
          </button>
          <button
            onClick={() => exportToExcel(selectedStudents)}
            className="gap-1 flex items-center justify-center px-5 py-1.5 rounded-xl border cursor-pointer hover:bg-white/5 transition-colors"
            style={{ color: adminColors.blueText }}
          >
            <Download size={16} /> {t("exportSelected")}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: adminColors.pinkText }}
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Table */}
      <AdminCard noPadding>
        {displayedStudents.length === 0 ? (
          <AdminEmptyState
            title={t("noStudentsFound")}
            description="Try adjusting your search or filters."
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
                    <CheckSquare size={15} />
                  ) : (
                    <Square size={15} />
                  )}
                </button>
              </AdminTh>
              <AdminTh>
                <button
                  onClick={() => toggleSort("name")}
                  className="flex items-center gap-1 hover:text-white/70 transition-colors"
                >
                  {t("student")} <SortIcon k="name" />
                </button>
              </AdminTh>
              <AdminTh>
                <button
                  onClick={() => toggleSort("phone")}
                  className="flex items-center gap-1 hover:text-white/70 transition-colors"
                >
                  Phone <SortIcon k="phone" />
                </button>
              </AdminTh>
              <AdminTh>Enrollments</AdminTh>
              <AdminTh>{t("schedule")}</AdminTh>
              <AdminTh>
                <button
                  onClick={() => toggleSort("status")}
                  className="flex items-center gap-1 hover:text-white/70 transition-colors"
                >
                  Status <SortIcon k="status" />
                </button>
              </AdminTh>
              <AdminTh>
                <button
                  onClick={() => toggleSort("joinedAt")}
                  className="flex items-center gap-1 hover:text-white/70 transition-colors"
                >
                  {t("joined")} <SortIcon k="joinedAt" />
                </button>
              </AdminTh>
              <AdminTh className="text-right">Actions</AdminTh>
            </AdminThead>
            <AdminTbody>
              {displayedStudents.map((student) => {
                const isSelected = selected.has(student.id);
                return (
                  <AdminTr key={student.id}>
                    <AdminTd>
                      <button
                        onClick={() => toggleOne(student.id)}
                        className="transition-colors"
                        style={{
                          color: isSelected
                            ? "#f59e0b"
                            : "rgba(255,255,255,0.25)",
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare size={18} />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </AdminTd>

                    <AdminTd>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[16px] font-bold flex-shrink-0"
                          style={{
                            background: "rgba(96,165,250,0.12)",
                            color: "#60a5fa",
                          }}
                        >
                          {student.firstName.charAt(0)}
                          {student.lastName.charAt(0)}
                        </div>
                        <div>
                          <p
                            className="text-xl font-medium"
                            style={{ color: adminColors.textPrimary }}
                          >
                            {student.firstName} {student.lastName}
                          </p>
                          <p
                            className="text-l"
                            style={{ color: adminColors.textMuted }}
                          >
                            {student.user.email}
                          </p>
                        </div>
                      </div>
                    </AdminTd>

                    <AdminTd>
                      {student.user.phone ? (
                        <span style={{ color: adminColors.textSecondary }}>
                          {student.user.phone}
                        </span>
                      ) : (
                        <span style={{ color: adminColors.textMuted }}>—</span>
                      )}
                    </AdminTd>

                    <AdminTd>
                      {student.monthlyEnrollments.length === 0 ? (
                        <span style={{ color: adminColors.textMuted }}>
                          None
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {student.monthlyEnrollments.slice(0, 2).map((e) => (
                            <AdminBadge key={e.id} variant="info">
                              {e.subClass.name}
                            </AdminBadge>
                          ))}
                          {student.monthlyEnrollments.length > 2 && (
                            <AdminBadge variant="default">
                              +{student.monthlyEnrollments.length - 2}
                            </AdminBadge>
                          )}
                        </div>
                      )}
                    </AdminTd>

                    <AdminTd>
                      <div className="flex flex-wrap gap-1">
                        {[
                          ...new Set(
                            student.monthlyEnrollments.flatMap((e) =>
                              e.subClass.classSchedules.map((sc) =>
                                sc.dayOfWeek.slice(0, 3),
                              ),
                            ),
                          ),
                        ].map((day) => (
                          <span
                            key={day}
                            className="text-[15px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              background: "rgba(245,158,11,0.1)",
                              color: "#f59e0b",
                            }}
                          >
                            {day}
                          </span>
                        ))}
                        {student.monthlyEnrollments.length === 0 && (
                          <span style={{ color: adminColors.textMuted }}>
                            —
                          </span>
                        )}
                      </div>
                    </AdminTd>

                    <AdminTd>
                      <AdminBadge
                        variant={student.user.isActive ? "success" : "default"}
                      >
                        {student.user.isActive ? "Active" : "Inactive"}
                      </AdminBadge>
                    </AdminTd>

                    <AdminTd>
                      <span style={{ color: adminColors.textMuted }}>
                        {new Date(student.user.createdAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </AdminTd>

                    {/* Actions — View + SMS + Edit */}
                    <AdminTd className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal({ type: "view", student })}
                          className="p-1.5 rounded-lg transition-colors text-purple-400 hover:text-purple-300 hover:bg-purple-500/[0.08]"
                          title="View details"
                        >
                          <Eye size={20} />
                        </button>
                        <button
                          onClick={() =>
                            setModal({ type: "sms", students: [student] })
                          }
                          className="p-1.5 rounded-lg transition-colors text-blue-400 hover:text-blue-300 hover:bg-blue-500/[0.08]"
                          title="Send SMS"
                        >
                          <MessageSquare size={20} />
                        </button>
                        <button
                          onClick={() => setModal({ type: "edit", student })}
                          className="p-1.5 rounded-lg transition-colors text-amber-400 hover:text-amber-300 hover:bg-amber-500/[0.08]"
                          title="Edit student"
                        >
                          <Pencil size={20} />
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

      {displayedStudents.length !== initialStudents.length && (
        <p
          className="text-l text-center"
          style={{ color: adminColors.textMuted }}
        >
          {t("showing")} {displayedStudents.length} of {initialStudents.length}{" "}
          students
        </p>
      )}

      {/* Modals */}
      {modal?.type === "view" && (
        <StudentViewModal
          student={modal.student}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "edit" && (
        <StudentEditModal
          student={modal.student}
          onClose={() => setModal(null)}
          onSuccess={handleSuccess}
        />
      )}
      {modal?.type === "sms" && (
        <SmsModal
          students={modal.students}
          onClose={() => setModal(null)}
          onSuccess={(count) => {
            setModal(null);
            toast(
              `SMS queued for ${count} student${count !== 1 ? "s" : ""}.`,
              "success",
            );
          }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}
