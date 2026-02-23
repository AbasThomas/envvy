import { NextRequest } from "next/server";

import { fail, ok } from "@/lib/http";
import { verifyPaystackSignature } from "@/lib/paystack";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return fail("Invalid webhook signature", 401);
  }

  const event = JSON.parse(rawBody) as {
    event: string;
    data?: {
      reference?: string;
      status?: string;
      customer?: { email?: string; customer_code?: string };
      subscription_code?: string;
      metadata?: { userId?: string; planTier?: "BASIC" | "PRO" | "TEAM" };
    };
  };

  switch (event.event) {
    case "charge.success": {
      const reference = event.data?.reference;
      if (!reference) return ok({ received: true });

      const payment = await prisma.payment.findFirst({
        where: { reference },
      });
      if (!payment) return ok({ received: true });

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "ACTIVE",
          paystackSubId: event.data?.subscription_code ?? payment.paystackSubId,
          rawPayload: event,
        },
      });

      await prisma.user.update({
        where: { id: payment.userId },
        data: {
          planTier: payment.planTier,
          paystackSubscription: event.data?.subscription_code,
          paystackCustomerCode: event.data?.customer?.customer_code,
        },
      });
      break;
    }

    case "subscription.disable": {
      const customerCode = event.data?.customer?.customer_code;
      if (customerCode) {
        await prisma.user.updateMany({
          where: { paystackCustomerCode: customerCode },
          data: { planTier: "FREE" },
        });
      }
      break;
    }

    default:
      break;
  }

  return ok({ received: true });
}
