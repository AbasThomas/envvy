"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { diffString } from "json-diff";
import {
  GitForkIcon,
  HistoryIcon,
  PencilLineIcon,
  RefreshCwIcon,
  SaveIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UserPlus2Icon,
} from "@/components/ui/icons";
import { useParams } from "next/navigation";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { MonacoEnvEditor } from "@/components/editor/monaco-env-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EnvGraph } from "@/components/visualizer/env-graph";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { parseDotEnv, stringifyDotEnv } from "@/lib/env";
import { fetcher } from "@/lib/fetcher";
import {
  clearStoredRepoPin,
  isValidRepoPin,
  readStoredRepoPin,
  writeStoredRepoPin,
} from "@/lib/repo-pin";
import { cn } from "@/lib/utils";

type RepoDetailsResponse = {
  repo: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isPublic: boolean;
    tags: string[];
    stars?: Array<{ id: string }>;
    _count: { stars: number; envs: number; shares: number };
    envs: Array<{
      id: string;
      version: number;
      environment: string;
      commitMsg: string;
      diffSummary: string | null;
      createdAt: string;
      user: { id: string; name: string | null; email: string };
    }>;
    shares: Array<{
      id: string;
      role: "OWNER" | "EDITOR" | "CONTRIB" | "VIEWER";
      inviteEmail: string | null;
      acceptedAt: string | null;
      expiresAt: string | null;
      createdAt: string;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      } | null;
    }>;
    auditLogs: Array<{
      id: string;
      action: string;
      timestamp: string;
      metadata: unknown;
      user: {
        id: string;
        name: string | null;
        email: string;
      };
    }>;
  };
};

type LatestEnvResponse = {
  env: {
    id: string;
    environment: string;
    version: number;
    decrypted?: Record<string, string>;
  };
};

type RepoTab = "history" | "editor" | "settings" | "audit";

function isExpectedRepoAccessError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("pin") ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  );
}

export default function RepoPage() {
  const params = useParams<{ id: string }>();
  const repoIdentifier = params.id;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<RepoTab>("history");

  const [repoPinInput, setRepoPinInput] = useState("");
  const [repoPin, setRepoPin] = useState<string | null>(null);
  const [hydratedRepoIdentifier, setHydratedRepoIdentifier] = useState<string | null>(null);

  const [envSource, setEnvSource] = useState("NODE_ENV=development\n");
  const [commitMsg, setCommitMsg] = useState("Update env values");
  const [environment, setEnvironment] = useState<"development" | "staging" | "production">(
    "development",
  );
  const [localDiff, setLocalDiff] = useState("");

  const [settingsName, setSettingsName] = useState("");
  const [settingsDescription, setSettingsDescription] = useState("");
  const [settingsVisibility, setSettingsVisibility] = useState<"private" | "public">("private");
  const [settingsRepoPin, setSettingsRepoPin] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"VIEWER" | "CONTRIB" | "EDITOR">("VIEWER");

  const repoHeaders = repoPin ? { "x-envii-repo-pin": repoPin } : undefined;

  useEffect(() => {
    if (!repoIdentifier) return;
    const storedPin = readStoredRepoPin(repoIdentifier);
    setRepoPin(storedPin ?? null);
    setRepoPinInput(storedPin ?? "");
    setHydratedRepoIdentifier(repoIdentifier);
  }, [repoIdentifier]);

  const isRepoPinHydrated = hydratedRepoIdentifier === repoIdentifier;

  const repoQuery = useQuery({
    queryKey: ["repo", repoIdentifier, repoPin],
    queryFn: () =>
      fetcher<RepoDetailsResponse>(`/api/repos/${encodeURIComponent(repoIdentifier)}`, {
        headers: repoHeaders,
      }),
    enabled: !!repoIdentifier && isRepoPinHydrated,
    retry: (failureCount, error) => {
      if (isExpectedRepoAccessError(error)) return false;
      return failureCount < 2;
    },
  });

  const resolvedRepoId = repoQuery.data?.repo.id ?? null;
  const hasAnySnapshots = (repoQuery.data?.repo._count.envs ?? 0) > 0;

  const latestQuery = useQuery<LatestEnvResponse | null>({
    queryKey: ["repo-latest", resolvedRepoId, environment, repoPin],
    queryFn: async () => {
      try {
        return await fetcher<LatestEnvResponse>(
          `/api/envs/${resolvedRepoId}/latest?environment=${environment}&decrypt=true`,
          {
            headers: repoHeaders,
          },
        );
      } catch (error) {
        if (error instanceof Error && error.message.toLowerCase().includes("no environment snapshot")) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!resolvedRepoId && hasAnySnapshots,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.toLowerCase().includes("no environment snapshot")) {
        return false;
      }
      return failureCount < 2;
    },
  });

  const latestDecryptedSource = latestQuery.data?.env?.decrypted
    ? stringifyDotEnv(latestQuery.data.env.decrypted)
    : null;

  useEffect(() => {
    if (latestDecryptedSource) {
      queueMicrotask(() => setEnvSource(latestDecryptedSource));
    }
  }, [latestDecryptedSource]);

  useEffect(() => {
    const repo = repoQuery.data?.repo;
    if (!repo) return;
    setSettingsName(repo.name);
    setSettingsDescription(repo.description ?? "");
    setSettingsVisibility(repo.isPublic ? "public" : "private");
  }, [repoQuery.data?.repo]);

  useEffect(() => {
    const repoId = repoQuery.data?.repo.id;
    if (!repoId || !repoPin) return;
    writeStoredRepoPin(repoId, repoPin);
    writeStoredRepoPin(repoIdentifier, repoPin);
  }, [repoQuery.data?.repo.id, repoIdentifier, repoPin]);

  const commitMutation = useMutation({
    mutationFn: () => {
      if (!resolvedRepoId) throw new Error("Repository is not ready");
      return fetcher("/api/envs", {
        method: "POST",
        headers: repoHeaders,
        body: JSON.stringify({
          repoId: resolvedRepoId,
          environment,
          commitMsg,
          env: parseDotEnv(envSource),
        }),
      });
    },
    onSuccess: () => {
      toast.success("Snapshot committed");
      queryClient.invalidateQueries({ queryKey: ["repo", repoIdentifier] });
      queryClient.invalidateQueries({ queryKey: ["repo-latest", resolvedRepoId, environment] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Commit failed");
    },
  });

  const starMutation = useMutation({
    mutationFn: () => {
      if (!resolvedRepoId) throw new Error("Repository is not ready");
      return fetcher("/api/social/star", {
        method: "POST",
        body: JSON.stringify({ repoId: resolvedRepoId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repo", repoIdentifier] });
      toast.success("Star state updated");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Star failed"),
  });

  const forkMutation = useMutation({
    mutationFn: () => {
      if (!resolvedRepoId) throw new Error("Repository is not ready");
      return fetcher("/api/social/fork", {
        method: "POST",
        body: JSON.stringify({ repoId: resolvedRepoId }),
      });
    },
    onSuccess: () => toast.success("Fork created in your dashboard"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Fork failed"),
  });

  const settingsMutation = useMutation({
    mutationFn: async () => {
      const repo = repoQuery.data?.repo;
      if (!repo) throw new Error("Repository is not loaded");

      const payload: {
        name?: string;
        description?: string | null;
        visibility?: "private" | "public";
        repoPin?: string;
      } = {};

      const trimmedName = settingsName.trim();
      const trimmedDescription = settingsDescription.trim();
      const currentDescription = repo.description ?? "";
      const currentVisibility: "private" | "public" = repo.isPublic ? "public" : "private";

      if (trimmedName.length < 2) {
        throw new Error("Repository name must be at least 2 characters");
      }

      if (trimmedName !== repo.name) payload.name = trimmedName;
      if (trimmedDescription !== currentDescription) payload.description = trimmedDescription || null;
      if (settingsVisibility !== currentVisibility) payload.visibility = settingsVisibility;

      if (settingsRepoPin) {
        if (!isValidRepoPin(settingsRepoPin)) {
          throw new Error("Repository PIN must be exactly 6 digits");
        }
        payload.repoPin = settingsRepoPin;
      }

      if (!Object.keys(payload).length) {
        throw new Error("No settings changes to save");
      }

      return fetcher(`/api/repos/${encodeURIComponent(repoIdentifier)}`, {
        method: "PATCH",
        headers: repoHeaders,
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setSettingsRepoPin("");
      toast.success("Repository settings updated");
      queryClient.invalidateQueries({ queryKey: ["repo", repoIdentifier] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!resolvedRepoId) throw new Error("Repository is not ready");
      if (!inviteEmail.trim()) throw new Error("Invite email is required");

      return fetcher("/api/share", {
        method: "POST",
        headers: repoHeaders,
        body: JSON.stringify({
          repoId: resolvedRepoId,
          inviteEmail: inviteEmail.trim(),
          role: inviteRole,
        }),
      });
    },
    onSuccess: () => {
      setInviteEmail("");
      toast.success("Invite created");
      queryClient.invalidateQueries({ queryKey: ["repo", repoIdentifier] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Invite failed"),
  });

  const removeShareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      if (!resolvedRepoId) throw new Error("Repository is not ready");
      return fetcher(`/api/share/${resolvedRepoId}?shareId=${encodeURIComponent(shareId)}`, {
        method: "DELETE",
        headers: repoHeaders,
      });
    },
    onSuccess: () => {
      toast.success("Collaborator removed");
      queryClient.invalidateQueries({ queryKey: ["repo", repoIdentifier] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not remove collaborator"),
  });

  useShortcuts([
    { key: "s", ctrl: true, onTrigger: () => commitMutation.mutate() },
    { key: "d", ctrl: true, onTrigger: () => calculateLocalDiff() },
  ]);

  function calculateLocalDiff() {
    const baseline = latestQuery.data?.env.decrypted ?? {};
    const current = parseDotEnv(envSource);
    setLocalDiff(diffString(baseline, current));
  }

  const repo = repoQuery.data?.repo;
  const envKeys = useMemo(() => Object.keys(parseDotEnv(envSource)), [envSource]);

  useEffect(() => {
    if (!(repoQuery.error instanceof Error)) return;
    if (!repoQuery.error.message.toLowerCase().includes("pin")) return;

    const resolvedId = repoQuery.data?.repo.id;
    clearStoredRepoPin(repoIdentifier);
    if (resolvedId) clearStoredRepoPin(resolvedId);
    setRepoPin(null);
  }, [repoIdentifier, repoQuery.data?.repo.id, repoQuery.error]);

  function unlockRepo() {
    if (!isValidRepoPin(repoPinInput)) {
      toast.error("Enter a valid 6-digit PIN");
      return;
    }

    writeStoredRepoPin(repoIdentifier, repoPinInput);
    setRepoPin(repoPinInput);
    queryClient.invalidateQueries({ queryKey: ["repo", repoIdentifier] });
  }

  const repoPinRequired =
    repoQuery.error instanceof Error && repoQuery.error.message.toLowerCase().includes("pin");

  if (!isRepoPinHydrated || repoQuery.isLoading) {
    return (
      <div className="app-page">
        <Card>
          <CardHeader>
            <div className="h-7 w-52 animate-pulse rounded bg-[#1B4D3E]/30" />
            <div className="h-4 w-80 animate-pulse rounded bg-[#1B4D3E]/20" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-20 animate-pulse rounded-full bg-[#1B4D3E]/20" />
              <div className="h-6 w-24 animate-pulse rounded-full bg-[#1B4D3E]/20" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-[#1B4D3E]/20" />
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="h-9 w-28 animate-pulse rounded-lg bg-[#1B4D3E]/20" />
              <div className="h-9 w-24 animate-pulse rounded-lg bg-[#1B4D3E]/20" />
              <div className="h-9 w-28 animate-pulse rounded-lg bg-[#1B4D3E]/20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-8 text-sm text-[#a8b3af]">
            Loading repository details...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (repoPinRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repository Locked</CardTitle>
          <CardDescription>
            Select repo, then enter your 6-digit PIN to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Input
              placeholder="Enter 6-digit PIN"
              value={repoPinInput}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setRepoPinInput(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  unlockRepo();
                }
              }}
            />
            <p className="text-xs text-[#8d9a95]">{repoPinInput.length}/6 digits</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={unlockRepo} disabled={!isValidRepoPin(repoPinInput)}>
              Unlock Repository
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                clearStoredRepoPin(repoIdentifier);
                setRepoPin(null);
                setRepoPinInput("");
              }}
            >
              Clear PIN
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (repoQuery.error instanceof Error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repository Error</CardTitle>
          <CardDescription>{repoQuery.error.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tabs: Array<{
    key: RepoTab;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }> = [
    { key: "history", label: "Env History", icon: HistoryIcon },
    { key: "editor", label: "Editor", icon: PencilLineIcon },
    { key: "settings", label: "Settings", icon: Settings2Icon },
    { key: "audit", label: "Audit Log", icon: ShieldCheckIcon },
  ];

  return (
    <div className="app-page space-y-6 sm:space-y-10">
      <Card className="glass relative overflow-hidden border-[#D4A574]/20 bg-[#02120e]/60">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4A574]/5 blur-3xl" />
        <CardHeader className="relative z-10 pb-6">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#D4A574]">
                <div className="h-1 w-8 rounded-full bg-gradient-to-r from-[#D4A574] to-transparent" />
                <span>Vault Details</span>
              </div>
              <CardTitle className="text-3xl font-black tracking-tight text-[#f5f5f0] sm:text-4xl">
                {repo?.name ?? "Repository"}
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-relaxed text-[#a8b3af] sm:text-base">
                {repo?.description ?? "No description provided for this secure vault."}
              </CardDescription>
              {repoQuery.isFetching && (
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#D4A574]/60">
                  <RefreshCwIcon className="h-3 w-3 animate-spin" />
                  Refreshing...
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-2 border-[#D4A574]/20 bg-[#1B4D3E]/10 px-4 text-[11px] font-black uppercase tracking-widest text-[#f5f5f0] hover:bg-[#1B4D3E]/20"
                onClick={() => starMutation.mutate()}
              >
                <StarIcon className={cn("h-4 w-4", repo?.stars?.length ? "fill-[#D4A574] text-[#D4A574]" : "text-[#8d9a95]")} />
                {repo?._count.stars ?? 0} Stars
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-2 border-[#D4A574]/20 bg-[#1B4D3E]/10 px-4 text-[11px] font-black uppercase tracking-widest text-[#f5f5f0] hover:bg-[#1B4D3E]/20"
                onClick={() => forkMutation.mutate()}
              >
                <GitForkIcon className="h-4 w-4 text-[#D4A574]" />
                Fork
              </Button>
              <Badge className={cn(
                "h-10 flex items-center px-4 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#D4A574]/10",
                repo?.isPublic 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-[#D4A574] text-[#02120e]"
              )}>
                {repo?.isPublic ? "Public" : "Private"}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 border-t border-[#D4A574]/10 pt-0">
          <nav className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 py-4 sm:-mx-8 sm:px-8">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all",
                    active
                      ? "bg-[#1B4D3E]/40 text-[#f5f5f0] shadow-lg shadow-[#1B4D3E]/20 ring-1 ring-[#D4A574]/20"
                      : "text-[#8d9a95] hover:bg-[#1B4D3E]/10 hover:text-[#f5f5f0]"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-[#D4A574]" : "text-[#8d9a95]")} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </CardContent>
      </Card>

      <div className="space-y-10">
        {activeTab === "history" ? (
          <Card className="glass border-[#D4A574]/15 bg-[#02120e]/40">
            <CardHeader>
              <CardTitle className="text-xl font-black tracking-tight text-[#f5f5f0]">Environment History</CardTitle>
              <CardDescription className="text-[#a8b3af]">Versioned snapshots and commit trail for this vault.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {repo?.envs.length ? (
                <div className="grid gap-4">
                  {repo.envs.map((entry) => (
                    <div
                      key={entry.id}
                      className="group relative overflow-hidden rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/10 p-5 transition-all hover:border-[#D4A574]/30 hover:bg-[#1B4D3E]/20"
                    >
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#D4A574]/5 blur-2xl transition-all group-hover:bg-[#D4A574]/10" />
                      <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-[#D4A574] text-[10px] font-black uppercase text-[#02120e]">
                              v{entry.version}
                            </Badge>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">
                              {entry.environment}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-[#f5f5f0]">{entry.commitMsg}</p>
                          <div className="flex items-center gap-3 text-[10px] text-[#8d9a95]">
                            <span className="flex items-center gap-1">
                              <HistoryIcon className="h-3 w-3" />
                              {new Date(entry.createdAt).toLocaleString()}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-[#D4A574]/30" />
                            <span>{entry.diffSummary ?? "Initial snapshot"}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg border border-[#D4A574]/10 bg-[#1B4D3E]/10 px-3 text-[10px] font-black uppercase tracking-widest text-[#f5f5f0] hover:bg-[#D4A574] hover:text-[#02120e]"
                        >
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D4A574]/20 py-12 text-center">
                  <div className="mb-4 rounded-full bg-[#1B4D3E]/20 p-4">
                    <HistoryIcon className="h-8 w-8 text-[#D4A574]/40" />
                  </div>
                  <p className="text-sm font-bold text-[#f5f5f0]">No snapshots yet</p>
                  <p className="mt-1 text-xs text-[#a8b3af]">Create your first snapshot in the Editor tab.</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "editor" ? (
          <div className="space-y-6">
            {!latestQuery.isLoading && (!hasAnySnapshots || !latestQuery.data?.env) ? (
              <Card className="border-[#D4A574]/20 bg-[#D4A574]/5">
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="rounded-full bg-[#D4A574]/10 p-2">
                    <SparklesIcon className="h-5 w-5 text-[#D4A574]" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#f5f5f0]">
                      No snapshot found for <span className="text-[#D4A574]">{environment}</span>
                    </p>
                    <p className="text-xs leading-relaxed text-[#a8b3af]">
                      Run <code className="rounded bg-[#02120e]/70 px-1.5 py-0.5 font-mono text-[#D4A574]">envii backup</code> in your project folder or commit from this editor to load environment values.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="glass border-[#D4A574]/15 bg-[#02120e]/40">
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="relative">
                    <select
                      className="themed-select h-11 w-full rounded-xl border border-[#D4A574]/20 bg-[#1B4D3E]/10 px-4 text-xs font-black uppercase tracking-widest text-[#f5f5f0]"
                      value={environment}
                      onChange={(event) =>
                        setEnvironment(
                          event.target.value as "development" | "staging" | "production",
                        )
                      }
                    >
                      <option value="development">development</option>
                      <option value="staging">staging</option>
                      <option value="production">production</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <Input 
                      className="h-11 rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10 text-sm"
                      placeholder="Commit message..."
                      value={commitMsg} 
                      onChange={(event) => setCommitMsg(event.target.value)} 
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="h-11 flex-1 gap-2 border-[#D4A574]/20 bg-[#1B4D3E]/10 text-[10px] font-black uppercase tracking-widest text-[#f5f5f0] hover:bg-[#1B4D3E]/20"
                      onClick={calculateLocalDiff}
                    >
                      Diff
                    </Button>
                    <Button 
                      className="h-11 flex-1 gap-2 bg-[#D4A574] text-[10px] font-black uppercase tracking-widest text-[#02120e] hover:bg-[#D4A574]/90"
                      onClick={() => commitMutation.mutate()}
                    >
                      <SaveIcon className="h-3.5 w-3.5" />
                      Commit
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-2 text-[10px] font-black uppercase tracking-widest text-[#D4A574] hover:bg-[#D4A574]/10"
                    onClick={async () => {
                      const aiPromise = fetcher<{ suggestions: string[]; commitSummary: string }>(
                        "/api/ai/suggestions",
                        {
                          method: "POST",
                          body: JSON.stringify({ env: parseDotEnv(envSource) }),
                        },
                      );
                      toast.promise(aiPromise, {
                        loading: "AI is analyzing your env...",
                        success: (data) => {
                          setCommitMsg(data.commitSummary);
                          return "AI suggestions ready!";
                        },
                        error: "AI analysis failed",
                      });
                    }}
                  >
                    <SparklesIcon className="h-3.5 w-3.5" />
                    AI Suggest Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="overflow-hidden rounded-2xl border border-[#D4A574]/20 bg-[#02120e]/60 shadow-2xl">
              <MonacoEnvEditor value={envSource} onChange={setEnvSource} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass border-[#D4A574]/15 bg-[#02120e]/40">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight text-[#f5f5f0]">Env Visualizer</CardTitle>
                  <CardDescription className="text-xs text-[#a8b3af]">Grouped by key suffix dependencies.</CardDescription>
                </CardHeader>
                <CardContent className="h-[360px]">
                  <EnvGraph keys={envKeys} />
                </CardContent>
              </Card>

              <Card className="glass border-[#D4A574]/15 bg-[#02120e]/40">
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight text-[#f5f5f0]">Local Diff Preview</CardTitle>
                  <CardDescription className="text-xs text-[#a8b3af]">Compare editor changes against latest snapshot.</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="max-h-[360px] overflow-auto rounded-xl bg-[#02120e]/80 p-4 font-mono text-[11px] leading-relaxed text-[#c8d2ce]">
                    {localDiff || "No diff calculated yet. Click Diff to see changes."}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}

        {activeTab === "settings" ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="glass border-[#D4A574]/15 bg-[#02120e]/40">
              <CardHeader>
                <CardTitle className="text-xl font-black tracking-tight text-[#f5f5f0]">Vault Settings</CardTitle>
                <CardDescription className="text-[#a8b3af]">Update identity, visibility, and access PIN.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">Name</label>
                  <Input 
                    className="h-11 rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10"
                    value={settingsName} 
                    onChange={(event) => setSettingsName(event.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">Description</label>
                  <Textarea
                    className="min-h-[100px] rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10"
                    value={settingsDescription}
                    onChange={(event) => setSettingsDescription(event.target.value)}
                    placeholder="Describe this vault..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">Visibility</label>
                  <select
                    className="themed-select h-11 w-full rounded-xl border border-[#D4A574]/20 bg-[#1B4D3E]/10 px-4 text-xs font-black uppercase tracking-widest text-[#f5f5f0]"
                    value={settingsVisibility}
                    onChange={(event) =>
                      setSettingsVisibility(event.target.value as "private" | "public")
                    }
                  >
                    <option value="private">Private (Vaulted)</option>
                    <option value="public">Public (Shared)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">Access PIN</label>
                  <Input
                    className="h-11 rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10"
                    placeholder="New 6-digit PIN (optional)"
                    inputMode="numeric"
                    maxLength={6}
                    value={settingsRepoPin}
                    onChange={(event) =>
                      setSettingsRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                  />
                  <p className="text-[10px] text-[#8d9a95]">{settingsRepoPin.length}/6 digits</p>
                </div>
                <Button 
                  className="w-full bg-[#D4A574] text-xs font-black uppercase tracking-widest text-[#02120e] hover:bg-[#D4A574]/90"
                  onClick={() => settingsMutation.mutate()} 
                  disabled={settingsMutation.isPending}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card className="glass border-[#D4A574]/15 bg-[#02120e]/40">
              <CardHeader>
                <CardTitle className="text-xl font-black tracking-tight text-[#f5f5f0]">Collaborators</CardTitle>
                <CardDescription className="text-[#a8b3af]">Invite team members and manage access roles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <Input
                    className="h-11 rounded-xl border-[#D4A574]/20 bg-[#1B4D3E]/10 text-sm"
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                  />
                  <select
                    className="themed-select h-11 rounded-xl border border-[#D4A574]/20 bg-[#1B4D3E]/10 px-4 text-xs font-black uppercase tracking-widest text-[#f5f5f0]"
                    value={inviteRole}
                    onChange={(event) =>
                      setInviteRole(event.target.value as "VIEWER" | "CONTRIB" | "EDITOR")
                    }
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="CONTRIB">Contrib</option>
                    <option value="EDITOR">Editor</option>
                  </select>
                  <Button 
                    className="h-11 bg-[#D4A574] text-[10px] font-black uppercase tracking-widest text-[#02120e] hover:bg-[#D4A574]/90"
                    onClick={() => inviteMutation.mutate()} 
                    disabled={inviteMutation.isPending}
                  >
                    <UserPlus2Icon className="mr-2 h-4 w-4" />
                    Invite
                  </Button>
                </div>

                <div className="space-y-3">
                  {repo?.shares.length ? (
                    repo.shares.map((share) => (
                      <div
                        key={share.id}
                        className="group flex items-center justify-between gap-4 rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/10 p-4 transition-all hover:border-[#D4A574]/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A574]/10 text-[#D4A574]">
                            <UserPlus2Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#f5f5f0]">
                              {share.user?.name || share.user?.email || share.inviteEmail}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">
                              {share.role} • {share.acceptedAt ? "Active" : "Pending"}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 hover:text-red-400"
                          onClick={() => removeShareMutation.mutate(share.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D4A574]/20 py-8 text-center">
                      <p className="text-xs font-bold text-[#8d9a95]">No collaborators yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === "audit" ? (
          <Card className="glass border-[#D4A574]/15 bg-[#02120e]/40">
            <CardHeader>
              <CardTitle className="text-xl font-black tracking-tight text-[#f5f5f0]">Audit Log</CardTitle>
              <CardDescription className="text-[#a8b3af]">Complete activity trail for this vault.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {repo?.auditLogs.length ? (
                <div className="grid gap-3">
                  {repo.auditLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/10 p-4 transition-all hover:border-[#D4A574]/20"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-[#f5f5f0]">{entry.action}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/60">
                            {entry.user.name ?? entry.user.email} • {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {entry.metadata ? (
                          <div className="rounded-xl bg-[#02120e]/60 p-3">
                            <pre className="max-h-24 overflow-auto font-mono text-[10px] text-[#8d9a95]">
                              {JSON.stringify(entry.metadata, null, 2)}
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D4A574]/20 py-12 text-center">
                  <p className="text-sm font-bold text-[#8d9a95]">No audit events yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
