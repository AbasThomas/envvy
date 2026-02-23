import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/http";
import { canAccessRepo } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

type Params = {
  params: Promise<{ repoId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const { repoId } = await params;
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const access = await canAccessRepo(user.id, repoId, "EDITOR");
  if (!access.ok) return fail("Forbidden", 403);

  const shares = await prisma.share.findMany({
    where: { repoId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({ shares });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { repoId } = await params;
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const access = await canAccessRepo(user.id, repoId, "EDITOR");
  if (!access.ok) return fail("Forbidden", 403);

  const shareId = request.nextUrl.searchParams.get("shareId");
  if (!shareId) return fail("shareId is required", 422);

  const deleted = await prisma.share.deleteMany({
    where: {
      id: shareId,
      repoId,
    },
  });

  if (!deleted.count) return fail("Share link not found", 404);

  return ok({ removed: true });
}
