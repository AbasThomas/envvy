"use client";

import {
  BookOpenIcon,
  ChevronRightIcon,
  CodeIcon,
  FolderGit2Icon,
  GitForkIcon,
  HistoryIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LockIcon,
  MessageSquareIcon,
  RocketIcon,
  SettingsIcon,
  ShareIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TerminalIcon,
  UserIcon,
  ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const sections = [
  { id: "what-is-envii", label: "What is envii?", icon: BookOpenIcon },
  { id: "getting-started", label: "Getting Started", icon: RocketIcon },
  { id: "creating-a-repo", label: "Creating a Repo", icon: FolderGit2Icon },
  { id: "committing-env", label: "Committing Env Snapshots", icon: HistoryIcon },
  { id: "cli-usage", label: "CLI Usage", icon: TerminalIcon },
  { id: "history-rollback", label: "History & Rollback", icon: HistoryIcon },
  { id: "diff-view", label: "Diff View", icon: CodeIcon },
  { id: "sharing", label: "Sharing & Collaboration", icon: ShareIcon },
  { id: "explore-fork", label: "Explore & Fork", icon: GitForkIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
  { id: "cli-pin", label: "CLI PIN", icon: KeyRoundIcon },
  { id: "integrations", label: "CI/CD & Slack", icon: ZapIcon },
  { id: "billing", label: "Billing & Plans", icon: StarIcon },
  { id: "security", label: "Security & Encryption", icon: ShieldCheckIcon },
  { id: "faq", label: "FAQ", icon: MessageSquareIcon },
];

function SectionHeading({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="flex items-center gap-4 scroll-mt-24 border-b border-[#D4A574]/15 pb-4 text-3xl font-black tracking-tight text-[#f5f5f0]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1B4D3E] to-transparent text-[#D4A574] ring-1 ring-[#D4A574]/20 shadow-lg shadow-black/20">
        <Icon className="h-5 w-5" />
      </div>
      {children}
    </h2>
  );
}

function SubHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h3
      id={id}
      className="scroll-mt-24 text-xl font-black tracking-tight text-[#f5f5f0]"
    >
      {children}
    </h3>
  );
}

function Callout({
  type = "info",
  children,
}: {
  type?: "info" | "tip" | "warning";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-[#D4A574]/30 bg-[#D4A574]/5 text-[#e8d5b7]",
    tip: "border-emerald-500/30 bg-emerald-500/5 text-[#a8d5c2]",
    warning: "border-amber-500/35 bg-amber-500/5 text-amber-200",
  };
  const labels = { info: "Note", tip: "Tip", warning: "Warning" };
  return (
    <div className={cn("rounded-2xl border px-5 py-4 text-sm leading-relaxed shadow-sm", styles[type])}>
      <span className="mr-2 text-[10px] font-black uppercase tracking-widest opacity-80">{labels[type]}</span>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#D4A574]/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <pre className="relative overflow-x-auto rounded-2xl border border-[#D4A574]/15 bg-[#010b09] px-5 py-4 text-sm font-mono text-[#c8d2ce] shadow-inner">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group flex gap-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#C85A3A] text-sm font-black text-[#02120e] shadow-lg shadow-[#D4A574]/10 transition-transform group-hover:scale-110">
        {number}
      </div>
      <div className="space-y-2 pt-1">
        <p className="text-base font-black tracking-tight text-[#f5f5f0]">{title}</p>
        <div className="text-sm leading-relaxed text-[#a8b3af]">{children}</div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  const [activeId, setActiveId] = useState("what-is-envii");
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0% -70% 0%" },
    );

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.current.observe(element);
    }

    return () => observer.current?.disconnect();
  }, []);

  return (
    <div className="relative mx-auto flex w-full max-w-7xl gap-12 px-6 pb-32 pt-6 lg:px-10">
      {/* Sidebar */}
      <aside className="sticky top-10 hidden h-[calc(100vh-5rem)] w-64 shrink-0 overflow-y-auto pr-4 lg:block no-scrollbar">
        <div className="space-y-1">
          <p className="mb-4 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/60">
            Documentation
          </p>
          {sections.map((s) => {
            const Icon = s.icon;
            const active = activeId === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition-all duration-200",
                  active
                    ? "bg-[#1B4D3E]/40 text-[#f5f5f0] shadow-[0_4px_12px_rgba(27,77,62,0.15)] ring-1 ring-[#D4A574]/20"
                    : "text-[#8d9a95] hover:bg-[#1B4D3E]/15 hover:text-[#f5f5f0]",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110", active ? "text-[#D4A574]" : "text-[#8d9a95]")} />
                {s.label}
              </a>
            );
          })}
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 space-y-20 lg:max-w-4xl">
        {/* Hero */}
        <div className="space-y-4 border-b border-[#D4A574]/15 pb-12">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[#D4A574]">
            <BookOpenIcon className="h-4 w-4" />
            <span>Developer Guide</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-[#f5f5f0] lg:text-6xl">
            envii <span className="text-[#D4A574]">Docs</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-[#a8b3af]">
            Master the art of secure environment management. Version, share, and protect your project secrets with enterprise-grade encryption.
          </p>
        </div>

        {/* ── WHAT IS ENVII ── */}
        <section className="space-y-5">
          <SectionHeading id="what-is-envii" icon={BookOpenIcon}>
            What is envii?
          </SectionHeading>
          <p className="leading-relaxed text-[#a8b3af]">
            <strong className="text-[#f5f5f0]">Envii</strong> is the GitHub for{" "}
            <code className="rounded bg-[#1B4D3E]/40 px-1 text-[#D4A574]">.env</code> files. It is
            a secure, collaborative platform where developers and teams can backup, version, fork,
            star, and share environment variables the same way they share code.
          </p>
          <p className="leading-relaxed text-[#a8b3af]">
            Every environment snapshot is encrypted with AES-256-GCM before being stored. You
            control access with a 6-digit repo PIN, and every change is logged in an immutable audit
            trail.
          </p>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: LockIcon,
                title: "Zero-knowledge encryption",
                desc: "AES-256-GCM encrypts all env variables before they touch the database.",
              },
              {
                icon: HistoryIcon,
                title: "Full version history",
                desc: "Every commit creates an immutable, timestamped snapshot you can diff or rollback.",
              },
              {
                icon: TerminalIcon,
                title: "CLI-first workflow",
                desc: "envii backup, envii restore, envii login — use your terminal like you always have.",
              },
              {
                icon: ShareIcon,
                title: "Role-based sharing",
                desc: "Invite teammates with VIEWER, CONTRIB, or EDITOR roles. PIN-protected.",
              },
              {
                icon: GitForkIcon,
                title: "Fork & star templates",
                desc: "Discover public env templates from the community and fork them in one click.",
              },
              {
                icon: SparklesIcon,
                title: "AI suggestions",
                desc: "Auto-detect missing keys, weak secrets, and insecure defaults in your env files.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="group relative rounded-2xl border border-[#D4A574]/15 bg-[#02120e]/40 p-6 transition-all hover:border-[#D4A574]/30 hover:bg-[#1B4D3E]/10"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A574]/10 text-[#D4A574] transition-transform group-hover:scale-110">
                  <card.icon className="h-5 w-5" />
                </div>
                <p className="text-base font-black tracking-tight text-[#f5f5f0] group-hover:text-[#D4A574] transition-colors">{card.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[#a8b3af]">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── GETTING STARTED ── */}
        <section className="space-y-6">
          <SectionHeading id="getting-started" icon={RocketIcon}>
            Getting Started
          </SectionHeading>

          <SubHeading id="signup">1. Create your account</SubHeading>
          <div className="space-y-4">
            <Step number={1} title="Go to the signup page">
              Navigate to{" "}
              <Link href="/signup" className="text-[#D4A574] hover:underline">
                /signup
              </Link>{" "}
              and fill in your full name, email, and a password (minimum 8 characters).
            </Step>
            <Step number={2} title="Accept terms">
              Check the terms and privacy policy checkbox, then click{" "}
              <strong className="text-[#f5f5f0]">Create Account</strong>.
            </Step>
            <Step number={3} title="Complete onboarding">
              You are automatically redirected to{" "}
              <Link href="/onboarding" className="text-[#D4A574] hover:underline">
                /onboarding
              </Link>{" "}
              where you generate your 6-digit CLI PIN. This PIN is used to authenticate the CLI
              tool. Keep it safe — it is hashed and stored; envii cannot retrieve the raw value.
            </Step>
            <Step number={4} title="You're in!">
              After onboarding, you land on the{" "}
              <Link href="/dashboard" className="text-[#D4A574] hover:underline">
                Dashboard
              </Link>
              . You are now ready to create repositories and start committing snapshots.
            </Step>
          </div>

          <Callout type="tip">
            You can also sign in with Google or GitHub for a faster onboarding experience. After
            OAuth login you will still be prompted to set up your CLI PIN on the onboarding screen.
          </Callout>

          <SubHeading id="login">2. Logging in</SubHeading>
          <p className="text-sm text-[#a8b3af] leading-relaxed">
            Go to{" "}
            <Link href="/login" className="text-[#D4A574] hover:underline">
              /login
            </Link>
            . You can sign in using:
          </p>
          <ul className="ml-4 space-y-2 text-sm text-[#a8b3af]">
            <li className="flex items-start gap-2">
              <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A574]" />
              <span>
                <strong className="text-[#f5f5f0]">Password</strong> — your account email and
                password.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A574]" />
              <span>
                <strong className="text-[#f5f5f0]">6-digit PIN</strong> — the CLI PIN you generated
                during onboarding. Toggle to "6-digit PIN" mode on the login page.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#D4A574]" />
              <span>
                <strong className="text-[#f5f5f0]">Google / GitHub</strong> — one-click OAuth login.
              </span>
            </li>
          </ul>
        </section>

        {/* ── CREATING A REPO ── */}
        <section className="space-y-6">
          <SectionHeading id="creating-a-repo" icon={FolderGit2Icon}>
            Creating a Repository
          </SectionHeading>
          <p className="text-sm text-[#a8b3af] leading-relaxed">
            A <strong className="text-[#f5f5f0]">repository</strong> in envii is a named container
            for your environment snapshots — similar to a Git repo but for{" "}
            <code className="rounded bg-[#1B4D3E]/40 px-1 text-[#D4A574]">.env</code> files. Each
            repo is protected by a 6-digit PIN and can hold multiple environments
            (development, staging, production).
          </p>

          <div className="space-y-4">
            <Step number={1} title="Open the Dashboard">
              Go to{" "}
              <Link href="/dashboard" className="text-[#D4A574] hover:underline">
                Dashboard
              </Link>
              . You will see a <strong className="text-[#f5f5f0]">New Repository</strong> panel on
              the right.
            </Step>
            <Step number={2} title="Enter a name">
              Type a repository name. Names are converted to a URL-safe slug automatically (e.g.{" "}
              <code className="rounded bg-[#1B4D3E]/40 px-1 text-[#D4A574]">My App</code> becomes{" "}
              <code className="rounded bg-[#1B4D3E]/40 px-1 text-[#D4A574]">my-app</code>).
            </Step>
            <Step number={3} title="Choose visibility">
              <strong className="text-[#f5f5f0]">Private</strong> (default) — only you and invited
              collaborators can access it.
              <br />
              <strong className="text-[#f5f5f0]">Public</strong> — visible to everyone on the
              Explore page (available on PRO / TEAM plans).
            </Step>
            <Step number={4} title="Set the repo PIN">
              Enter a 6-digit numeric PIN. This PIN gates access to all env data in this repo. You
              will need to enter it whenever you open the repo, use the CLI, or share with
              teammates.
              <Callout type="warning">
                Store your repo PIN somewhere safe. If you forget it, the repo owner can reset it
                from the repo Settings tab.
              </Callout>
            </Step>
            <Step number={5} title="Click Create Repository">
              The repo appears in your repos list immediately.
            </Step>
          </div>

          <Callout type="info">
            You can also create repos from the{" "}
            <Link href="/repos" className="text-[#D4A574] hover:underline">
              Repos
            </Link>{" "}
            page. Plan limits apply — FREE accounts can create 1 repo, BASIC up to 5, PRO and TEAM
            have unlimited repos.
          </Callout>
        </section>

        {/* ── COMMITTING ENV SNAPSHOTS ── */}
        <section className="space-y-6">
          <SectionHeading id="committing-env" icon={HistoryIcon}>
            Committing Environment Snapshots
          </SectionHeading>
          <p className="text-sm text-[#a8b3af] leading-relaxed">
            A <strong className="text-[#f5f5f0]">snapshot</strong> is a versioned, encrypted copy
            of your{" "}
            <code className="rounded bg-[#1B4D3E]/40 px-1 text-[#D4A574]">.env</code> file at a
            point in time. Every snapshot gets an incrementing version number per environment.
          </p>

          <SubHeading id="commit-web">Using the Web Editor</SubHeading>
          <div className="space-y-4">
            <Step number={1} title="Open your repo">
              Go to{" "}
              <Link href="/repos" className="text-[#D4A574] hover:underline">
                Repos
              </Link>{" "}
              and click the repository you want to work with.
            </Step>
            <Step number={2} title="Enter your repo PIN">
              You are prompted to enter the 6-digit repo PIN. This unlocks the encrypted snapshots
              for this session.
            </Step>
            <Step number={3} title="Open the Editor tab">
              Inside the repo, click the <strong className="text-[#f5f5f0]">Editor</strong> tab.
              The Monaco-powered editor pre-loads the latest snapshot.
            </Step>
            <Step number={4} title="Edit your environment variables">
              Add, remove, or change key-value pairs. The editor supports standard{" "}
              <code className="rounded bg-[#1B4D3E]/40 px-1 text-[#D4A574]">.env</code> syntax:
              <CodeBlock>{`DATABASE_URL=postgresql://localhost:5432/mydb
JWT_SECRET=replace-me-with-something-strong
NODE_ENV=development`}</CodeBlock>
            </Step>
            <Step number={5} title="Write a commit message and save">
              Type a short commit message (e.g. "Rotate JWT secret") and click{" "}
              <strong className="text-[#f5f5f0]">Commit Snapshot</strong>. The snapshot is
              encrypted and stored as the next version.
            </Step>
          </div>

          <SubHeading id="commit-cli">Using the CLI</SubHeading>
          <p className="text-sm text-[#a8b3af] leading-relaxed">
            The CLI reads your local{" "}
            <code className="rounded bg-[#1B4D3E]/40 px-1 text-[#D4A574]">.env</code> file and
            uploads it as a new snapshot.
          </p>
          <CodeBlock>{`# First-time login
envii login

# Login with your 6-digit PIN instead of password
envii login --pin

# Point the CLI at your repo
envii init my-app

# Add your .env file to tracking
envii add .env

# Commit a new snapshot
envii commit -m "Add Redis connection string"

# Push to envii
envii push`}</CodeBlock>
          <Callout type="tip">
            Run <code className="rounded bg-[#1B4D3E]/40 px-1 text-[#D4A574]">envii push</code>{" "}
            from within any project directory that has a{" "}
            <code className="rounded bg-[#1B4D3E]/40 px-1 text-[#D4A574]">.envii</code>{" "}
            config file. The CLI uses your API token (generated at login) for authentication.
          </Callout>
        </section>

        {/* ── CLI REFERENCE ── */}
        <section className="space-y-8">
          <SectionHeading id="cli-usage" icon={TerminalIcon}>
            CLI Reference
          </SectionHeading>
          <p className="text-lg text-[#a8b3af] leading-relaxed">
            The envii CLI gives you a Git-like workflow for your environment files straight from
            the terminal.
          </p>

          <div className="grid gap-4">
            {[
              {
                cmd: "envii login",
                desc: "Authenticate with your email and password. Stores an API token locally.",
              },
              {
                cmd: "envii login --pin",
                desc: "Authenticate using your 6-digit CLI PIN instead of password.",
              },
              {
                cmd: "envii init <repo-name>",
                desc: "Initialise a new envii repository linked to the current directory.",
              },
              {
                cmd: "envii add .env",
                desc: "Stage the .env file for the next commit.",
              },
              {
                cmd: "envii commit -m \"message\"",
                desc: "Create a new encrypted snapshot with the given commit message.",
              },
              {
                cmd: "envii push",
                desc: "Upload the latest committed snapshot to envii.",
              },
              {
                cmd: "envii restore",
                desc: "Download and decrypt the latest snapshot for the current environment.",
              },
              {
                cmd: "envii restore --version 5",
                desc: "Restore a specific version by number.",
              },
              {
                cmd: "envii repos",
                desc: "List all your envii repositories.",
              },
              {
                cmd: "envii status",
                desc: "Show the current repo, environment, and latest snapshot version.",
              },
            ].map((row) => (
              <div key={row.cmd} className="group flex flex-col gap-3 rounded-2xl border border-[#D4A574]/10 bg-[#02120e]/40 p-4 transition-all hover:border-[#D4A574]/30 hover:bg-[#1B4D3E]/5 sm:flex-row sm:items-center">
                <code className="shrink-0 rounded-xl border border-[#D4A574]/20 bg-[#010b09] px-4 py-2 text-sm font-bold text-[#D4A574] sm:w-64 transition-colors group-hover:border-[#D4A574]/40 shadow-inner">
                  {row.cmd}
                </code>
                <p className="text-sm text-[#a8b3af] px-2">{row.desc}</p>
              </div>
            ))}
          </div>

          <Callout type="info">
            The CLI authenticates all requests with a Bearer token. The token is generated when you
            run <code className="rounded-lg bg-[#1B4D3E]/40 px-2 py-0.5 text-[#D4A574]">envii login</code>{" "}
            and stored in your local config. You can revoke it from{" "}
            <Link href="/settings" className="text-[#D4A574] font-bold hover:underline">
              Settings → CLI PIN
            </Link>
            .
          </Callout>
        </section>

        {/* ── HISTORY & ROLLBACK ── */}
        <section className="space-y-10">
          <SectionHeading id="history-rollback" icon={HistoryIcon}>
            History & Rollback
          </SectionHeading>
          <div className="space-y-8">
            <p className="text-lg leading-relaxed text-[#a8b3af]">
              Every snapshot you commit is stored permanently with a version number, timestamp, commit
              message, author, and an auto-generated diff summary.
            </p>

            <div className="space-y-6">
              <SubHeading id="viewing-history">Viewing History</SubHeading>
              <div className="grid gap-6">
                <Step number={1} title="Open your repo">
                  From{" "}
                  <Link href="/repos" className="text-[#D4A574] font-bold hover:underline">
                    Repos
                  </Link>
                  , click a repo and enter its PIN.
                </Step>
                <Step number={2} title="Go to the History tab">
                  Each row shows the version number, commit message, who committed, when it was
                  committed, and a quick diff summary.
                </Step>
                <Step number={3} title="Select any version">
                  Click a version to expand its full details and preview the decrypted key-value pairs.
                </Step>
              </div>
            </div>

            <div className="space-y-6">
              <SubHeading id="rolling-back">Rolling Back</SubHeading>
              <div className="grid gap-6">
                <Step number={1} title="Find the version to restore">
                  In the History tab, locate the snapshot you want to roll back to.
                </Step>
                <Step number={2} title="Click Rollback">
                  Click the <strong className="text-[#f5f5f0]">Rollback</strong> button. This creates a brand new snapshot with the
                  content of the old version.
                </Step>
                <Step number={3} title="Confirm">
                  Add an optional commit message and confirm. The new
                  snapshot appears at the top of the history.
                </Step>
              </div>
            </div>
            
            <Callout type="tip">
              Rollback via CLI:{" "}
              <code className="rounded-lg bg-[#1B4D3E]/40 px-2 py-0.5 text-[#D4A574] font-mono text-xs">
                envii restore --version 4
              </code>
            </Callout>
          </div>
        </section>

        {/* ── DIFF VIEW ── */}
        <section className="space-y-6">
          <SectionHeading id="diff-view" icon={CodeIcon}>
            Diff View
          </SectionHeading>
          <p className="text-sm text-[#a8b3af] leading-relaxed">
            The diff view lets you compare any two snapshots side-by-side to see exactly what
            changed between versions.
          </p>
          <div className="space-y-4">
            <Step number={1} title="Open the History tab">
              Go to your repo and select the History tab.
            </Step>
            <Step number={2} title="Select two versions to compare">
              Use the checkboxes (or the Compare button) to select a From version and a To version.
            </Step>
            <Step number={3} title="View the diff">
              The diff panel shows:
              <ul className="mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Green lines — keys that were added</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span>Red lines — keys that were removed</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span>Amber lines — keys whose values changed</span>
                </li>
              </ul>
            </Step>
          </div>
          <Callout type="info">
            Diff metrics (added / removed / changed counts) are also stored with every snapshot and
            shown in the History list.
          </Callout>
        </section>

        {/* ── SHARING ── */}
        <section className="space-y-10">
          <SectionHeading id="sharing" icon={ShareIcon}>
            Sharing & Collaboration
          </SectionHeading>
          <div className="space-y-8">
            <p className="text-lg leading-relaxed text-[#a8b3af]">
              Invite teammates to access your private repositories with granular role-based permissions.
            </p>

            <div className="space-y-6">
              <SubHeading id="roles">Role-Based Access Control</SubHeading>
              <div className="overflow-hidden rounded-2xl border border-[#D4A574]/15 bg-[#02120e]/40 shadow-xl">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#D4A574]/15 bg-[#1B4D3E]/20">
                    <tr>
                      {["Role", "History", "Commit", "Rollback", "Admin"].map((h) => (
                        <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#D4A574]/70">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D4A574]/10">
                    {[
                      { role: "VIEWER", view: "✓", commit: "—", rollback: "—", manage: "—" },
                      { role: "CONTRIB", view: "✓", commit: "✓", rollback: "—", manage: "—" },
                      { role: "EDITOR", view: "✓", commit: "✓", rollback: "✓", manage: "—" },
                      { role: "OWNER", view: "✓", commit: "✓", rollback: "✓", manage: "✓" },
                    ].map((row) => (
                      <tr key={row.role} className="transition-colors hover:bg-[#1B4D3E]/10">
                        <td className="px-6 py-4">
                          <Badge variant="muted" className="bg-[#02120e]/60 font-black text-[#f5f5f0]">{row.role}</Badge>
                        </td>
                        {[row.view, row.commit, row.rollback, row.manage].map((v, i) => (
                          <td key={i} className={cn("px-6 py-4 font-bold", v === "✓" ? "text-emerald-400" : "text-[#4d6d62]")}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-6">
              <SubHeading id="invite">Inviting a Collaborator</SubHeading>
              <div className="grid gap-8">
                <Step number={1} title="Open repo Settings">
                  Go to the <strong className="text-[#f5f5f0]">Settings</strong> tab in your repo.
                </Step>
                <Step number={2} title="Enter email & role">
                  Enter their email and pick a role (VIEWER, CONTRIB, or EDITOR).
                </Step>
                <Step number={3} title="Send invitation link">
                  Share the generated link with your teammate. They must be signed in to accept.
                </Step>
              </div>
            </div>
            
            <Callout type="warning">
              Collaborators need the repo PIN to access encrypted data. Share it with them
              securely (e.g. via a team vault).
            </Callout>
          </div>
        </section>

        {/* ── EXPLORE & FORK ── */}
        <section className="space-y-10">
          <SectionHeading id="explore-fork" icon={GitForkIcon}>
            Explore & Fork
          </SectionHeading>
          <div className="space-y-8">
            <p className="text-lg leading-relaxed text-[#a8b3af]">
              Discover community-driven environment templates. Fork popular stacks and jumpstart your
              development with pre-configured secure defaults.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="group rounded-2xl border border-[#D4A574]/15 bg-[#02120e]/40 p-6 transition-all hover:border-[#D4A574]/30 hover:bg-[#1B4D3E]/5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <StarIcon className="h-5 w-5" />
                </div>
                <h4 className="text-base font-black text-[#f5f5f0]">Starring Repos</h4>
                <p className="mt-2 text-sm text-[#a8b3af]">Bookmark useful templates for quick access later. Starred repos appear in your main dashboard filter.</p>
              </div>
              <div className="group rounded-2xl border border-[#D4A574]/15 bg-[#02120e]/40 p-6 transition-all hover:border-[#D4A574]/30 hover:bg-[#1B4D3E]/5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A574]/10 text-[#D4A574]">
                  <GitForkIcon className="h-5 w-5" />
                </div>
                <h4 className="text-base font-black text-[#f5f5f0]">One-Click Forking</h4>
                <p className="mt-2 text-sm text-[#a8b3af]">Instantly clone a public repo into your private workspace. All snapshots are re-encrypted with your own PIN.</p>
              </div>
            </div>

            <div className="space-y-6">
              <SubHeading id="forking">Forking a Repo</SubHeading>
              <div className="grid gap-6">
                <Step number={1} title="Find a template">
                  Browse the{" "}
                  <Link href="/explore" className="text-[#D4A574] font-bold hover:underline">
                    Explore
                  </Link>{" "}
                  page and open a repository you want to use.
                </Step>
                <Step number={2} title="Click Fork">
                  Click the <strong className="text-[#f5f5f0]">Fork</strong> button. Optionally give
                  the fork a new name.
                </Step>
                <Step number={3} title="Instant Workspace Integration">
                  The fork appears in your repos immediately. You can then commit your own changes on top of it.
                </Step>
              </div>
            </div>
            
            <Callout type="info">
              Fork and star features are premium additions available on PRO and TEAM plans.
            </Callout>
          </div>
        </section>

        {/* ── SETTINGS ── */}
        <section className="space-y-10">
          <SectionHeading id="settings" icon={SettingsIcon}>
            Workspace Settings
          </SectionHeading>
          <div className="space-y-8">
            <p className="text-lg leading-relaxed text-[#a8b3af]">
              Fine-tune your envii experience. Manage your secure identity, billing, and third-party
              integrations from one central hub.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  title: "Profile",
                  href: "/profile",
                  desc: "Update your developer identity, bio, and public profile picture.",
                  icon: UserIcon,
                },
                {
                  title: "CLI Security",
                  href: "/settings",
                  desc: "Manage your 6-digit CLI PIN and rotate your terminal API tokens.",
                  icon: KeyRoundIcon,
                },
                {
                  title: "Billing & Plans",
                  href: "/billing",
                  desc: "Upgrade your workspace, view history, and manage your subscription.",
                  icon: CreditCardIcon,
                },
                {
                  title: "Integrations",
                  href: "/settings",
                  desc: "Connect Slack for live notifications and export envs for CI/CD pipelines.",
                  icon: ZapIcon,
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group rounded-2xl border border-[#D4A574]/15 bg-[#02120e]/40 p-6 transition-all hover:border-[#D4A574]/30 hover:bg-[#1B4D3E]/10"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A574]/10 text-[#D4A574] transition-transform group-hover:scale-110">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-base font-black tracking-tight text-[#f5f5f0] group-hover:text-[#D4A574] transition-colors">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-[#a8b3af] leading-relaxed">{item.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── CLI PIN ── */}
        <section className="space-y-6">
          <SectionHeading id="cli-pin" icon={KeyRoundIcon}>
            CLI PIN
          </SectionHeading>
          <p className="text-sm text-[#a8b3af] leading-relaxed">
            Your <strong className="text-[#f5f5f0]">CLI PIN</strong> is a 6-digit numeric PIN used
            to authenticate the envii CLI tool without typing your full password. It can also be
            used to log into the web app in PIN mode.
          </p>

          <SubHeading id="generate-pin">Generating a CLI PIN</SubHeading>
          <div className="space-y-4">
            <Step number={1} title="Go to onboarding or Settings">
              New accounts are directed to{" "}
              <Link href="/onboarding" className="text-[#D4A574] hover:underline">
                /onboarding
              </Link>{" "}
              after signup. Existing users can regenerate their PIN from{" "}
              <Link href="/settings" className="text-[#D4A574] hover:underline">
                Settings
              </Link>
              .
            </Step>
            <Step number={2} title="Click Generate PIN">
              envii generates a random 6-digit PIN. You can also type a custom 6-digit number.
            </Step>
            <Step number={3} title="Copy and store it">
              The PIN is shown only once. Store it in your password manager — once saved, envii
              only stores the bcryptjs hash.
            </Step>
          </div>

          <SubHeading id="revoke-pin">Revoking a CLI PIN</SubHeading>
          <p className="text-sm text-[#a8b3af] leading-relaxed">
            Go to{" "}
            <Link href="/settings" className="text-[#D4A574] hover:underline">
              Settings → CLI PIN
            </Link>{" "}
            and click <strong className="text-[#f5f5f0]">Revoke PIN</strong>. This immediately
            invalidates the PIN and rotates your API token, ending all active CLI sessions.
          </p>
          <Callout type="warning">
            Revoking your PIN also rotates your API token. You will need to run{" "}
            <code className="rounded bg-[#1B4D3E]/40 px-1 text-[#D4A574]">envii login</code>{" "}
            again after revoking.
          </Callout>
        </section>

        {/* ── INTEGRATIONS ── */}
        <section className="space-y-10">
          <SectionHeading id="integrations" icon={ZapIcon}>
            CI/CD & Slack
          </SectionHeading>
          <div className="space-y-8">
            <p className="text-lg leading-relaxed text-[#a8b3af]">
              Streamline your deployment pipeline. Export encrypted secrets to your favorite CI/CD
              platforms and stay notified via Slack.
            </p>

            <div className="space-y-6">
              <SubHeading id="cicd">CI/CD Export</SubHeading>
              <div className="grid gap-6">
                <Step number={1} title="Access Repo Settings">
                  Go to the <strong className="text-[#f5f5f0]">Settings</strong> tab in your repo.
                </Step>
                <Step number={2} title="Select Target Platform">
                  Pick <strong className="text-[#f5f5f0]">Vercel</strong>,{" "}
                  <strong className="text-[#f5f5f0]">Netlify</strong>, or{" "}
                  <strong className="text-[#f5f5f0]">GitHub Actions</strong>.
                </Step>
                <Step number={3} title="Generate & Copy">
                  Select your environment (Dev/Staging/Prod) and copy the ready-to-use dotenv block.
                </Step>
              </div>
            </div>

            <div className="space-y-6">
              <SubHeading id="slack">Slack Notifications</SubHeading>
              <div className="grid gap-6">
                <Step number={1} title="Setup Slack Webhook">
                  Create an Incoming Webhook in your Slack App settings.
                </Step>
                <Step number={2} title="Configure envii">
                  Paste the URL into <strong className="text-[#f5f5f0]">Settings → Integrations</strong>.
                </Step>
                <Step number={3} title="Go Live">
                  Your team will now receive real-time alerts whenever an env snapshot is updated.
                </Step>
              </div>
            </div>
          </div>
        </section>

        {/* ── BILLING ── */}
        <section className="space-y-10">
          <SectionHeading id="billing" icon={CreditCardIcon}>
            Billing & Plans
          </SectionHeading>
          <div className="space-y-8">
            <p className="text-lg leading-relaxed text-[#a8b3af]">
              Envii offers flexible plan tiers tailored for individuals and teams. Payments are
              securely processed in NGN via Paystack.
            </p>

            <div className="overflow-hidden rounded-2xl border border-[#D4A574]/15 bg-[#02120e]/40 shadow-xl">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#D4A574]/15 bg-[#1B4D3E]/20">
                  <tr>
                    {["Plan", "Repos", "Sharing", "Fork & Star", "Audit logs", "Teams"].map((h) => (
                      <th key={h} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#D4A574]/70">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4A574]/10">
                  {[
                    { plan: "FREE", repos: "1", sharing: "—", fork: "—", audit: "—", teams: "—" },
                    { plan: "BASIC", repos: "5", sharing: "✓", fork: "—", audit: "—", teams: "—" },
                    { plan: "PRO", repos: "Unlimited", sharing: "✓", fork: "✓", audit: "—", teams: "—" },
                    { plan: "TEAM", repos: "Unlimited", sharing: "✓", fork: "✓", audit: "✓", teams: "✓" },
                  ].map((row) => (
                    <tr key={row.plan} className="transition-colors hover:bg-[#1B4D3E]/10">
                      <td className="px-6 py-4">
                        <Badge variant={row.plan === "FREE" ? "muted" : "default"} className="font-black">{row.plan}</Badge>
                      </td>
                      {[row.repos, row.sharing, row.fork, row.audit, row.teams].map((v, i) => (
                        <td key={i} className={cn("px-6 py-4", v === "✓" ? "text-emerald-400 font-bold" : v === "—" ? "text-[#4d6d62]" : "text-[#f5f5f0] font-bold")}>
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-6">
              <SubHeading id="upgrade">Upgrading Your Plan</SubHeading>
              <div className="grid gap-6">
                <Step number={1} title="Visit Billing Settings">
                  Go to <Link href="/billing" className="text-[#D4A574] font-bold hover:underline">Settings → Billing</Link>.
                </Step>
                <Step number={2} title="Select Your Plan">
                  Choose between Basic, Pro, or Team tiers based on your workspace needs.
                </Step>
                <Step number={3} title="Secure Checkout">
                  Complete your payment via Paystack. Your new limits are applied instantly.
                </Step>
              </div>
            </div>
          </div>
        </section>
            <Step number={1} title="Go to Settings → Billing">
              Navigate to{" "}
              <Link href="/settings/billing" className="text-[#D4A574] hover:underline">
                Settings → Billing
              </Link>
              .
            </Step>
            <Step number={2} title="Select a plan">
              Choose BASIC, PRO, or TEAM and click{" "}
              <strong className="text-[#f5f5f0]">Upgrade</strong>.
            </Step>
            <Step number={3} title="Complete payment via Paystack">
              You are redirected to a Paystack checkout. Payments are accepted via card, bank
              transfer, and USSD.
            </Step>
            <Step number={4} title="Plan activates immediately">
              After payment is verified your plan tier is updated and you gain access to the new
              features right away.
            </Step>
          </div>
          <Callout type="info">
            You can view your full payment history and subscription status from the Billing page.
          </Callout>
        </section>

        {/* ── SECURITY ── */}
        <section className="space-y-10">
          <SectionHeading id="security" icon={ShieldCheckIcon}>
            Security & Encryption
          </SectionHeading>

          <div className="space-y-12">
            <div className="space-y-4">
              <SubHeading id="encryption">Zero-Knowledge Architecture</SubHeading>
              <p className="text-base leading-relaxed text-[#a8b3af]">
                All environment variables are encrypted with <strong className="text-[#f5f5f0]">AES-256-GCM</strong> before being stored. Each snapshot uses a unique, random IV (initialization vector) to ensure cryptographic strength.
              </p>
              <div className="rounded-2xl border border-[#D4A574]/15 bg-[#010b09] p-6">
                <p className="text-sm font-mono text-[#D4A574]">
                  // Standard AES-256-GCM encryption flow<br/>
                  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);<br/>
                  let encrypted = cipher.update(plainText, 'utf8', 'hex');<br/>
                  encrypted += cipher.final('hex');
                </p>
              </div>
              <p className="text-sm leading-relaxed text-[#a8b3af]">
                The authentication tag generated during encryption ensures data integrity — any tampering with the encrypted data is immediately detected during decryption.
              </p>
            </div>

            <div className="space-y-4">
              <SubHeading id="pin-security">PIN & Token Security</SubHeading>
              <p className="text-base leading-relaxed text-[#a8b3af]">
                Repo and CLI PINs are never stored in plaintext. We use <strong className="text-[#f5f5f0]">bcryptjs</strong> (cost factor 10) to hash all PINs before they reach our database.
              </p>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/5 p-5">
                  <h4 className="text-sm font-black text-[#f5f5f0]">Brute-Force Protection</h4>
                  <p className="mt-2 text-xs text-[#a8b3af]">PIN login attempts are strictly limited to 5 attempts per 15 minutes per IP address.</p>
                </div>
                <div className="rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/5 p-5">
                  <h4 className="text-sm font-black text-[#f5f5f0]">Token Rotation</h4>
                  <p className="mt-2 text-xs text-[#a8b3af]">Revoking your CLI PIN instantly rotates your API Bearer token, invalidating all active sessions.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SubHeading id="access-control">Access Control & Auditing</SubHeading>
              <div className="space-y-4">
                {[
                  "Authenticated sessions are required for all API endpoints.",
                  "A valid repo PIN must be provided via the x-envii-repo-pin header.",
                  "Role-based permissions restrict actions (VIEWER, CONTRIB, EDITOR, OWNER).",
                  "Immutable audit logs record every workspace action (TEAM plan).",
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-[#a8b3af]">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#D4A574]" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="space-y-10 pb-20">
          <SectionHeading id="faq" icon={MessageSquareIcon}>
            Frequently Asked Questions
          </SectionHeading>

          <div className="grid gap-4">
            {[
              {
                q: "Can I use envii without the CLI?",
                a: "Yes. The web editor lets you create, edit, and commit env snapshots entirely from the browser. The CLI is optional but recommended for daily developer workflows.",
              },
              {
                q: "What happens if I forget my repo PIN?",
                a: "The repo owner can reset the PIN from the repo's Settings tab. Resetting the PIN does not delete existing snapshots, but any cached PIN in your browser session is cleared.",
              },
              {
                q: "What happens if I forget my CLI PIN?",
                a: "You can revoke the old PIN from Settings and generate a new one. Revoking also rotates your API token, so you will need to run envii login again.",
              },
              {
                q: "Can I import an existing .env file?",
                a: "Yes — paste the contents directly into the web editor (it supports standard .env format) or use the CLI to add and push your local .env file.",
              },
              {
                q: "Are my .env files readable by the envii team?",
                a: "No. All snapshots are encrypted with AES-256-GCM using a key that only your server knows. Even database administrators cannot read your plaintext values.",
              },
              {
                q: "How do I switch between environments (dev, staging, prod)?",
                a: "Each repo can hold separate histories for development, staging, and production. When committing via the web editor, select the environment from the dropdown. With the CLI, use envii commit --env staging.",
              },
              {
                q: "Can collaborators see the repo PIN?",
                a: "No. PINs are only stored as hashes. You must share the raw PIN with collaborators through a separate secure channel (e.g. your team's password manager).",
              },
              {
                q: "What is the free plan limit?",
                a: "Free accounts can create 1 private repository with full version history and encryption. Sharing, public repos, forking, and starring require a paid plan.",
              },
              {
                q: "Can I cancel my subscription?",
                a: "Yes, contact support or cancel via the Paystack subscription management link in Settings → Billing. Your plan reverts to FREE at the end of the billing cycle.",
              },
              {
                q: "Does envii support team workspaces?",
                a: "The TEAM plan enables multi-user collaboration with audit logs. You can invite editors and viewers to individual repos. A full shared workspace feature is on the roadmap.",
              },
            ].map((item) => (
              <div
                key={item.q}
                className="group rounded-2xl border border-[#D4A574]/15 bg-[#02120e]/40 p-6 space-y-3 transition-all hover:border-[#D4A574]/30 hover:bg-[#1B4D3E]/5"
              >
                <p className="text-base font-black tracking-tight text-[#f5f5f0] group-hover:text-[#D4A574] transition-colors">{item.q}</p>
                <p className="text-sm leading-relaxed text-[#a8b3af]">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <div className="rounded-3xl border border-[#D4A574]/20 bg-gradient-to-br from-[#1B4D3E]/30 via-[#02120e]/60 to-transparent p-12 text-center space-y-8 overflow-hidden relative group">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4A574]/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#1B4D3E]/10 blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-center">
              <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#D4A574] to-[#C85A3A] text-2xl font-black text-[#02120e] shadow-2xl shadow-[#D4A574]/20">
                EN
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-[#D4A574] to-[#C85A3A] opacity-20 blur-md" />
              </span>
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tight text-[#f5f5f0]">Ready to get started?</h3>
              <p className="text-base text-[#a8b3af] max-w-sm mx-auto leading-relaxed">
                Create your first repo in seconds. Join thousands of developers versioning their secrets securely.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#D4A574] to-[#C85A3A] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-[#02120e] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-[#D4A574]/10"
              >
                <LayoutDashboardIcon className="h-4 w-4" />
                Go to Dashboard
              </Link>
              <Link
                href="/explore"
                className="group inline-flex items-center gap-2 rounded-xl border border-[#D4A574]/25 bg-[#1B4D3E]/30 px-8 py-3.5 text-sm font-black uppercase tracking-widest text-[#f5f5f0] transition-all hover:bg-[#1B4D3E]/50 hover:scale-105 active:scale-95"
              >
                <GitForkIcon className="h-4 w-4" />
                Explore Templates
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
