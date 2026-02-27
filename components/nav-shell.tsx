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
  LogOutIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UserIcon,
  MenuIcon,
  XIcon,
} from "@/components/ui/icons";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
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
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (mode === "top") {
    return (
      <header className="sticky top-2 z-40 lg:hidden sm:top-3">
        <div className="rounded-xl border border-[#D4A574]/20 bg-[#02120e]/90 p-2 shadow-[0_12px_48px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:rounded-2xl sm:p-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 text-[#D4A574] hover:bg-[#1B4D3E]/20 sm:hidden"
                onClick={() => setIsOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
              <Link href="/" className="text-xl font-black tracking-tight text-[#f5f5f0] sm:text-2xl">
                Envvy
              </Link>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/signup" className="hidden xs:block sm:block">
                <Button size="sm" className="bg-gradient-to-br from-[#c8854a] to-[#a03020] text-white border border-white/20 shadow-[0_8px_24px_rgba(200,90,58,0.35)] font-bold text-[9px] uppercase tracking-widest px-3 sm:text-[10px] sm:px-4 transition-all hover:scale-105 active:scale-95">
                  Get Started
                </Button>
              </Link>
              <button className="relative rounded-full border border-[#D4A574]/15 p-1.5 text-[#a8b3af] transition hover:bg-[#1B4D3E]/30 hover:text-[#f5f5f0] sm:p-2">
                <BellIcon className="h-3.5 w-3.5 sm:h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#C85A3A] sm:right-2 sm:top-2" />
              </button>
              <ThemeToggle />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="h-8 w-8 border-[#D4A574]/25 bg-[#02120e]/40 text-[#f5f5f0] hover:bg-[#1B4D3E]/40 hover:text-[#f5f5f0] sm:h-9 sm:w-9"
              >
                <LogOutIcon className="h-3.5 w-3.5 sm:h-4 w-4" />
              </Button>
            </div>
          </div>

          <nav className="no-scrollbar mt-3 hidden gap-1.5 overflow-x-auto pb-1 sm:flex sm:mt-4 sm:gap-2">
            {links.map((link) => {
              const active = isActivePath(pathname, link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all sm:rounded-xl sm:px-3.5 sm:py-2 sm:text-xs",
                    active
                      ? "border-[#D4A574]/40 bg-[#1B4D3E]/50 text-[#f5f5f0] shadow-sm"
                      : "border-transparent bg-[#02120e]/40 text-[#a8b3af] hover:border-[#D4A574]/20 hover:text-[#f5f5f0]",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 sm:h-4 w-4", active ? "text-[#D4A574]" : "text-[#8d9a95]")} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm sm:hidden"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-[60] w-[280px] border-r border-[#D4A574]/15 bg-[#02120e] p-6 shadow-2xl sm:hidden"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <Link href="/" className="text-2xl font-black tracking-tighter text-[#f5f5f0]">
                      Envvy
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#8d9a95] hover:text-[#f5f5f0]"
                      onClick={() => setIsOpen(false)}
                    >
                      <XIcon className="h-6 w-6" />
                    </Button>
                  </div>

                  <nav className="flex-1 space-y-2">
                    {links.map((link) => {
                      const active = isActivePath(pathname, link.href);
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            "flex items-center gap-4 rounded-xl border px-4 py-3.5 text-sm font-bold tracking-tight transition-all",
                            active
                              ? "border-[#D4A574]/30 bg-[#1B4D3E]/40 text-[#f5f5f0] shadow-lg"
                              : "border-transparent text-[#a8b3af] hover:bg-[#1B4D3E]/15 hover:text-[#f5f5f0]",
                          )}
                        >
                          <Icon className={cn("h-5 w-5", active ? "text-[#D4A574]" : "text-[#8d9a95]")} />
                          {link.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="mt-auto space-y-4 pt-6 border-t border-[#D4A574]/10">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/5 p-4">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/80">System Live</span>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={() => void handleLogout()}
                      disabled={isLoggingOut}
                      className="w-full justify-start gap-3 border border-[#D4A574]/15 bg-[#02120e]/40 px-4 py-3.5 text-sm font-black uppercase tracking-widest text-[#C85A3A] hover:bg-[#C85A3A]/10"
                    >
                      <LogOutIcon className="h-5 w-5" />
                      {isLoggingOut ? "..." : "Logout"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    );
  }

  return (
    <aside 
      className={cn(
        "no-scrollbar sticky top-0 hidden h-screen flex-col overflow-y-auto border-r border-[#D4A574]/15 bg-[#02120e]/85 p-4 shadow-[0_16px_64px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] lg:flex",
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

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className={cn(
              "flex items-center transition-all duration-500 ease-in-out",
              collapsed ? "justify-center" : "px-2 gap-3",
            )}
          >
            {collapsed ? (
              <span className="text-2xl font-black tracking-tighter text-[#D4A574]">
                E
              </span>
            ) : (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-black tracking-tighter text-[#f5f5f0]"
              >
                Envvy
              </motion.span>
            )}
          </Link>

          <div className={cn(
            "flex items-center gap-2 rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/5 p-2 transition-all",
            collapsed ? "flex-col" : "justify-between"
          )}>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
              </div>
              {!collapsed && <span className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]/80">System Live</span>}
            </div>
            <button className="relative rounded-lg p-1.5 text-[#8d9a95] transition hover:bg-[#1B4D3E]/20 hover:text-[#f5f5f0]">
              <BellIcon className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#C85A3A]" />
            </button>
          </div>
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

        <div className="mt-auto flex w-full flex-col space-y-4 pt-4">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="group relative w-full overflow-hidden rounded-2xl border border-[#D4A574]/20 bg-gradient-to-br from-[#1B4D3E]/30 via-[#02120e]/60 to-transparent p-4 transition-all hover:border-[#D4A574]/40"
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
                    Your environment variables are <span className="text-[#D4A574]">AES-256</span> encrypted.
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
            "flex w-full items-center gap-2 transition-all",
            collapsed ? "flex-col py-2" : "justify-between px-1"
          )}>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              title={collapsed ? "Logout" : undefined}
              className={cn(
                "group flex items-center rounded-xl border border-[#D4A574]/15 bg-[#02120e]/40 text-[#a8b3af] transition-all hover:border-[#C85A3A]/45 hover:bg-[#C85A3A]/10 hover:text-[#f5f5f0] disabled:cursor-not-allowed disabled:opacity-60",
                collapsed ? "h-10 w-10 justify-center" : "flex-1 gap-3 px-4 py-2.5",
              )}
            >
              <LogOutIcon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110",
                  collapsed ? "text-[#D4A574]" : "text-[#C85A3A]",
                )}
              />
              {!collapsed && (
                <span className="text-[11px] font-black uppercase tracking-widest">{isLoggingOut ? "..." : "Logout"}</span>
              )}
            </button>

            {!collapsed && (
              <div className="flex items-center gap-2 rounded-xl border border-[#D4A574]/15 bg-[#02120e]/40 p-1">
                <ThemeToggle />
              </div>
            )}
            
            {collapsed && (
              <div className="flex flex-col gap-2 items-center">
                <ThemeToggle />
                <div className="h-px w-6 bg-[#D4A574]/10" />
                <div className="rounded-full bg-[#1B4D3E]/20 p-1 border border-[#D4A574]/10 shrink-0">
                  <p className="text-[8px] font-black text-[#D4A574]">v1.2</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
