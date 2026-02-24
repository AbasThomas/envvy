"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CompassIcon, PlusIcon, RefreshCcwIcon } from "lucide-react";
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
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-3 md:grid-cols-[1fr_auto]"
      >
        <Card className="glass border-[#D4A574]/25">
          <CardHeader>
            <CardTitle>{`Hey ${displayName}`}</CardTitle>
            <CardDescription>
              Manage private repos, encrypted backups, and approval-safe environment updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            <Badge>Private by default</Badge>
            <Badge variant="muted">CLI synced</Badge>
            <Badge variant="success">PIN guard active</Badge>
            <Link href="/explore">
              <Button size="sm" variant="ghost">
                <CompassIcon className="mr-1 h-4 w-4" />
                Explore Public Repos
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Card className="border-[#D4A574]/25 bg-[#1B4D3E]/18">
          <CardHeader>
            <CardTitle className="text-base">Create New Repo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="repo-name"
              value={repoName}
              onChange={(event) => setRepoName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitCreateRepo();
                }
              }}
            />
            <Input
              placeholder="Description (optional)"
              value={repoDescription}
              onChange={(event) => setRepoDescription(event.target.value)}
            />
            <select
              className="themed-select w-full rounded-xl px-3 py-2 text-sm"
              value={repoVisibility}
              onChange={(event) =>
                setRepoVisibility(event.target.value as "private" | "public")
              }
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <Input
              placeholder="6-digit repo PIN"
              value={repoPin}
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => setRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitCreateRepo();
                }
              }}
            />
            <Button
              onClick={submitCreateRepo}
              disabled={createRepoMutation.isPending || !repoName.trim() || !isValidRepoPin(repoPin)}
            >
              <PlusIcon className="mr-1 h-4 w-4" />
              Create Repo
            </Button>
          </CardContent>
        </Card>
      </motion.section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Your Repos</CardDescription>
            <CardTitle>{repos.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Commits</CardDescription>
            <CardTitle>{totalCommits}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Stars Received</CardDescription>
            <CardTitle>{totalStars}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Team Members</CardDescription>
            <CardTitle>{totalTeamMembers}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest repository updates from your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {repos.slice(0, 6).map((repo) => (
            <div
              key={repo.id}
              className="rounded-lg border border-[#D4A574]/12 bg-[#1B4D3E]/18 px-3 py-2 text-sm"
            >
              <p className="text-[#f5f5f0]">{repo.name}</p>
              <p className="text-xs text-[#a8b3af]">
                Updated {new Date(repo.updatedAt).toLocaleString()} - {repo._count.envs} snapshots
              </p>
            </div>
          ))}
          {!repos.length ? (
            <p className="text-sm text-[#a8b3af]">
              No activity yet. Create your first repo to get started.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#f5f5f0]">Your Repositories</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => reposQuery.refetch()}
          disabled={reposQuery.isFetching}
        >
          <RefreshCcwIcon className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {reposQuery.isLoading ? (
        <Card>
          <CardContent className="py-8 text-sm text-[#a8b3af]">Loading repositories...</CardContent>
        </Card>
      ) : repos.length ? (
        <RepoList repos={repos} />
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[#a8b3af]">
            No repositories yet. Create one, then run `envii backup` from your project.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
