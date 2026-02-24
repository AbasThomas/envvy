import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/http";
import { canAccessRepoWithPin } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

type Params = {
  params: Promise<{ repoId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const { repoId } = await params;
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const access = await canAccessRepoWithPin(request, user.id, repoId, "VIEWER");
  if (!access.ok) return fail(access.error, access.status);

  const environment = request.nextUrl.searchParams.get("environment");
  const history = await prisma.env.findMany({
    where: {
      repoId,
      ...(environment ? { environment } : {}),
    },
    select: {
      id: true,
      version: true,
      environment: true,
      commitMsg: true,
      diffSummary: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ environment: "asc" }, { version: "desc" }],
    take: 200,
  });

  return ok({ history });
}
