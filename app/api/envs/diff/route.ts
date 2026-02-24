import { diffString } from "json-diff";
import { NextRequest } from "next/server";
import { z } from "zod";

import { decryptJson } from "@/lib/crypto";
import { envDiff } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { canAccessRepoWithPin } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

const diffSchema = z.object({
  repoId: z.string(),
  environment: z.enum(["development", "staging", "production"]).default("development"),
  fromVersion: z.number().int().positive(),
  toVersion: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const payload = await request.json().catch(() => null);
  const parsed = diffSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const access = await canAccessRepoWithPin(request, user.id, parsed.data.repoId, "VIEWER");
  if (!access.ok) return fail(access.error, access.status);

  const [from, to] = await Promise.all([
    prisma.env.findFirst({
      where: {
        repoId: parsed.data.repoId,
        environment: parsed.data.environment,
        version: parsed.data.fromVersion,
      },
    }),
    prisma.env.findFirst({
      where: {
        repoId: parsed.data.repoId,
        environment: parsed.data.environment,
        version: parsed.data.toVersion,
      },
    }),
  ]);

  if (!from || !to) return fail("Version range not found", 404);

  try {
    const userSecret = request.headers.get("x-envii-user-key") ?? undefined;
    const fromEnv = decryptJson(from.jsonBlob, userSecret);
    const toEnv = decryptJson(to.jsonBlob, userSecret);

    return ok({
      metrics: envDiff(fromEnv, toEnv),
      unified: diffString(fromEnv, toEnv),
      fromVersion: from.version,
      toVersion: to.version,
    });
  } catch {
    return fail(
      "Encrypted snapshot diff unavailable without the original key or with client-side ciphertext.",
      422,
    );
  }
}
