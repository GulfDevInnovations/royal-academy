// src/lib/supabase/admin.ts
// ─────────────────────────────────────────────────────────────
// Service-role Supabase client — NEVER import this in client
// components or expose it to the browser. Server only.
// ─────────────────────────────────────────────────────────────
import { createClient } from "@supabase/supabase-js";

// This client bypasses Row Level Security and can write app_metadata.
// It uses the SERVICE_ROLE key — keep this secret, server-side only.
function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn(
      "[supabaseAdmin] Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; skipping app_metadata updates."
    );
    return null;
  }

  // Best-effort sanity check: ensure the service-role key belongs to the same
  // Supabase project as the URL. If these don't match, Admin API calls fail
  // with "Invalid API key".
  try {
    const urlRef = supabaseUrl.split("https://")[1]?.split(".supabase.co")[0];
    const jwtPart = serviceRoleKey.split(".")[1];
    if (urlRef && jwtPart) {
      const normalized = jwtPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = normalized + "===".slice((normalized.length + 3) % 4);
      const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
      const keyRef = payload?.ref as string | undefined;
      if (keyRef && keyRef !== urlRef) {
        console.warn(
          `[supabaseAdmin] Project mismatch: NEXT_PUBLIC_SUPABASE_URL ref '${urlRef}' does not match SUPABASE_SERVICE_ROLE_KEY ref '${keyRef}'. Role sync will be skipped until envs are aligned.`
        );
        return null;
      }
    }
  } catch {
    // Ignore decode errors; we'll rely on the API call error message.
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Call this after creating/updating a user's role in Prisma.
// Writes role to app_metadata (tamper-proof — user cannot
// overwrite this themselves, unlike user_metadata).
// ─────────────────────────────────────────────────────────────
export async function syncRoleToAppMetadata(
  supabaseUserId: string,
  role: string
) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return;

  const normalizedRole = role.toUpperCase();

  // Merge into existing app_metadata to avoid overwriting provider fields.
  const existing = await supabaseAdmin.auth.admin.getUserById(supabaseUserId);
  const existingAppMetadata = (existing.data?.user?.app_metadata ?? {}) as Record<
    string,
    unknown
  >;

  const { error } = await supabaseAdmin.auth.admin.updateUserById(
    supabaseUserId,
    {
      app_metadata: {
        ...existingAppMetadata,
        role: normalizedRole,
      },
    }
  );

  if (error) {
    console.error(
      "[syncRoleToAppMetadata] Failed:",
      error.message,
      "(Check SUPABASE_SERVICE_ROLE_KEY matches the same project as SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL)"
    );
    // Don't block auth flows in dev if role sync fails.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Could not sync role to auth metadata.");
    }
  }
}