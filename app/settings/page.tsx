"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, RotateCwIcon, ShieldIcon } from "lucide-react";
import Script from "next/script";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";
import { isValidCliPin } from "@/lib/cli-pin";
import { isValidRepoPin } from "@/lib/repo-pin";

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
    <div className="app-page">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      <Card className="glass border-[#D4A574]/20">
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>
            Manage your 6-digit CLI PIN and revoke active CLI sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ShieldIcon className="h-4 w-4 text-[#D4A574]" />
            <span className="text-sm text-[#a8b3af]">
              {cliPinQuery.data?.state.hasCliPin ? "CLI PIN is configured" : "CLI PIN is not configured"}
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-[220px_auto_auto]">
            <Input
              value={customCliPin}
              onChange={(event) => setCustomCliPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="Optional custom PIN"
            />
            <Button
              variant="outline"
              onClick={() => saveCliPinMutation.mutate(isValidCliPin(customCliPin) ? customCliPin : undefined)}
              disabled={saveCliPinMutation.isPending}
            >
              <RotateCwIcon className="mr-2 h-4 w-4" />
              Generate / Reset PIN
            </Button>
            <Button
              variant="ghost"
              onClick={() => revokeCliPinMutation.mutate()}
              disabled={revokeCliPinMutation.isPending}
            >
              Revoke PIN + Sessions
            </Button>
          </div>
          <div className="rounded-lg border border-[#D4A574]/20 bg-[#02120e]/70 p-3">
            <p className="text-xs uppercase tracking-wide text-[#D4A574]">Latest generated PIN</p>
            <p className="mt-2 font-mono text-3xl tracking-[0.4em] text-[#f5f5f0]">
              {shownCliPin || "------"}
            </p>
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!shownCliPin}
                onClick={() => {
                  if (!shownCliPin) return;
                  navigator.clipboard.writeText(shownCliPin);
                  toast.success("CLI PIN copied");
                }}
              >
                <CopyIcon className="mr-2 h-4 w-4" />
                Copy PIN
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-[#D4A574]/20">
        <CardHeader>
          <CardTitle>Billing Quick Actions</CardTitle>
          <CardDescription>Run inline checkout without leaving the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => openPaystackInline("BASIC")}>Upgrade to Basic (NGN 800)</Button>
          <Button variant="secondary" onClick={() => openPaystackInline("PRO")}>
            Upgrade to Pro (NGN 2400)
          </Button>
          <Button variant="outline" onClick={() => openPaystackInline("TEAM")}>
            Upgrade to Team (NGN 4000)
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-[#D4A574]/20 bg-[#02120e]/65">
          <CardHeader>
            <CardTitle>Slack Notifications</CardTitle>
            <CardDescription>Ping your workspace when env updates are pushed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              value={repoId}
              onChange={(event) => setRepoId(event.target.value)}
              placeholder="Repo ID"
            />
            <Input
              value={slackWebhook}
              onChange={(event) => setSlackWebhook(event.target.value)}
              placeholder="Slack webhook URL"
            />
            <div className="space-y-1">
              <Input
                value={repoPin}
                onChange={(event) => setRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="Repo PIN (6 digits)"
              />
              <p className="text-xs text-[#8d9a95]">{repoPin.length}/6 digits</p>
            </div>
            <Button onClick={sendSlackPing} variant="outline">
              Test Slack alert
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#D4A574]/20 bg-[#02120e]/65">
          <CardHeader>
            <CardTitle>CI/CD Export</CardTitle>
            <CardDescription>Generate secure dotenv payloads for GitHub Actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              value={ciRepoId}
              onChange={(event) => setCiRepoId(event.target.value)}
              placeholder="Repo ID"
            />
            <div className="space-y-1">
              <Input
                value={ciRepoPin}
                onChange={(event) => setCiRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
                placeholder="Repo PIN (6 digits)"
              />
              <p className="text-xs text-[#8d9a95]">{ciRepoPin.length}/6 digits</p>
            </div>
            <Button onClick={generateCiExport} variant="outline">
              Copy production dotenv
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
