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

function isVideo(contentType: string) {
  return contentType.startsWith("video/");
}

export async function GET(
  request: Request,
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

    const ext = path.extname(absPath).slice(1).toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";

    // Mobile browsers require Range request support to play videos.
    // Without 206 Partial Content, iOS Safari and Android Chrome won't load video.
    if (isVideo(contentType)) {
      const stat = await fs.stat(absPath);
      const fileSize = stat.size;
      const rangeHeader = request.headers.get("range");

      if (rangeHeader) {
        // Parse "bytes=start-end"
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        const start = match?.[1] ? parseInt(match[1], 10) : 0;
        const end = match?.[2] ? parseInt(match[2], 10) : fileSize - 1;
        const clampedEnd = Math.min(end, fileSize - 1);
        const chunkSize = clampedEnd - start + 1;

        const buffer = Buffer.allocUnsafe(chunkSize);
        const fh = await fs.open(absPath, "r");
        try {
          await fh.read(buffer, 0, chunkSize, start);
        } finally {
          await fh.close();
        }

        return new NextResponse(buffer, {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Range": `bytes ${start}-${clampedEnd}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunkSize),
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }

      // No Range header — return full file but advertise range support
      const file = await fs.readFile(absPath);
      return new NextResponse(file, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Accept-Ranges": "bytes",
          "Content-Length": String(fileSize),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Non-video files: serve as before
    const file = await fs.readFile(absPath);
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
