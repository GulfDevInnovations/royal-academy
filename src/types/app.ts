// types/app.ts
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User as PrismaUser } from '@prisma/client'

// Your app's session context — combine both
export type AppUser = PrismaUser & {
  supabaseId: string
}

// Helper to extract just what you need from Supabase's user
export type AuthUser = Pick<SupabaseUser, 'id' | 'email' | 'created_at'>