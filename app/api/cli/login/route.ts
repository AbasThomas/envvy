import { compare } from "bcryptjs";
import { NextRequest } from "next/server";
import { z } from "zod";

import { createApiToken } from "@/lib/crypto";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid credentials payload", 422, parsed.error.flatten());

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !user.passwordHash) return fail("Invalid credentials", 401);

  const valid = await compare(parsed.data.password, user.passwordHash);
  if (!valid) return fail("Invalid credentials", 401);

  const apiToken = user.apiToken ?? createApiToken();
  if (!user.apiToken) {
    await prisma.user.update({
      where: { id: user.id },
      data: { apiToken },
    });
  }

  return ok({
    token: apiToken,
    user: {
      id: user.id,
      email: user.email,
      planTier: user.planTier,
    },
  });
}
