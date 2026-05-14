import { NextResponse } from "next/server";
import { deleteMediaByKey } from "@/lib/media/service";

export const runtime = "nodejs";

async function handleDelete(request: Request) {
  try {
    const body = (await request.json()) as { key?: string };
    const key = body?.key?.trim();

    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    await deleteMediaByKey(key);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Delete failed unexpectedly.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  return handleDelete(request);
}

export async function POST(request: Request) {
  return handleDelete(request);
}
