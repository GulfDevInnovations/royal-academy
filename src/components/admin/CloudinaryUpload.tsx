"use client";

// src/components/admin/CloudinaryUpload.tsx
// ─────────────────────────────────────────────────────────────
// Direct unsigned upload to Cloudinary.
// The client uploads straight to Cloudinary — no server proxy.
// Uses an unsigned upload preset which is safe for client-side use.
//
// Setup (one-time in Cloudinary dashboard):
//   1. Settings → Upload → Upload Presets → Add upload preset
//   2. Set "Signing Mode" to "Unsigned"
//   3. Set folder to "teachers" (optional but recommended)
//   4. Copy the preset name → NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
//   5. Copy your cloud name  → NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
// ─────────────────────────────────────────────────────────────

import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { adminColors } from "@/components/admin/ui";

interface Props {
  value?: string | null; // current URL (from DB)
  onChange: (url: string) => void; // called with new Cloudinary URL
  folder?: string; // Cloudinary folder, default "teachers"
}

export default function CloudinaryUpload({
  value,
  onChange,
  folder = "teachers",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    // Show local preview immediately while uploading
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", uploadPreset);
      fd.append("folder", folder);
      // Auto-generate a unique public_id based on timestamp
      fd.append("public_id", `${folder}_${Date.now()}`);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: fd },
      );

      if (!res.ok) throw new Error("Upload failed.");

      const data = await res.json();

      // Use the secure_url — HTTPS, CDN-delivered
      setPreview(data.secure_url);
      onChange(data.secure_url);
    } catch {
      setError("Upload failed. Please try again.");
      setPreview(value ?? null); // revert to original on failure
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label
        className="block text-xs font-medium"
        style={{ color: adminColors.textSecondary }}
      >
        Profile Photo
      </label>

      {preview ? (
        /* ── Preview state ── */
        <div className="relative w-24 h-24">
          <img
            src={preview}
            alt="Teacher photo"
            className="w-24 h-24 rounded-xl object-cover border"
            style={{ borderColor: adminColors.border }}
          />
          {uploading && (
            <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-white" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-lg transition-opacity hover:opacity-80"
              style={{ background: "#f87171" }}
            >
              <X size={11} className="text-white" />
            </button>
          )}
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-all"
          style={{
            borderColor: dragOver ? "#f59e0b" : "rgba(255,255,255,0.1)",
            background: dragOver
              ? "rgba(245,158,11,0.05)"
              : "rgba(255,255,255,0.02)",
          }}
        >
          {uploading ? (
            <Loader2
              size={20}
              className="animate-spin"
              style={{ color: "#f59e0b" }}
            />
          ) : (
            <>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(245,158,11,0.1)" }}
              >
                <ImageIcon size={15} style={{ color: "#f59e0b" }} />
              </div>
              <div className="text-center">
                <p
                  className="text-xs font-medium"
                  style={{ color: adminColors.textSecondary }}
                >
                  <span style={{ color: "#f59e0b" }}>Click to upload</span> or
                  drag & drop
                </p>
                <p
                  className="text-[10px] mt-0.5"
                  style={{ color: adminColors.textMuted }}
                >
                  PNG, JPG, WEBP — max 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
