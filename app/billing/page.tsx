"use client";

import { useQuery } from "@tanstack/react-query";

import { PlanCards } from "@/components/billing/plan-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetcher } from "@/lib/fetcher";

type BillingHistoryResponse = {
  payments: Array<{
    id: string;
    status: string;
    planTier: string;
    amount: number;
    currency: string;
    reference: string | null;
    createdAt: string;
  }>;
};

export default function BillingPage() {
  const historyQuery = useQuery({
    queryKey: ["billing-history"],
    queryFn: () => fetcher<BillingHistoryResponse>("/api/billing/history"),
  });

  return (
    <div className="space-y-5">
      <Card className="grid-bg border-[#D4A574]/20">
        <CardHeader>
          <CardTitle className="text-2xl">Pricing and Billing</CardTitle>
          <CardDescription>
            Structured for fast growth teams with clear NGN-first pricing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge>Free: private-only trial</Badge>
          <Badge variant="success">Basic: NGN 800 / $2</Badge>
          <Badge variant="success">Pro: NGN 2400 / $6</Badge>
          <Badge variant="success">Team: NGN 4000 / $10</Badge>
        </CardContent>
      </Card>

      <PlanCards />

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {historyQuery.data?.payments.length ? (
            historyQuery.data.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between rounded-lg border border-[#D4A574]/15 bg-[#1B4D3E]/20 px-3 py-2"
              >
                <div className="text-sm">
                  <p className="text-[#f5f5f0]">
                    {payment.planTier} - {payment.currency} {payment.amount}
                  </p>
                  <p className="text-xs text-[#a8b3af]">
                    {payment.reference ?? "no-ref"} - {new Date(payment.createdAt).toLocaleString()}
                  </p>
                </div>
                <Badge variant={payment.status === "ACTIVE" ? "success" : "muted"}>
                  {payment.status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#a8b3af]">No payments yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
