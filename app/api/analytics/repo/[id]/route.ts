import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/http";
import { canAccessRepo } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const access = await canAccessRepo(user.id, id, "VIEWER");
  if (!access.ok || !access.repo) return fail("Forbidden", 403);

  const [totalVersions, latestCommits, stars, forks, auditCount] = await Promise.all([
    prisma.env.count({ where: { repoId: id } }),
    prisma.env.findMany({
      where: { repoId: id },
      select: { id: true, version: true, environment: true, createdAt: true },
      take: 30,
      orderBy: { createdAt: "desc" },
    }),
    prisma.star.count({ where: { repoId: id } }),
    prisma.fork.count({ where: { originalRepoId: id } }),
    prisma.auditLog.count({ where: { repoId: id } }),
  ]);

  const churnByEnv = latestCommits.reduce<Record<string, number>>((acc, commit) => {
    acc[commit.environment] = (acc[commit.environment] ?? 0) + 1;
    return acc;
  }, {});

  return ok({
    summary: {
      totalVersions,
      stars,
      forks,
      auditCount,
      views: access.repo.viewsCount,
    },
    churnByEnv,
    recentCommits: latestCommits,
  });
}
