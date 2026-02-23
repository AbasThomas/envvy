import { NextRequest } from "next/server";

import { decryptJson } from "@/lib/crypto";
import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const { slug } = await params;
  const environment = request.nextUrl.searchParams.get("environment") ?? "development";
  const decrypt = request.nextUrl.searchParams.get("decrypt") === "true";

  const repo = await prisma.repo.findFirst({
    where: {
      slug,
      OR: [
        { userId: user.id },
        { shares: { some: { userId: user.id } } },
        { isPublic: true },
      ],
    },
  });
  if (!repo) return fail("Repository not found", 404);

  const latest = await prisma.env.findFirst({
    where: {
      repoId: repo.id,
      environment,
    },
    orderBy: { version: "desc" },
  });
  if (!latest) return fail("No snapshot found", 404);

  if (!decrypt) {
    return ok({
      repo: { id: repo.id, slug: repo.slug, name: repo.name },
      env: latest,
    });
  }

  try {
    const userKey = request.headers.get("x-envii-user-key") ?? undefined;
    const values = decryptJson(latest.jsonBlob, userKey);
    return ok({
      repo: { id: repo.id, slug: repo.slug, name: repo.name },
      env: {
        ...latest,
        values,
      },
    });
  } catch {
    return fail("Unable to decrypt snapshot", 422);
  }
}
