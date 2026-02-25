"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ActivityIcon,
  ArrowRightIcon,
  CompassIcon,
  FolderGit2Icon,
  HistoryIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  PlusIcon,
  RefreshCcwIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  StarIcon,
  UsersIcon,
  ZapIcon,
} from "@/components/ui/icons";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

import { RepoList } from "@/components/repo-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";
import { isValidRepoPin } from "@/lib/repo-pin";
import { cn } from "@/lib/utils";

type RepoResponse = {
  repos: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    tags: string[];
    isPublic: boolean;
    updatedAt: string;
    _count: { stars: number; envs: number; forks: number; shares: number };
  }>;
};

type ProfileResponse = {
  profile: {
    name: string | null;
  };
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [repoName, setRepoName] = useState("");
  const [repoDescription, setRepoDescription] = useState("");
  const [repoVisibility, setRepoVisibility] = useState<"private" | "public">("private");
  const [repoPin, setRepoPin] = useState("");

  const profileQuery = useQuery({
    queryKey: ["profile-summary"],
    queryFn: () => fetcher<ProfileResponse>("/api/profile"),
  });

  const reposQuery = useQuery({
    queryKey: ["repos"],
    queryFn: () => fetcher<RepoResponse>("/api/repos"),
  });

  const createRepoMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      visibility: "private" | "public";
      repoPin: string;
    }) => {
      return fetcher("/api/repos", {
        method: "POST",
        body: JSON.stringify({
          name: payload.name,
          description: payload.description,
          visibility: payload.visibility,
          repoPin: payload.repoPin,
          tags: [],
        }),
      });
    },
    onSuccess: () => {
      toast.success("Repository created");
      setRepoName("");
      setRepoDescription("");
      setRepoVisibility("private");
      setRepoPin("");
      queryClient.invalidateQueries({ queryKey: ["repos"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Create failed");
    },
  });

  const repos = reposQuery.data?.repos ?? [];
  const totalCommits = repos.reduce((sum, repo) => sum + repo._count.envs, 0);
  const totalStars = repos.reduce((sum, repo) => sum + repo._count.stars, 0);
  const totalTeamMembers = repos.reduce((sum, repo) => sum + repo._count.shares, 0);
  const displayName = profileQuery.data?.profile.name?.trim() || "there";

  function submitCreateRepo() {
    const trimmedName = repoName.trim();
    if (trimmedName.length < 2) {
      toast.error("Repository name must be at least 2 characters");
      return;
    }
    if (!isValidRepoPin(repoPin)) {
      toast.error("Enter a valid 6-digit repository PIN");
      return;
    }
    createRepoMutation.mutate({
      name: trimmedName,
      description: repoDescription.trim() || undefined,
      visibility: repoVisibility,
      repoPin,
    });
  }

  return (
    <div className="app-page space-y-6 pb-10 sm:space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative grid gap-6 lg:grid-cols-[1fr_400px]"
      >
        <Card className="glass relative flex flex-col justify-center overflow-hidden border-[#D4A574]/20 bg-gradient-to-br from-[#1B4D3E]/20 to-transparent p-6 sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4A574]/5 blur-3xl" />
          <div className="relative z-10 space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-[#f5f5f0] sm:text-4xl">
                Secure your <span className="text-[#D4A574]">secrets</span>.
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-[#a8b3af] sm:text-base">
                Create a new repository to start versioning your environment variables with AES-256
                encryption.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[#D4A574]/20 bg-[#02120e]/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#D4A574] sm:px-3 sm:text-[10px]">
                <ShieldCheckIcon className="h-3 w-3" />
                Zero-Knowledge
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[#D4A574]/20 bg-[#02120e]/40 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[#D4A574] sm:px-3 sm:text-[10px]">
                <KeyRoundIcon className="h-3 w-3" />
                PIN Protected
              </div>
            </div>
          </div>
        </Card>

        <Card className="glass border-[#D4A574]/20 bg-[#02120e]/60 p-5 sm:p-8">
          <div className="space-y-5 sm:space-y-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black tracking-tight text-[#f5f5f0]">Quick Create</h3>
              <p className="text-xs font-medium text-[#a8b3af]">Launch a new secure vault in seconds.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">Repository Name</label>
                <Input
                  placeholder="my-awesome-app"
                  className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 focus:ring-[#D4A574]/30"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className="group h-11 w-full bg-gradient-to-r from-[#D4A574] to-[#C85A3A] font-black uppercase tracking-widest text-[#02120e] shadow-lg shadow-[#D4A574]/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                onClick={submitCreateRepo}
                disabled={createRepoMutation.isPending || !repoName.trim() || !isValidRepoPin(repoPin)}
              >
                {createRepoMutation.isPending ? (
                  <RefreshCcwIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Create Vault
                    <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
        {[
          { label: "Your Repos", value: repos.length, icon: FolderGit2Icon, color: "text-blue-400" },
          { label: "Total Snapshots", value: totalCommits, icon: ActivityIcon, color: "text-emerald-400" },
          { label: "Stars Received", value: totalStars, icon: StarIcon, color: "text-amber-400" },
          { label: "Team Members", value: totalTeamMembers, icon: UsersIcon, color: "text-purple-400" },
        ].map((stat, i) => (
          <Card key={i} className="group relative overflow-hidden border-[#D4A574]/15 bg-[#02120e]/40 transition hover:border-[#D4A574]/30">
            <div className={`absolute -right-4 -top-4 opacity-5 transition-transform group-hover:scale-110 group-hover:opacity-10`}>
              <stat.icon className="h-24 w-24" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">
                {stat.label}
              </CardDescription>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <CardTitle className="text-2xl font-bold">{stat.value}</CardTitle>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-[#D4A574]" />
              <h2 className="text-xl font-semibold text-[#f5f5f0]">Your Repositories</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#a8b3af] hover:text-[#f5f5f0]"
              onClick={() => reposQuery.refetch()}
              disabled={reposQuery.isFetching}
            >
              <RefreshCcwIcon className={cn("mr-2 h-3 w-3", reposQuery.isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {reposQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-[#1B4D3E]/10 animate-pulse border border-[#D4A574]/5" />
              ))}
            </div>
          ) : repos.length ? (
            <RepoList repos={repos} />
          ) : (
            <Card className="border-dashed border-[#D4A574]/20 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-[#1B4D3E]/20 p-4 text-[#D4A574]">
                  <FolderGit2Icon className="h-8 w-8" />
                </div>
                <p className="text-[#f5f5f0] font-medium">No repositories yet</p>
                <p className="mt-1 text-sm text-[#a8b3af] max-w-[280px]">
                  Create one above, then run <code className="bg-[#1B4D3E]/30 px-1 rounded">envii backup</code> from your project terminal.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card className="border-[#D4A574]/15 bg-[#02120e]/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ZapIcon className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link href="/explore">
                <Button variant="outline" className="w-full justify-start border-[#D4A574]/15 bg-transparent hover:bg-[#1B4D3E]/20">
                  <CompassIcon className="mr-3 h-4 w-4 text-[#D4A574]" />
                  Explore Public
                </Button>
              </Link>
              <Link href="/editor">
                <Button variant="outline" className="w-full justify-start border-[#D4A574]/15 bg-transparent hover:bg-[#1B4D3E]/20">
                  <ZapIcon className="mr-3 h-4 w-4 text-amber-500" />
                  Live Editor
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full justify-start border-[#D4A574]/15 bg-transparent hover:bg-[#1B4D3E]/20">
                  <UsersIcon className="mr-3 h-4 w-4 text-blue-400" />
                  Manage Team
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-[#D4A574]/15 bg-[#02120e]/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ActivityIcon className="h-4 w-4 text-emerald-500" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {repos.slice(0, 5).map((repo) => (
                <div key={repo.id} className="group flex items-start gap-3">
                  <div className="mt-1 flex h-2 w-2 rounded-full bg-[#D4A574]/40 group-hover:bg-[#D4A574]" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-[#f5f5f0] group-hover:text-[#D4A574] transition-colors">
                      {repo.name}
                    </p>
                    <p className="text-xs text-[#a8b3af]">
                      {new Date(repo.updatedAt).toLocaleDateString()} · {repo._count.envs} snaps
                    </p>
                  </div>
                </div>
              ))}
              {!repos.length ? (
                <p className="text-xs text-[#a8b3af] italic">
                  No activity recorded.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
