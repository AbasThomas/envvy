"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActivityIcon,
  FilterIcon,
  FolderGit2Icon,
  GlobeIcon,
  HistoryIcon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react";
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
    <div className="app-page">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#D4A574]">
            <FolderGit2Icon className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Repositories</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-[#f5f5f0]">Your Workspace</h1>
          <p className="text-[#a8b3af]">Manage and secure your project environment variables.</p>
        </div>

        <Card className="border-[#D4A574]/20 bg-[#1B4D3E]/12 px-4 py-3 md:w-auto">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-[#D4A574]/70">Total Repos</span>
              <span className="text-xl font-bold">{reposQuery.data?.repos.length ?? 0}</span>
            </div>
            <div className="h-8 w-px bg-[#D4A574]/15" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-emerald-400/70">Total Snaps</span>
              <span className="text-xl font-bold">
                {reposQuery.data?.repos.reduce((acc, r) => acc + r._count.envs, 0) ?? 0}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="glass overflow-hidden border-[#D4A574]/25">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4A574]/5 blur-3xl" />
        <CardHeader className="relative z-10 border-b border-[#D4A574]/10 bg-[#02120e]/40">
          <div className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4 text-[#D4A574]" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Quick Create Repository</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 grid gap-4 p-6 md:grid-cols-[1.5fr_1fr_120px_140px_auto]">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-[#a8b3af]">Repo Name</label>
            <Input
              placeholder="e.g. backend-api"
              className="bg-[#02120e]/60 border-[#D4A574]/15 focus:ring-[#D4A574]/30"
              value={repoName}
              onChange={(event) => setRepoName(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-[#a8b3af]">Description</label>
            <Input
              placeholder="Project environment..."
              className="bg-[#02120e]/60 border-[#D4A574]/15"
              value={repoDescription}
              onChange={(event) => setRepoDescription(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-[#a8b3af]">Visibility</label>
            <select
              className="themed-select w-full rounded-xl border-[#D4A574]/15 bg-[#02120e]/60 px-3 py-2 text-sm"
              value={repoVisibility}
              onChange={(event) => setRepoVisibility(event.target.value as "private" | "public")}
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-[#a8b3af]">6-Digit PIN</label>
            <Input
              placeholder="000000"
              className="bg-[#02120e]/60 border-[#D4A574]/15"
              value={repoPin}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full bg-gradient-to-r from-[#D4A574] to-[#C85A3A] font-bold text-[#02120e]"
              disabled={!canCreate || createRepoMutation.isPending}
              onClick={() => createRepoMutation.mutate()}
            >
              {createRepoMutation.isPending ? (
                <ZapIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusIcon className="mr-2 h-4 w-4" />
              )}
              Create
            </Button>
          </div>
        </CardContent>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
