import { ArrowRightIcon, CloudUploadIcon, LockIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Encrypted Backup + Restore",
    body: "Versioned snapshots with optional zero-knowledge client-side encryption.",
    icon: LockIcon,
  },
  {
    title: "CLI + Dashboard",
    body: "One command to push env updates, one click to explore and collaborate.",
    icon: CloudUploadIcon,
  },
  {
    title: "GitHub-like Social",
    body: "Public/private repos, forks, stars, trending projects, templates, and profiles.",
    icon: SparklesIcon,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-5 rounded-3xl border border-zinc-800 bg-zinc-900/45 p-6 md:grid-cols-[1.2fr_0.8fr] md:p-10">
        <div className="space-y-4">
          <Badge>envii CLI + SaaS</Badge>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
            GitHub for <span className="text-cyan-300">.env files</span>, built for teams.
          </h1>
          <p className="max-w-xl text-zinc-300">
            Backup, diff, rollback, and share environment variables across projects with secure
            versioning, audit logs, and Paystack-powered affordable plans.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild>
              <Link href="/dashboard">
                Open Dashboard <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/explore">Explore Repos</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/billing">Pricing from ₦800</Link>
            </Button>
          </div>
        </div>
        <div className="grid-bg rounded-2xl border border-zinc-800 p-4">
          <pre className="overflow-x-auto rounded-xl bg-zinc-950/75 p-4 text-xs text-zinc-300">
            <code>{`$ envii login
$ envii init
$ envii backup --repo my-app --env .env
$ envii commit -m "Rotate JWT secret"
$ envii push`}</code>
          </pre>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title}>
              <CardHeader>
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-200">
                  <Icon className="h-4 w-4" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.body}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          );
        })}
      </section>
    </div>
  );
}
