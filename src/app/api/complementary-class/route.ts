import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/complementary-class — fetch music SubClasses for the form select
export async function GET() {
  try {
    const subClasses = await prisma.subClass.findMany({
      where: {
        isActive: true,
        class: { name: { contains: 'Music' } },
      },
      select: { id: true, name: true, name_ar: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ subClasses });
  } catch {
    return NextResponse.json({ error: 'Failed to load programs.' }, { status: 500 });
  }
}

// POST /api/complementary-class — submit a new request
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentName, dateOfBirth, subClassId, background, contactNumber, email, preferredDays } = body;

    if (!studentName || !dateOfBirth || !subClassId || !background || !contactNumber || !preferredDays?.length) {
      return NextResponse.json({ error: 'All required fields must be filled.' }, { status: 400 });
    }

    const request = await prisma.complementaryClassRequest.create({
      data: {
        studentName: studentName.trim(),
        dateOfBirth: new Date(dateOfBirth),
        subClassId,
        background,
        contactNumber: contactNumber.trim(),
        email: email?.trim() || null,
        preferredDays: JSON.stringify(preferredDays),
      },
    });

    return NextResponse.json({ success: true, id: request.id });
  } catch (err) {
    console.error('complementary-class POST error:', err);
    return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 });
  }
}
