"use client";

import {
  BellIcon,
  BoltIcon,
  CreditCardIcon,
  CompassIcon,
  FolderGit2Icon,
  HomeIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/repos", label: "Repos", icon: FolderGit2Icon },
  { href: "/explore", label: "Explore", icon: CompassIcon },
  { href: "/editor", label: "Editor", icon: BoltIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/billing", label: "Billing", icon: CreditCardIcon },
];

type NavShellProps = {
  mode?: "sidebar" | "top";
};

function isActivePath(pathname: string, href: string) {
  if (href === "/repos") {
    return pathname === "/repos" || pathname.startsWith("/repos/") || pathname.startsWith("/repo/");
  }

  if (href === "/billing") {
    return pathname === "/billing" || pathname.startsWith("/settings/billing");
  }

  if (href === "/settings") {
    return (
      pathname === "/settings" ||
      (pathname.startsWith("/settings/") && !pathname.startsWith("/settings/billing"))
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavShell({ mode = "sidebar" }: NavShellProps) {
  const pathname = usePathname();

  if (mode === "top") {
    return (
      <header className="sticky top-3 z-40 lg:hidden">
        <div className="rounded-2xl border border-[#D4A574]/20 bg-[#02120e]/90 p-3 shadow-[0_12px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#C85A3A] text-xs font-bold text-[#02120e] shadow-lg">
                EN
              </span>
              <div>
                <p className="font-bold text-[#f5f5f0]">envii</p>
                <p className="text-[10px] font-medium text-[#a8b3af]">Secure Envs</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button className="relative rounded-full border border-[#D4A574]/15 p-2 text-[#a8b3af] transition hover:bg-[#1B4D3E]/30 hover:text-[#f5f5f0]">
                <BellIcon className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#C85A3A]" />
              </button>
              <ThemeToggle />
            </div>
          </div>

          <nav className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {links.map((link) => {
              const active = isActivePath(pathname, link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all",
                    active
                      ? "border-[#D4A574]/40 bg-[#1B4D3E]/50 text-[#f5f5f0] shadow-sm"
                      : "border-transparent bg-[#02120e]/40 text-[#a8b3af] hover:border-[#D4A574]/20 hover:text-[#f5f5f0]",
                  )}
                >
                  <Icon className={cn("h-4 w-4", active ? "text-[#D4A574]" : "text-[#8d9a95]")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
    );
  }

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] flex-col rounded-3xl border border-[#D4A574]/15 bg-[#02120e]/80 p-4 shadow-[0_16px_64px_rgba(0,0,0,0.6)] backdrop-blur-xl lg:flex">
      <Link href="/" className="group flex items-center gap-3 rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/15 px-4 py-4 transition-all hover:border-[#D4A574]/25 hover:bg-[#1B4D3E]/25">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#C85A3A] text-sm font-bold text-[#02120e] shadow-[0_0_20px_rgba(212,165,116,0.3)] transition-transform group-hover:scale-105">
          EN
        </span>
        <div>
          <p className="text-lg font-bold tracking-tight text-[#f5f5f0]">envii</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-[#a8b3af]/70">Secure Envs</p>
        </div>
      </Link>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-[#D4A574]/10 bg-[#02120e]/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#a8b3af]">Encrypted</span>
        </div>
        <button className="relative rounded-full border border-[#D4A574]/10 p-2 text-[#a8b3af] transition hover:bg-[#1B4D3E]/30 hover:text-[#f5f5f0]">
          <BellIcon className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#C85A3A]" />
        </button>
      </div>

      <nav className="mt-6 space-y-1.5">
        {links.map((link) => {
          const active = isActivePath(pathname, link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200",
                active
                  ? "border-[#D4A574]/30 bg-[#1B4D3E]/40 text-[#f5f5f0] shadow-sm"
                  : "border-transparent bg-transparent text-[#a8b3af] hover:bg-[#1B4D3E]/15 hover:text-[#f5f5f0]",
              )}
            >
              <Icon className={cn("h-5 w-5 transition-colors", active ? "text-[#D4A574]" : "text-[#8d9a95] group-hover:text-[#f5f5f0]")} />
              {link.label}
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D4A574]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-[#D4A574]/15 bg-gradient-to-br from-[#1B4D3E]/20 to-transparent px-4 py-4">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#D4A574]/5 blur-xl" />
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A574]/80">
            Security Status
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#a8b3af]">
            Your environment variables are AES-256 encrypted and PIN protected.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#02120e]/60 px-2 py-1.5 text-[10px] font-medium text-[#8d9a95] border border-[#D4A574]/5">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
            Active Protection
          </div>
        </div>
        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
          <p className="text-[10px] font-medium text-[#a8b3af]/50">v1.2.0</p>
        </div>
      </div>
    </aside>
  );
}
