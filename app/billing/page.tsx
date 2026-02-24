"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CreditCardIcon,
  HistoryIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "lucide-react";

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
    <div className="app-page space-y-10 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D4A574]">
            <CreditCardIcon className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Subscription</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#f5f5f0]">Pricing & Billing</h1>
          <p className="text-[#a8b3af]">Manage your plan, billing history, and payment methods.</p>
        </div>

        <Card className="glass overflow-hidden border-[#D4A574]/20 bg-[#1B4D3E]/12 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A574]/10 text-[#D4A574]">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4A574]/70">Current Security</p>
              <p className="text-lg font-bold text-[#f5f5f0]">Enterprise Vault</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ZapIcon className="h-5 w-5 text-[#D4A574]" />
          <h2 className="text-xl font-bold text-[#f5f5f0]">Choose Your Plan</h2>
        </div>
        <PlanCards />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-[#D4A574]" />
            <h2 className="text-xl font-bold text-[#f5f5f0]">Payment History</h2>
          </div>
          <Badge variant="muted" className="bg-[#02120e]/40 border-[#D4A574]/10 text-[#a8b3af]">
            {historyQuery.data?.payments.length ?? 0} Transactions
          </Badge>
        </div>

        <Card className="overflow-hidden border-[#D4A574]/15 bg-[#02120e]/40 shadow-xl">
          <CardContent className="p-0">
            {historyQuery.isLoading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-[#1B4D3E]/10" />
                ))}
              </div>
            ) : historyQuery.data?.payments.length ? (
              <div className="divide-y divide-[#D4A574]/10">
                {historyQuery.data.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="group flex flex-col gap-4 p-5 transition-colors hover:bg-[#1B4D3E]/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D3E]/20 text-[#D4A574] transition-transform group-hover:scale-110">
                        <ReceiptIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#f5f5f0]">{payment.planTier} Plan</p>
                          <Badge 
                            variant={payment.status === "ACTIVE" || payment.status === "success" ? "success" : "muted"}
                            className="text-[10px] font-black uppercase tracking-widest px-2 py-0"
                          >
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-[#a8b3af]">
                          Reference: <span className="font-mono text-[#D4A574]/70">{payment.reference ?? "no-ref"}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1 text-right">
                      <p className="text-lg font-black text-[#f5f5f0]">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-medium text-[#a8b3af]">
                        {new Date(payment.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-[#1B4D3E]/10 p-4 text-[#D4A574]/40">
                  <ReceiptIcon className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-[#f5f5f0]">No payment history</h3>
                <p className="max-w-xs text-sm text-[#a8b3af]">
                  When you upgrade your plan, your transaction history will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-3xl border border-[#D4A574]/10 bg-gradient-to-br from-[#1B4D3E]/10 to-transparent p-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#f5f5f0]">Secure Payments</h3>
            <p className="text-sm leading-relaxed text-[#a8b3af]">
              We use Paystack for all payment processing. Your sensitive payment information never touches our servers. 
              All transactions are encrypted and secured using industry-standard protocols.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#f5f5f0]">Flexible Billing</h3>
            <p className="text-sm leading-relaxed text-[#a8b3af]">
              Upgrade or downgrade your plan at any time. Changes are reflected immediately in your workspace limits. 
              If you have any questions, reach out to our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
