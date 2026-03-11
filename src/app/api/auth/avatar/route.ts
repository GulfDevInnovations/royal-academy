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
      return NextResponse.json({
        authenticated: false,
        imageUrl: null,
        displayName: null,
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        image: true,
        email: true,
        studentProfile: { select: { firstName: true } },
        teacherProfile: { select: { firstName: true } },
        adminProfile: { select: { firstName: true } },
      },
    });

    const metadataName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name.trim()
        : "";
    const dbName =
      dbUser?.studentProfile?.firstName ||
      dbUser?.teacherProfile?.firstName ||
      dbUser?.adminProfile?.firstName ||
      "";
    const emailName = dbUser?.email?.split("@")[0] || user.email?.split("@")[0] || "";
    const displayName = dbName || metadataName || emailName || "User";

    return NextResponse.json({
      authenticated: true,
      imageUrl: dbUser?.image ?? null,
      displayName,
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
      imageUrl: null,
      displayName: null,
    });
  }
}
