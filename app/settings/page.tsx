"use client";

import Script from "next/script";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";
import { isValidRepoPin } from "@/lib/repo-pin";

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: Record<string, unknown>) => { openIframe: () => void };
    };
  }
}

export default function SettingsPage() {
  const [repoId, setRepoId] = useState("");
  const [repoPin, setRepoPin] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [ciRepoId, setCiRepoId] = useState("");
  const [ciRepoPin, setCiRepoPin] = useState("");

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
    <div className="space-y-4">
      <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />

      <Card>
        <CardHeader>
          <CardTitle>Billing Quick Actions</CardTitle>
          <CardDescription>Use Paystack inline checkout without leaving the dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => openPaystackInline("BASIC")}>Upgrade to Basic (₦800)</Button>
          <Button variant="secondary" onClick={() => openPaystackInline("PRO")}>
            Upgrade to Pro (₦2400)
          </Button>
          <Button variant="outline" onClick={() => openPaystackInline("TEAM")}>
            Upgrade to Team (₦4000)
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Slack Notifications</CardTitle>
            <CardDescription>Ping your workspace when env changes are pushed.</CardDescription>
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
            <Input
              value={repoPin}
              onChange={(event) => setRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="Repo PIN (6 digits)"
            />
            <Button onClick={sendSlackPing} variant="outline">
              Test Slack Alert
            </Button>
          </CardContent>
        </Card>

        <Card>
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
            <Input
              value={ciRepoPin}
              onChange={(event) => setCiRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              placeholder="Repo PIN (6 digits)"
            />
            <Button onClick={generateCiExport} variant="outline">
              Copy production dotenv
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
