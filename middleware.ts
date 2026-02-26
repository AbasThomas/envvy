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

const AUTH_COOKIE_CANDIDATES = [
  "__Secure-authjs.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "next-auth.session-token",
] as const;

async function readSessionToken(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const forwardedProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const isHttpsRequest =
    req.nextUrl.protocol === "https:" ||
    forwardedProto === "https" ||
    process.env.NODE_ENV === "production";

  const defaultToken = await getToken({
    req,
    secret,
    secureCookie: isHttpsRequest,
  });
  if (defaultToken) return defaultToken;

  const fallbackToken = await getToken({
    req,
    secret,
    secureCookie: !isHttpsRequest,
  });
  if (fallbackToken) return fallbackToken;

  for (const cookieName of AUTH_COOKIE_CANDIDATES) {
    const explicitToken = await getToken({
      req,
      secret,
      cookieName,
      secureCookie: cookieName.startsWith("__Secure-"),
    });
    if (explicitToken) return explicitToken;
  }

  return null;
}

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const token = await readSessionToken(req);
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
