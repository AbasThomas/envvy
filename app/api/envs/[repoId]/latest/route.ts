import { NextRequest } from "next/server";

import { decryptJson } from "@/lib/crypto";
import { fail, ok } from "@/lib/http";
import { canAccessRepoWithPin } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

type Params = {
  params: Promise<{ repoId: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const { repoId } = await params;
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const access = await canAccessRepoWithPin(request, user.id, repoId, "VIEWER");
  if (!access.ok) return fail(access.error, access.status);

  const environment =
    request.nextUrl.searchParams.get("environment") ?? access.repo?.defaultEnv ?? "development";
  const decrypt = request.nextUrl.searchParams.get("decrypt") === "true";

  const latest = await prisma.env.findFirst({
    where: {
      repoId,
      environment,
    },
    orderBy: {
      version: "desc",
    },
  });

  if (!latest) return fail("No environment snapshot found", 404);

  if (!decrypt) {
    return ok({ env: latest });
  }

  try {
    const userSecret = request.headers.get("x-envii-user-key") ?? undefined;
    const json = decryptJson(latest.jsonBlob, userSecret);
    return ok({
      env: {
        ...latest,
        decrypted: json,
      },
    });
  } catch (error) {
    return fail("Could not decrypt payload", 422, {
      message: error instanceof Error ? error.message : "Unknown decryption error",
    });
  }
}
