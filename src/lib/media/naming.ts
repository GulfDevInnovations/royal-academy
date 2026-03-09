import { randomUUID } from "node:crypto";
import type { MediaKind } from "./validation";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/x-matroska": "mkv",
};

function sanitizeSegment(value: string) {
  const normalized = value.trim().toLowerCase();
  const cleaned = normalized.replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-");
  return cleaned.replace(/^-+/, "").replace(/-+$/, "") || "item";
}

function extensionFromName(name: string) {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

export function getFileExtension(mimeType: string, originalName: string) {
  const byMime = MIME_EXTENSION_MAP[mimeType];
  if (byMime) return byMime;

  const byName = extensionFromName(originalName);
  if (byName) return byName;

  return "bin";
}

export type BuildStorageKeyInput = {
  kind: MediaKind;
  mimeType: string;
  originalName: string;
  userId?: string | null;
  folder?: string;
  now?: Date;
};

export function buildStorageKey(input: BuildStorageKeyInput) {
  const folder = sanitizeSegment(input.folder || "media");
  const userSegment = input.userId ? sanitizeSegment(input.userId) : "anonymous";
  const date = input.now || new Date();
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  const ext = getFileExtension(input.mimeType, input.originalName);
  const fileName = `${randomUUID()}.${ext}`;

  return `${folder}/${userSegment}/${input.kind}/${year}/${month}/${day}/${fileName}`;
}
