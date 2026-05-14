import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://royalacadeymct.com';
  const token = searchParams.get('token');
  const userId = searchParams.get('userId');
  const locale = searchParams.get('locale') ?? 'en';

  if (!token || !userId) {
    return NextResponse.redirect(
      `${origin}/${locale}/login?error=invalid_link`,
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (
    !user ||
    user.resetToken !== token ||
    !user.resetTokenExpiry ||
    user.resetTokenExpiry < new Date()
  ) {
    return NextResponse.redirect(
      `${origin}/${locale}/login?error=link_expired`,
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isVerified: true,
      emailVerified: new Date(),
      isActive: true,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.redirect(`${origin}/${locale}/login?verified=true`);
}
