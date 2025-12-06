import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Créer un pool de connexion PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Créer l'adaptateur Prisma pour PostgreSQL
const adapter = new PrismaPg(pool)

// Initialiser le PrismaClient avec l'adaptateur
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
