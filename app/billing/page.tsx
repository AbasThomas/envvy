"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CreditCardIcon,
  HistoryIcon,
  RefreshCwIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  ZapIcon,
} from "@/components/ui/icons";

import { PlanCards } from "@/components/billing/plan-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

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
    <div className="app-page space-y-12 pb-20">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#D4A574]">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-[#D4A574] to-transparent" />
            <span>Workspace</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#f5f5f0] sm:text-4xl">
            Pricing & Billing
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#a8b3af] sm:text-base">
            Scale your environment management with premium features and higher limits.
          </p>
        </div>

        <Card className="glass overflow-hidden border-[#D4A574]/20 bg-[#1B4D3E]/10 px-6 py-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4A574]/10 text-[#D4A574]">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/70">Security Tier</p>
              <p className="text-lg font-black text-[#f5f5f0]">Enterprise Vault</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4A574]/10 text-[#D4A574]">
            <ZapIcon className="h-4 w-4" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-[#f5f5f0]">Choose Your Plan</h2>
        </div>
        <PlanCards />
      </div>

      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D4A574]/10 text-[#D4A574]">
              <HistoryIcon className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-[#f5f5f0]">Payment History</h2>
          </div>
          <Badge className="bg-[#1B4D3E]/20 text-[10px] font-black uppercase tracking-widest text-[#D4A574] ring-1 ring-[#D4A574]/20">
            {historyQuery.data?.payments.length ?? 0} Transactions
          </Badge>
        </div>

        <Card className="overflow-hidden border-[#D4A574]/15 bg-[#02120e]/60 shadow-2xl">
          <CardContent className="p-0">
            {historyQuery.isLoading ? (
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#1B4D3E]/10" />
                ))}
              </div>
            ) : historyQuery.data?.payments.length ? (
              <div className="divide-y divide-[#D4A574]/10">
                {historyQuery.data.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="group flex flex-col gap-6 p-6 transition-all hover:bg-[#1B4D3E]/10 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/20 text-[#D4A574] transition-all group-hover:scale-110 group-hover:border-[#D4A574]/30">
                        <ReceiptIcon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-[#f5f5f0]">{payment.planTier} Plan</p>
                          <Badge 
                            className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2 py-0.5",
                              (payment.status === "ACTIVE" || payment.status === "success")
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-[#8d9a95]/10 text-[#8d9a95] border border-[#8d9a95]/20"
                            )}
                          >
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] font-medium text-[#a8b3af]">
                          Reference: <span className="font-mono text-[#D4A574]/70">{payment.reference ?? "no-ref"}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-start gap-1 sm:items-end sm:text-right">
                      <p className="text-xl font-black text-[#f5f5f0]">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#8d9a95]">
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
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 rounded-full bg-[#1B4D3E]/10 p-6 text-[#D4A574]/20">
                  <ReceiptIcon className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-black text-[#f5f5f0]">No payment history</h3>
                <p className="mt-2 max-w-xs text-sm text-[#a8b3af]">
                  Your transaction history will appear here once you upgrade your workspace.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="group rounded-3xl border border-[#D4A574]/15 bg-gradient-to-br from-[#1B4D3E]/10 to-transparent p-8 transition-all hover:border-[#D4A574]/30">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A574]/10 text-[#D4A574]">
            <ShieldCheckIcon className="h-5 w-5" />
          </div>
          <h3 className="mb-3 text-xl font-black text-[#f5f5f0]">Secure Payments</h3>
          <p className="text-sm leading-relaxed text-[#a8b3af]">
            Payments are processed via Paystack. Your sensitive information never touches our servers. 
            All transactions are encrypted and secured using industry-standard protocols.
          </p>
        </div>
        <div className="group rounded-3xl border border-[#D4A574]/15 bg-gradient-to-br from-[#1B4D3E]/10 to-transparent p-8 transition-all hover:border-[#D4A574]/30">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A574]/10 text-[#D4A574]">
            <RefreshCwIcon className="h-5 w-5" />
          </div>
          <h3 className="mb-3 text-xl font-black text-[#f5f5f0]">Flexible Billing</h3>
          <p className="text-sm leading-relaxed text-[#a8b3af]">
            Upgrade or downgrade your plan at any time. Changes are reflected immediately in your workspace limits. 
            Contact our support team for custom enterprise requirements.
          </p>
        </div>
      </div>
    </div>
  );
}
