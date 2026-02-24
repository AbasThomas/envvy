"use client";

import { usePathname } from "next/navigation";

import { NavShell } from "@/components/nav-shell";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (isLanding) {
    return <main className="w-full">{children}</main>;
  }

  if (isAuthPage) {
    return <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">{children}</main>;
  }

  return (
    <>
      <NavShell />
      <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 md:px-6 md:pb-10 md:pt-8 lg:px-8">
        {children}
      </main>
    </>
  );
}
