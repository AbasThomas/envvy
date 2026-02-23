import { randomUUID } from "crypto";

import { NextRequest } from "next/server";
import { z } from "zod";

import { enforceFeature } from "@/lib/api-guards";
import { fail, ok } from "@/lib/http";
import { canAccessRepo } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

const shareSchema = z.object({
  repoId: z.string(),
  inviteEmail: z.string().email().optional(),
  inviteUserId: z.string().optional(),
  role: z.enum(["VIEWER", "CONTRIB", "EDITOR"]).default("VIEWER"),
  expiresInHours: z.number().int().positive().max(24 * 14).default(24 * 7),
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const feature = await enforceFeature(user.id, "allowSharing");
  if (!feature.allowed) return fail(feature.reason, 403);

  const payload = await request.json().catch(() => null);
  const parsed = shareSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const access = await canAccessRepo(user.id, parsed.data.repoId, "EDITOR");
  if (!access.ok || !access.repo) return fail("Forbidden", 403);

  if (!parsed.data.inviteEmail && !parsed.data.inviteUserId) {
    return fail("inviteEmail or inviteUserId is required", 422);
  }

  const invitee = parsed.data.inviteUserId
    ? await prisma.user.findUnique({ where: { id: parsed.data.inviteUserId } })
    : parsed.data.inviteEmail
      ? await prisma.user.findUnique({
          where: { email: parsed.data.inviteEmail.toLowerCase() },
        })
      : null;

  const expiresAt = new Date(Date.now() + parsed.data.expiresInHours * 60 * 60 * 1000);
  const token = randomUUID();

  const share = await prisma.share.create({
    data: {
      repoId: parsed.data.repoId,
      userId: invitee?.id,
      invitedById: user.id,
      inviteEmail: parsed.data.inviteEmail?.toLowerCase(),
      role: parsed.data.role,
      token,
      expiresAt,
    },
  });

  if (invitee?.id) {
    await prisma.notification.create({
      data: {
        userId: invitee.id,
        repoId: parsed.data.repoId,
        type: "SHARE",
        title: "Repository invite",
        body: `${user.name ?? user.email} invited you to collaborate on ${access.repo.name}`,
      },
    });
  }

  const inviteUrl = `${request.nextUrl.origin}/api/share/accept?token=${token}`;
  return ok({ share, inviteUrl }, 201);
}
