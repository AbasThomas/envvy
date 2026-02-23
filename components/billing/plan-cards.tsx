"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_MATRIX, PLAN_ORDER } from "@/lib/plans";

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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {PLAN_ORDER.map((tier) => {
        const plan = PLAN_MATRIX[tier];
        const paid = tier !== "FREE";
        return (
          <Card key={tier} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.label}</CardTitle>
                <Badge variant={paid ? "success" : "muted"}>
                  {paid ? `₦${plan.monthlyNgn}` : "Free"}
                </Badge>
              </div>
              <CardDescription>
                {plan.monthlyUsd > 0 ? `$${plan.monthlyUsd}/mo` : "Starter tier"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p>Repos: {plan.repoLimit === Number.MAX_SAFE_INTEGER ? "Unlimited" : plan.repoLimit}</p>
              <p>Public repos: {plan.allowPublicRepos ? "Yes" : "No"}</p>
              <p>Sharing: {plan.allowSharing ? "Yes" : "No"}</p>
              <p>Fork/Star: {plan.allowForksAndStars ? "Yes" : "No"}</p>
              <p>Audit logs: {plan.allowAuditLogs ? "Yes" : "No"}</p>
              {tier === "FREE" ? (
                <Button variant="outline" className="w-full" disabled>
                  Current baseline
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => upgrade(tier as "BASIC" | "PRO" | "TEAM")}
                  disabled={loadingTier === tier}
                >
                  {loadingTier === tier ? "Starting checkout..." : "Upgrade"}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
