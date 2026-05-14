"use client";

import { useState, useTransition, useEffect } from "react";
import {
  X,
  Users,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  UserPlus,
  CheckCircle2,
  XCircle,
  Wifi,
} from "lucide-react";
import {
  getWorkshopById,
  cancelWorkshopBooking,
} from "@/lib/actions/admin/Workshops.actions";
import { adminColors, AdminButton, AdminBadge } from "@/components/admin/ui";
import type { SerializedWorkshop } from "../page";
import EnrollStudentModal from "./EnrollStudentModal";
import { useTranslations } from "next-intl";

interface Props {
  workshop: SerializedWorkshop;
  teachers: { id: string; firstName: string; lastName: string }[];
  rooms: {
    id: string;
    name: string;
    capacity: number;
    location: string | null;
  }[];
  onClose: () => void;
  onRefresh: () => void;
}

type DetailedBooking = {
  id: string;
  status: string;
  bookedAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    user: { email: string; phone: string | null };
  };
  payment: {
    id: string;
    amount: number;
    status: string;
    method: string | null;
    paidAt: string | null;
    currency: string;
  } | null;
};

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

const statusBadge: Record<
  string,
  "success" | "danger" | "warning" | "default"
> = {
  CONFIRMED: "success",
  CANCELLED: "danger",
  COMPLETED: "info" as any,
  NO_SHOW: "warning",
  RESCHEDULED: "warning",
};

export default function WorkshopDetailDrawer({
  workshop,
  teachers,
  rooms,
  onClose,
  onRefresh,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [bookings, setBookings] = useState<DetailedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const t = useTranslations("admin");

  const loadBookings = () => {
    setLoading(true);
    getWorkshopById(workshop.id).then((data) => {
      if (data) setBookings(data.bookings as DetailedBooking[]);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadBookings();
  }, [workshop.id]);

  const handleCancel = (bookingId: string) => {
    startTransition(async () => {
      await cancelWorkshopBooking(bookingId);
      setCancellingId(null);
      loadBookings();
      onRefresh();
    });
  };

  const confirmedCount = bookings.filter(
    (b) => b.status === "CONFIRMED",
  ).length;
  const seatsLeft = workshop.capacity - confirmedCount;

  return (
    <>
      <div className="fixed inset-0 z-40 flex">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer */}
        <div
          className="relative ml-auto w-full max-w-lg h-full flex flex-col shadow-2xl"
          style={{
            background: "#1a1d27",
            borderLeft: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-start justify-between px-6 py-5 border-b flex-shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <h2
                  className="text-sm font-semibold"
                  style={{ color: adminColors.textPrimary }}
                >
                  {workshop.title}
                </h2>
                {workshop.isOnline && (
                  <span
                    className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(96,165,250,0.1)",
                      color: "#60a5fa",
                    }}
                  >
                    <Wifi size={9} /> Online
                  </span>
                )}
                {!workshop.isActive && (
                  <AdminBadge variant="warning">Inactive</AdminBadge>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap gap-3 mt-2">
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: adminColors.textMuted }}
                >
                  <Calendar size={11} />
                  {fmtDate(workshop.eventDate)}
                </span>
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: adminColors.textMuted }}
                >
                  <Clock size={11} />
                  {fmtTime(workshop.startTime)} – {fmtTime(workshop.endTime)}
                </span>
                {workshop.room && (
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: adminColors.textMuted }}
                  >
                    <MapPin size={11} />
                    {(workshop.room as any).name}
                  </span>
                )}
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: adminColors.textMuted }}
                >
                  <Users size={11} />
                  {confirmedCount}/{workshop.capacity} enrolled
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={16} style={{ color: adminColors.pinkText }} />
            </button>
          </div>

          {/* Seat progress bar */}
          <div
            className="px-6 py-3 border-b flex-shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <div className="flex justify-between text-xs mb-1.5">
              <span style={{ color: adminColors.textSecondary }}>
                {t("capacity")}
              </span>
              <span
                style={{
                  color:
                    seatsLeft === 0 ? "#f87171" : adminColors.textSecondary,
                }}
              >
                {seatsLeft} {t("seat")}
                {seatsLeft !== 1 ? "s" : ""} {t("remaining")}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((confirmedCount / workshop.capacity) * 100, 100)}%`,
                  background: seatsLeft === 0 ? "#f87171" : adminColors.accent,
                }}
              />
            </div>
          </div>

          {/* Price */}
          <div
            className="px-6 py-3 border-b flex items-center justify-between flex-shrink-0"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            <span
              className="text-xs"
              style={{ color: adminColors.textSecondary }}
            >
              {t("price")} per {t("seat")}
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: adminColors.accent }}
            >
              {workshop.currency} {workshop.price.toFixed(2)}
            </span>
          </div>

          {/* Bookings list */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-3">
              <p
                className="text-xs font-medium"
                style={{ color: adminColors.textSecondary }}
              >
                Enrollments ({bookings.length})
              </p>
              <AdminButton
                size="sm"
                variant="primary"
                onClick={() => setShowEnroll(true)}
                disabled={seatsLeft === 0}
              >
                <UserPlus size={12} />
                Enroll Student
              </AdminButton>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-white/20" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Users size={28} className="mb-3 text-white/10" />
                <p className="text-sm" style={{ color: adminColors.textMuted }}>
                  {t("noEnrollmentsYet")}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: adminColors.textMuted }}
                >
                  {t("useButtonAbove")}
                </p>
              </div>
            ) : (
              <div
                className="divide-y"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                {bookings.map((b) => (
                  <div key={b.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3">
                      {/* Student info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-semibold"
                          style={{
                            background: "rgba(245,158,11,0.12)",
                            color: adminColors.accent,
                          }}
                        >
                          {b.student.firstName[0]}
                          {b.student.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-xs font-medium truncate"
                            style={{ color: adminColors.textPrimary }}
                          >
                            {b.student.firstName} {b.student.lastName}
                          </p>
                          <p
                            className="text-[11px] truncate"
                            style={{ color: adminColors.textMuted }}
                          >
                            {b.student.user.email}
                          </p>
                        </div>
                      </div>

                      {/* Status + cancel */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <AdminBadge
                          variant={statusBadge[b.status] ?? "default"}
                        >
                          {b.status}
                        </AdminBadge>
                        {b.status === "CONFIRMED" &&
                          (cancellingId === b.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCancel(b.id)}
                                disabled={isPending}
                                className="text-[11px] px-2 py-1 rounded-lg transition-colors"
                                style={{
                                  background: "rgba(248,113,113,0.12)",
                                  color: "#f87171",
                                }}
                              >
                                {isPending ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  "Confirm"
                                )}
                              </button>
                              <button
                                onClick={() => setCancellingId(null)}
                                className="text-[11px] px-2 py-1 rounded-lg transition-colors"
                                style={{ color: adminColors.textMuted }}
                              >
                                Keep
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCancellingId(b.id)}
                              className="p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
                              title="Cancel booking"
                            >
                              <XCircle size={13} />
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Payment info */}
                    {b.payment && (
                      <div className="mt-2 ml-11 flex items-center gap-3">
                        <CheckCircle2
                          size={11}
                          className="text-emerald-400 flex-shrink-0"
                        />
                        <span
                          className="text-[11px]"
                          style={{ color: adminColors.textMuted }}
                        >
                          {b.payment.currency} {b.payment.amount.toFixed(2)}
                          {b.payment.method &&
                            ` · ${b.payment.method.replace("_", " ")}`}
                          {b.payment.paidAt &&
                            ` · ${fmtDate(b.payment.paidAt)}`}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEnroll && (
        <EnrollStudentModal
          workshop={{ ...workshop, enrolledCount: confirmedCount }}
          onClose={() => setShowEnroll(false)}
          onSuccess={() => {
            setShowEnroll(false);
            loadBookings();
            onRefresh();
          }}
        />
      )}
    </>
  );
}
