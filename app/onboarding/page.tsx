"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRightIcon, CopyIcon, RefreshCwIcon, ShieldCheckIcon, TerminalSquareIcon } from "@/components/ui/icons";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

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

const CLI_COMMANDS = [
  { cmd: "npm install -g envii", desc: "Install the CLI globally" },
  { cmd: "envii login --pin", desc: "Authenticate with your PIN" },
  { cmd: "envii init my-project", desc: "Initialize a new repository" },
  { cmd: "envii add .env", desc: "Stage your environment file" },
  { cmd: "envii push", desc: "Securely backup your secrets" },
];

export default function OnboardingPage() {
  const queryClient = useQueryClient();
  const [shownPin, setShownPin] = useState<string>("");
  const [customPin, setCustomPin] = useState<string>("");
  const [activeCmdIndex, setActiveCmdIndex] = useState(0);

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
    <div className="app-page mx-auto w-full max-w-5xl py-8">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D4A574]/25 bg-[#1B4D3E]/20 px-4 py-1.5 text-[11px] uppercase tracking-[0.2em] text-[#D4A574]">
          <ShieldCheckIcon className="h-3 w-3" />
          Security Setup Required
        </div>
        <h1 className="text-4xl font-black tracking-tight text-[#f5f5f0] sm:text-5xl">
          Configure your <span className="text-[#D4A574]">CLI Access</span>.
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-[#a8b3af]">
          To use envii from your terminal, you need a secure 6-digit PIN. 
          This acts as your master key for CLI authentication.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card className="glass relative overflow-hidden border-[#D4A574]/25 bg-[#02120e]/60 shadow-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4A574]/5 blur-3xl" />
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">1. Generate Security PIN</CardTitle>
              <CardDescription>Enter a custom PIN or let us generate a random one for you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4A574]">Custom 6-Digit PIN</label>
                  <Input
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Optional (e.g. 123456)"
                    className="bg-[#02120e]/80 border-[#D4A574]/15 focus:ring-[#D4A574]/30 h-12 text-xl font-black tracking-[0.5em] text-center"
                    value={customPin}
                    onChange={(event) => setCustomPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </div>
                <div className="flex items-end pb-0.5">
                  <Button
                    className="h-12 px-8 bg-gradient-to-r from-[#D4A574] to-[#C85A3A] text-[#02120e] font-black uppercase tracking-widest transition-all hover:scale-[1.02]"
                    onClick={() => generateMutation.mutate(canUseCustomPin ? customPin : undefined)}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <RefreshCwIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      "Generate & Save"
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#D4A574]/15 bg-[#02120e]/80 p-6 text-center shadow-inner">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#a8b3af]">Your Active CLI PIN</p>
                <div className="my-4 flex items-center justify-center gap-4">
                  {(shownPin || "••••••").split("").map((char, i) => (
                    <div key={i} className="grid h-14 w-10 place-items-center rounded-xl border border-[#D4A574]/20 bg-[#1B4D3E]/5 text-3xl font-black text-[#f5f5f0] shadow-sm">
                      {char}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center gap-4">
                  <p className="max-w-[280px] text-[11px] font-medium leading-relaxed text-[#4d6d62]">
                    CRITICAL: Copy this now. For security, we never store the plaintext PIN. 
                    If lost, you must regenerate a new one.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#D4A574]/20 text-[#D4A574] hover:bg-[#D4A574]/10"
                      disabled={!shownPin}
                      onClick={() => {
                        if (!shownPin) return;
                        navigator.clipboard.writeText(shownPin);
                        toast.success("CLI PIN copied to clipboard");
                      }}
                    >
                      <CopyIcon className="mr-2 h-4 w-4" />
                      Copy to Clipboard
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#a8b3af] hover:text-[#f5f5f0]"
                      disabled={generateMutation.isPending}
                      onClick={() => generateMutation.mutate(undefined)}
                    >
                      <RefreshCwIcon className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/5 p-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                statusQuery.data?.state.hasCliPin || shownPin
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-500"
                  : "border-[#D4A574]/30 bg-[#D4A574]/10 text-[#D4A574]"
              )}>
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#f5f5f0]">
                  {statusQuery.data?.state.hasCliPin || shownPin ? "Ready for terminal" : "PIN required to continue"}
                </p>
                <p className="text-xs text-[#a8b3af]">Status: Secure connection verified</p>
              </div>
            </div>
            <Link href="/dashboard">
              <Button 
                size="lg"
                className="bg-[#f5f5f0] text-[#02120e] font-black uppercase tracking-widest hover:bg-[#D4A574] transition-colors shadow-lg"
                disabled={!statusQuery.data?.state.hasCliPin && !shownPin}
              >
                Go to Dashboard
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-[#D4A574]/20 bg-[#010b09] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D4A574]/10 bg-[#02120e]/95 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#4d6d62]">
                <TerminalSquareIcon className="h-3 w-3" />
                envii-cli v1.2.0
              </div>
            </div>
            <div className="p-6 font-mono text-xs leading-relaxed">
              <div className="space-y-4">
                {CLI_COMMANDS.map((item, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "cursor-pointer transition-all",
                      activeCmdIndex === i ? "opacity-100 scale-[1.02]" : "opacity-40 hover:opacity-60"
                    )}
                    onClick={() => setActiveCmdIndex(i)}
                  >
                    <div className="flex items-center gap-2 text-[#D4A574]">
                      <span className="text-[#4d6d62]">$</span>
                      <span className="font-bold">{item.cmd}</span>
                    </div>
                    {activeCmdIndex === i && (
                      <motion.p 
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-1 pl-4 text-[10px] text-[#a8b3af]"
                      >
                        # {item.desc}
                      </motion.p>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-[#f5f5f0]">
                  <span className="text-[#4d6d62]">$</span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </div>
            <div className="bg-[#1B4D3E]/10 p-4 border-t border-[#D4A574]/10">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#D4A574]">
                <span>Connection</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#D4A574]/10 bg-[#02120e]/40 p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#a8b3af]">Workflow Tip</p>
            <p className="text-xs leading-relaxed text-[#4d6d62]">
              Use <code className="text-[#D4A574]">envii watch</code> to automatically backup changes whenever you save your .env file.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
