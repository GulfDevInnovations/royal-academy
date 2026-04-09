"use client";

import { useRef, useState, useTransition } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { AdminButton, adminColors } from "@/components/admin/ui";
import {
  createUpcoming,
  updateUpcoming,
  createNews,
  updateNews,
  createOffer,
  updateOffer,
} from "@/lib/actions/admin/content.actions";
import type { SerializedUpcoming } from "./UpcomingClient";
import type { SerializedNews } from "../../news/_components/NewsClient";
import type { SerializedOffer } from "../../offers/_components/OffersClient";
import type { ClassWithSubClasses } from "../../offers/_components/OffersClient";
import { useTranslations } from "next-intl";

type Kind = "upcoming" | "news" | "offers";
type AnyItem = SerializedUpcoming | SerializedNews | SerializedOffer;

interface Props {
  kind: Kind;
  data: AnyItem | null;
  classes?: ClassWithSubClasses[];
  onSuccess: () => void;
  onClose: () => void;
}

function nowLocalDatetimeValue() {
  const now = new Date();
  now.setSeconds(0, 0);
  // Format as yyyy-MM-ddTHH:mm which datetime-local expects
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function ContentFormModal({
  kind,
  data,
  classes = [],
  onSuccess,
  onClose,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isExternal, setIsExternal] = useState(data?.isExternal ?? false);
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [langTab, setLangTab] = useState<"en" | "ar">("en");
  const t = useTranslations("admin");

  // ── Image previews ─────────────────────────────────────────────────────────
  // Existing URLs from the DB (shown on edit)
  const [existingImages, setExistingImages] = useState<string[]>(
    data?.mediaUrls ?? [],
  );
  // New files picked by the admin (not yet uploaded)
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // ── Video preview ──────────────────────────────────────────────────────────
  const [existingVideo, setExistingVideo] = useState<string | null>(
    data?.videoUrls?.[0] ?? null,
  );
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newVideoPreview, setNewVideoPreview] = useState<string | null>(null);

  const isEdit = !!data;

  const titles: Record<Kind, string> = {
    upcoming: isEdit ? "Edit Upcoming" : t("newUpcoming"),
    news: isEdit ? "Edit News" : t("newNews"),
    offers: isEdit ? "Edit Offer" : "New Offer",
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleImageFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setNewImageFiles((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewImagePreviews((prev) => [...prev, ...previews]);
    // Reset input so the same file can be re-added after removal
    e.target.value = "";
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewThumbnailFile(file);
    e.target.value = "";
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  };

  const removeNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (newVideoPreview) URL.revokeObjectURL(newVideoPreview);
    setNewVideoFile(file);
    setNewVideoPreview(URL.createObjectURL(file));
    setExistingVideo(null); // replacing the existing one
  };

  const removeVideo = () => {
    if (newVideoPreview) URL.revokeObjectURL(newVideoPreview);
    setNewVideoFile(null);
    setNewVideoPreview(null);
    setExistingVideo(null);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);

    if (!fd.get("title")) {
      setError("Title (English) is required.");
      return;
    }

    // Inject controlled state that isn't in native inputs
    fd.set("isExternal", isExternal ? "true" : "false");

    // Existing image URLs (after removals)
    fd.delete("existingMediaUrls");
    existingImages.forEach((url) => fd.append("existingMediaUrls", url));

    // New image files
    fd.delete("mediaFiles");
    newImageFiles.forEach((f) => fd.append("mediaFiles", f));

    // Video
    fd.delete("existingVideoUrls");
    fd.delete("videoFiles");
    if (existingVideo) fd.append("existingVideoUrls", existingVideo);
    if (newVideoFile) fd.append("videoFiles", newVideoFile);

    fd.delete("thumbnailFile");
    if (newThumbnailFile) fd.append("thumbnailFile", newThumbnailFile);

    // Derive isActive from status
    const status = fd.get("status") as string;
    fd.set("isActive", status === "ACTIVE" ? "true" : "false");

    startTransition(async () => {
      setError(null);
      let result: { error?: string };

      if (kind === "upcoming") {
        result = isEdit
          ? await updateUpcoming(data!.id, fd)
          : await createUpcoming(fd);
      } else if (kind === "news") {
        result = isEdit ? await updateNews(data!.id, fd) : await createNews(fd);
      } else {
        result = isEdit
          ? await updateOffer(data!.id, fd)
          : await createOffer(fd);
      }

      if (result.error) setError(result.error);
      else onSuccess();
    });
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    borderColor: adminColors.border,
    color: adminColors.textPrimary,
  };

  const labelStyle = { color: adminColors.textSecondary };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border"
        style={{
          background: adminColors.surface,
          borderColor: adminColors.border,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
          style={{
            background: adminColors.surface,
            borderColor: adminColors.border,
          }}
        >
          <h2
            className="text-l font-medium"
            style={{ color: adminColors.textPrimary }}
          >
            {titles[kind]}
          </h2>
          <button onClick={onClose}>
            <X size={16} style={{ color: adminColors.pinkText }} />
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} className="px-6 py-5 space-y-5">
          {/* Language Tab Switcher */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg w-fit"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {(["en", "ar"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLangTab(lang)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
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

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-l" style={labelStyle}>
              Title <span className="text-red-400">*</span>
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
              defaultValue={data?.title ?? ""}
              required
              className="w-full text-2xl rounded-lg border px-3 py-2 outline-none"
              style={{
                ...inputStyle,
                display: langTab === "en" ? "block" : "none",
              }}
            />
            <input
              name="title_ar"
              defaultValue={(data as any)?.title_ar ?? ""}
              dir="rtl"
              placeholder="العنوان بالعربي"
              className="w-full text-l rounded-lg border px-3 py-2 outline-none"
              style={{
                ...inputStyle,
                fontFamily: "var(--font-layla, sans-serif)",
                display: langTab === "ar" ? "block" : "none",
              }}
            />
          </div>

          {/* Subtitle */}
          <div className="space-y-1.5">
            <label className="text-l" style={labelStyle}>
              Subtitle
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
              name="subtitle"
              defaultValue={data?.subtitle ?? ""}
              className="w-full text-l rounded-lg border px-3 py-2 outline-none"
              style={{
                ...inputStyle,
                display: langTab === "en" ? "block" : "none",
              }}
            />
            <input
              name="subtitle_ar"
              defaultValue={(data as any)?.subtitle_ar ?? ""}
              dir="rtl"
              placeholder="العنوان الفرعي بالعربي"
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
            <label className="text-l" style={labelStyle}>
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
              defaultValue={data?.description ?? ""}
              rows={3}
              className="w-full text-l rounded-lg border px-3 py-2 outline-none resize-none"
              style={{
                ...inputStyle,
                display: langTab === "en" ? "block" : "none",
              }}
            />
            <textarea
              name="description_ar"
              defaultValue={(data as any)?.description_ar ?? ""}
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
          {/* News: slug */}
          {kind === "news" && (
            <div className="space-y-1.5">
              <label className="text-l" style={labelStyle}>
                Slug <span className="text-red-400">*</span>
              </label>
              <input
                name="slug"
                defaultValue={(data as SerializedNews)?.slug ?? ""}
                required
                placeholder="e.g. summer-recital-2025"
                className="w-full text-l rounded-lg border px-3 py-2 outline-none font-mono"
                style={inputStyle}
              />
            </div>
          )}

          {/* Upcoming: event date */}
          {kind === "upcoming" && (
            <div className="space-y-1.5">
              <label className="text-l" style={labelStyle}>
                Event Date
              </label>
              <input
                type="datetime-local"
                name="eventDate"
                defaultValue={
                  (data as SerializedUpcoming)?.eventDate
                    ? new Date((data as SerializedUpcoming).eventDate!)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                className="w-full text-l rounded-lg border px-3 py-2 outline-none"
                style={inputStyle}
              />
            </div>
          )}

          {/* ── Images ── */}
          <div className="space-y-2">
            <label className="text-l" style={labelStyle}>
              Images
            </label>

            {/* Preview grid */}
            {(existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {existingImages.map((url) => (
                  <div key={url} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="w-20 h-14 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(url)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "#ef4444" }}
                    >
                      <X size={15} style={{ color: adminColors.pinkText }} />
                    </button>
                  </div>
                ))}
                {newImagePreviews.map((preview, i) => (
                  <div key={preview} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt=""
                      className="w-20 h-14 object-cover rounded-lg ring-1 ring-amber-400/50"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: "#ef4444" }}
                    >
                      <X size={10} style={{ color: adminColors.pinkText }} />
                    </button>
                    {/* "new" indicator */}
                    <span
                      className="absolute bottom-1 left-1 text-[13px] px-1 rounded"
                      style={{
                        background: "rgba(0,0,0,0.6)",
                        color: "#fbbf24",
                      }}
                    >
                      new
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add more button */}
            <label
              className="inline-flex items-center gap-1.5 text-l px-3 py-1.5 rounded-lg border cursor-pointer transition-colors hover:border-amber-400/50"
              style={{
                borderColor: adminColors.border,
                color: adminColors.textSecondary,
              }}
            >
              <Plus size={12} />
              Add images
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageFilesChange}
              />
            </label>
          </div>

          {/* ── Video (single) ── */}
          <div className="space-y-2">
            <label className="text-l" style={labelStyle}>
              Video (one)
            </label>

            {existingVideo || newVideoPreview ? (
              <div className="space-y-2">
                <video
                  src={newVideoPreview ?? existingVideo ?? undefined}
                  controls
                  className="w-full max-h-40 rounded-lg object-cover"
                  style={{ background: "rgba(0,0,0,0.3)" }}
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="flex items-center gap-1.5 text-l text-red-400 hover:text-red-300"
                >
                  <Trash2 size={16} />
                  Remove video
                </button>
              </div>
            ) : (
              <label
                className="inline-flex items-center gap-1.5 text-l px-3 py-1.5 rounded-lg border cursor-pointer transition-colors hover:border-amber-400/50"
                style={{
                  borderColor: adminColors.border,
                  color: adminColors.textSecondary,
                }}
              >
                <Plus size={12} />
                Add video
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoChange}
                />
              </label>
            )}
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <label className="text-l" style={labelStyle}>
              Thumbnail
              <span
                className="ml-1 text-[16px]"
                style={{ color: adminColors.textMuted }}
              >
                (cover image shown in cards)
              </span>
            </label>
            {data?.thumbnailUrl && (
              <div className="mb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.thumbnailUrl}
                  alt="thumbnail"
                  className="h-16 w-28 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <input
                  type="hidden"
                  name="existingThumbnailUrl"
                  value={data.thumbnailUrl}
                />
              </div>
            )}
            <label
              className="inline-flex items-center gap-1.5 text-l px-3 py-1.5 rounded-lg border cursor-pointer transition-colors hover:border-amber-400/50"
              style={{
                borderColor: adminColors.border,
                color: adminColors.textSecondary,
              }}
            >
              <Plus size={12} />
              Add Thumbnaile
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailChange} // ← add this handler
              />
            </label>
          </div>

          {/* Link */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-l" style={labelStyle}>
                Link URL
              </label>
              <input
                name="linkUrl"
                defaultValue={data?.linkUrl ?? ""}
                placeholder="https:// or /page"
                className="w-full text-l rounded-lg border px-3 py-2 outline-none"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-l" style={labelStyle}>
                Link Label
              </label>
              <input
                name="linkLabel"
                defaultValue={data?.linkLabel ?? ""}
                placeholder="e.g. Learn More"
                className="w-full text-l rounded-lg border px-3 py-2 outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isExternal}
              onChange={(e) => setIsExternal(e.target.checked)}
            />
            <span className="text-l" style={labelStyle}>
              Open link in new tab (external)
            </span>
          </label>

          {/* Offers: discount fields */}
          {kind === "offers" && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-l" style={labelStyle}>
                    Discount Type
                  </label>
                  <select
                    name="discountType"
                    defaultValue={(data as SerializedOffer)?.discountType ?? ""}
                    className="w-full text-l rounded-lg border px-2.5 py-2 outline-none"
                    style={inputStyle}
                  >
                    <option value="">None</option>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                    <option value="FREE_TRIAL">Free Trial</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-l" style={labelStyle}>
                    Discount Value
                  </label>
                  <input
                    type="number"
                    name="discountValue"
                    defaultValue={
                      (data as SerializedOffer)?.discountValue ?? ""
                    }
                    step="0.01"
                    min="0"
                    className="w-full text-l rounded-lg border px-3 py-2 outline-none"
                    style={inputStyle}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-l" style={labelStyle}>
                    Promo Code
                  </label>
                  <input
                    name="promoCode"
                    defaultValue={(data as SerializedOffer)?.promoCode ?? ""}
                    placeholder="e.g. SUMMER25"
                    className="w-full text-l rounded-lg border px-3 py-2 outline-none font-mono uppercase"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-l" style={labelStyle}>
                  Applies to
                  <span
                    className="ml-1 text-[16px]"
                    style={{ color: adminColors.textMuted }}
                  >
                    (leave all unchecked to show on every class)
                  </span>
                </label>

                <div
                  className="rounded-lg border divide-y overflow-hidden divide-white/5"
                  style={{
                    borderColor: adminColors.border,
                  }}
                >
                  {classes.map((cls) => (
                    <div key={cls.id}>
                      {/* Class row */}
                      <label
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.03)" }}
                      >
                        <input
                          type="checkbox"
                          name="classIds"
                          value={cls.id}
                          defaultChecked={(
                            data as SerializedOffer
                          )?.classIds?.includes(cls.id)}
                        />
                        <span
                          className="text-l font-medium"
                          style={{ color: adminColors.textPrimary }}
                        >
                          {cls.name}
                        </span>
                        <span
                          className="ml-auto text-[16px]"
                          style={{ color: adminColors.textMuted }}
                        >
                          all subclasses
                        </span>
                      </label>

                      {/* SubClass rows — indented */}
                      {cls.subClasses.length > 0 && (
                        <div
                          className="divide-y"
                          style={{ borderColor: adminColors.border }}
                        >
                          {cls.subClasses.map((sc) => (
                            <label
                              key={sc.id}
                              className="flex items-center gap-2 pl-8 pr-3 py-1.5 cursor-pointer"
                              style={{ background: "rgba(255,255,255,0.01)" }}
                            >
                              <input
                                type="checkbox"
                                name="subClassIds"
                                value={sc.id}
                                defaultChecked={(
                                  data as SerializedOffer
                                )?.subClassIds?.includes(sc.id)}
                              />
                              <span
                                className="text-l"
                                style={{ color: adminColors.textSecondary }}
                              >
                                {sc.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Publish window — publishAt defaults to now on create */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-l" style={labelStyle}>
                Publish At
              </label>
              <input
                type="datetime-local"
                name="publishAt"
                defaultValue={
                  data?.publishAt
                    ? new Date(data.publishAt).toISOString().slice(0, 16)
                    : nowLocalDatetimeValue()
                }
                className="w-full text-l rounded-lg border px-3 py-2 outline-none"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-l" style={labelStyle}>
                Expire At
                <span
                  className="ml-1 text-[16px]"
                  style={{ color: adminColors.textMuted }}
                >
                  (optional)
                </span>
              </label>
              <input
                type="datetime-local"
                name="expireAt"
                defaultValue={
                  data?.expireAt
                    ? new Date(data.expireAt).toISOString().slice(0, 16)
                    : ""
                }
                className="w-full text-l rounded-lg border px-3 py-2 outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Status + Sort + Badge */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-l" style={labelStyle}>
                Status
              </label>
              <select
                name="status"
                defaultValue={data?.status ?? "DRAFT"}
                className="w-full text-l rounded-lg border px-2.5 py-2 outline-none"
                style={inputStyle}
              >
                <option value="DRAFT">Draft — hidden</option>
                <option value="ACTIVE">Active — visible</option>
                <option value="ARCHIVED">Archived — hidden</option>
              </select>
              <p
                className="text-[16px]"
                style={{ color: adminColors.blueText }}
              >
                Set to Active to show on site
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-l" style={labelStyle}>
                Sort Order
              </label>
              <input
                type="number"
                name="sortOrder"
                defaultValue={data?.sortOrder ?? 0}
                min="0"
                className="w-full text-l rounded-lg border px-3 py-2 outline-none"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-l" style={labelStyle}>
                Badge Label
              </label>
              <input
                name="badgeLabel"
                defaultValue={data?.badgeLabel ?? ""}
                placeholder="e.g. New"
                className="w-full text-l rounded-lg border px-3 py-2 outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {error && <p className="text-l text-red-400">{error}</p>}
        </form>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-6 py-4 border-t sticky bottom-0"
          style={{
            background: adminColors.surface,
            borderColor: adminColors.border,
          }}
        >
          <AdminButton variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </AdminButton>
          <AdminButton
            variant="primary"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Create"}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
