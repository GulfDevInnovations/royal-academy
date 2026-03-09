import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, imageUrl: null });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { image: true },
    });

    return NextResponse.json({
      authenticated: true,
      imageUrl: dbUser?.image ?? null,
    });
  } catch {
    return NextResponse.json({ authenticated: false, imageUrl: null });
  }
}
