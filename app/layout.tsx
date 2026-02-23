import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";

import { CommandPalette } from "@/components/command-palette";
import { NavShell } from "@/components/nav-shell";
import { Providers } from "@/components/providers";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

const heading = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
});

const body = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "envii | GitHub for environment variables",
    template: "%s | envii",
  },
  description:
    "Backup, version, share, and deploy encrypted env files with a CLI and collaborative dashboard.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${heading.variable} ${body.variable} antialiased`}>
        <Providers>
          <PWARegister />
          <div className="min-h-screen bg-app-background text-foreground">
            <NavShell />
            <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">{children}</main>
          </div>
          <CommandPalette />
        </Providers>
      </body>
    </html>
  );
}
