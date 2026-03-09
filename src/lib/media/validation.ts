export type MediaKind = "image" | "video";

export type ValidatedMedia = {
  kind: MediaKind;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
};

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);

const DEFAULT_MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB
const DEFAULT_MAX_VIDEO_BYTES = 20 * 1024 * 1024; // 20 MB

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function getMaxImageBytes() {
  return parsePositiveInt(process.env.MAX_IMAGE_BYTES, DEFAULT_MAX_IMAGE_BYTES);
}

export function getMaxVideoBytes() {
  return parsePositiveInt(process.env.MAX_VIDEO_BYTES, DEFAULT_MAX_VIDEO_BYTES);
}

export function detectMediaKind(mimeType: string): MediaKind | null {
  if (IMAGE_MIME_TYPES.has(mimeType)) return "image";
  if (VIDEO_MIME_TYPES.has(mimeType)) return "video";
  return null;
}

export function validateUploadFile(file: File): ValidatedMedia {
  if (!file) {
    throw new Error("No file provided.");
  }

  if (file.size <= 0) {
    throw new Error("Uploaded file is empty.");
  }

  const mimeType = file.type || "application/octet-stream";
  const kind = detectMediaKind(mimeType);

  if (!kind) {
    throw new Error(
      "Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM, MOV, AVI, MKV."
    );
  }

  const maxBytes = kind === "image" ? getMaxImageBytes() : getMaxVideoBytes();
  if (file.size > maxBytes) {
    const limitMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    throw new Error(`File is too large. Max ${kind} size is ${limitMb} MB.`);
  }

  return {
    kind,
    mimeType,
    sizeBytes: file.size,
    originalName: file.name || "upload",
  };
}
