import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Prisma cannot connect to the database. Set DATABASE_URL in your production environment.',
  )
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma