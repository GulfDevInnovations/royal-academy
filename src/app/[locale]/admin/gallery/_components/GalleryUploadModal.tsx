"use client";

import { useRef, useState, useTransition } from "react";
import {
  X,
  Loader2,
  Upload,
  Video,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  AdminInput,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";
import { uploadGalleryItem } from "@/lib/actions/admin/gallery.actions";
import type { SerializedCategory, SerializedPerson } from "./GalleryClient";

interface Props {
  categories: SerializedCategory[];
  persons: SerializedPerson[];
  onClose: () => void;
  onSuccess: () => void;
}

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime";

// Strip extension from filename for a clean default title
const fileBaseName = (name: string) =>
  name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");

//Formatter for alt text
const toAltText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // strip punctuation and special chars
    .trim()
    .replace(/\s+/g, "-") // spaces → hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .slice(0, 125) // hard cap at 125 chars
    .replace(/-$/, "");

export default function GalleryUploadModal({
  categories,
  persons,
  onClose,
  onSuccess,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const openFilePicker = () => fileInputRef.current?.click();

  // Title field is pre-filled from filename but still editable
  const [title, setTitle] = useState("");
  const [altText, setAltText] = useState("");
  const [altTouched, setAltTouched] = useState(false);

  // Advanced section collapsed by default
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Person tag selection
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);

  const processFile = (file: File) => {
    const video = file.type.startsWith("video/");
    setIsVideo(video);
    setFileName(file.name);
    const base = fileBaseName(file.name);
    setTitle(base);
    setAltText(toAltText(base)); // ← add this
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (!altTouched) setAltText(toAltText(e.target.value));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const input =
      formRef.current?.querySelector<HTMLInputElement>('input[name="file"]');
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
    }
    processFile(file);
  };

  const togglePerson = (id: string) =>
    setSelectedPersons((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);
    formData.delete("personIds");
    selectedPersons.forEach((id) => formData.append("personIds", id));

    startTransition(async () => {
      const result = await uploadGalleryItem(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setUploadSuccess(true);
        setTimeout(() => onSuccess(), 1200);
      }
    });
  };

  // Today's date in YYYY-MM-DD for the date input default
  const todayValue = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-white/8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] sticky top-0 z-10"
          style={{ background: "#1a1d27" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: adminColors.textPrimary }}
          >
            Upload Media
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-4"
        >
          {/* ── Drop zone ── */}
          {/* ONE input, always in the form, never duplicated */}
          <input
            ref={fileInputRef}
            name="file"
            type="file"
            accept={ACCEPT}
            onChange={handleFileInput}
            required
            className="sr-only"
          />

          {/* Drop zone — purely visual, no inputs inside */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="relative rounded-xl border-2 transition-all duration-300"
            style={{
              borderColor: uploadSuccess
                ? "#22c55e"
                : dragOver
                  ? "#f59e0b"
                  : fileName
                    ? "rgba(245,158,11,0.4)"
                    : "rgba(255,255,255,0.1)",
              borderStyle: fileName ? "solid" : "dashed",
              background: uploadSuccess
                ? "rgba(34,197,94,0.06)"
                : dragOver
                  ? "rgba(245,158,11,0.05)"
                  : fileName
                    ? "rgba(245,158,11,0.03)"
                    : "rgba(255,255,255,0.02)",
            }}
          >
            {uploadSuccess ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.15)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10l4.5 4.5L16 6"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium" style={{ color: "#22c55e" }}>
                  Uploaded successfully
                </p>
              </div>
            ) : fileName ? (
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-16 h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video size={22} style={{ color: "#f59e0b" }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: adminColors.textPrimary }}
                    >
                      {fileName}
                    </p>
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: adminColors.textMuted }}
                    >
                      {isVideo ? "Video" : "Image"} · ready to upload
                    </p>
                  </div>

                  {/* Change — triggers the single input above */}
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-lg border transition-colors hover:bg-white/5"
                    style={{
                      borderColor: "rgba(255,255,255,0.1)",
                      color: adminColors.textMuted,
                    }}
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              // Empty state — clicking anywhere opens the picker
              <div
                className="flex flex-col items-center gap-3 py-7 cursor-pointer"
                onClick={openFilePicker}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(245,158,11,0.1)" }}
                >
                  <Upload size={18} style={{ color: "#f59e0b" }} />
                </div>
                <div className="text-center">
                  <p
                    className="text-xs font-medium"
                    style={{ color: adminColors.textPrimary }}
                  >
                    Drop file here or click to browse
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: adminColors.textMuted }}
                  >
                    JPG, PNG, WebP, GIF · MP4, WebM, MOV · max 4 MB / 20 MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Title — auto-filled, editable ── */}
          <AdminInput
            label="Title"
            name="title"
            value={title}
            onChange={handleTitleChange} // ← was inline setState before
          />

          {/* ── Category ── */}
          {categories.length > 0 && (
            <AdminSelect label="Category" name="categoryId">
              <option value="" className="text-black">
                — No category —
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="text-black">
                  {cat.name}
                </option>
              ))}
            </AdminSelect>
          )}

          {/* ── People ── */}
          {persons.length > 0 && (
            <div>
              <label
                className="block text-xs font-medium mb-2"
                style={{ color: adminColors.textSecondary }}
              >
                Tag People
              </label>
              <div className="flex flex-wrap gap-2">
                {persons.map((p) => {
                  const selected = selectedPersons.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePerson(p.id)}
                      className="px-2.5 py-1 rounded-full text-xs transition-all border"
                      style={{
                        borderColor: selected
                          ? "#f59e0b"
                          : "rgba(255,255,255,0.1)",
                        background: selected
                          ? "rgba(245,158,11,0.1)"
                          : "rgba(255,255,255,0.03)",
                        color: selected ? "#f59e0b" : adminColors.textSecondary,
                      }}
                    >
                      {p.displayName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Advanced (collapsed by default) ── */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: adminColors.textMuted }}
            >
              {showAdvanced ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
              Advanced options
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pl-1">
                <AdminInput
                  label="Description / Caption"
                  name="description"
                  placeholder="Optional caption..."
                />

                <div>
                  <AdminInput
                    label="Alt Text (SEO)"
                    name="altText"
                    value={altText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setAltTouched(true);
                      setAltText(e.target.value.slice(0, 125)); // hard cap on manual input too
                    }}
                    placeholder="auto-filled from title"
                  />
                  <p
                    className="text-[11px] mt-1 text-right"
                    style={{
                      color:
                        altText.length > 110
                          ? "#f59e0b"
                          : adminColors.textMuted,
                    }}
                  >
                    {altText.length} / 125
                  </p>
                </div>

                <AdminSelect
                  label="Visibility"
                  name="visibility"
                  defaultValue="PUBLISHED"
                >
                  <option value="PUBLISHED" className="text-black">
                    Published
                  </option>
                  <option value="DRAFT" className="text-black">
                    Draft
                  </option>
                  <option value="ARCHIVED" className="text-black">
                    Archived
                  </option>
                </AdminSelect>

                <div className="grid grid-cols-2 gap-3">
                  <AdminSelect
                    label="Featured"
                    name="isFeatured"
                    defaultValue="false"
                  >
                    <option value="false" className="text-black">
                      No
                    </option>
                    <option value="true" className="text-black">
                      Yes
                    </option>
                  </AdminSelect>
                  <AdminInput
                    label="Sort Order"
                    name="sortOrder"
                    type="number"
                    defaultValue="0"
                  />
                </div>

                {/* Date taken — defaults to today */}
                <AdminInput
                  label="Date Taken"
                  name="takenAt"
                  type="date"
                  defaultValue={todayValue}
                />

                {/* Video thumbnail upload */}
                {isVideo && (
                  <div>
                    <label
                      className="block text-xs font-medium mb-1.5"
                      style={{ color: adminColors.textSecondary }}
                    >
                      Video Thumbnail (optional)
                    </label>
                    <label
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-xs transition-colors hover:bg-white/3"
                      style={{
                        borderColor: adminColors.border,
                        color: adminColors.textSecondary,
                      }}
                    >
                      <Video size={13} />
                      Choose poster image
                      <input
                        name="thumbnail"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Hidden defaults for fields not shown in simple mode */}
          {!showAdvanced && (
            <>
              <input type="hidden" name="visibility" value="PUBLISHED" />
              <input type="hidden" name="isFeatured" value="false" />
              <input type="hidden" name="sortOrder" value="0" />
              <input type="hidden" name="altText" value={altText} />
              <input type="hidden" name="takenAt" value={todayValue} />
            </>
          )}

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <AdminButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              variant="primary"
              disabled={isPending || !fileName}
            >
              {isPending && <Loader2 size={13} className="animate-spin" />}
              Upload
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
