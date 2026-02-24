import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/http";
import { canAccessRepoWithPin } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

const slackSchema = z.object({
  repoId: z.string(),
  webhookUrl: z.string().url(),
  message: z.string().min(1).max(500).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = slackSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const access = await canAccessRepoWithPin(request, user.id, parsed.data.repoId, "EDITOR");
  if (!access.ok || !access.repo) return fail(access.error, access.status);

  const latest = await prisma.env.findFirst({
    where: { repoId: parsed.data.repoId },
    orderBy: { createdAt: "desc" },
  });

  const text =
    parsed.data.message ??
    `envii update: ${access.repo.name} now at ${latest?.environment ?? "unknown"} v${latest?.version ?? 0}`;

  await fetch(parsed.data.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
    }),
  });

  return ok({ sent: true, text });
}
