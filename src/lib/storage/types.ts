// /Users/sadaf/Desktop/royal-academy/src/lib/storage/types.ts
export type StorageProvider = "LOCAL" | "HOSTINGER";

export type PutInput = {
  key: string;                 // e.g. "users/{userId}/images/abc.jpg"
  buffer: Buffer;
  contentType: string;         // "image/jpeg", "video/mp4"
  visibility?: "public";       // keep simple
};

export type PutResult = {
  provider: StorageProvider;
  key: string;
  url: string;                 // public URL returned to app
  sizeBytes: number;
  contentType: string;
};

export interface StorageAdapter {
  put(input: PutInput): Promise<PutResult>;
  remove(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
