import { randomUUID } from "crypto";

import { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/http";
import { initializePaystackTransaction } from "@/lib/paystack";
import { PLAN_MATRIX } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

const initSchema = z.object({
  planTier: z.enum(["BASIC", "PRO", "TEAM"]),
});

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const payload = await request.json().catch(() => null);
  const parsed = initSchema.safeParse(payload);
  if (!parsed.success) return fail("Invalid payload", 422, parsed.error.flatten());

  const plan = PLAN_MATRIX[parsed.data.planTier];
  const reference = `envii_${user.id}_${randomUUID()}`;

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      planTier: parsed.data.planTier,
      amount: plan.monthlyNgn,
      reference,
      status: "PENDING",
    },
  });

  try {
    const transaction = await initializePaystackTransaction({
      email: user.email,
      amountKobo: plan.monthlyNgn * 100,
      callbackUrl: `${request.nextUrl.origin}/billing?reference=${reference}`,
      reference,
      metadata: {
        userId: user.id,
        planTier: parsed.data.planTier,
        paymentId: payment.id,
      },
    });

    return ok({
      reference,
      authorizationUrl: transaction.data?.authorization_url,
      accessCode: transaction.data?.access_code,
    });
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        rawPayload: {
          message: error instanceof Error ? error.message : "Paystack initialize failed",
        },
      },
    });
    return fail("Could not initialize billing", 502);
  }
}
