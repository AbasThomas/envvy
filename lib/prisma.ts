import { Prisma, PrismaClient } from "@prisma/client";

declare global {
  var __enviiPrisma: PrismaClient | undefined;
}

const globalForPrisma = globalThis as typeof globalThis & {
  __enviiPrisma?: PrismaClient;
};

const developmentLogs: Prisma.LogLevel[] =
  process.env.PRISMA_LOG_ERRORS === "true" ? ["warn", "error"] : ["warn"];

export const prisma =
  globalForPrisma.__enviiPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? developmentLogs : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__enviiPrisma = prisma;
}
