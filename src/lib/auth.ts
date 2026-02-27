// lib/auth.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

// Use this when user MUST be logged in (server components/pages)
// Redirects if not authenticated
export async function requireUser(): Promise<User> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) redirect('/login')

  return user // guaranteed non-null here
}

// Use this when auth is optional
export async function getOptionalUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}