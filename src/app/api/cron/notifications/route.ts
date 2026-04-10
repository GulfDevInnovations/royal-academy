// src/app/api/cron/notifications/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Royal Academy — Cron Notification Route
//
// Called by your cron provider (Vercel Cron, GitHub Actions, external cron)
// every hour (or as often as you want — the service is idempotent).
//
// SECURITY: Protected by CRON_SECRET header.
// Set CRON_SECRET=<random-string> in your environment variables.
//
// Vercel Cron setup (vercel.json):
// {
//   "crons": [
//     { "path": "/api/cron/notifications", "schedule": "0 * * * *" }
//   ]
// }
//
// For external crons (cron-job.org, EasyCron, GitHub Actions):
// Call: GET https://yourdomain.com/api/cron/notifications
// Header: Authorization: Bearer <CRON_SECRET>
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import {
  sendSessionReminders,
  sendBirthdayGreetings,
} from "@/lib/notifications/auto-notification-service";

export async function GET(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = req.headers.get("authorization");
    const token      = authHeader?.replace("Bearer ", "");
    if (token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    // In development, allow without auth but warn
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 }
      );
    }
    console.warn("[cron/notifications] CRON_SECRET not set — running without auth (dev mode)");
  }

  // ── Run both notification jobs ───────────────────────────────────────────────
  const startTime = Date.now();
  const results: Record<string, unknown> = {};

  try {
    console.log("[cron/notifications] Running session reminders...");
    results.sessionReminders = await sendSessionReminders();
  } catch (err) {
    console.error("[cron/notifications] Session reminders failed:", err);
    results.sessionReminders = { error: String(err) };
  }

  try {
    console.log("[cron/notifications] Running birthday greetings...");
    results.birthdayGreetings = await sendBirthdayGreetings();
  } catch (err) {
    console.error("[cron/notifications] Birthday greetings failed:", err);
    results.birthdayGreetings = { error: String(err) };
  }

  const elapsed = Date.now() - startTime;

  console.log("[cron/notifications] Done in", elapsed, "ms:", results);

  return NextResponse.json({
    ok:      true,
    elapsed: `${elapsed}ms`,
    results,
  });
}