"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowDownIcon, 
  ArrowUpIcon, 
  MoveVerticalIcon, 
  RefreshCwIcon, 
  SaveIcon, 
  ShieldCheckIcon, 
  ActivityIcon,
  GlobeIcon,
  LockIcon,
  MessageSquareIcon,
  TerminalIcon,
  KeyRoundIcon
} from "@/components/ui/icons";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { MonacoEnvEditor } from "@/components/editor/monaco-env-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRealtimeRepo, sendRealtimeRepoEvent } from "@/hooks/use-realtime-repo";
import { parseDotEnv, stringifyDotEnv } from "@/lib/env";
import { fetcher } from "@/lib/fetcher";
import { isValidRepoPin, readStoredRepoPin, writeStoredRepoPin } from "@/lib/repo-pin";
import { cn } from "@/lib/utils";

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
    <div className="app-page space-y-6 pb-20 sm:space-y-10">
      {/* Hero Header */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#D4A574]">
          <div className="h-1 w-8 rounded-full bg-gradient-to-r from-[#D4A574] to-transparent" />
          <span>Real-time Editor</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-[#f5f5f0] sm:text-5xl lg:text-6xl">
          Collaborative <span className="text-[#D4A574]">Editor</span>
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#a8b3af] font-medium sm:text-lg">
          Edit and broadcast environment changes in real-time. Securely commit snapshots to your repository history.
        </p>
      </div>

      {/* Controls Card */}
      <Card className="glass relative overflow-hidden border-[#D4A574]/20 bg-[#02120e]/60 p-5 sm:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4A574]/5 blur-3xl" />
        <div className="relative z-10 grid items-end gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-[minmax(0,1fr)_200px_220px_220px_auto]">
          <div className="min-w-0 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">Repository</label>
            <select
              className="themed-select h-11 w-full rounded-xl border border-[#D4A574]/15 bg-[#02120e]/80 px-3 text-sm text-[#f5f5f0] outline-none focus:ring-1 focus:ring-[#D4A574]/30"
              value={repoId}
              onChange={(event) => setRepoId(event.target.value)}
            >
              <option value="">Select a repository...</option>
              {reposQuery.data?.repos.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">Environment</label>
            <select
              className="themed-select h-11 w-full rounded-xl border border-[#D4A574]/15 bg-[#02120e]/80 px-3 text-sm text-[#f5f5f0] outline-none focus:ring-1 focus:ring-[#D4A574]/30"
              value={environment}
              onChange={(event) =>
                setEnvironment(event.target.value as "development" | "staging" | "production")
              }
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>

          <div className="min-w-0 space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">Commit Message</label>
            <Input 
              placeholder="Rotate API keys..."
              className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 focus:ring-[#D4A574]/30"
              value={commitMsg} 
              onChange={(event) => setCommitMsg(event.target.value)} 
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">Repo PIN</label>
              <span className={cn("text-[10px] font-bold", repoPin.length === 6 ? "text-emerald-400" : "text-[#8d9a95]")}>
                {repoPin.length}/6
              </span>
            </div>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 text-center font-mono tracking-widest focus:ring-[#D4A574]/30"
              value={repoPin}
              onChange={(event) => setRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>

          <Button
            className="group flex h-11 w-full items-center justify-center gap-2 px-6 sm:px-8 2xl:w-auto bg-gradient-to-r from-[#D4A574] to-[#C85A3A] font-black uppercase tracking-widest text-[#02120e] shadow-lg shadow-[#D4A574]/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !repoId || !isValidRepoPin(repoPin)}
          >
            {saveMutation.isPending ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <SaveIcon className="h-4 w-4" />
                <span className="whitespace-nowrap">Commit + Broadcast</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]">Live Editor Active</span>
            </div>
            <Badge variant="muted" className="bg-[#1B4D3E]/20 text-[#D4A574] border-[#D4A574]/10 font-black">
              AES-256-GCM
            </Badge>
          </div>
          <MonacoEnvEditor
            value={stringifyDotEnv(reorderedEnv)}
            onChange={(value) => setEnvSource(value)}
            height="600px"
          />
        </div>

        <div className="space-y-6">
          <Card className="glass border-[#D4A574]/15 bg-[#02120e]/40 overflow-hidden">
            <CardHeader className="border-b border-[#D4A574]/10 bg-[#1B4D3E]/10">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#D4A574]">
                <MoveVerticalIcon className="h-4 w-4" />
                Structure Control
              </CardTitle>
              <CardDescription className="text-xs">Reorder keys to organize your .env file.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="max-h-[300px] space-y-2 overflow-y-auto no-scrollbar pr-1">
                <AnimatePresence mode="popLayout">
                  {effectiveOrderedKeys.map((key, index) => (
                    <motion.div
                      key={key}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between rounded-xl border border-[#D4A574]/10 bg-[#02120e]/60 px-4 py-2.5 transition-colors hover:border-[#D4A574]/30"
                    >
                      <span className="truncate text-xs font-bold text-[#f5f5f0]">{key}</span>
                      <div className="flex gap-1 shrink-0">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 text-[#8d9a95] hover:text-[#D4A574] hover:bg-[#D4A574]/10"
                          onClick={() => moveKey(index, -1)}
                          disabled={index === 0}
                        >
                          <ArrowUpIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 text-[#8d9a95] hover:text-[#D4A574] hover:bg-[#D4A574]/10"
                          onClick={() => moveKey(index, 1)}
                          disabled={index === effectiveOrderedKeys.length - 1}
                        >
                          <ArrowDownIcon className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!effectiveOrderedKeys.length && (
                  <p className="py-8 text-center text-xs text-[#8d9a95]">No keys detected in editor.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-[#D4A574]/15 bg-[#02120e]/40 overflow-hidden">
            <CardHeader className="border-b border-[#D4A574]/10 bg-[#1B4D3E]/10">
              <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#D4A574]">
                <ActivityIcon className="h-4 w-4" />
                Broadcast Feed
              </CardTitle>
              <CardDescription className="text-xs">Real-time repository event stream.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {activity.length ? (
                  activity.map((line, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={`${line}-${idx}`} 
                      className="flex items-start gap-3 rounded-xl border border-[#D4A574]/10 bg-[#02120e]/80 p-3"
                    >
                      <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4A574]/40" />
                      <p className="text-[11px] font-medium leading-relaxed text-[#a8b3af]">
                        {line}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B4D3E]/20 text-[#4d6d62]">
                      <MessageSquareIcon className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-[#8d9a95]">Waiting for repo activity...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <TerminalIcon className="h-4 w-4 text-[#D4A574]" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]">Pro Tip</p>
            </div>
            <p className="text-xs leading-relaxed text-[#a8b3af]">
              Reordering keys in the editor will reflect in your downloaded <code className="text-[#D4A574]">.env</code> files, keeping your project organized across the team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
