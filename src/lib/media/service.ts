import "server-only";

import { createStorageAdapter } from "@/lib/storage/factory";
import { buildStorageKey } from "./naming";
import { validateUploadFile } from "./validation";

export type UploadMediaInput = {
  file: File;
  userId?: string | null;
  folder?: string;
};

export type UploadMediaResult = {
  provider: "LOCAL" | "HOSTINGER";
  key: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
  kind: "image" | "video";
  originalName: string;
};

export async function uploadMedia(input: UploadMediaInput): Promise<UploadMediaResult> {
  const validated = validateUploadFile(input.file);
  const key = buildStorageKey({
    kind: validated.kind,
    mimeType: validated.mimeType,
    originalName: validated.originalName,
    userId: input.userId,
    folder: input.folder,
  });

  const bytes = await input.file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const storage = createStorageAdapter();
  const result = await storage.put({
    key,
    buffer,
    contentType: validated.mimeType,
    visibility: "public",
  });

  return {
    provider: result.provider,
    key: result.key,
    url: result.url,
    sizeBytes: result.sizeBytes,
    mimeType: validated.mimeType,
    kind: validated.kind,
    originalName: validated.originalName,
  };
}

export async function deleteMediaByKey(key: string): Promise<void> {
  const storage = createStorageAdapter();
  await storage.remove(key);
}

export function getMediaUrlByKey(key: string): string {
  const storage = createStorageAdapter();
  return storage.getPublicUrl(key);
}
