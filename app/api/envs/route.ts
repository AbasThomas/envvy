import { diffString } from "json-diff";
import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/http";
import { canAccessRepoWithPin } from "@/lib/repo-access";
import { decryptJson, encryptJson } from "@/lib/crypto";
import { envDiff } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

const commitSchema = z.object({
  repoId: z.string().min(1),
  environment: z.enum(["development", "staging", "production"]).default("development"),
  commitMsg: z.string().min(2).max(240),
  env: z.record(z.string(), z.string()).optional(),
  encryptedBlob: z.string().optional(),
  clientEncrypted: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const payload = await request.json().catch(() => null);
  const parsed = commitSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const access = await canAccessRepoWithPin(request, user.id, parsed.data.repoId, "EDITOR");
  if (!access.ok || !access.repo) return fail(access.error, access.status);

  const latest = await prisma.env.findFirst({
    where: {
      repoId: parsed.data.repoId,
      environment: parsed.data.environment,
    },
    orderBy: { version: "desc" },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  let jsonBlob: string;
  if (parsed.data.clientEncrypted && parsed.data.encryptedBlob) {
    jsonBlob = parsed.data.encryptedBlob;
  } else if (parsed.data.env) {
    const userSecret = request.headers.get("x-envii-user-key") ?? undefined;
    jsonBlob = encryptJson(parsed.data.env, userSecret);
  } else {
    return fail("Either env or encryptedBlob is required", 422);
  }

  let diffSummary = "initial commit";
  if (latest && parsed.data.env) {
    try {
      const userSecret = request.headers.get("x-envii-user-key") ?? undefined;
      const previous = decryptJson(latest.jsonBlob, userSecret);
      const delta = envDiff(previous, parsed.data.env);
      diffSummary = `+${delta.added.length} ~${delta.changed.length} -${delta.removed.length}`;
    } catch {
      diffSummary = "encrypted diff unavailable";
    }
  }

  const env = await prisma.env.create({
    data: {
      repoId: parsed.data.repoId,
      userId: user.id,
      environment: parsed.data.environment,
      version: nextVersion,
      jsonBlob,
      commitMsg: parsed.data.commitMsg,
      diffSummary,
    },
  });

  await prisma.auditLog.create({
    data: {
      repoId: parsed.data.repoId,
      userId: user.id,
      action: "env.commit",
      metadata: {
        version: nextVersion,
        environment: parsed.data.environment,
      },
    },
  });

  return ok({ env }, 201);
}

const diffSchema = z.object({
  from: z.record(z.string(), z.string()),
  to: z.record(z.string(), z.string()),
});

export async function PUT(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = diffSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  return ok({
    summary: diffString(parsed.data.from, parsed.data.to),
    metrics: envDiff(parsed.data.from, parsed.data.to),
  });
}
