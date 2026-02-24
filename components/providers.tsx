"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

import { initPostHog } from "@/lib/posthog";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(2, 18, 14, 0.9)",
                color: "#f5f5f0",
                border: "1px solid rgba(212, 165, 116, 0.25)",
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
