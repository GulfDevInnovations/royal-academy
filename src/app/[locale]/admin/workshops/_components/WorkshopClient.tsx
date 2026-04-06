"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  UserPlus,
  CalendarDays,
  Users,
  Wifi,
  WifiOff,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Clock,
} from "lucide-react";
import {
  deleteWorkshop,
  toggleWorkshopActive,
  getWorkshops,
} from "@/lib/actions/admin/Workshops.actions";
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
import WorkshopFormModal from "./WorkshopFormModal";
import WorkshopDetailDrawer from "./WorkshopDetailDrawer";
import EnrollModal from "./EnrollModal";
import DeleteConfirmModal from "../../../../../components/admin/DeleteConfirmModal";
import type { SerializedWorkshop } from "../page";

interface Props {
  initialWorkshops: SerializedWorkshop[];
  rooms: {
    id: string;
    name: string;
    capacity: number;
    location: string | null;
  }[];
  teachers: { id: string; firstName: string; lastName: string }[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function isUpcoming(eventDate: string) {
  return new Date(eventDate) >= new Date();
}

export default function WorkshopsClient({
  initialWorkshops,
  rooms,
  teachers,
}: Props) {
  const { toasts, toast, remove } = useToast();
  const [isPending, startTransition] = useTransition();

  const [workshops, setWorkshops] = useState(initialWorkshops);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [filterTime, setFilterTime] = useState<"all" | "upcoming" | "past">(
    "all",
  );

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<SerializedWorkshop | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SerializedWorkshop | null>(
    null,
  );
  const [drawerTarget, setDrawerTarget] = useState<SerializedWorkshop | null>(
    null,
  );

  const [showEnroll, setShowEnroll] = useState(false);

  const reloadWorkshops = useCallback(async () => {
    const fresh = await getWorkshops();
    setWorkshops(
      fresh.map((w) => ({
        ...w,
        price: Number(w.price),
        eventDate:
          w.eventDate instanceof Date
            ? w.eventDate.toISOString()
            : String(w.eventDate),
        createdAt:
          w.createdAt instanceof Date
            ? w.createdAt.toISOString()
            : String(w.createdAt),
        updatedAt:
          w.updatedAt instanceof Date
            ? w.updatedAt.toISOString()
            : String(w.updatedAt),
        bookings: w.bookings.map((b: any) => ({
          ...b,
          bookedAt:
            b.bookedAt instanceof Date
              ? b.bookedAt.toISOString()
              : String(b.bookedAt),
          createdAt:
            b.createdAt instanceof Date
              ? b.createdAt.toISOString()
              : String(b.createdAt),
          updatedAt:
            b.updatedAt instanceof Date
              ? b.updatedAt.toISOString()
              : String(b.updatedAt),
        })),
      })) as typeof initialWorkshops,
    );
  }, []);

  // ── Filters ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    return workshops.filter((w) => {
      if (filterStatus === "active" && !w.isActive) return false;
      if (filterStatus === "inactive" && w.isActive) return false;
      if (filterTime === "upcoming" && !isUpcoming(w.eventDate)) return false;
      if (filterTime === "past" && isUpcoming(w.eventDate)) return false;

      if (search) {
        const q = search.toLowerCase();
        const teacherName = w.teacher
          ? `${(w.teacher as any).firstName} ${(w.teacher as any).lastName}`.toLowerCase()
          : "";
        const roomName = w.room ? (w.room as any).name?.toLowerCase() : "";
        if (
          !w.title.toLowerCase().includes(q) &&
          !teacherName.includes(q) &&
          !roomName.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [workshops, search, filterStatus, filterTime]);

  // ── Stats ──────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: workshops.length,
      active: workshops.filter((w) => w.isActive).length,
      upcoming: workshops.filter((w) => isUpcoming(w.eventDate)).length,
      totalEnrolled: workshops.reduce((acc, w) => acc + w.enrolledCount, 0),
    }),
    [workshops],
  );

  // ── Handlers ──────────────────────────────────────────────
  const handleToggleActive = (w: SerializedWorkshop) => {
    startTransition(async () => {
      const result = await toggleWorkshopActive(w.id, !w.isActive);
      if (result.success) {
        setWorkshops((prev) =>
          prev.map((x) =>
            x.id === w.id ? { ...x, isActive: !w.isActive } : x,
          ),
        );
        toast(
          w.isActive ? "Workshop deactivated" : "Workshop activated",
          "success",
        );
      } else {
        toast(result.error ?? "Failed", "error");
      }
    });
  };

  const handleDelete = (w: SerializedWorkshop) => setDeleteTarget(w);

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteWorkshop(deleteTarget.id);
      if (result.success) {
        setWorkshops((prev) => prev.filter((x) => x.id !== deleteTarget.id));
        toast("Workshop deleted", "success");
        setDeleteTarget(null);
      } else {
        toast(result.error ?? "Delete failed", "error");
        setDeleteTarget(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* ── Header ── */}
      <AdminPageHeader
        title="Workshops"
        subtitle="Manage one-off workshops, enrollments and payments"
        action={
          <div className="flex items-center gap-2">
            <AdminButton variant="primary" onClick={() => setShowEnroll(true)}>
              <UserPlus size={14} />
              Enroll Student
            </AdminButton>
            <AdminButton variant="primary" onClick={() => setShowCreate(true)}>
              <Plus size={14} />
              New Workshop
            </AdminButton>
          </div>
        }
      />

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Workshops", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Upcoming", value: stats.upcoming },
          { label: "Total Enrolled", value: stats.totalEnrolled },
        ].map((s) => (
          <AdminCard key={s.label}>
            <p className="text-xs" style={{ color: adminColors.textMuted }}>
              {s.label}
            </p>
            <p
              className="text-2xl font-semibold mt-1"
              style={{ color: adminColors.textPrimary }}
            >
              {s.value}
            </p>
          </AdminCard>
        ))}
      </div>

      {/* ── Filters ── */}
      <AdminCard>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, teacher, room…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border bg-white/[0.03] text-sm focus:outline-none focus:border-amber-500/40 transition-colors"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                color: adminColors.textPrimary,
              }}
            />
          </div>

          {/* Status filter */}
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            {(["all", "active", "inactive"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setFilterStatus(v)}
                className="px-3 py-2 text-xs capitalize transition-colors"
                style={{
                  background:
                    filterStatus === v ? adminColors.accent : "transparent",
                  color:
                    filterStatus === v ? "#000" : adminColors.textSecondary,
                }}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Time filter */}
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            {(["all", "upcoming", "past"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setFilterTime(v)}
                className="px-3 py-2 text-xs capitalize transition-colors"
                style={{
                  background:
                    filterTime === v ? "rgba(245,158,11,0.15)" : "transparent",
                  color:
                    filterTime === v
                      ? adminColors.accent
                      : adminColors.textSecondary,
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </AdminCard>

      {/* ── Table ── */}
      <AdminCard noPadding>
        <AdminTable>
          <AdminThead>
            <AdminTh>Workshop</AdminTh>
            <AdminTh>Date & Time</AdminTh>
            <AdminTh>Teacher</AdminTh>
            <AdminTh>Room</AdminTh>
            <AdminTh>Seats</AdminTh>
            <AdminTh>Price</AdminTh>
            <AdminTh>Status</AdminTh>
            <AdminTh>Enrollments</AdminTh>
            <AdminTh className="text-right">Actions</AdminTh>
          </AdminThead>
          <AdminTbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <AdminEmptyState
                    title="No workshops found"
                    description={
                      search
                        ? "Try a different search term"
                        : "Create your first workshop to get started"
                    }
                    action={
                      !search ? (
                        <AdminButton
                          variant="primary"
                          size="sm"
                          onClick={() => setShowCreate(true)}
                        >
                          <Plus size={12} /> New Workshop
                        </AdminButton>
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            ) : (
              filtered.map((w) => {
                const teacher = w.teacher as any;
                const room = w.room as any;
                const upcoming = isUpcoming(w.eventDate);
                const seatsLeft = w.capacity - w.enrolledCount;
                const isFull = seatsLeft <= 0;

                return (
                  <AdminTr key={w.id}>
                    {/* Workshop title */}
                    <AdminTd>
                      <div className="flex items-center gap-2">
                        <div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: adminColors.textPrimary }}
                          >
                            {w.title}
                          </p>
                          {w.isOnline && (
                            <span
                              className="flex items-center gap-1 text-[10px] mt-0.5"
                              style={{ color: "#60a5fa" }}
                            >
                              <Wifi size={9} /> Online
                            </span>
                          )}
                        </div>
                      </div>
                    </AdminTd>

                    {/* Date & Time */}
                    <AdminTd>
                      <div className="space-y-0.5">
                        <p
                          className="text-xs flex items-center gap-1"
                          style={{ color: adminColors.textPrimary }}
                        >
                          <CalendarDays size={10} className="flex-shrink-0" />
                          {fmtDate(w.eventDate)}
                        </p>
                        <p
                          className="text-[11px] flex items-center gap-1"
                          style={{ color: adminColors.textMuted }}
                        >
                          <Clock size={10} className="flex-shrink-0" />
                          {fmtTime(w.startTime)} – {fmtTime(w.endTime)}
                        </p>
                      </div>
                    </AdminTd>

                    {/* Teacher */}
                    <AdminTd>
                      {teacher ? (
                        <p
                          className="text-xs"
                          style={{ color: adminColors.textSecondary }}
                        >
                          {teacher.firstName} {teacher.lastName}
                        </p>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: adminColors.textMuted }}
                        >
                          —
                        </span>
                      )}
                    </AdminTd>

                    {/* Room */}
                    <AdminTd>
                      {room ? (
                        <p
                          className="text-xs flex items-center gap-1"
                          style={{ color: adminColors.textSecondary }}
                        >
                          <MapPin size={10} />
                          {room.name}
                        </p>
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: adminColors.textMuted }}
                        >
                          —
                        </span>
                      )}
                    </AdminTd>

                    {/* Seats */}
                    <AdminTd>
                      <div className="space-y-1">
                        <p
                          className="text-xs"
                          style={{
                            color: isFull
                              ? "#f87171"
                              : adminColors.textSecondary,
                          }}
                        >
                          {w.enrolledCount}/{w.capacity}
                        </p>
                        <div
                          className="w-16 h-1 rounded-full overflow-hidden"
                          style={{ background: "rgba(255,255,255,0.06)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min((w.enrolledCount / w.capacity) * 100, 100)}%`,
                              background: isFull
                                ? "#f87171"
                                : adminColors.accent,
                            }}
                          />
                        </div>
                      </div>
                    </AdminTd>

                    {/* Price */}
                    <AdminTd>
                      <p
                        className="text-xs font-medium"
                        style={{ color: adminColors.accent }}
                      >
                        {w.currency} {w.price.toFixed(2)}
                      </p>
                    </AdminTd>

                    {/* Status */}
                    <AdminTd>
                      <div className="space-y-1">
                        <AdminBadge
                          variant={w.isActive ? "success" : "default"}
                        >
                          {w.isActive ? "Active" : "Inactive"}
                        </AdminBadge>
                        <AdminBadge variant={upcoming ? "info" : "default"}>
                          {upcoming ? "Upcoming" : "Past"}
                        </AdminBadge>
                      </div>
                    </AdminTd>

                    {/* Enrollments — dedicated column, prominent eye button */}
                    <AdminTd className="text-left">
                      <button
                        onClick={() => setDrawerTarget(w)}
                        title="View enrollments"
                        className="inline-flex items-left gap-1.5 px-3 py-1.5 rounded-lg transition-all group"
                        style={{
                          background: "rgba(245,158,11,0.08)",
                          border: "1px solid rgba(245,158,11,0.15)",
                          color: adminColors.accent,
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "rgba(245,158,11,0.16)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "rgba(245,158,11,0.35)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "rgba(245,158,11,0.08)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "rgba(245,158,11,0.15)";
                        }}
                      >
                        <Eye size={15} />
                        <span className="text-[11px] font-medium">
                          {w.enrolledCount}/{w.capacity}
                        </span>
                      </button>
                    </AdminTd>

                    {/* Actions — edit, toggle, delete */}
                    <AdminTd className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit — blue */}
                        <button
                          onClick={() => setEditTarget(w)}
                          title="Edit workshop"
                          className="p-1.5 rounded-lg transition-all"
                          style={{
                            color: "#60a5fa",
                            background: "rgba(96,165,250,0.08)",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = "rgba(96,165,250,0.16)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = "rgba(96,165,250,0.08)";
                          }}
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Toggle active — green / grey */}
                        <button
                          onClick={() => handleToggleActive(w)}
                          disabled={isPending}
                          title={w.isActive ? "Deactivate" : "Activate"}
                          className="p-1.5 rounded-lg transition-all disabled:opacity-40"
                          style={{
                            color: w.isActive
                              ? "#34d399"
                              : "rgba(255,255,255,0.25)",
                            background: w.isActive
                              ? "rgba(52,211,153,0.08)"
                              : "rgba(255,255,255,0.04)",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = w.isActive
                              ? "rgba(52,211,153,0.16)"
                              : "rgba(255,255,255,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = w.isActive
                              ? "rgba(52,211,153,0.08)"
                              : "rgba(255,255,255,0.04)";
                          }}
                        >
                          {w.isActive ? (
                            <ToggleRight size={15} />
                          ) : (
                            <ToggleLeft size={15} />
                          )}
                        </button>

                        {/* Delete — red */}
                        <button
                          onClick={() => handleDelete(w)}
                          title="Delete workshop"
                          className="p-1.5 rounded-lg transition-all"
                          style={{
                            color: "#f87171",
                            background: "rgba(248,113,113,0.08)",
                          }}
                          onMouseEnter={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = "rgba(248,113,113,0.16)";
                          }}
                          onMouseLeave={(e) => {
                            (
                              e.currentTarget as HTMLButtonElement
                            ).style.background = "rgba(248,113,113,0.08)";
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </AdminTd>
                  </AdminTr>
                );
              })
            )}
          </AdminTbody>
        </AdminTable>
      </AdminCard>

      {/* ── Modals ── */}
      {showCreate && (
        <WorkshopFormModal
          teachers={teachers}
          rooms={rooms}
          onClose={() => setShowCreate(false)}
          onSuccess={async () => {
            setShowCreate(false);
            await reloadWorkshops();
            toast("Workshop created", "success");
          }}
        />
      )}

      {editTarget && (
        <WorkshopFormModal
          workshop={editTarget}
          teachers={teachers}
          rooms={rooms}
          onClose={() => setEditTarget(null)}
          onSuccess={async () => {
            setEditTarget(null);
            await reloadWorkshops();
            toast("Workshop updated", "success");
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={`Delete "${deleteTarget.title}"?`}
          description="This will permanently delete the workshop. Workshops with confirmed enrollments cannot be deleted."
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {showEnroll && (
        <EnrollModal
          onClose={() => setShowEnroll(false)}
          onSuccess={async () => {
            setShowEnroll(false);
            await reloadWorkshops();
            toast("Student enrolled successfully", "success");
          }}
        />
      )}

      {drawerTarget && (
        <WorkshopDetailDrawer
          workshop={drawerTarget}
          teachers={teachers}
          rooms={rooms}
          onClose={() => setDrawerTarget(null)}
          onRefresh={async () => {
            await reloadWorkshops();
            setDrawerTarget((prev: SerializedWorkshop | null) =>
              prev ? { ...prev } : null,
            );
          }}
        />
      )}
    </div>
  );
}
