import { Prisma } from "@prisma/client";

const CONNECTIVITY_ERROR_CODES = new Set(["P1000", "P1001", "P1002", "P1008", "P1017"]);
const RETRY_BACKOFF_MS = 15_000;

let unavailableUntil = 0;
let lastLogAt = 0;

function messageIndicatesConnectivityIssue(message: string) {
  return /(Can't reach database server|Tenant or user not found|timed out|ECONNREFUSED|ENOTFOUND|EHOSTUNREACH|Connection terminated)/i.test(
    message,
  );
}

function summarizeError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return `${error.code}: ${error.message}`;
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function isPrismaConnectivityError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return CONNECTIVITY_ERROR_CODES.has(error.code);
  }
  if (error instanceof Error) {
    return messageIndicatesConnectivityIssue(error.message);
  }
  return false;
}

function logConnectivityFailure(context: string, error: unknown) {
  const now = Date.now();
  if (now - lastLogAt < RETRY_BACKOFF_MS) return;

  lastLogAt = now;
  const summary = summarizeError(error).replace(/\s+/g, " ").trim();
  console.error(`[prisma] ${context}: ${summary}`);
}

export async function withPrismaResilience<T>(context: string, operation: () => Promise<T>, fallback: T): Promise<T> {
  if (Date.now() < unavailableUntil) return fallback;

  try {
    return await operation();
  } catch (error) {
    if (!isPrismaConnectivityError(error)) throw error;

    unavailableUntil = Date.now() + RETRY_BACKOFF_MS;
    logConnectivityFailure(context, error);
    return fallback;
  }
}
