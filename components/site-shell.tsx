"use client";

import { usePathname } from "next/navigation";

import { NavShell } from "@/components/nav-shell";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding");

  if (isLanding) {
    return <main className="w-full">{children}</main>;
  }

  if (isAuthPage) {
    return <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">{children}</main>;
  }

  return (
    <div className="flex min-h-screen w-full bg-[#02120e]">
      <NavShell mode="sidebar" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="px-2 pt-2 sm:px-4 sm:pt-4 lg:hidden">
          <NavShell mode="top" />
        </div>
        <main className="mx-auto w-full min-w-0 max-w-[1400px] flex-1 px-2 pb-8 pt-4 sm:px-6 sm:pb-12 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
