"use client";

import { motion } from "framer-motion";
import { ActivityIcon, CalendarIcon, GitForkIcon, LockIcon, StarIcon, GlobeIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type RepoItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  tags: string[];
  isPublic: boolean;
  updatedAt: string;
  _count?: {
    stars?: number;
    envs?: number;
    forks?: number;
  };
};

export function RepoList({ repos }: { repos: RepoItem[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {repos.map((repo, index) => (
        <motion.div
          key={repo.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
        >
          <Link href={`/repo/${repo.id}`}>
            <Card className="group relative h-full overflow-hidden border-[#D4A574]/15 bg-[#02120e]/40 transition-all hover:border-[#D4A574]/40 hover:bg-[#1B4D3E]/10">
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#D4A574]/5 blur-2xl transition-all group-hover:bg-[#D4A574]/10" />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold text-[#f5f5f0] group-hover:text-[#D4A574] transition-colors">
                      {repo.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-[#a8b3af]">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{new Date(repo.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={repo.isPublic ? "success" : "muted"}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold",
                      repo.isPublic 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-[#1B4D3E]/20 text-[#a8b3af] border-[#D4A574]/10"
                    )}
                  >
                    {repo.isPublic ? (
                      <GlobeIcon className="h-3 w-3" />
                    ) : (
                      <LockIcon className="h-3 w-3" />
                    )}
                    {repo.isPublic ? "public" : "private"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 text-sm leading-relaxed text-[#a8b3af]">
                  {repo.description ?? "No description provided for this repository."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <Badge variant="warning" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px] py-0">
                    PIN protected
                  </Badge>
                  {repo.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="muted" className="bg-[#02120e]/60 border-[#D4A574]/10 text-[10px] py-0">
                      #{tag}
                    </Badge>
                  ))}
                  {repo.tags.length > 3 && (
                    <span className="text-[10px] text-[#a8b3af] self-center">+{repo.tags.length - 3}</span>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-[#D4A574]/10 pt-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-[#a8b3af]">
                      <StarIcon className="h-3.5 w-3.5 text-amber-500/70" />
                      <span>{repo._count?.stars ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#a8b3af]">
                      <GitForkIcon className="h-3.5 w-3.5 text-blue-400/70" />
                      <span>{repo._count?.forks ?? 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#D4A574]">
                    <ActivityIcon className="h-3.5 w-3.5" />
                    <span>{repo._count?.envs ?? 0} snapshots</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
