import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

const followSchema = z.object({
  targetUserId: z.string(),
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const payload = await request.json().catch(() => null);
  const parsed = followSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());
  if (parsed.data.targetUserId === user.id) return fail("You cannot follow yourself", 422);

  const target = await prisma.user.findUnique({ where: { id: parsed.data.targetUserId } });
  if (!target) return fail("User not found", 404);

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: user.id,
        followingId: target.id,
      },
    },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
    return ok({ following: false });
  }

  await prisma.$transaction([
    prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: target.id,
      },
    }),
    prisma.notification.create({
      data: {
        userId: target.id,
        type: "SYSTEM",
        title: "New follower",
        body: `${user.name ?? user.email} followed you`,
      },
    }),
  ]);

  return ok({ following: true });
}
