import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';

// Singleton pattern pour éviter de créer plusieurs instances de PrismaClient
// en développement avec hot reload de Next.js
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Créer l'adapter (fallback vers le fichier SQLite du projet)
const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || 'file:./data/dev.db',
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production')
{
    globalForPrisma.prisma = prisma;
}

export default prisma;
