import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/http";
import { canAccessRepoWithPin } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

const rollbackSchema = z.object({
  version: z.number().int().positive(),
  environment: z.enum(["development", "staging", "production"]).default("development"),
  commitMsg: z.string().default("Rollback commit"),
});

type Params = {
  params: Promise<{ repoId: string }>;
};

export async function POST(request: NextRequest, { params }: Params) {
  const { repoId } = await params;
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const access = await canAccessRepoWithPin(request, user.id, repoId, "EDITOR");
  if (!access.ok) return fail(access.error, access.status);

  const payload = await request.json().catch(() => null);
  const parsed = rollbackSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const target = await prisma.env.findFirst({
    where: {
      repoId,
      environment: parsed.data.environment,
      version: parsed.data.version,
    },
  });
  if (!target) return fail("Target version not found", 404);

  const latest = await prisma.env.findFirst({
    where: { repoId, environment: parsed.data.environment },
    orderBy: { version: "desc" },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  const created = await prisma.env.create({
    data: {
      repoId,
      userId: user.id,
      environment: parsed.data.environment,
      version: nextVersion,
      jsonBlob: target.jsonBlob,
      commitMsg: `${parsed.data.commitMsg} (from v${target.version})`,
      diffSummary: `rollback to v${target.version}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      repoId,
      userId: user.id,
      action: "env.rollback",
      metadata: {
        fromVersion: target.version,
        toVersion: nextVersion,
        environment: parsed.data.environment,
      },
    },
  });

  return ok({ env: created }, 201);
}
