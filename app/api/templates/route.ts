import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/http";
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

  const repo = await prisma.repo.findUnique({
    where: { id: parsed.data.repoId },
  });
  if (!repo) return fail("Repository not found", 404);
  if (repo.userId !== user.id) return fail("Only owner can publish templates", 403);

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
