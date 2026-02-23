import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/http";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return fail("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const reference = body?.reference as string | undefined;
  if (!reference) return fail("reference is required", 422);

  const payment = await prisma.payment.findFirst({
    where: {
      reference,
      userId: user.id,
    },
  });
  if (!payment) return fail("Payment not found", 404);

  try {
    const result = await verifyPaystackTransaction(reference);
    const status = result.data?.status;
    const successful = status === "success";

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: successful ? "ACTIVE" : "FAILED",
        paystackSubId:
          result.data?.subscription?.subscription_code ??
          result.data?.plan_object?.plan_code ??
          payment.paystackSubId,
        rawPayload: result,
      },
    });

    if (successful) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          planTier: payment.planTier,
          paystackSubscription:
            result.data?.subscription?.subscription_code ?? user.paystackSubscription,
          paystackCustomerCode:
            result.data?.customer?.customer_code ?? user.paystackCustomerCode,
        },
      });
    }

    return ok({ success: successful, status });
  } catch (error) {
    return fail("Could not verify payment", 502, {
      message: error instanceof Error ? error.message : "Unknown verify error",
    });
  }
}
