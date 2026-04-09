// app/api/locations/countries-cities/route.ts

import { NextResponse } from "next/server";
import { LOCATIONS } from "@/lib/data/locations";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ data: LOCATIONS });
}