"use client";

import { motion } from "framer-motion";
import {
  BellIcon,
  BoltIcon,
  CompassIcon,
  FolderGit2Icon,
  HomeIcon,
  SettingsIcon,
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
];

export function NavShell() {
  const pathname = usePathname();

  return (
    <header className="sticky top-4 z-40 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-[#D4A574]/20 bg-[#02120e]/70 shadow-[0_8px_36px_rgba(0,0,0,0.45)] backdrop-blur">
          <div className="flex items-center justify-between gap-4 p-3 pl-4 pr-3">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#D4A574] to-[#C85A3A] text-xs font-bold text-[#02120e]">
                EN
              </span>
              <div>
                <p className="font-semibold text-[#f5f5f0]">envii</p>
                <p className="text-xs text-[#a8b3af]">private env control</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => {
                const active =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/") ||
                  (link.href === "/repos" && pathname.startsWith("/repo/"));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#a8b3af] transition hover:text-[#f5f5f0]",
                      active ? "text-[#f5f5f0]" : "",
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId="active-nav-pill"
                        className="absolute inset-0 -z-10 rounded-lg bg-[#1B4D3E]/50"
                        transition={{ type: "spring", stiffness: 300, damping: 26 }}
                      />
                    ) : null}
                    <Icon className={cn("h-4 w-4", active ? "text-[#D4A574]" : "")} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Badge variant="muted">Private mode</Badge>
              <button className="rounded-full border border-[#D4A574]/20 p-2 text-[#a8b3af] transition hover:bg-[#1B4D3E]/35 hover:text-[#f5f5f0]">
                <BellIcon className="h-4 w-4" />
                <span className="sr-only">Notifications</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
