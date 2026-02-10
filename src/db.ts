import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from './generated/prisma/client';

const adapter = new PrismaBetterSqlite3({
  url: process.env["DATABASE_URL"]
})

/**
 * Prisma client instance
 *
 * Logging enabled for:
 * - warn: non-fatal issues
 * - error: query / engine errors
 *
 * In prod, route this to structured logger.
 */
export const prisma = new PrismaClient({
  adapter,
  log: ["warn", "error"] // TODO Structured + centralized
});
