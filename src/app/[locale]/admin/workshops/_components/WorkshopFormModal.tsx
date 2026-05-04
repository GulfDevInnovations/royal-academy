"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import {
  X,
  Loader2,
  ImagePlus,
  Film,
  Trash2,
  GripVertical,
  AlertCircle,
} from "lucide-react";
import {
  createWorkshop,
  updateWorkshop,
} from "@/lib/actions/admin/Workshops.actions";
import { adminColors, AdminButton } from "@/components/admin/ui";
import type { SerializedWorkshop } from "../page";
import { useTranslations } from "next-intl";
import DatePicker from "@/components/date-time/DatePicker";
import TimePicker from "@/components/date-time/TimePicker";

interface Props {
  workshop?: SerializedWorkshop;
  teachers: { id: string; firstName: string; lastName: string }[];
  rooms: {
    id: string;
    name: string;
    capacity: number;
    location: string | null;
  }[];
  onClose: () => void;
  onSuccess: () => void;
}

const CURRENCIES = ["OMR", "USD", "EUR", "GBP", "AED", "SAR"];

// ─── Field wrapper ────────────────────────────────────────────
function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-l font-medium"
        style={{ color: adminColors.textSecondary }}
      >
        {label}{" "}
        {required && <span style={{ color: adminColors.accent }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg border bg-white/[0.03] text-xl focus:outline-none focus:border-amber-500/40 transition-colors";
const inputStyle = {
  borderColor: "rgba(255,255,255,0.08)",
  color: adminColors.textPrimary,
};

// ─── Image preview item ───────────────────────────────────────
function ImagePreview({
  src,
  onRemove,
}: {
  src: string;
  onRemove: () => void;
}) {
  return (
    <div
      className="relative group rounded-lg overflow-hidden flex-shrink-0"
      style={{ width: 80, height: 80 }}
    >
      <img src={src} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded-full bg-red-500/80 text-white"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Video preview item ───────────────────────────────────────
function VideoPreview({
  src,
  name,
  onRemove,
}: {
  src: string;
  name: string;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg border group"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <Film
        size={18}
        style={{ color: adminColors.textMuted }}
        className="flex-shrink-0"
      />
      <span
        className="text-l flex-1 truncate max-w-40"
        style={{ color: adminColors.textSecondary }}
      >
        {name}
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function WorkshopFormModal({
  workshop,
  teachers,
  rooms,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = !!workshop;
  const formRef = useRef<HTMLFormElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(workshop?.isOnline ?? false);
  const [langTab, setLangTab] = useState<"en" | "ar">("en");
  const t = useTranslations("admin");

  // ── Image state ──
  // existingImageUrls: URLs already saved (edit mode), user can remove them
  // newImageFiles: newly picked File objects not yet uploaded
  // newImagePreviews: object URLs for local preview of new files
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(
    (workshop as any)?.imageUrls ??
      (workshop?.coverUrl ? [workshop.coverUrl] : []),
  );
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // ── Video state ──
  const [existingVideoUrls, setExistingVideoUrls] = useState<string[]>(
    (workshop as any)?.videoUrls ?? [],
  );
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);

  // Format date for <input type="date">
  const defaultDate = workshop?.eventDate
    ? new Date(workshop.eventDate).toISOString().split("T")[0]
    : "";

  // ── Image picker ──────────────────────────────────────────
  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setNewImageFiles((prev) => [...prev, ...files]);
    setNewImagePreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
    e.target.value = "";
  };

  const removeExistingImage = (url: string) =>
    setExistingImageUrls((prev) => prev.filter((u) => u !== url));

  const removeNewImage = (idx: number) => {
    URL.revokeObjectURL(newImagePreviews[idx]);
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Video picker ──────────────────────────────────────────
  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setNewVideoFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeExistingVideo = (url: string) =>
    setExistingVideoUrls((prev) => prev.filter((u) => u !== url));

  const removeNewVideo = (idx: number) =>
    setNewVideoFiles((prev) => prev.filter((_, i) => i !== idx));

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const fd = new FormData(e.currentTarget);

    // Validate
    const title = (fd.get("title") as string).trim();
    const eventDate = fd.get("eventDate") as string;
    const startTime = fd.get("startTime") as string;
    const endTime = fd.get("endTime") as string;
    const capacity = Number(fd.get("capacity"));
    const price = Number(fd.get("price"));

    if (!title) return setError("Title is required.");
    if (!eventDate) return setError("Event date is required.");
    if (!startTime) return setError("Start time is required.");
    if (!endTime) return setError("End time is required.");
    if (startTime >= endTime)
      return setError("End time must be after start time.");
    if (capacity < 1) return setError("Capacity must be at least 1.");
    if (price < 0) return setError("Price cannot be negative.");

    // Attach isOnline flag
    fd.set("isOnline", String(isOnline));

    // Attach existing URLs (kept by user)
    existingImageUrls.forEach((u) => fd.append("existingImageUrls", u));
    existingVideoUrls.forEach((u) => fd.append("existingVideoUrls", u));

    // Attach new files
    newImageFiles.forEach((f) => fd.append("imageFiles", f));
    newVideoFiles.forEach((f) => fd.append("videoFiles", f));

    startTransition(async () => {
      const result = isEdit
        ? await updateWorkshop(workshop!.id, fd)
        : await createWorkshop(fd);

      if (result.success) onSuccess();
      else setError(result.error ?? "Something went wrong.");
    });
  };

  const totalImages = existingImageUrls.length + newImageFiles.length;
  const totalVideos = existingVideoUrls.length + newVideoFiles.length;

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    borderColor: adminColors.border,
    color: adminColors.textPrimary,
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-white/[0.08] shadow-2xl z-10 max-h-[92vh] flex flex-col"
        style={{ background: "#1a1d27" }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div>
            <h2
              className="text-3xl font-semibold"
              style={{ color: adminColors.textPrimary }}
            >
              {isEdit ? "Edit Workshop" : "New Workshop"}
            </h2>
            <p
              className="text-l mt-0.5"
              style={{ color: adminColors.textMuted }}
            >
              {isEdit
                ? "Update workshop details"
                : "Fill in the details to create a new workshop"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X size={20} style={{ color: adminColors.pinkText }} />
          </button>
        </div>

        {/* ── Body ── */}
        <form
          ref={formRef}
          id="workshop-form"
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 px-6 py-5 space-y-5"
        >
          <div
            className="flex items-center gap-1 p-1 rounded-lg w-fit"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {(["en", "ar"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLangTab(lang)}
                className="px-3 py-1 rounded-md text-l font-medium transition-all"
                style={{
                  background:
                    langTab === lang ? "rgba(251,191,36,0.15)" : "transparent",
                  color: langTab === lang ? "#fbbf24" : adminColors.textMuted,
                  border:
                    langTab === lang
                      ? "1px solid rgba(251,191,36,0.3)"
                      : "1px solid transparent",
                }}
              >
                {lang === "en" ? "🇬🇧 English" : "🇴🇲 Arabic"}
              </button>
            ))}
          </div>
          <div className="space-y-1.5">
            <label
              className="text-l"
              style={{ color: adminColors.textSecondary }}
            >
              Class Name <span className="text-red-400">*</span>
              {langTab === "ar" && (
                <span
                  className="ml-1 text-[16px]"
                  style={{ color: adminColors.textMuted }}
                >
                  (Arabic)
                </span>
              )}
            </label>
            <input
              name="title"
              defaultValue={workshop?.title ?? ""}
              placeholder="e.g. Dance, Painting, Music"
              className="w-full text-l rounded-lg border px-3 py-2 outline-none"
              style={{
                ...inputStyle,
                display: langTab === "en" ? "block" : "none",
              }}
            />
            <input
              name="title_ar"
              defaultValue={(workshop as any)?.title_ar ?? ""}
              dir="rtl"
              placeholder="مثال: رقص، رسم، موسيقى"
              className="w-full text-l rounded-lg border px-3 py-2 outline-none"
              style={{
                ...inputStyle,
                fontFamily: "var(--font-layla, sans-serif)",
                display: langTab === "ar" ? "block" : "none",
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-l">
              Description
              {langTab === "ar" && (
                <span
                  className="ml-1 text-[16px]"
                  style={{ color: adminColors.textMuted }}
                >
                  (Arabic)
                </span>
              )}
            </label>
            <textarea
              name="description"
              defaultValue={workshop?.description ?? ""}
              rows={3}
              className="w-full text-l rounded-lg border px-3 py-2 outline-none resize-none"
              style={{
                ...inputStyle,
                display: langTab === "en" ? "block" : "none",
              }}
            />
            <textarea
              name="description_ar"
              defaultValue={(workshop as any)?.description_ar ?? ""}
              rows={3}
              dir="rtl"
              placeholder="الوصف بالعربي"
              className="w-full text-l rounded-lg border px-3 py-2 outline-none resize-none"
              style={{
                ...inputStyle,
                fontFamily: "var(--font-layla, sans-serif)",
                display: langTab === "ar" ? "block" : "none",
              }}
            />
          </div>

          {/* ── Images ──────────────────────────────────── */}
          <Field label="Images">
            {/* Previews row */}
            {totalImages > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {/* Existing */}
                {existingImageUrls.map((url) => (
                  <ImagePreview
                    key={url}
                    src={url}
                    onRemove={() => removeExistingImage(url)}
                  />
                ))}
                {/* New (local preview) */}
                {newImagePreviews.map((src, i) => (
                  <ImagePreview
                    key={src}
                    src={src}
                    onRemove={() => removeNewImage(i)}
                  />
                ))}
              </div>
            )}

            {/* Drop zone / add button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed text-l transition-colors hover:border-amber-500/40"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
                color: adminColors.textMuted,
              }}
            >
              <ImagePlus size={19} />
              {totalImages === 0 ? "Add images" : "Add more images"}
              <span className="ml-1" style={{ color: adminColors.textMuted }}>
                (JPG, PNG, WebP)
              </span>
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleImagePick}
            />
            {totalImages > 0 && (
              <p
                className="text-[16px] mt-1"
                style={{ color: adminColors.textMuted }}
              >
                First image is used as the cover. {totalImages} image
                {totalImages !== 1 ? "s" : ""} selected.
              </p>
            )}
          </Field>

          {/* ── Videos ──────────────────────────────────── */}
          <Field label="Videos">
            {/* Video list */}
            {totalVideos > 0 && (
              <div className="space-y-1.5 mb-2">
                {existingVideoUrls.map((url) => (
                  <VideoPreview
                    key={url}
                    src={url}
                    name={url.split("/").pop() ?? url}
                    onRemove={() => removeExistingVideo(url)}
                  />
                ))}
                {newVideoFiles.map((f, i) => (
                  <VideoPreview
                    key={f.name + i}
                    src=""
                    name={f.name}
                    onRemove={() => removeNewVideo(i)}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed text-l transition-colors hover:border-amber-500/40"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
                color: adminColors.textMuted,
              }}
            >
              <Film size={19} />
              {totalVideos === 0 ? "Add videos" : "Add more videos"}
              <span className="ml-1" style={{ color: adminColors.textMuted }}>
                (MP4, MOV, WebM)
              </span>
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              multiple
              className="hidden"
              onChange={handleVideoPick}
            />
            {totalVideos > 0 && (
              <p
                className="text-[16px] mt-1"
                style={{ color: adminColors.textMuted }}
              >
                {totalVideos} video{totalVideos !== 1 ? "s" : ""} selected.
              </p>
            )}
          </Field>

          {/* Teacher + Room */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Teacher">
              <select
                name="teacherId"
                defaultValue={workshop?.teacherId ?? ""}
                className={inputCls}
                style={inputStyle}
              >
                <option value="">No teacher assigned</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Room">
              <select
                name="roomId"
                defaultValue={workshop?.roomId ?? ""}
                className={inputCls}
                style={inputStyle}
              >
                <option value="">No room assigned</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.capacity ? ` (cap. ${r.capacity})` : ""}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Date + Times */}
          <div className="grid grid-cols-3 gap-4">
            <DatePicker
              id="eventDate"
              name="eventDate"
              label="Event Date"
              defaultValue={defaultDate}
              required
              theme="dark"
              fieldClassName="w-full text-l rounded-lg border px-3 py-2 outline-none focus:border-amber-500/50 transition-all duration-150"
              inputStyle={{ borderColor: adminColors.border }}
            />
            <TimePicker
              id="startTime"
              name="startTime"
              label="Start Time"
              defaultValue={workshop?.startTime ?? ""}
              required
              theme="dark"
              fieldClassName="w-full text-l rounded-lg border px-3 py-2 outline-none focus:border-amber-500/50 transition-all duration-150"
              inputStyle={{ borderColor: adminColors.border }}
            />
            <TimePicker
              id="endTime"
              name="endTime"
              label="End Time"
              defaultValue={workshop?.endTime ?? ""}
              required
              theme="dark"
              fieldClassName="w-full text-l rounded-lg border px-3 py-2 outline-none focus:border-amber-500/50 transition-all duration-150"
              inputStyle={{ borderColor: adminColors.border }}
            />
          </div>

          {/* Capacity + Price + Currency */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Capacity" required>
              <input
                type="number"
                name="capacity"
                min={1}
                defaultValue={workshop?.capacity ?? 20}
                className={inputCls}
                style={inputStyle}
              />
            </Field>
            <Field label="Price" required>
              <input
                type="number"
                name="price"
                min={0}
                step="0.01"
                defaultValue={workshop?.price ?? ""}
                placeholder="0.00"
                className={inputCls}
                style={inputStyle}
              />
            </Field>
            <Field label="Currency">
              <select
                name="currency"
                defaultValue={workshop?.currency ?? "OMR"}
                className={inputCls}
                style={inputStyle}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Online toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsOnline((v: boolean) => !v)}
              className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
              style={{
                background: isOnline
                  ? adminColors.accent
                  : "rgba(255,255,255,0.1)",
              }}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  isOnline ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span
              className="text-l"
              style={{ color: adminColors.textSecondary }}
            >
              Online workshop
            </span>
          </div>

          {isOnline && (
            <Field label="Online Link (Zoom / Meet)">
              <input
                name="onlineLink"
                defaultValue={(workshop as any)?.onlineLink ?? ""}
                placeholder="https://zoom.us/j/..."
                className={inputCls}
                style={inputStyle}
              />
            </Field>
          )}

          {/* Upcoming notice */}
          {!isEdit && (
            <div
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
              style={{
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.15)",
              }}
            >
              <AlertCircle
                size={18}
                className="flex-shrink-0 mt-0.5"
                style={{ color: adminColors.accent }}
              />
              <p
                className="text-l"
                style={{ color: adminColors.textSecondary }}
              >
                A matching{" "}
                <strong style={{ color: adminColors.accent }}>Upcoming</strong>{" "}
                card will be created automatically as a draft. You can publish
                it from the Upcoming section.
              </p>
            </div>
          )}

          {error && (
            <p className="text-l px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </p>
          )}
        </form>

        {/* ── Footer ── */}
        <div
          className="flex justify-end gap-2 px-6 py-4 border-t flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <AdminButton variant="ghost" type="button" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            type="submit"
            form="workshop-form"
            disabled={isPending}
          >
            {isPending && <Loader2 size={18} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Create Workshop"}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
