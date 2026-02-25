import { compare } from "bcryptjs";
import { NextRequest } from "next/server";
import { z } from "zod";

import { createApiToken } from "@/lib/crypto";
import { isValidCliPin } from "@/lib/cli-pin";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { isPrismaConnectivityError } from "@/lib/prisma-resilience";
import { rateLimit } from "@/lib/rate-limit";

const passwordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const pinLoginSchema = z.object({
  email: z.string().email(),
  pin: z.string().regex(/^\d{6}$/),
});

const loginSchema = z.union([passwordLoginSchema, pinLoginSchema]);

type CliPinRow = {
  cli_pin_hash: string | null;
  onboarding_completed: boolean;
};

async function readCliPinRow(userId: string) {
  const rows = await prisma.$queryRaw<Array<CliPinRow>>`
    SELECT "cli_pin_hash", "onboarding_completed"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid credentials payload", 422, parsed.error.flatten());

  try {
    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return fail("Invalid credentials", 401);

    if ("pin" in parsed.data) {
      const pin = parsed.data.pin;
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
      const limit = rateLimit(`cli-pin-login:${email}:${ip}`, {
        max: 5,
        windowMs: 15 * 60_000,
      });
      if (!limit.ok) {
        return fail("Too many invalid PIN attempts. Use email/password login to continue.", 429, {
          retryAfterMs: limit.retryAfterMs,
        });
      }

      if (!isValidCliPin(pin)) {
        return fail("Invalid CLI PIN", 401);
      }

      const pinState = await readCliPinRow(user.id);
      if (!pinState?.cli_pin_hash) {
        return fail(
          "CLI PIN is not configured for this account. Login with email/password first.",
          403,
        );
      }

      const pinValid = await compare(pin, pinState.cli_pin_hash);
      if (!pinValid) return fail("Invalid CLI PIN", 401);

      await prisma.$executeRaw`
        UPDATE "User"
        SET "cli_pin_last_used_at" = NOW()
        WHERE "id" = ${user.id}
      `;
    } else {
      const password = parsed.data.password;
      if (!user.passwordHash) return fail("Password login is not enabled for this account", 401);
      const valid = await compare(password, user.passwordHash);
      if (!valid) return fail("Invalid credentials", 401);
    }

    const apiToken = user.apiToken ?? createApiToken();
    if (!user.apiToken) {
      await prisma.user.update({
        where: { id: user.id },
        data: { apiToken },
      });
    }

    const pinState = await readCliPinRow(user.id);
    return ok({
      token: apiToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planTier: user.planTier,
        hasCliPin: !!pinState?.cli_pin_hash,
        onboardingCompleted: pinState?.onboarding_completed ?? false,
      },
    });
  } catch (error) {
    if (isPrismaConnectivityError(error)) {
      return fail("Database temporarily unavailable. Please try again.", 503);
    }

    console.error("[api][cli-login] unexpected error", error);
    return fail("Unable to complete login", 500);
  }
}
