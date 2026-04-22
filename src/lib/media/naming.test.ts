import { describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", () => ({
  default: {
    randomUUID: () => "fixed-id",
  },
  randomUUID: () => "fixed-id",
}));

import { buildStorageKey, getFileExtension } from "./naming";

describe("getFileExtension", () => {
  it("uses mime type extension first", () => {
    expect(getFileExtension("image/jpeg", "photo.png")).toBe("jpg");
  });

  it("uses file name extension when mime type is unknown", () => {
    expect(getFileExtension("application/octet-stream", "archive.zip")).toBe(
      "zip",
    );
  });

  it("returns bin when no extension exists", () => {
    expect(getFileExtension("application/octet-stream", "file")).toBe("bin");
  });
});

describe("buildStorageKey", () => {
  it("builds a predictable storage key", () => {
    const result = buildStorageKey({
      kind: "image",
      mimeType: "image/png",
      originalName: "Photo.png",
      userId: "User 123",
      folder: "Gallery Uploads",
      now: new Date("2026-04-20T10:00:00Z"),
    });

    expect(result).toBe(
      "gallery-uploads/user-123/image/2026/04/20/fixed-id.png",
    );
  });

  it("uses anonymous when user id is missing", () => {
    const result = buildStorageKey({
      kind: "video",
      mimeType: "video/mp4",
      originalName: "dance.mp4",
      now: new Date("2026-04-20T10:00:00Z"),
    });

    expect(result).toBe("media/anonymous/video/2026/04/20/fixed-id.mp4");
  });
});
