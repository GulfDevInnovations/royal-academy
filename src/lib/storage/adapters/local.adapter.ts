import { promises as fs } from "node:fs";
import path from "node:path";
import { StorageAdapter, PutInput, PutResult } from "../types";

function ensureSafeKey(key: string) {
  const normalized = key.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}

export class LocalStorageAdapter implements StorageAdapter {
  private rootDir: string;
  private baseUrl: string;

  constructor() {
    this.rootDir =
      process.env.LOCAL_STORAGE_ROOT ||
      path.join(process.cwd(), "storage", "uploads");
    this.baseUrl =
      process.env.LOCAL_MEDIA_BASE_URL ||
      "http://localhost:3000/api/media/serve";
  }

  async put(input: PutInput): Promise<PutResult> {
    const safeKey = ensureSafeKey(input.key);
    const absPath = path.join(this.rootDir, safeKey);
    const dir = path.dirname(absPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(absPath, input.buffer);

    return {
      provider: "LOCAL",
      key: safeKey,
      url: this.getPublicUrl(safeKey),
      sizeBytes: input.buffer.byteLength,
      contentType: input.contentType,
    };
  }

  async remove(key: string): Promise<void> {
    const safeKey = ensureSafeKey(key);
    const absPath = path.join(this.rootDir, safeKey);

    try {
      await fs.unlink(absPath);
    } catch (error: unknown) {
      const e = error as NodeJS.ErrnoException;
      if (e.code !== "ENOENT") throw error;
    }
  }

  getPublicUrl(key: string): string {
    const safeKey = ensureSafeKey(key);
    return `${this.baseUrl}/${safeKey}`;
  }
}
