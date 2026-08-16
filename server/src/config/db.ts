// Prisma client singleton.
//
// Why a singleton: `tsx watch` re-executes modules on every file change in
// dev. Without this guard, every reload would open a fresh PrismaClient
// (and a fresh pool of MySQL connections) without closing the old one,
// eventually exhausting the connection pool. Caching the instance on
// `globalThis` in non-production survives the module reload.

import { PrismaClient } from "@prisma/client";

import { isProduction } from "./env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ["error", "warn"] : ["query", "error", "warn"]
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
