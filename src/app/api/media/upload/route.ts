import { auth } from '@/lib/auth';
import { uploadMedia } from '@/lib/media/service';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawFile = formData.get('file');
    const rawFolder = formData.get('folder');

    if (!(rawFile instanceof File)) {
      return NextResponse.json(
        { error: 'file is required (multipart/form-data)' },
        { status: 400 },
      );
    }

    const folder =
      typeof rawFolder === 'string' && rawFolder.trim().length > 0
        ? rawFolder.trim()
        : undefined;

    const session = await auth();
    const user = session?.user;

    const result = await uploadMedia({
      file: rawFile,
      userId: user?.id ?? null,
      folder,
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Upload failed unexpectedly.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
