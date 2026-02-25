import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { rateLimit } from "@/lib/rate-limit";

const protectedPages = [
  "/dashboard",
  "/onboarding",
  "/repos",
  "/repo",
  "/editor",
  "/profile",
  "/settings",
  "/billing",
];

const protectedApiPrefixes = [
  "/api/repos",
  "/api/envs",
  "/api/social",
  "/api/share",
  "/api/notifications",
  "/api/analytics",
  "/api/referrals",
  "/api/billing/initialize",
  "/api/billing/verify",
  "/api/cli/repos",
  "/api/cli/backup",
  "/api/cli/restore",
];

const publicApiAllowlist = new Set([
  "/api/auth",
  "/api/repos/trending",
  "/api/repos/search",
  "/api/billing/plans",
  "/api/templates",
  "/api/webhooks/paystack",
  "/api/ai/suggestions",
]);

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const hasBearerAuth = req.headers.get("authorization")?.startsWith("Bearer ") ?? false;

  if (pathname.startsWith("/api/")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limit = rateLimit(`api:${ip}:${pathname}`, {
      max: pathname.startsWith("/api/cli/") ? 180 : 90,
      windowMs: 60_000,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfterMs: limit.retryAfterMs },
        { status: 429 },
      );
    }

    if ([...publicApiAllowlist].some((publicPath) => pathname.startsWith(publicPath))) {
      return NextResponse.next();
    }

    if (protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix)) && !token && !hasBearerAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  const isProtectedPage = protectedPages.some((page) => pathname.startsWith(page));
  if (isProtectedPage && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)"],
};
