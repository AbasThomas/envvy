import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

const profileSchema = z.object({
  name: z.string().min(2).max(64).optional(),
  bio: z.string().max(400).optional(),
  image: z.string().url().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const [repos, stars, followers, following] = await Promise.all([
    prisma.repo.count({ where: { userId: user.id } }),
    prisma.star.count({ where: { userId: user.id } }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ]);

  return ok({
    profile: {
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      image: user.image,
      planTier: user.planTier,
      referralCode: user.referralCode,
    },
    stats: { repos, stars, followers, following },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const payload = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
  });

  return ok({
    profile: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      bio: updated.bio,
      image: updated.image,
    },
  });
}
