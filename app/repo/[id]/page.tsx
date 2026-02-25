"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { diffString } from "json-diff";
import {
  GitForkIcon,
  HistoryIcon,
  PencilLineIcon,
  SaveIcon,
  Settings2Icon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  UserPlus2Icon,
} from "lucide-react";
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

type RepoDetailsResponse = {
  repo: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isPublic: boolean;
    tags: string[];
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

export default function RepoPage() {
  const params = useParams<{ id: string }>();
  const repoIdentifier = params.id;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<RepoTab>("history");

  const [repoPinInput, setRepoPinInput] = useState("");
  const [repoPin, setRepoPin] = useState<string | null>(null);

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
    if (!storedPin) return;
    setRepoPin(storedPin);
    setRepoPinInput(storedPin);
  }, [repoIdentifier]);

  const repoQuery = useQuery({
    queryKey: ["repo", repoIdentifier, repoPin],
    queryFn: () =>
      fetcher<RepoDetailsResponse>(`/api/repos/${encodeURIComponent(repoIdentifier)}`, {
        headers: repoHeaders,
      }),
    enabled: !!repoIdentifier,
  });

  const resolvedRepoId = repoQuery.data?.repo.id ?? null;

  const latestQuery = useQuery({
    queryKey: ["repo-latest", resolvedRepoId, environment, repoPin],
    queryFn: () =>
      fetcher<LatestEnvResponse>(
        `/api/envs/${resolvedRepoId}/latest?environment=${environment}&decrypt=true`,
        {
          headers: repoHeaders,
        },
      ),
    enabled: !!resolvedRepoId,
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

  if (repoQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-[#a8b3af]">
          Loading repository...
        </CardContent>
      </Card>
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
    <div className="app-page">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">{repo?.name ?? "Repository"}</CardTitle>
              <CardDescription>{repo?.description ?? "No description provided."}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => starMutation.mutate()}>
                <StarIcon className="mr-2 h-4 w-4" />
                Star
              </Button>
              <Button variant="outline" size="sm" onClick={() => forkMutation.mutate()}>
                <GitForkIcon className="mr-2 h-4 w-4" />
                Fork
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{repo?.isPublic ? "public" : "private"}</Badge>
            <Badge variant="muted">{repo?._count.envs ?? 0} snapshots</Badge>
            <Badge variant="muted">{repo?._count.stars ?? 0} stars</Badge>
            <Badge variant="muted">{repo?._count.shares ?? 0} collaborators</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <Button
                  key={tab.key}
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {activeTab === "history" ? (
        <Card>
          <CardHeader>
            <CardTitle>Environment History</CardTitle>
            <CardDescription>Versioned snapshots and commit trail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {repo?.envs.length ? (
              repo.envs.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[#D4A574]/15 bg-[#1B4D3E]/20 p-3"
                >
                  <p className="text-sm text-[#c8d2ce]">
                    v{entry.version} - {entry.environment}
                  </p>
                  <p className="text-sm text-[#a8b3af]">{entry.commitMsg}</p>
                  <p className="text-xs text-[#8d9a95]">
                    {entry.diffSummary ?? "No diff summary"} -{" "}
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#a8b3af]">No snapshots yet.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "editor" ? (
        <>
          <Card>
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="themed-select rounded-xl px-3 py-2 text-sm"
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
                <Input value={commitMsg} onChange={(event) => setCommitMsg(event.target.value)} />
                <Button variant="secondary" onClick={calculateLocalDiff}>
                  Local Diff
                </Button>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    const ai = await fetcher<{ suggestions: string[]; commitSummary: string }>(
                      "/api/ai/suggestions",
                      {
                        method: "POST",
                        body: JSON.stringify({ env: parseDotEnv(envSource) }),
                      },
                    );
                    setCommitMsg(ai.commitSummary);
                    toast.success(ai.suggestions.join("\n"));
                  }}
                >
                  <SparklesIcon className="mr-2 h-4 w-4" />
                  AI Suggest
                </Button>
                <Button size="sm" onClick={() => commitMutation.mutate()}>
                  <SaveIcon className="mr-2 h-4 w-4" />
                  Commit
                </Button>
              </div>
            </CardContent>
          </Card>

          <MonacoEnvEditor value={envSource} onChange={setEnvSource} />

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Env Visualizer</CardTitle>
                <CardDescription>Grouped by key suffix dependencies.</CardDescription>
              </CardHeader>
              <CardContent>
                <EnvGraph keys={envKeys} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Local Diff Preview</CardTitle>
                <CardDescription>Compare editor changes against latest snapshot.</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[360px] overflow-auto rounded-xl bg-[#02120e] p-3 text-xs text-[#c8d2ce]">
                  {localDiff || "No diff calculated yet. Click Local Diff."}
                </pre>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {activeTab === "settings" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Repository Settings</CardTitle>
              <CardDescription>Update name, description, visibility, and PIN.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input value={settingsName} onChange={(event) => setSettingsName(event.target.value)} />
              <Textarea
                value={settingsDescription}
                onChange={(event) => setSettingsDescription(event.target.value)}
                placeholder="Description"
              />
              <select
                className="themed-select w-full rounded-xl px-3 py-2 text-sm"
                value={settingsVisibility}
                onChange={(event) =>
                  setSettingsVisibility(event.target.value as "private" | "public")
                }
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
              <div className="space-y-1">
                <Input
                  placeholder="New 6-digit repository PIN (optional)"
                  inputMode="numeric"
                  maxLength={6}
                  value={settingsRepoPin}
                  onChange={(event) =>
                    setSettingsRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                />
                <p className="text-xs text-[#8d9a95]">{settingsRepoPin.length}/6 digits</p>
              </div>
              <Button onClick={() => settingsMutation.mutate()} disabled={settingsMutation.isPending}>
                Save Settings
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collaborators</CardTitle>
              <CardDescription>Invite by email and manage access roles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-[1fr_140px_auto]">
                <Input
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                />
                <select
                  className="themed-select rounded-xl px-3 py-2 text-sm"
                  value={inviteRole}
                  onChange={(event) =>
                    setInviteRole(event.target.value as "VIEWER" | "CONTRIB" | "EDITOR")
                  }
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="CONTRIB">Contributor</option>
                  <option value="EDITOR">Editor</option>
                </select>
                <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending}>
                  <UserPlus2Icon className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </div>

              <div className="space-y-2">
                {repo?.shares.length ? (
                  repo.shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#D4A574]/15 bg-[#1B4D3E]/20 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm text-[#f5f5f0]">
                          {share.user?.name || share.user?.email || share.inviteEmail || "Invite"}
                        </p>
                        <p className="text-xs text-[#8d9a95]">
                          {share.role} -{" "}
                          {share.acceptedAt ? "accepted" : `pending since ${new Date(share.createdAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeShareMutation.mutate(share.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#a8b3af]">No collaborators yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "audit" ? (
        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>Who changed what, and when.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {repo?.auditLogs.length ? (
              repo.auditLogs.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[#D4A574]/15 bg-[#1B4D3E]/20 p-3"
                >
                  <p className="text-sm text-[#f5f5f0]">{entry.action}</p>
                  <p className="text-xs text-[#a8b3af]">
                    {entry.user.name ?? entry.user.email} - {new Date(entry.timestamp).toLocaleString()}
                  </p>
                  {entry.metadata ? (
                    <pre className="mt-2 max-h-24 overflow-auto rounded bg-[#02120e]/70 p-2 text-[11px] text-[#8d9a95]">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-[#a8b3af]">No audit events yet.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
