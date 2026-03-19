
import { NextResponse } from "next/server";
import { getTeachers } from "@/lib/actions/admin/teachers.actions";

export async function GET() {
  try {
    const teachers = await getTeachers();
    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}