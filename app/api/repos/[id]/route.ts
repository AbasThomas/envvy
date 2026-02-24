import { hash } from "bcryptjs";
import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/http";
import { canAccessRepoWithPin } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { isValidRepoPin } from "@/lib/repo-pin";
import { getRequestUser } from "@/lib/server-auth";

const updateSchema = z.object({
  name: z.string().min(2).max(64).optional(),
  description: z.string().max(1000).nullable().optional(),
  readme: z.string().max(100_000).nullable().optional(),
  repoPin: z.string().regex(/^\d{6}$/).optional(),
  tags: z.array(z.string().min(1).max(24)).optional(),
  defaultEnv: z.enum(["development", "staging", "production"]).optional(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const viewer = await getRequestUser(request);
  if (!viewer) return fail("Unauthorized", 401);

  const access = await canAccessRepoWithPin(request, viewer.id, id, "VIEWER");
  if (!access.ok) return fail(access.error, access.status);

  const repo = await prisma.repo.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
        },
      },
      _count: {
        select: { stars: true, envs: true, shares: true },
      },
      envs: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          version: true,
          environment: true,
          commitMsg: true,
          diffSummary: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!repo) return fail("Repository not found", 404);

  await prisma.repo.update({
    where: { id: repo.id },
    data: { viewsCount: { increment: 1 } },
  });

  return ok({ repo });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const access = await canAccessRepoWithPin(request, user.id, id, "EDITOR");
  if (!access.ok || !access.repo) return fail(access.error, access.status);

  const payload = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());
  if (parsed.data.repoPin && !isValidRepoPin(parsed.data.repoPin)) {
    return fail("Repository PIN must be 6 digits", 422);
  }

  const updated = await prisma.repo.update({
    where: { id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      readme: parsed.data.readme,
      defaultEnv: parsed.data.defaultEnv,
      tags: parsed.data.tags?.map((t) => t.toLowerCase()),
      isPublic: false,
    },
  });

  if (parsed.data.repoPin) {
    await prisma.$executeRaw`
      UPDATE "Repo"
      SET "repo_pin_hash" = ${await hash(parsed.data.repoPin, 10)}
      WHERE "id" = ${id}
    `;
  }

  await prisma.auditLog.create({
    data: {
      repoId: id,
      userId: user.id,
      action: "repo.updated",
      metadata: {
        ...parsed.data,
        repoPin: parsed.data.repoPin ? "[updated]" : undefined,
      },
    },
  });

  return ok({ repo: updated });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const access = await canAccessRepoWithPin(request, user.id, id, "OWNER");
  if (!access.ok) return fail(access.error, access.status);

  const repo = await prisma.repo.findUnique({ where: { id } });
  if (!repo) return fail("Repository not found", 404);
  if (repo.userId !== user.id) return fail("Only repository owners can delete", 403);

  await prisma.repo.delete({ where: { id } });

  return ok({ success: true });
}
