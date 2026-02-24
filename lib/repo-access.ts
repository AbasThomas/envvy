import { compare } from "bcryptjs";
import type { ShareRole } from "@prisma/client";
import type { NextRequest } from "next/server";

import { isValidRepoPin } from "@/lib/repo-pin";
import { prisma } from "@/lib/prisma";

const SHARE_RANK: Record<ShareRole, number> = {
  VIEWER: 1,
  CONTRIB: 2,
  EDITOR: 3,
  OWNER: 4,
};

export async function canAccessRepo(
  userId: string,
  repoId: string,
  minimumRole: ShareRole = "VIEWER",
) {
  const repo = await prisma.repo.findUnique({
    where: { id: repoId },
    include: {
      shares: {
        where: {
          userId,
        },
      },
    },
  });

  if (!repo) return { ok: false, repo: null as typeof repo };
  if (repo.userId === userId) return { ok: true, repo };

  const share = repo.shares[0];
  if (!share) return { ok: false, repo };

  return {
    ok: SHARE_RANK[share.role] >= SHARE_RANK[minimumRole],
    repo,
  };
}

export async function canAccessRepoWithPin(
  request: NextRequest,
  userId: string,
  repoId: string,
  minimumRole: ShareRole = "VIEWER",
) {
  const access = await canAccessRepo(userId, repoId, minimumRole);
  if (!access.ok || !access.repo) {
    return {
      ok: false as const,
      status: access.repo ? 403 : 404,
      error: access.repo ? "Forbidden" : "Repository not found",
      repo: null,
    };
  }

  if (access.repo.isPublic) {
    return {
      ok: true as const,
      repo: access.repo,
    };
  }

  const pin = request.headers.get("x-envii-repo-pin")?.trim();
  if (!isValidRepoPin(pin)) {
    return {
      ok: false as const,
      status: 401,
      error: "Repository PIN required",
      repo: null,
    };
  }

  const pinRows = await prisma.$queryRaw<Array<{ repo_pin_hash: string | null }>>`
    SELECT "repo_pin_hash"
    FROM "Repo"
    WHERE "id" = ${access.repo.id}
    LIMIT 1
  `;
  const repoPinHash = pinRows[0]?.repo_pin_hash ?? null;

  if (!repoPinHash) {
    return {
      ok: false as const,
      status: 403,
      error: "Repository PIN is not configured",
      repo: null,
    };
  }

  const matches = await compare(pin, repoPinHash);
  if (!matches) {
    return {
      ok: false as const,
      status: 403,
      error: "Invalid repository PIN",
      repo: null,
    };
  }

  return {
    ok: true as const,
    repo: access.repo,
  };
}
