"use client";

import { useRef, useState } from "react";
import { Upload, X, Film, ImageIcon } from "lucide-react";
import { adminColors } from "@/components/admin/ui";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime";

interface Props {
  currentUrl?: string | null;
  currentKind?: string | null;
  onUploadComplete: (url: string, kind: string) => void;
  onClear: () => void;
  folder?: string;
}

export default function MediaUploadField({
  currentUrl,
  currentKind,
  onUploadComplete,
  onClear,
  folder = "classes",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [kind, setKind] = useState<string>(currentKind ?? "image");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    setPreview(objectUrl);
    setKind(isVideo ? "video" : "image");

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onUploadComplete(json.data.url, json.data.kind);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setPreview(currentUrl ?? null);
      setKind(currentKind ?? "image");
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setPreview(null);
    setKind("image");
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
    onClear();
  };

  return (
    <div className="space-y-2">
      <label className="text-sm" style={{ color: adminColors.textSecondary }}>
        Cover Image / Video
      </label>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-black/10" style={{ background: "#f9fafb" }}>
          {kind === "video" ? (
            <video
              src={preview}
              className="w-full h-40 object-cover"
              muted
              playsInline
              controls={false}
            />
          ) : (
            <img src={preview} alt="preview" className="w-full h-40 object-cover" />
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin" />
            </div>
          )}

          {!uploading && (
            <div className="absolute top-2 right-2 flex gap-1.5">
              <div
                className="px-2 py-1 rounded-md text-xs flex items-center gap-1"
                style={{ background: "rgba(0,0,0,0.65)", color: adminColors.textMuted }}
              >
                {kind === "video" ? <Film size={11} /> : <ImageIcon size={11} />}
                {kind}
              </div>
              <button
                type="button"
                onClick={clear}
                className="p-1 rounded-md hover:bg-black/30 transition-colors"
                style={{ background: "rgba(0,0,0,0.65)", color: adminColors.pinkText }}
              >
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full h-32 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 transition-colors hover:border-black/10"
          style={{
            borderColor: adminColors.border,
            background: "#f9fafb",
            color: adminColors.textMuted,
          }}
        >
          <Upload size={20} style={{ color: adminColors.textMuted }} />
          <span className="text-xs">Click to upload image or video</span>
        </button>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
