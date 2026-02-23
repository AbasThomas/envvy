import { NextRequest } from "next/server";
import { z } from "zod";

import { enforceRepoLimit } from "@/lib/api-guards";
import { encryptJson } from "@/lib/crypto";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";
import { slugify } from "@/lib/utils";

const backupSchema = z.object({
  repoSlug: z.string().min(2).max(64),
  repoName: z.string().min(2).max(64).optional(),
  isPublic: z.boolean().default(false),
  environment: z.enum(["development", "staging", "production"]).default("development"),
  commitMsg: z.string().default("CLI backup"),
  env: z.record(z.string(), z.string()),
  clientEncrypted: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const payload = await request.json().catch(() => null);
  const parsed = backupSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  let repo = await prisma.repo.findUnique({
    where: {
      userId_slug: {
        userId: user.id,
        slug: slugify(parsed.data.repoSlug),
      },
    },
  });

  if (!repo) {
    const repoLimit = await enforceRepoLimit(user.id, parsed.data.isPublic);
    if (!repoLimit.allowed) return fail(repoLimit.reason, 403);

    repo = await prisma.repo.create({
      data: {
        userId: user.id,
        name: parsed.data.repoName ?? parsed.data.repoSlug,
        slug: slugify(parsed.data.repoSlug),
        isPublic: parsed.data.isPublic,
        tags: [],
        defaultEnv: parsed.data.environment,
      },
    });
  }

  const latest = await prisma.env.findFirst({
    where: { repoId: repo.id, environment: parsed.data.environment },
    orderBy: { version: "desc" },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  const userSecret = request.headers.get("x-envii-user-key") ?? undefined;
  const jsonBlob = parsed.data.clientEncrypted
    ? JSON.stringify(parsed.data.env)
    : encryptJson(parsed.data.env, userSecret);

  const env = await prisma.env.create({
    data: {
      repoId: repo.id,
      userId: user.id,
      environment: parsed.data.environment,
      version: nextVersion,
      jsonBlob,
      commitMsg: parsed.data.commitMsg,
      diffSummary: latest ? "cli backup update" : "cli backup initial",
    },
  });

  return ok({
    repo: {
      id: repo.id,
      name: repo.name,
      slug: repo.slug,
    },
    env: {
      id: env.id,
      version: env.version,
      environment: env.environment,
    },
  });
}
