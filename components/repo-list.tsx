"use client";

import { motion } from "framer-motion";
import { GitForkIcon, StarIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type RepoItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tags: string[];
  isPublic: boolean;
  _count?: {
    stars?: number;
    envs?: number;
    forks?: number;
  };
};

export function RepoList({ repos }: { repos: RepoItem[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {repos.map((repo, index) => (
        <motion.div
          key={repo.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
        >
          <Link href={`/repo/${repo.id}`}>
            <Card className="h-full transition hover:border-amber-500/40">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{repo.name}</CardTitle>
                  <Badge variant={repo.isPublic ? "success" : "muted"}>
                    {repo.isPublic ? "public" : "private"}
                  </Badge>
                </div>
                <CardDescription>{repo.description ?? "No description yet."}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant="warning">6-digit PIN required</Badge>
                  {repo.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="muted">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-[#8d9a95]">
                  <span className="inline-flex items-center gap-1">
                    <StarIcon className="h-3.5 w-3.5" /> {repo._count?.stars ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitForkIcon className="h-3.5 w-3.5" /> {repo._count?.forks ?? 0}
                  </span>
                  <span>{repo._count?.envs ?? 0} snapshots</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
