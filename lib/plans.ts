import type { PlanTier } from "@prisma/client";

export type PlanConfig = {
  tier: PlanTier;
  label: string;
  monthlyUsd: number;
  monthlyNgn: number;
  repoLimit: number;
  allowPublicRepos: boolean;
  allowSharing: boolean;
  allowForksAndStars: boolean;
  allowVersionHistory: boolean;
  allowTeams: boolean;
  allowAuditLogs: boolean;
  prioritySupport: boolean;
};

export const PLAN_MATRIX: Record<PlanTier, PlanConfig> = {
  FREE: {
    tier: "FREE",
    label: "Free",
    monthlyUsd: 0,
    monthlyNgn: 0,
    repoLimit: 1,
    allowPublicRepos: true,
    allowSharing: false,
    allowForksAndStars: false,
    allowVersionHistory: false,
    allowTeams: false,
    allowAuditLogs: false,
    prioritySupport: false,
  },
  BASIC: {
    tier: "BASIC",
    label: "Basic",
    monthlyUsd: 2,
    monthlyNgn: 800,
    repoLimit: 5,
    allowPublicRepos: false,
    allowSharing: true,
    allowForksAndStars: false,
    allowVersionHistory: false,
    allowTeams: false,
    allowAuditLogs: false,
    prioritySupport: false,
  },
  PRO: {
    tier: "PRO",
    label: "Pro",
    monthlyUsd: 6,
    monthlyNgn: 2400,
    repoLimit: Number.MAX_SAFE_INTEGER,
    allowPublicRepos: true,
    allowSharing: true,
    allowForksAndStars: true,
    allowVersionHistory: true,
    allowTeams: false,
    allowAuditLogs: false,
    prioritySupport: false,
  },
  TEAM: {
    tier: "TEAM",
    label: "Team",
    monthlyUsd: 10,
    monthlyNgn: 4000,
    repoLimit: Number.MAX_SAFE_INTEGER,
    allowPublicRepos: true,
    allowSharing: true,
    allowForksAndStars: true,
    allowVersionHistory: true,
    allowTeams: true,
    allowAuditLogs: true,
    prioritySupport: true,
  },
};

export const PLAN_ORDER: PlanTier[] = ["FREE", "BASIC", "PRO", "TEAM"];

export function getPlanConfig(tier: PlanTier) {
  return PLAN_MATRIX[tier];
}

export function ensureFeature(
  tier: PlanTier,
  feature: keyof Omit<PlanConfig, "tier" | "label" | "monthlyUsd" | "monthlyNgn" | "repoLimit">,
) {
  return PLAN_MATRIX[tier][feature];
}

export function canCreateRepo(tier: PlanTier, currentRepoCount: number) {
  return currentRepoCount < PLAN_MATRIX[tier].repoLimit;
}
