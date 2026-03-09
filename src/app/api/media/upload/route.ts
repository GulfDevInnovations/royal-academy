import { NextResponse } from "next/server";
import { uploadMedia } from "@/lib/media/service";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawFile = formData.get("file");
    const rawFolder = formData.get("folder");

    if (!(rawFile instanceof File)) {
      return NextResponse.json(
        { error: "file is required (multipart/form-data)" },
        { status: 400 }
      );
    }

    const folder =
      typeof rawFolder === "string" && rawFolder.trim().length > 0
        ? rawFolder.trim()
        : undefined;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const result = await uploadMedia({
      file: rawFile,
      userId: user?.id ?? null,
      folder,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed unexpectedly.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
