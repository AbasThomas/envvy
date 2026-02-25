"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIcon,
  ArrowRightIcon,
  FilterIcon,
  FolderGit2Icon,
  GlobeIcon,
  HistoryIcon,
  LockIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  StarIcon,
  Trash2Icon,
  ZapIcon,
} from "@/components/ui/icons";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";
import { isValidRepoPin } from "@/lib/repo-pin";

type RepoResponse = {
  repos: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isPublic: boolean;
    updatedAt: string;
    _count: { stars: number; envs: number; forks: number };
    stars?: Array<{ id: string }>;
  }>;
};

type RepoFilter = "all" | "private" | "public" | "starred";

export default function ReposPage() {
  const queryClient = useQueryClient();
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [repoVisibility, setRepoVisibility] = useState<"private" | "public">("private");
  const [repoPin, setRepoPin] = useState("");
  const [filter, setFilter] = useState<RepoFilter>("all");

  const reposQuery = useQuery({
    queryKey: ["repos-table"],
    queryFn: () => fetcher<RepoResponse>("/api/repos"),
  });

  const createRepoMutation = useMutation({
    mutationFn: async () =>
      fetcher("/api/repos", {
        method: "POST",
        body: JSON.stringify({
          name: repoName.trim(),
          description: repoDescription.trim() || undefined,
          visibility: repoVisibility,
          repoPin,
          tags: [],
        }),
      }),
    onSuccess: () => {
      toast.success("Repository created");
      setRepoName("");
      setRepoDescription("");
      setRepoVisibility("private");
      setRepoPin("");
      queryClient.invalidateQueries({ queryKey: ["repos-table"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Create failed"),
  });

  const deleteRepoMutation = useMutation({
    mutationFn: async (payload: { repoId: string; pin: string }) =>
      fetcher(`/api/repos/${payload.repoId}`, {
        method: "DELETE",
        headers: {
          "x-envii-repo-pin": payload.pin,
        },
      }),
    onSuccess: () => {
      toast.success("Repository deleted");
      queryClient.invalidateQueries({ queryKey: ["repos-table"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Delete failed"),
  });

  const filteredRepos = useMemo(() => {
    const repos = reposQuery.data?.repos ?? [];
    return repos.filter((repo) => {
      if (filter === "private") return !repo.isPublic;
      if (filter === "public") return repo.isPublic;
      if (filter === "starred") return (repo.stars?.length ?? 0) > 0;
      return true;
    });
  }, [reposQuery.data?.repos, filter]);

  const canCreate = repoName.trim().length >= 2 && isValidRepoPin(repoPin);

  return (
    <div className="app-page space-y-10 pb-20">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between sm:gap-10">
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#D4A574]">
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-[#D4A574] to-transparent" />
            <span>Workspace</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-[#f5f5f0] sm:text-4xl">Your Repositories</h1>
          <p className="max-w-2xl text-sm leading-relaxed text-[#a8b3af] sm:text-base">
            Manage and secure your project environment variables in isolated vaults.
          </p>
        </div>

        <Card className="glass overflow-hidden border-[#D4A574]/20 bg-[#1B4D3E]/10 px-6 py-4 shadow-xl">
          <div className="flex items-center justify-around gap-6 md:justify-start">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/70">Vaults</span>
              <span className="text-2xl font-black text-[#f5f5f0]">{reposQuery.data?.repos.length ?? 0}</span>
            </div>
            <div className="h-10 w-px bg-[#D4A574]/15" />
            <div className="flex flex-col items-center md:items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70">Snapshots</span>
              <span className="text-2xl font-black text-[#f5f5f0]">
                {reposQuery.data?.repos.reduce((acc, r) => acc + r._count.envs, 0) ?? 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="glass relative overflow-hidden border-[#D4A574]/20 bg-[#02120e]/60 p-5 sm:p-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-black tracking-tight text-[#f5f5f0]">Quick Create</h3>
              <p className="text-xs font-medium text-[#a8b3af]">Launch a new secure vault in seconds.</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-[#D4A574]/20 bg-[#02120e]/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#D4A574] xs:flex">
              <PlusIcon className="h-3 w-3" />
              SECURE
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 md:grid-cols-[1fr_180px_180px_auto] items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">Repository Name</label>
              <Input
                placeholder="my-awesome-app"
                className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 focus:ring-[#D4A574]/30"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 md:contents">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">Visibility</label>
                <select
                  className="themed-select h-11 w-full rounded-xl border border-[#D4A574]/15 bg-[#02120e]/80 px-3 text-sm text-[#f5f5f0] outline-none focus:ring-1 focus:ring-[#D4A574]/30"
                  value={repoVisibility}
                  onChange={(event) => setRepoVisibility(event.target.value as "private" | "public")}
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">Access PIN</label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit PIN"
                  className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 text-center font-mono tracking-widest focus:ring-[#D4A574]/30"
                  value={repoPin}
                  onChange={(e) => setRepoPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
            </div>

            <Button
              className="group h-11 w-full px-8 bg-gradient-to-r from-[#D4A574] to-[#C85A3A] font-black uppercase tracking-widest text-[#02120e] shadow-lg shadow-[#D4A574]/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 md:w-auto"
              disabled={!canCreate || createRepoMutation.isPending}
              onClick={() => createRepoMutation.mutate()}
            >
              {createRepoMutation.isPending ? (
                <ZapIcon className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span className="hidden md:inline">Create Vault</span>
                  <span className="md:hidden">Create Repository</span>
                  <PlusIcon className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-[#D4A574]/10 bg-[#02120e]/40 p-1.5 no-scrollbar">
          {(["all", "private", "public", "starred"] as const).map((tab) => {
            const active = filter === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  active
                    ? "bg-[#D4A574] text-[#02120e] shadow-lg"
                    : "text-[#a8b3af] hover:bg-[#1B4D3E]/20 hover:text-[#f5f5f0]"
                }`}
              >
                {tab === "all" && <FilterIcon className="h-3 w-3" />}
                {tab === "private" && <LockIcon className="h-3 w-3" />}
                {tab === "public" && <GlobeIcon className="h-3 w-3" />}
                {tab === "starred" && <StarIcon className="h-3 w-3" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}
        </div>
        
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8b3af]" />
          <Input 
            placeholder="Search repositories..." 
            className="w-full border-[#D4A574]/15 bg-[#02120e]/40 pl-10 sm:w-64"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {reposQuery.isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/10" />
          ))
        ) : filteredRepos.length ? (
          filteredRepos.map((repo) => (
            <Link key={repo.id} href={`/repo/${repo.id}`}>
              <Card className="group relative h-full overflow-hidden border-[#D4A574]/15 bg-[#02120e]/40 transition-all hover:border-[#D4A574]/40 hover:bg-[#1B4D3E]/10">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="line-clamp-1 text-base font-bold text-[#f5f5f0] group-hover:text-[#D4A574]">
                        {repo.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-[10px] text-[#a8b3af]">
                        <HistoryIcon className="h-3 w-3" />
                        <span>{new Date(repo.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className={repo.isPublic ? "text-emerald-400" : "text-[#D4A574]/60"}>
                      {repo.isPublic ? <GlobeIcon className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="line-clamp-2 text-xs leading-relaxed text-[#a8b3af]">
                    {repo.description ?? "No description provided."}
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-[#D4A574]/10 pt-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#a8b3af]">
                        <StarIcon className="h-3 w-3 text-amber-500" />
                        {repo._count.stars}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-[#a8b3af]">
                        <ActivityIcon className="h-3 w-3 text-blue-400" />
                        {repo._count.envs} snaps
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 rounded-full p-0 text-[#a8b3af] hover:bg-red-500/10 hover:text-red-500"
                      onClick={(e) => {
                        e.preventDefault();
                        const pin = prompt("Enter 6-digit repo PIN to delete:");
                        if (pin) deleteRepoMutation.mutate({ repoId: repo.id, pin });
                      }}
                    >
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1B4D3E]/20 text-[#D4A574]">
              <FolderGit2Icon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[#f5f5f0]">No repositories found</h3>
            <p className="text-[#a8b3af]">Try adjusting your filters or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
