import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        imageUrl: null,
        displayName: null,
      });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        image: true,
        email: true,
        studentProfile: { select: { firstName: true } },
        teacherProfile: { select: { firstName: true } },
        adminProfile: { select: { firstName: true } },
      },
    });

    const displayName =
      dbUser?.studentProfile?.firstName ||
      dbUser?.teacherProfile?.firstName ||
      dbUser?.adminProfile?.firstName ||
      session.user.name?.split(' ')[0] ||
      session.user.email?.split('@')[0] ||
      'User';

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
