// lib/user.ts
import { prisma } from '@/lib/prisma'
import type { User } from '@prisma/client'

export async function getUserById(supabaseId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id: supabaseId }
  })
}

// Use this in server components when you need full user data
export async function getFullUser(supabaseId: string): Promise<User> {
  const user = await getUserById(supabaseId)
  if (!user) throw new Error(`User not found for id: ${supabaseId}`)
  return user
}