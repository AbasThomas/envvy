"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, RotateCwIcon, ShieldIcon } from "@/components/ui/icons";
import Script from "next/script";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";
import { isValidCliPin } from "@/lib/cli-pin";
import { isValidRepoPin } from "@/lib/repo-pin";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [repoId, setRepoId] = useState("");
  const [repoPin, setRepoPin] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [ciRepoId, setCiRepoId] = useState("");
  const [ciRepoPin, setCiRepoPin] = useState("");
  const [customCliPin, setCustomCliPin] = useState("");
  const [shownCliPin, setShownCliPin] = useState("");

  const cliPinQuery = useQuery({
    queryKey: ["cli-pin-status"],
    queryFn: () =>
      fetcher<{
        state: {
          hasCliPin: boolean;
          onboardingCompleted: boolean;
          cliPinUpdatedAt: string | null;
          cliPinLastUsedAt: string | null;
        };
      }>("/api/auth/cli-pin"),
  });

  const saveCliPinMutation = useMutation({
    mutationFn: async (pin?: string) =>
      fetcher<{ pin: string }>("/api/auth/cli-pin", {
        method: "POST",
        body: JSON.stringify(pin ? { pin } : {}),
      }),
    onSuccess: (data) => {
      setShownCliPin(data.pin);
      setCustomCliPin("");
      queryClient.invalidateQueries({ queryKey: ["cli-pin-status"] });
      toast.success("CLI PIN updated");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not update CLI PIN"),
  });

  const revokeCliPinMutation = useMutation({
    mutationFn: async () =>
      fetcher("/api/auth/cli-pin", {
        method: "DELETE",
      }),
    onSuccess: () => {
      setShownCliPin("");
      queryClient.invalidateQueries({ queryKey: ["cli-pin-status"] });
      toast.success("CLI PIN revoked and CLI sessions rotated");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not revoke CLI PIN"),
  });

  async function sendSlackPing() {
    try {
      if (!isValidRepoPin(repoPin)) {
        throw new Error("Enter the 6-digit repository PIN");
      }
      await fetcher("/api/integrations/slack", {
        method: "POST",
        headers: {
          "x-envii-repo-pin": repoPin,
        },
        body: JSON.stringify({
          repoId,
          webhookUrl: slackWebhook,
        }),
      });
      toast.success("Slack webhook test sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Slack integration failed");
    }
  }

  async function openPaystackInline(planTier: "BASIC" | "PRO" | "TEAM") {
    try {
      const init = await fetcher<{ reference: string; accessCode?: string; authorizationUrl?: string }>(
        "/api/billing/initialize",
        {
          method: "POST",
          body: JSON.stringify({ planTier }),
        },
      );

      if (window.PaystackPop?.setup && process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          ref: init.reference,
          callback: async () => {
            await fetcher("/api/billing/verify", {
              method: "POST",
              body: JSON.stringify({ reference: init.reference }),
            });
            toast.success("Payment verified");
          },
          onClose: () => toast("Checkout closed"),
        });
        handler.openIframe();
      } else if (init.authorizationUrl) {
        window.location.href = init.authorizationUrl;
      } else {
        throw new Error("No checkout flow available");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Billing init failed");
    }
  }

  async function generateCiExport() {
    try {
      if (!isValidRepoPin(ciRepoPin)) {
        throw new Error("Enter the 6-digit repository PIN");
      }
      const data = await fetcher<{ dotenv: string; guide: string }>("/api/integrations/ci", {
        method: "POST",
        headers: {
          "x-envii-repo-pin": ciRepoPin,
        },
        body: JSON.stringify({
          repoId: ciRepoId,
          provider: "github-actions",
          environment: "production",
        }),
      });

      navigator.clipboard.writeText(data.dotenv);
      toast.success(`CI export copied. ${data.guide}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CI export failed");
    }
  }

  return (
    <div className="app-page space-y-8 sm:space-y-12">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      {/* Page Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#D4A574]">
          <div className="h-1 w-8 rounded-full bg-gradient-to-r from-[#D4A574] to-transparent" />
          <span>Workspace</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#f5f5f0] sm:text-4xl">
          Settings & Integrations
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#a8b3af] sm:text-base">
          Manage your secure identity, billing, and third-party integrations from one central hub.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Security Section */}
        <Card className="glass relative overflow-hidden border-[#D4A574]/20 bg-[#02120e]/60">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4A574]/5 blur-3xl" />
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-black tracking-tight text-[#f5f5f0]">Terminal Security</CardTitle>
            <CardDescription className="text-[#a8b3af]">
              Manage your 6-digit CLI PIN and rotate your terminal API tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 rounded-xl border border-[#D4A574]/10 bg-[#1B4D3E]/10 px-4 py-3">
              <ShieldIcon className="h-4 w-4 text-[#D4A574]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#f5f5f0]">
                Status: {cliPinQuery.data?.state.hasCliPin ? "Configured" : "Unprotected"}
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_auto]">
              <Input
                className="h-12 rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10 text-sm focus:ring-[#D4A574]/30"
                value={customCliPin}
                onChange={(event) => setCustomCliPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter custom 6-digit PIN..."
              />
              <Button
                className="h-12 gap-2 bg-[#D4A574] text-[10px] font-black uppercase tracking-widest text-[#02120e] hover:bg-[#D4A574]/90"
                onClick={() => saveCliPinMutation.mutate(isValidCliPin(customCliPin) ? customCliPin : undefined)}
                disabled={saveCliPinMutation.isPending}
              >
                <RotateCwIcon className="h-4 w-4" />
                Reset PIN
              </Button>
              <Button
                variant="outline"
                className="h-12 gap-2 border-red-500/20 bg-red-500/5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => revokeCliPinMutation.mutate()}
                disabled={revokeCliPinMutation.isPending}
              >
                Revoke All Sessions
              </Button>
            </div>

            <div className="rounded-2xl border border-[#D4A574]/20 bg-[#02120e]/80 p-6 shadow-inner">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/60">Latest Active PIN</p>
                {shownCliPin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-2 text-[10px] font-black uppercase tracking-widest text-[#D4A574] hover:bg-[#D4A574]/10"
                    onClick={() => {
                      navigator.clipboard.writeText(shownCliPin);
                      toast.success("CLI PIN copied");
                    }}
                  >
                    <CopyIcon className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                )}
              </div>
              <div className="flex justify-center py-4">
                <p className="font-mono text-5xl font-black tracking-[0.5em] text-[#f5f5f0] sm:text-6xl">
                  {shownCliPin || "••••••"}
                </p>
              </div>
              <p className="mt-4 text-center text-[10px] text-[#8d9a95]">
                Use this PIN to authenticate your local terminal with <code className="text-[#D4A574]">envii login</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Slack Integration */}
          <Card className="glass border-[#D4A574]/20 bg-[#02120e]/60">
            <CardHeader>
              <CardTitle className="text-xl font-black tracking-tight text-[#f5f5f0]">Slack Sync</CardTitle>
              <CardDescription className="text-[#a8b3af]">
                Live notifications for every environment change.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">Vault ID</label>
                <Input
                  className="h-11 rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10"
                  value={repoId}
                  onChange={(event) => setRepoId(event.target.value)}
                  placeholder="e.g. production-api"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">Webhook URL</label>
                <Input
                  className="h-11 rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10"
                  value={slackWebhook}
                  onChange={(event) => setSlackWebhook(event.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">Vault PIN</label>
                <Input
                  className="h-11 rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10"
                  value={repoPin}
                  onChange={(event) => setRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit vault PIN"
                />
              </div>
              <Button 
                onClick={sendSlackPing} 
                variant="outline"
                className="w-full h-11 border-[#D4A574]/20 bg-[#1B4D3E]/10 text-[10px] font-black uppercase tracking-widest text-[#f5f5f0] hover:bg-[#1B4D3E]/20"
              >
                Test Connection
              </Button>
            </CardContent>
          </Card>

          {/* CI/CD Export */}
          <Card className="glass border-[#D4A574]/20 bg-[#02120e]/60">
            <CardHeader>
              <CardTitle className="text-xl font-black tracking-tight text-[#f5f5f0]">CI/CD Pipeline</CardTitle>
              <CardDescription className="text-[#a8b3af]">
                Generate secure payloads for GitHub Actions & GitLab.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">Vault ID</label>
                <Input
                  className="h-11 rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10"
                  value={ciRepoId}
                  onChange={(event) => setCiRepoId(event.target.value)}
                  placeholder="e.g. staging-db"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">Vault PIN</label>
                <Input
                  className="h-11 rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10"
                  value={ciRepoPin}
                  onChange={(event) => setCiRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit vault PIN"
                />
              </div>
              <div className="pt-4">
                <Button 
                  onClick={generateCiExport} 
                  className="w-full h-11 bg-[#D4A574] text-[10px] font-black uppercase tracking-widest text-[#02120e] hover:bg-[#D4A574]/90 shadow-lg shadow-[#D4A574]/10"
                >
                  Generate CI Payload
                </Button>
              </div>
              <p className="text-center text-[10px] text-[#8d9a95]">
                Payload will be automatically copied to your clipboard.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Billing Section */}
        <Card className="glass border-[#D4A574]/20 bg-[#02120e]/60">
          <CardHeader>
            <CardTitle className="text-xl font-black tracking-tight text-[#f5f5f0]">Subscription Plans</CardTitle>
            <CardDescription className="text-[#a8b3af]">
              Scale your workspace with premium features and higher limits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { tier: "BASIC", price: "800", label: "Basic Plan", variant: "outline" as const },
                { tier: "PRO", price: "2400", label: "Pro Plan", variant: "secondary" as const },
                { tier: "TEAM", price: "4000", label: "Team Plan", variant: "outline" as const },
              ].map((plan) => (
                <div 
                  key={plan.tier}
                  className="group flex flex-col justify-between rounded-2xl border border-[#D4A574]/15 bg-[#1B4D3E]/10 p-6 transition-all hover:border-[#D4A574]/40 hover:bg-[#1B4D3E]/20"
                >
                  <div className="mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]">{plan.tier}</p>
                    <p className="mt-2 text-2xl font-black text-[#f5f5f0]">NGN {plan.price}</p>
                    <p className="text-xs text-[#a8b3af]">per month</p>
                  </div>
                  <Button 
                    className={cn(
                      "h-10 w-full text-[10px] font-black uppercase tracking-widest transition-all",
                      plan.tier === "PRO" 
                        ? "bg-[#D4A574] text-[#02120e] hover:bg-[#D4A574]/90" 
                        : "border-[#D4A574]/20 bg-[#1B4D3E]/20 text-[#f5f5f0] hover:bg-[#1B4D3E]/30"
                    )}
                    onClick={() => openPaystackInline(plan.tier as any)}
                  >
                    Select {plan.tier}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
