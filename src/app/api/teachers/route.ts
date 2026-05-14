
import { NextResponse } from "next/server";
import { getTeachers } from "@/lib/actions/admin/teachers.actions";
import { parseJsonArray } from "@/utils/parseJson";

export async function GET() {
  try {
    const teachers = await getTeachers();
    const serialized = teachers.map((t) => ({
      ...t,
      specialties: parseJsonArray<string>(t.specialties),
    }));
    return NextResponse.json(serialized);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}