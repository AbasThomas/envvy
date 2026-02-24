"use client";

import { usePathname } from "next/navigation";

import { NavShell } from "@/components/nav-shell";

type SiteShellProps = {
  children: React.ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) {
    return <main className="w-full">{children}</main>;
  }

  return (
    <>
      <NavShell />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">{children}</main>
    </>
  );
}
