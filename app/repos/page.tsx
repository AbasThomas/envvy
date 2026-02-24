"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, StarIcon, Trash2Icon } from "lucide-react";
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
    <div className="space-y-5">
      <Card className="glass border-[#D4A574]/25">
        <CardHeader>
          <CardTitle>Your Repositories</CardTitle>
          <CardDescription>Create and manage repositories used by CLI and dashboard workflows.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-[1fr_1fr_140px_180px_auto]">
          <Input
            placeholder="Repository name"
            value={repoName}
            onChange={(event) => setRepoName(event.target.value)}
          />
          <Input
            placeholder="Description (optional)"
            value={repoDescription}
            onChange={(event) => setRepoDescription(event.target.value)}
          />
          <select
            className="themed-select rounded-xl px-3 py-2 text-sm"
            value={repoVisibility}
            onChange={(event) =>
              setRepoVisibility(event.target.value as "private" | "public")
            }
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <Input
            placeholder="6-digit PIN"
            value={repoPin}
            inputMode="numeric"
            maxLength={6}
            onChange={(event) => setRepoPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <Button
            disabled={!canCreate || createRepoMutation.isPending}
            onClick={() => createRepoMutation.mutate()}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create New Repo
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "private", "public", "starred"] as const).map((tab) => (
          <Button
            key={tab}
            size="sm"
            variant={filter === tab ? "default" : "outline"}
            onClick={() => setFilter(tab)}
          >
            {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="border-b border-[#D4A574]/15 bg-[#1B4D3E]/25 text-[#a8b3af]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Visibility</th>
                  <th className="px-4 py-3 font-medium">Last Commit</th>
                  <th className="px-4 py-3 font-medium">Stars / Forks</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reposQuery.isLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-[#a8b3af]" colSpan={5}>
                      Loading repositories...
                    </td>
                  </tr>
                ) : filteredRepos.length ? (
                  filteredRepos.map((repo) => (
                    <tr key={repo.id} className="border-b border-[#D4A574]/10">
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#f5f5f0]">{repo.name}</p>
                        <p className="text-xs text-[#8d9a95]">{repo.description ?? "No description"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={repo.isPublic ? "success" : "muted"}>
                          {repo.isPublic ? "Public" : "Private"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#a8b3af]">
                        {new Date(repo.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[#a8b3af]">
                        <span className="inline-flex items-center gap-1">
                          <StarIcon className="h-3.5 w-3.5 text-[#D4A574]" />
                          {repo._count.stars}
                        </span>{" "}
                        / {repo._count.forks}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/repo/${repo.id}`}>
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </Link>
                          <Link href={`/settings`}>
                            <Button size="sm" variant="ghost">
                              Settings
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const pin = window.prompt(
                                `Enter 6-digit PIN to delete "${repo.name}"`,
                              )?.trim();
                              if (!isValidRepoPin(pin)) {
                                toast.error("Valid 6-digit PIN required");
                                return;
                              }
                              deleteRepoMutation.mutate({ repoId: repo.id, pin });
                            }}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-5 text-[#a8b3af]" colSpan={5}>
                      No repositories matched this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
