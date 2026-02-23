import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return fail("Invite token is required", 422);

  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const share = await prisma.share.findFirst({
    where: { token },
  });
  if (!share) return fail("Invite not found", 404);
  if (share.expiresAt && share.expiresAt < new Date()) return fail("Invite expired", 410);

  await prisma.share.update({
    where: { id: share.id },
    data: {
      userId: user.id,
      acceptedAt: new Date(),
      token: null,
    },
  });

  return ok({ accepted: true, repoId: share.repoId });
}
