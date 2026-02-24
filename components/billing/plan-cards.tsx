"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_MATRIX, PLAN_ORDER } from "@/lib/plans";
import { cn } from "@/lib/utils";

import { CheckIcon, SparklesIcon, RefreshCwIcon } from "lucide-react";

export function PlanCards() {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  async function upgrade(planTier: "BASIC" | "PRO" | "TEAM") {
    setLoadingTier(planTier);
    try {
      const res = await fetch("/api/billing/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planTier }),
      });
      const data = (await res.json()) as { authorizationUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not start payment");
      if (!data.authorizationUrl) throw new Error("Paystack authorization url missing");
      window.location.href = data.authorizationUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upgrade failed");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {PLAN_ORDER.map((tier) => {
        const plan = PLAN_MATRIX[tier];
        const isFree = tier === "FREE";
        const isPro = tier === "PRO";
        const isTeam = tier === "TEAM";

        return (
          <Card 
            key={tier} 
            className={cn(
              "group relative flex flex-col overflow-hidden transition-all duration-300 hover:translate-y-[-4px]",
              isPro ? "border-[#D4A574]/40 bg-[#1B4D3E]/10 ring-1 ring-[#D4A574]/20" : "border-[#D4A574]/15 bg-[#02120e]/40"
            )}
          >
            {isPro && (
              <div className="absolute top-0 right-0 rounded-bl-xl bg-gradient-to-r from-[#D4A574] to-[#C85A3A] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#02120e]">
                Popular
              </div>
            )}
            
            <CardHeader className="pb-8 pt-8">
              <div className="flex items-center gap-2">
                {isTeam ? (
                  <SparklesIcon className="h-5 w-5 text-[#D4A574]" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-[#D4A574]/40" />
                )}
                <CardTitle className="text-xl font-bold tracking-tight">{plan.label}</CardTitle>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-black text-[#f5f5f0]">
                  {isFree ? "Free" : `₦${plan.monthlyNgn.toLocaleString()}`}
                </span>
                {!isFree && <span className="text-sm font-medium text-[#a8b3af]">/month</span>}
              </div>
              <CardDescription className="mt-2 text-xs font-medium text-[#a8b3af]">
                {plan.monthlyUsd > 0 ? `Approximately $${plan.monthlyUsd} USD` : "Perfect for individual developers"}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/60">Features</p>
                <ul className="space-y-3">
                  {[
                    { label: `${plan.repoLimit === Number.MAX_SAFE_INTEGER ? "Unlimited" : plan.repoLimit} Repositories`, active: true },
                    { label: "Public Repositories", active: plan.allowPublicRepos },
                    { label: "Team Sharing", active: plan.allowSharing },
                    { label: "Forks & Stars", active: plan.allowForksAndStars },
                    { label: "Version History", active: plan.allowVersionHistory },
                    { label: "Teams Management", active: plan.allowTeams },
                    { label: "Audit Logs", active: plan.allowAuditLogs },
                    { label: "Priority Support", active: plan.prioritySupport },
                  ].map((feat, i) => (
                    <li key={i} className={cn("flex items-center gap-3 text-xs transition-colors", feat.active ? "text-[#f5f5f0]" : "text-[#a8b3af]/40")}>
                      <div className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        feat.active ? "border-[#D4A574]/30 bg-[#D4A574]/10 text-[#D4A574]" : "border-transparent bg-transparent"
                      )}>
                        {feat.active && <CheckIcon className="h-2.5 w-2.5" />}
                      </div>
                      {feat.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-6">
                {isFree ? (
                  <Button variant="outline" className="w-full border-[#D4A574]/20 bg-transparent text-[#a8b3af]" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className={cn(
                      "w-full font-black uppercase tracking-widest transition-all",
                      isPro 
                        ? "bg-gradient-to-r from-[#D4A574] to-[#C85A3A] text-[#02120e] shadow-lg shadow-[#D4A574]/20" 
                        : "bg-[#1B4D3E] text-[#f5f5f0] hover:bg-[#1B4D3E]/80"
                    )}
                    onClick={() => upgrade(tier as "BASIC" | "PRO" | "TEAM")}
                    disabled={loadingTier === tier}
                  >
                    {loadingTier === tier ? (
                      <RefreshCwIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      "Upgrade Plan"
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
