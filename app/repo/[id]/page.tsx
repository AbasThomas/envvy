"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { diffString } from "json-diff";
import { GitForkIcon, SaveIcon, SparklesIcon, StarIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { MonacoEnvEditor } from "@/components/editor/monaco-env-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function RepoPage() {
  const params = useParams<{ id: string }>();
  const repoId = params.id;
  const queryClient = useQueryClient();

  const [repoPinInput, setRepoPinInput] = useState("");
  const [repoPin, setRepoPin] = useState<string | null>(null);
  const [envSource, setEnvSource] = useState("NODE_ENV=development\n");
  const [commitMsg, setCommitMsg] = useState("Update env values");
  const [environment, setEnvironment] = useState<"development" | "staging" | "production">(
    "development",
  );
  const [localDiff, setLocalDiff] = useState("");
  const repoHeaders = repoPin ? { "x-envii-repo-pin": repoPin } : undefined;

  useEffect(() => {
    if (!repoId) return;
    const storedPin = readStoredRepoPin(repoId);
    if (!storedPin) return;
    setRepoPin(storedPin);
    setRepoPinInput(storedPin);
  }, [repoId]);

  const repoQuery = useQuery({
    queryKey: ["repo", repoId, repoPin],
    queryFn: () =>
      fetcher<RepoDetailsResponse>(`/api/repos/${repoId}`, {
        headers: repoHeaders,
      }),
    enabled: !!repoId && !!repoPin,
  });

  const latestQuery = useQuery({
    queryKey: ["repo-latest", repoId, environment, repoPin],
    queryFn: () =>
      fetcher<LatestEnvResponse>(`/api/envs/${repoId}/latest?environment=${environment}&decrypt=true`, {
        headers: repoHeaders,
      }),
    enabled: !!repoId && !!repoPin,
  });

  const latestDecryptedSource = latestQuery.data?.env?.decrypted
    ? stringifyDotEnv(latestQuery.data.env.decrypted)
    : null;

  useEffect(() => {
    if (latestDecryptedSource) {
      queueMicrotask(() => setEnvSource(latestDecryptedSource));
    }
  }, [latestDecryptedSource]);

  const commitMutation = useMutation({
    mutationFn: () =>
      fetcher("/api/envs", {
        method: "POST",
        headers: repoHeaders,
        body: JSON.stringify({
          repoId,
          environment,
          commitMsg,
          env: parseDotEnv(envSource),
        }),
      }),
    onSuccess: () => {
      toast.success("Snapshot committed");
      queryClient.invalidateQueries({ queryKey: ["repo", repoId] });
      queryClient.invalidateQueries({ queryKey: ["repo-latest", repoId, environment] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Commit failed");
    },
  });

  const starMutation = useMutation({
    mutationFn: () =>
      fetcher("/api/social/star", {
        method: "POST",
        body: JSON.stringify({ repoId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repo", repoId] });
      toast.success("Star state updated");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Star failed"),
  });

  const forkMutation = useMutation({
    mutationFn: () =>
      fetcher("/api/social/fork", {
        method: "POST",
        body: JSON.stringify({ repoId }),
      }),
    onSuccess: () => toast.success("Fork created in your dashboard"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Fork failed"),
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
    clearStoredRepoPin(repoId);
    setRepoPin(null);
  }, [repoId, repoQuery.error]);

  function unlockRepo() {
    if (!isValidRepoPin(repoPinInput)) {
      toast.error("Enter a valid 6-digit PIN");
      return;
    }

    writeStoredRepoPin(repoId, repoPinInput);
    setRepoPin(repoPinInput);
    queryClient.invalidateQueries({ queryKey: ["repo", repoId] });
  }

  if (!repoPin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unlock Private Repository</CardTitle>
          <CardDescription>Select repo, then enter your 6-digit PIN to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <Button onClick={unlockRepo} disabled={!isValidRepoPin(repoPinInput)}>
            Unlock Repository
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (repoQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-[#a8b3af]">
          Validating PIN and loading repository...
        </CardContent>
      </Card>
    );
  }

  if (repoQuery.error instanceof Error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repository Locked</CardTitle>
          <CardDescription>{repoQuery.error.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
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
          <div className="flex items-center gap-2">
            <Button onClick={unlockRepo} disabled={!isValidRepoPin(repoPinInput)}>
              Try PIN Again
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                clearStoredRepoPin(repoId);
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

  return (
    <div className="space-y-5">
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
              <Button size="sm" onClick={() => commitMutation.mutate()}>
                <SaveIcon className="mr-2 h-4 w-4" />
                Commit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{repo?.isPublic ? "public" : "private"}</Badge>
            <Badge variant="muted">{repo?._count.envs ?? 0} snapshots</Badge>
            <Badge variant="muted">{repo?._count.stars ?? 0} stars</Badge>
            <Badge variant="warning">Ctrl/Cmd + S to commit</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="themed-select rounded-xl px-3 py-2 text-sm"
              value={environment}
              onChange={(event) =>
                setEnvironment(event.target.value as "development" | "staging" | "production")
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
                const ai = await fetcher<{ suggestions: string[]; commitSummary: string }>("/api/ai/suggestions", {
                  method: "POST",
                  body: JSON.stringify({ env: parseDotEnv(envSource) }),
                });
                setCommitMsg(ai.commitSummary);
                toast.success(ai.suggestions.join("\n"));
              }}
            >
              <SparklesIcon className="mr-2 h-4 w-4" />
              AI Suggest
            </Button>
          </div>
        </CardContent>
      </Card>

      <MonacoEnvEditor value={envSource} onChange={setEnvSource} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {repo?.envs.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-[#D4A574]/15 bg-[#1B4D3E]/20 p-3"
              >
                <p className="text-sm text-[#c8d2ce]">
                  v{entry.version} - {entry.environment}
                </p>
                <p className="text-sm text-[#a8b3af]">{entry.commitMsg}</p>
                <p className="text-xs text-[#8d9a95]">{entry.diffSummary ?? "No diff summary"}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Env Visualizer</CardTitle>
            <CardDescription>Grouped by key suffix dependencies.</CardDescription>
          </CardHeader>
          <CardContent>
            <EnvGraph keys={envKeys} />
          </CardContent>
        </Card>
      </div>

      {localDiff ? (
        <Card>
          <CardHeader>
            <CardTitle>Local Diff Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[320px] overflow-auto rounded-xl bg-[#02120e] p-3 text-xs text-[#c8d2ce]">
              {localDiff}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
