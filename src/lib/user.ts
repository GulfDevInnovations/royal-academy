// lib/user.ts
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function getFullUser(id: string): Promise<User> {
  const user = await getUserById(id);
  if (!user) throw new Error(`User not found: ${id}`);
  return user;
}
