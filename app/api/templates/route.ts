import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/http";
import { canAccessRepoWithPin } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

const createTemplateSchema = z.object({
  repoId: z.string(),
  name: z.string().min(2).max(80),
  description: z.string().min(4).max(1000),
  priceNgn: z.number().int().min(100).max(2000).default(400),
});

export async function GET() {
  const templates = await prisma.template.findMany({
    include: {
      repo: {
        select: {
          id: true,
          name: true,
          slug: true,
          tags: true,
          owner: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: {
          purchases: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });

  return ok({ templates });
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const payload = await request.json().catch(() => null);
  const parsed = createTemplateSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const access = await canAccessRepoWithPin(request, user.id, parsed.data.repoId, "OWNER");
  if (!access.ok || !access.repo) return fail(access.error, access.status);

  const template = await prisma.template.create({
    data: {
      repoId: parsed.data.repoId,
      name: parsed.data.name,
      description: parsed.data.description,
      priceNgn: parsed.data.priceNgn,
    },
  });

  return ok({ template }, 201);
}
