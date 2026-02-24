"use client";

import {
  BellIcon,
  BoltIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CreditCardIcon,
  CompassIcon,
  FolderGit2Icon,
  HomeIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/repos", label: "Repos", icon: FolderGit2Icon },
  { href: "/explore", label: "Explore", icon: CompassIcon },
  { href: "/editor", label: "Editor", icon: BoltIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/billing", label: "Billing", icon: CreditCardIcon },
  { href: "/docs", label: "Docs", icon: BookOpenIcon },
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
  const [collapsed, setCollapsed] = useState(false);

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
              <Link href="/signup" className="hidden sm:block">
                <Button size="sm" className="bg-gradient-to-br from-[#D4A574] to-[#C85A3A] text-[#02120e] font-bold text-[10px] uppercase tracking-widest px-4">
                  Get Started
                </Button>
              </Link>
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
    <aside 
      className={cn(
        "sticky top-0 hidden h-screen flex-col border-r border-[#D4A574]/15 bg-[#02120e]/85 p-4 shadow-[0_16px_64px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lg:flex",
        collapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-10 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-[#D4A574]/25 bg-[#02120e] text-[#D4A574] shadow-[0_0_15px_rgba(212,165,116,0.15)] transition-all hover:scale-110 hover:border-[#D4A574]/50"
      >
        {collapsed ? (
          <ChevronRightIcon className="h-4 w-4" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4" />
        )}
      </button>

      <div className="flex flex-1 flex-col overflow-hidden">
        <Link href="/" className={cn(
          "group relative flex items-center gap-3 rounded-2xl border border-[#D4A574]/10 bg-gradient-to-br from-[#1B4D3E]/20 to-transparent transition-all duration-300 hover:border-[#D4A574]/30",
          collapsed ? "px-2 py-4 justify-center" : "px-4 py-4"
        )}>
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#D4A574] to-[#C85A3A] text-sm font-bold text-[#02120e] shadow-[0_4px_20px_rgba(212,165,116,0.3)] transition-transform group-hover:scale-105">
            EN
            <span className="absolute -inset-1 rounded-xl bg-gradient-to-br from-[#D4A574] to-[#C85A3A] opacity-20 blur-sm" />
          </span>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col"
            >
              <p className="text-xl font-black tracking-tighter text-[#f5f5f0]">envii</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A574]/60">Secure Envs</p>
            </motion.div>
          )}
        </Link>

        <div className={cn(
          "mt-6 flex items-center rounded-2xl border border-[#D4A574]/5 bg-[#02120e]/60 px-3 py-2.5",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#a8b3af]">System Live</span>
            </div>
          )}
          <button className="group relative rounded-full border border-[#D4A574]/10 p-2 text-[#a8b3af] transition-all hover:bg-[#1B4D3E]/40 hover:text-[#f5f5f0]">
            <BellIcon className="h-4 w-4 transition-transform group-hover:rotate-12" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#C85A3A] ring-2 ring-[#02120e]" />
          </button>
        </div>

        <nav className="mt-6 space-y-2">
          {links.map((link) => {
            const active = isActivePath(pathname, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={collapsed ? link.label : ""}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border transition-all duration-300",
                  collapsed ? "justify-center p-3.5" : "px-4 py-3",
                  active
                    ? "border-[#D4A574]/30 bg-[#1B4D3E]/40 text-[#f5f5f0] shadow-[0_4px_15px_rgba(27,77,62,0.2)]"
                    : "border-transparent bg-transparent text-[#a8b3af] hover:bg-[#1B4D3E]/15 hover:text-[#f5f5f0]",
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0 transition-all duration-300", 
                  active ? "text-[#D4A574] scale-110" : "text-[#8d9a95] group-hover:text-[#f5f5f0] group-hover:scale-110")} 
                />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm font-bold tracking-tight"
                  >
                    {link.label}
                  </motion.span>
                )}
                {active && !collapsed && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D4A574] shadow-[0_0_8px_rgba(212,165,116,0.6)]"
                  />
                )}
                {active && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute inset-0 rounded-xl bg-[#D4A574]/5 blur-md"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex w-full flex-col space-y-4 overflow-hidden pt-4">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="group relative w-full overflow-hidden rounded-[1.5rem] border border-[#D4A574]/20 bg-gradient-to-br from-[#1B4D3E]/30 via-[#02120e]/60 to-transparent p-4 transition-all hover:border-[#D4A574]/40"
              >
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#D4A574]/10 blur-2xl transition-all group-hover:bg-[#D4A574]/20" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#D4A574]/10">
                      <ShieldCheckIcon className="h-3.5 w-3.5 text-[#D4A574]" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#D4A574]">
                      Security
                    </p>
                  </div>
                  <p className="mt-3 text-[11px] font-medium leading-relaxed text-[#f5f5f0]">
                    Your environment variables are <span className="text-[#D4A574]">AES-256</span> encrypted and PIN protected.
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#D4A574]/10 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      <span className="text-[9px] font-bold uppercase text-[#a8b3af]">Vault Active</span>
                    </div>
                    <span className="rounded-full bg-[#D4A574]/10 px-2 py-0.5 text-[8px] font-black text-[#D4A574]">MOD-4</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className={cn(
            "flex w-full items-center gap-3 transition-all",
            collapsed ? "flex-col justify-center py-2 px-0" : "justify-between px-2"
          )}>
            <div className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
              <ThemeToggle />
              {!collapsed && (
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-[#f5f5f0]">Theme</p>
                  <p className="text-[9px] text-[#a8b3af]">System synced</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="rounded-full bg-[#1B4D3E]/20 px-2 py-1 border border-[#D4A574]/10 shrink-0">
                <p className="text-[10px] font-black text-[#D4A574]">v1.2.0</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
