"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type AvatarUploadFieldProps = {
  initialUrl: string;
  hiddenInputName?: string;
  uploadFolder?: string;
  label: string;
  helperText: string;
  uploadText: string;
  uploadingText: string;
  uploadErrorPrefix: string;
  defaultAvatarUrl?: string;
};

type UploadResponse = {
  data?: {
    url: string;
  };
  error?: string;
};

export default function AvatarUploadField({
  initialUrl,
  hiddenInputName = "imageUrl",
  uploadFolder = "avatars",
  label,
  helperText,
  uploadText,
  uploadingText,
  uploadErrorPrefix,
  defaultAvatarUrl = "/images/user.png",
}: AvatarUploadFieldProps) {
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function onFileChange(file: File | null) {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", uploadFolder);

      const response = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as UploadResponse;
      if (!response.ok || !payload.data?.url) {
        throw new Error(payload.error || "Upload failed");
      }

      setImageUrl(payload.data.url);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setError(`${uploadErrorPrefix} ${message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div className="md:col-span-2 rounded-2xl border border-white/10 p-4">
      <input type="hidden" name={hiddenInputName} value={imageUrl} />

      <p className="text-sm mb-2">{label}</p>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/20 bg-white/5">
          <Image
            src={imageUrl || defaultAvatarUrl}
            alt="Profile avatar preview"
            fill
            sizes="80px"
            className="object-cover"
            unoptimized={Boolean(imageUrl && imageUrl.startsWith("http"))}
          />
        </div>

        <div className="flex-1">
          <p className="text-xs mb-3" style={{ color: "rgba(228,208,181,0.65)" }}>
            {helperText}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              onFileChange(event.currentTarget.files?.[0] ?? null)
            }
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl px-4 py-2 text-xs tracking-[0.15em] uppercase transition-opacity disabled:opacity-60"
            style={{
              color: "#e4d0b5",
              border: "1px solid rgba(228,208,181,0.3)",
              background:
                "linear-gradient(135deg, rgba(228,208,181,0.14) 0%, rgba(228,208,181,0.06) 100%)",
            }}
          >
            {uploading ? uploadingText : uploadText}
          </button>
          {error && (
            <p className="mt-2 text-xs" style={{ color: "#f87171" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
