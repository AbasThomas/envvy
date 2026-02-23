import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const [current, referredUsers] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        referralCode: true,
        referralCredits: true,
      },
    }),
    prisma.user.findMany({
      where: { referredById: user.id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        planTier: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const referralUrl = `${request.nextUrl.origin}/register?ref=${current?.referralCode ?? ""}`;
  return ok({
    referralCode: current?.referralCode,
    referralCredits: current?.referralCredits ?? 0,
    referralUrl,
    referredUsers,
  });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const payload = await request.json().catch(() => ({}));
  const referredEmail = payload.email as string | undefined;
  if (!referredEmail) return fail("email is required", 422);

  await prisma.notification.create({
    data: {
      userId: user.id,
      type: "SYSTEM",
      title: "Referral invite queued",
      body: `Referral invite for ${referredEmail} tracked. Reward will apply on successful subscription.`,
    },
  });

  return ok({ invited: true });
}
