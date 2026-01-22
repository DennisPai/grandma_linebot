import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client 單例
 * 避免在開發環境中建立多個實例
 */

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
