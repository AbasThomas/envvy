"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchIcon, TrendingUpIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { RepoList } from "@/components/repo-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";

type ExploreResponse = {
  repos: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    tags: string[];
    isPublic: boolean;
    _count: { stars: number; envs: number; forks: number };
  }>;
};

const categories = ["web", "react", "node", "ai", "nextjs", "infra", "mobile"];

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const trendingQuery = useQuery({
    queryKey: ["trending"],
    queryFn: () => fetcher<ExploreResponse>("/api/repos/trending"),
  });

  const searchQuery = useQuery({
    queryKey: ["search", query, activeTag],
    queryFn: () =>
      fetcher<ExploreResponse>(
        `/api/repos/search?q=${encodeURIComponent(query)}${activeTag ? `&tag=${activeTag}` : ""}`,
      ),
    enabled: query.length > 0 || !!activeTag,
  });

  const repos = useMemo(() => {
    if (query.length > 0 || activeTag) return searchQuery.data?.repos ?? [];
    return trendingQuery.data?.repos ?? [];
  }, [query, activeTag, searchQuery.data?.repos, trendingQuery.data?.repos]);

  return (
    <div className="space-y-5">
      <Card className="grid-bg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <TrendingUpIcon className="h-5 w-5 text-cyan-300" />
            Private repositories only
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-400">
            envii is configured for private repos. Public explore is disabled.
          </p>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search your private tags locally..."
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTag((current) => (current === category ? null : category))}
              >
                <Badge variant={activeTag === category ? "default" : "muted"}>#{category}</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {repos.length ? (
        <RepoList repos={repos} />
      ) : (
        <Card>
          <CardContent className="py-8 text-sm text-zinc-400">
            No public repositories are available.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
