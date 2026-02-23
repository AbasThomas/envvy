import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return ok({ payments });
}
