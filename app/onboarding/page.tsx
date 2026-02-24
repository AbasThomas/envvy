"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, RefreshCwIcon, ShieldCheckIcon, TerminalSquareIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";

type CliPinStateResponse = {
  state: {
    hasCliPin: boolean;
    onboardingCompleted: boolean;
    cliPinUpdatedAt: string | null;
    cliPinLastUsedAt: string | null;
  };
};

type CreateCliPinResponse = {
  pin: string;
  generated: boolean;
  state: {
    hasCliPin: boolean;
    onboardingCompleted: boolean;
  } | null;
};

export default function OnboardingPage() {
  const queryClient = useQueryClient();
  const [shownPin, setShownPin] = useState<string>("");
  const [customPin, setCustomPin] = useState<string>("");

  const statusQuery = useQuery({
    queryKey: ["cli-pin-status"],
    queryFn: () => fetcher<CliPinStateResponse>("/api/auth/cli-pin"),
  });

  const generateMutation = useMutation({
    mutationFn: async (pin?: string) => {
      return fetcher<CreateCliPinResponse>("/api/auth/cli-pin", {
        method: "POST",
        body: JSON.stringify(pin ? { pin } : {}),
      });
    },
    onSuccess: (data) => {
      setShownPin(data.pin);
      setCustomPin("");
      queryClient.invalidateQueries({ queryKey: ["cli-pin-status"] });
      toast.success("CLI PIN saved. Copy it now.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not save CLI PIN");
    },
  });

  const canUseCustomPin = useMemo(() => /^\d{6}$/.test(customPin), [customPin]);

  return (
    <div className="app-page mx-auto w-full max-w-4xl">
      <Card className="glass border-[#D4A574]/25">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>One-time setup</Badge>
            <Badge variant="muted">CLI authentication</Badge>
          </div>
          <CardTitle className="mt-2 text-3xl">Generate your 6-digit PIN for CLI login</CardTitle>
          <CardDescription>
            This PIN is used for quick CLI authentication from your machine. It is separate from your account password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              placeholder="Optional custom PIN (6 digits)"
              value={customPin}
              onChange={(event) => setCustomPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <Button
              onClick={() => generateMutation.mutate(canUseCustomPin ? customPin : undefined)}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? "Saving..." : "Generate & Save"}
            </Button>
          </div>

          <div className="rounded-xl border border-[#D4A574]/25 bg-[#02120e]/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#D4A574]">Your CLI PIN</p>
            <p className="mt-2 font-mono text-4xl tracking-[0.45em] text-[#f5f5f0]">
              {shownPin || "------"}
            </p>
            <p className="mt-2 text-xs text-[#a8b3af]">
              Copy this now. You will not be able to view this exact value again.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                disabled={!shownPin}
                onClick={() => {
                  if (!shownPin) return;
                  navigator.clipboard.writeText(shownPin);
                  toast.success("CLI PIN copied");
                }}
              >
                <CopyIcon className="mr-2 h-4 w-4" />
                Copy PIN
              </Button>
              <Button
                variant="ghost"
                disabled={generateMutation.isPending}
                onClick={() => generateMutation.mutate(undefined)}
              >
                <RefreshCwIcon className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[#D4A574]/15 bg-[#1B4D3E]/20 p-4 text-sm text-[#c8d2ce]">
            <p className="mb-2 inline-flex items-center gap-2 font-semibold text-[#f5f5f0]">
              <TerminalSquareIcon className="h-4 w-4 text-[#D4A574]" />
              CLI quick start
            </p>
            <pre className="overflow-auto rounded-lg bg-[#02120e]/80 p-3 text-xs text-[#a8b3af]">
{`npm install -g envii
envii login --pin
envii init my-awesome-app
envii add .env
envii commit -m "Initial setup"
envii push`}
            </pre>
          </div>

          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-xs text-[#a8b3af]">
              <ShieldCheckIcon className="h-4 w-4 text-[#D4A574]" />
              {statusQuery.data?.state.hasCliPin ? "CLI PIN configured" : "CLI PIN not configured"}
            </div>
            <Link href="/dashboard">
              <Button disabled={!statusQuery.data?.state.hasCliPin && !shownPin}>
                Continue to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
