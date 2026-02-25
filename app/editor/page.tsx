"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowUpIcon, MoveVerticalIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { MonacoEnvEditor } from "@/components/editor/monaco-env-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRealtimeRepo, sendRealtimeRepoEvent } from "@/hooks/use-realtime-repo";
import { parseDotEnv, stringifyDotEnv } from "@/lib/env";
import { fetcher } from "@/lib/fetcher";
import { isValidRepoPin, readStoredRepoPin, writeStoredRepoPin } from "@/lib/repo-pin";

type RepoListResponse = {
  repos: Array<{ id: string; name: string; slug: string }>;
};

export default function EditorPage() {
  const reposQuery = useQuery({
    queryKey: ["editor-repos"],
    queryFn: () => fetcher<RepoListResponse>("/api/repos"),
  });

  const [repoId, setRepoId] = useState("");
  const [repoPin, setRepoPin] = useState("");
  const [environment, setEnvironment] = useState<"development" | "staging" | "production">(
    "development",
  );
  const [commitMsg, setCommitMsg] = useState("Editor commit");
  const [envSource, setEnvSource] = useState("NODE_ENV=development\n");
  const [activity, setActivity] = useState<string[]>([]);
  const envMap = useMemo(() => parseDotEnv(envSource), [envSource]);
  const [orderedKeys, setOrderedKeys] = useState<string[]>([]);
  const effectiveOrderedKeys = useMemo(() => {
    const sourceKeys = Object.keys(envMap);
    if (!orderedKeys.length) return sourceKeys;
    const keep = orderedKeys.filter((key) => sourceKeys.includes(key));
    const added = sourceKeys.filter((key) => !keep.includes(key));
    return [...keep, ...added];
  }, [orderedKeys, envMap]);

  useRealtimeRepo({
    repoId,
    onMessage: (message) => {
      setActivity((prev) => [`${new Date().toLocaleTimeString()} ${message.message}`, ...prev].slice(0, 8));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!repoId) throw new Error("Select a repository first");
      if (!isValidRepoPin(repoPin)) throw new Error("Enter the 6-digit repository PIN first");
      writeStoredRepoPin(repoId, repoPin);
      await fetcher("/api/envs", {
        method: "POST",
        headers: {
          "x-envii-repo-pin": repoPin,
        },
        body: JSON.stringify({
          repoId,
          environment,
          commitMsg,
          env: envMap,
        }),
      });

      await sendRealtimeRepoEvent(repoId, {
        type: "commit",
        message: `New ${environment} commit: ${commitMsg}`,
      });
    },
    onSuccess: () => toast.success("Saved and broadcasted"),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Save failed"),
  });

  function moveKey(index: number, direction: -1 | 1) {
    setOrderedKeys(() => {
      const next = [...effectiveOrderedKeys];
      const to = index + direction;
      if (to < 0 || to >= next.length) return effectiveOrderedKeys;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }

  const reorderedEnv = effectiveOrderedKeys.reduce<Record<string, string>>((acc, key) => {
    acc[key] = envMap[key];
    return acc;
  }, {});

  useEffect(() => {
    if (!repoId) {
      setRepoPin("");
      return;
    }
    setRepoPin(readStoredRepoPin(repoId) ?? "");
  }, [repoId]);

  return (
    <div className="app-page">
      <Card>
        <CardHeader>
          <CardTitle>Collaborative Env Editor</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-[1fr_180px_220px_180px_auto]">
          <select
            className="themed-select rounded-xl px-3 py-2 text-sm"
            value={repoId}
            onChange={(event) => setRepoId(event.target.value)}
          >
            <option value="">Select repo...</option>
            {reposQuery.data?.repos.map((repo) => (
              <option key={repo.id} value={repo.id}>
                {repo.name}
              </option>
            ))}
          </select>
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
          <div className="space-y-1">
            <Input
              placeholder="Repo PIN (6 digits)"
              value={repoPin}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <p className="text-xs text-[#8d9a95]">{repoPin.length}/6 digits</p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !repoId || !isValidRepoPin(repoPin)}
          >
            {saveMutation.isPending ? "Saving..." : "Save + Broadcast"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <MonacoEnvEditor
          value={stringifyDotEnv(reorderedEnv)}
          onChange={(value) => setEnvSource(value)}
          height="500px"
        />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MoveVerticalIcon className="h-4 w-4" />
                Reorder keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {effectiveOrderedKeys.map((key, index) => (
                  <li
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-[#D4A574]/15 bg-[#1B4D3E]/20 px-3 py-2"
                  >
                    <span className="text-sm text-[#c8d2ce]">{key}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => moveKey(index, -1)}>
                        <ArrowUpIcon className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => moveKey(index, 1)}>
                        <ArrowDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Realtime activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-[#c8d2ce]">
              {activity.length ? (
                activity.map((line, idx) => (
                  <p key={`${line}-${idx}`} className="rounded-md border border-[#D4A574]/10 bg-[#02120e]/65 p-2">
                    {line}
                  </p>
                ))
              ) : (
                <p className="text-[#8d9a95]">No events yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
