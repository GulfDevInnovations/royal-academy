import { describe, expect, it } from "vitest";
import { detectMediaKind, validateUploadFile } from "./validation";

describe("detectMediaKind", () => {
  it("detects image files", () => {
    expect(detectMediaKind("image/png")).toBe("image");
    expect(detectMediaKind("image/jpeg")).toBe("image");
  });

  it("detects video files", () => {
    expect(detectMediaKind("video/mp4")).toBe("video");
    expect(detectMediaKind("video/webm")).toBe("video");
  });

  it("returns null for unsupported files", () => {
    expect(detectMediaKind("application/pdf")).toBeNull();
  });
});

describe("validateUploadFile", () => {
  it("accepts a valid image file", () => {
    const file = new File(["hello"], "photo.png", {
      type: "image/png",
    });

    expect(validateUploadFile(file)).toEqual({
      kind: "image",
      mimeType: "image/png",
      sizeBytes: file.size,
      originalName: "photo.png",
    });
  });

  it("throws error for unsupported file type", () => {
    const file = new File(["hello"], "document.pdf", {
      type: "application/pdf",
    });

    expect(() => validateUploadFile(file)).toThrow("Unsupported file type");
  });

  it("throws error for empty file", () => {
    const file = new File([], "empty.png", {
      type: "image/png",
    });

    expect(() => validateUploadFile(file)).toThrow("Uploaded file is empty");
  });
});
