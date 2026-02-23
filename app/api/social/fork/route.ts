import { NextRequest } from "next/server";
import { z } from "zod";

import { enforceFeature } from "@/lib/api-guards";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";
import { slugify } from "@/lib/utils";

const forkSchema = z.object({
  repoId: z.string(),
  name: z.string().min(2).max(64).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const feature = await enforceFeature(user.id, "allowForksAndStars");
  if (!feature.allowed) return fail(feature.reason, 403);

  const payload = await request.json().catch(() => null);
  const parsed = forkSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const source = await prisma.repo.findUnique({
    where: { id: parsed.data.repoId },
    include: {
      envs: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });
  if (!source) return fail("Source repository not found", 404);
  if (!source.isPublic && source.userId !== user.id) return fail("Cannot fork a private repository", 403);

  const forkName = parsed.data.name ?? `${source.name}-fork`;
  const forkSlug = slugify(forkName);

  const exists = await prisma.repo.findUnique({
    where: { userId_slug: { userId: user.id, slug: forkSlug } },
  });
  if (exists) return fail("You already have a repository with this slug", 409);

  const forkedRepo = await prisma.repo.create({
    data: {
      userId: user.id,
      name: forkName,
      slug: forkSlug,
      description: source.description,
      readme: source.readme,
      isPublic: false,
      tags: source.tags,
      forkedFromId: source.id,
      defaultEnv: source.defaultEnv,
    },
  });

  if (source.envs[0]) {
    await prisma.env.create({
      data: {
        repoId: forkedRepo.id,
        userId: user.id,
        environment: source.envs[0].environment,
        version: 1,
        jsonBlob: source.envs[0].jsonBlob,
        commitMsg: `Forked from ${source.name}`,
        diffSummary: "fork snapshot",
      },
    });
  }

  await prisma.$transaction([
    prisma.fork.create({
      data: {
        userId: user.id,
        repoId: forkedRepo.id,
        originalRepoId: source.id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: source.userId,
        repoId: source.id,
        type: "FORK",
        title: "Repository forked",
        body: `${user.name ?? user.email} forked ${source.name}`,
      },
    }),
  ]);

  return ok({ repo: forkedRepo }, 201);
}
