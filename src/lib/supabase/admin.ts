// src/lib/supabase/admin.ts
// ─────────────────────────────────────────────────────────────
// Service-role Supabase client — NEVER import this in client
// components or expose it to the browser. Server only.
// ─────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

// This client bypasses Row Level Security and can write app_metadata.
// It uses the SERVICE_ROLE key — keep this secret, server-side only.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← never expose this to the client
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ─────────────────────────────────────────────────────────────
// Call this after creating/updating a user's role in Prisma.
// Writes role to app_metadata (tamper-proof — user cannot
// overwrite this themselves, unlike user_metadata).
// ─────────────────────────────────────────────────────────────
export async function syncRoleToAppMetadata(
  supabaseUserId: string,
  role: string
) {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    supabaseUserId,
    { app_metadata: { role } }
  );

  if (error) {
    console.error("[syncRoleToAppMetadata] Failed:", error.message);
    throw new Error("Could not sync role to auth metadata.");
  }
}