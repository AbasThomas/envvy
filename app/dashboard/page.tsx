"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ActivityIcon,
  CompassIcon,
  FolderGit2Icon,
  HistoryIcon,
  LayoutDashboardIcon,
  PlusIcon,
  RefreshCcwIcon,
  StarIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
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
    <div className="app-page space-y-10 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative grid gap-6 md:grid-cols-[1.5fr_1fr]"
      >
        <Card className="glass relative overflow-hidden border-[#D4A574]/25">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#D4A574]/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#1B4D3E]/20 blur-3xl" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-2 text-sm font-medium text-[#D4A574]">
              <LayoutDashboardIcon className="h-4 w-4" />
              <span>Workspace Overview</span>
            </div>
            <CardTitle className="mt-2 text-3xl font-bold tracking-tight">
              {`Welcome back, ${displayName}!`}
            </CardTitle>
            <CardDescription className="max-w-md text-base text-[#a8b3af]">
              Manage your private repositories, encrypted backups, and approval-safe environment updates from one secure hub.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 flex flex-wrap items-center gap-3">
            <Badge className="bg-[#1B4D3E]/30 text-[#f5f5f0] border-[#D4A574]/15">
              Private by default
            </Badge>
            <Badge variant="muted" className="bg-[#02120e]/40">
              CLI synced
            </Badge>
            <Badge variant="success" className="bg-[#1B4D3E]/40 border-[#1B4D3E]/50">
              PIN guard active
            </Badge>
            <Link href="/explore" className="ml-auto">
              <Button size="sm" variant="ghost" className="text-[#D4A574] hover:bg-[#D4A574]/10">
                <CompassIcon className="mr-2 h-4 w-4" />
                Explore Community
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-[#D4A574]/20 bg-[#1B4D3E]/12">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm font-medium text-[#D4A574]">
              <PlusIcon className="h-4 w-4" />
              <span>Quick Create</span>
            </div>
            <CardTitle className="text-xl">New Repository</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Input
                placeholder="repo-name"
                className="bg-[#02120e]/60 border-[#D4A574]/15 focus:ring-[#D4A574]/30"
                value={repoName}
                onChange={(event) => setRepoName(event.target.value)}
              />
              <div className="flex gap-2">
                <select
                  className="themed-select flex-1 rounded-xl px-3 py-2 text-sm border-[#D4A574]/15 bg-[#02120e]/60"
                  value={repoVisibility}
                  onChange={(event) =>
                    setRepoVisibility(event.target.value as "private" | "public")
                  }
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
                <div className="w-28 space-y-1">
                  <Input
                    placeholder="6-digit PIN"
                    className="w-full bg-[#02120e]/60 border-[#D4A574]/15"
                    value={repoPin}
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                  <p className="text-[10px] text-[#8d9a95]">{repoPin.length}/6</p>
                </div>
              </div>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-[#D4A574] to-[#C85A3A] text-[#02120e] font-bold hover:opacity-90 transition-opacity"
              onClick={submitCreateRepo}
              disabled={createRepoMutation.isPending || !repoName.trim() || !isValidRepoPin(repoPin)}
            >
              {createRepoMutation.isPending ? (
                <RefreshCcwIcon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusIcon className="mr-2 h-4 w-4" />
              )}
              Create Repository
            </Button>
          </CardContent>
        </Card>
      </motion.section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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
