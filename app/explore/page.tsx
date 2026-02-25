"use client";

import { useQuery } from "@tanstack/react-query";
import { SearchIcon, TrendingUpIcon } from "@/components/ui/icons";
import { useMemo, useState } from "react";

import { RepoList } from "@/components/repo-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

type ExploreResponse = {
  repos: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    tags: string[];
    isPublic: boolean;
    updatedAt: string;
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
    <div className="app-page space-y-10 pb-20">
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#D4A574]">
          <div className="h-1 w-8 rounded-full bg-gradient-to-r from-[#D4A574] to-transparent" />
          <span>Community</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[#f5f5f0] sm:text-4xl">Explore Public Vaults</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[#a8b3af] sm:text-base">
          Discover templates and workflows shared by the community. Securely fork and star repositories to your workspace.
        </p>
      </div>

      <Card className="grid-bg relative overflow-hidden border-[#D4A574]/20 bg-[#02120e]/60">
        <CardContent className="relative z-10 space-y-6 pt-8">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#D4A574]/60" />
            <Input
              placeholder="Search public repositories, tags, and templates..."
              className="h-14 rounded-2xl border-[#D4A574]/15 bg-[#02120e]/80 pl-12 text-base shadow-2xl focus:ring-[#D4A574]/30"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTag((current) => (current === category ? null : category))}
                className="transition-transform active:scale-95"
              >
                <Badge 
                  className={cn(
                    "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTag === category 
                      ? "bg-[#D4A574] text-[#02120e] shadow-lg shadow-[#D4A574]/20" 
                      : "bg-[#1B4D3E]/20 text-[#a8b3af] border border-[#D4A574]/10 hover:border-[#D4A574]/30 hover:text-[#f5f5f0]"
                  )}
                >
                  #{category}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {repos.length ? (
        <RepoList repos={repos} />
      ) : (
        <Card>
          <CardContent className="py-8 text-sm text-[#a8b3af]">
            No repositories found for the current search.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
