// src/app/api/auth/check/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    // Get student profile linked to this user
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      include: { studentProfile: true },
    });

    if (!dbUser?.studentProfile) {
      return NextResponse.json({
        authenticated: true,
        studentId: null,
        noProfile: true,
      });
    }

    return NextResponse.json({
      authenticated: true,
      studentId: dbUser.studentProfile.id,
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}