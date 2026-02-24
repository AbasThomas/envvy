import { NextRequest } from "next/server";
import { z } from "zod";

import { decryptJson } from "@/lib/crypto";
import { stringifyDotEnv } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { canAccessRepoWithPin } from "@/lib/repo-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

const ciSchema = z.object({
  repoId: z.string(),
  provider: z.enum(["vercel", "netlify", "github-actions"]),
  environment: z.enum(["development", "staging", "production"]).default("development"),
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = ciSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const access = await canAccessRepoWithPin(request, user.id, parsed.data.repoId, "VIEWER");
  if (!access.ok) return fail(access.error, access.status);

  const latest = await prisma.env.findFirst({
    where: {
      repoId: parsed.data.repoId,
      environment: parsed.data.environment,
    },
    orderBy: { version: "desc" },
  });
  if (!latest) return fail("No environment data found", 404);

  try {
    const userSecret = request.headers.get("x-envii-user-key") ?? undefined;
    const envMap = decryptJson(latest.jsonBlob, userSecret);
    const dotenv = stringifyDotEnv(envMap);

    return ok({
      provider: parsed.data.provider,
      environment: parsed.data.environment,
      dotenv,
      guide:
        parsed.data.provider === "vercel"
          ? "Use `vercel env add` for each key."
          : parsed.data.provider === "netlify"
            ? "Use Netlify UI/API to set site environment variables."
            : "Map keys in GitHub Actions `env:` section.",
    });
  } catch {
    return fail("Could not decrypt environment snapshot for CI export", 422);
  }
}
