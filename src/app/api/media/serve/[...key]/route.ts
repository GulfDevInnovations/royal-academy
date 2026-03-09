import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
};

function safeJoinKey(parts: string[]) {
  const key = parts.join("/").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!key || key.includes("..")) {
    throw new Error("Invalid media key");
  }
  return key;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key: keyParts } = await params;
    const key = safeJoinKey(keyParts);

    const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
    if (driver !== "local") {
      return NextResponse.json(
        { error: "Serve route is only available for local storage driver." },
        { status: 400 }
      );
    }

    const rootDir =
      process.env.LOCAL_STORAGE_ROOT ||
      path.join(process.cwd(), "storage", "uploads");

    const absPath = path.join(rootDir, key);
    const file = await fs.readFile(absPath);

    const ext = path.extname(absPath).slice(1).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    const e = error as NodeJS.ErrnoException;
    if (e.code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: e.message || "Failed to serve file" },
      { status: 400 }
    );
  }
}
