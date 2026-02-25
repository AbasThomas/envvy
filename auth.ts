import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PlanTier } from "@prisma/client";
import { compare } from "bcryptjs";
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withPrismaResilience } from "@/lib/prisma-resilience";

function createAuthApiToken() {
  return `${crypto.randomUUID().replace(/-/g, "")}${crypto.randomUUID().replace(/-/g, "")}`;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      planTier: PlanTier;
      apiToken: string | null;
    } & DefaultSession["user"];
  }
}

const optionalPasswordSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const normalized = value.trim();
    return normalized.length ? normalized : undefined;
  },
  z.string().min(8).optional(),
);

const optionalPinSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const normalized = value.trim();
    return normalized.length ? normalized : undefined;
  },
  z.string().regex(/^\d{6}$/).optional(),
);

const credentialSchema = z
  .object({
    email: z.string().email(),
    password: optionalPasswordSchema,
    pin: optionalPinSchema,
  })
  .refine((value) => Boolean(value.password || value.pin), {
    message: "Password or PIN is required",
  });

const providers: Array<ReturnType<typeof Credentials> | ReturnType<typeof Google> | ReturnType<typeof GitHub>> = [
  Credentials({
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      pin: { label: "PIN", type: "text" },
    },
    async authorize(rawCredentials) {
      const parsed = credentialSchema.safeParse(rawCredentials);
      if (!parsed.success) return null;

      return withPrismaResilience(
        "auth.authorize",
        async () => {
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email.toLowerCase() },
          });
          if (!user) return null;

          if (parsed.data.pin) {
            const pinRows = await prisma.$queryRaw<Array<{ cli_pin_hash: string | null }>>`
              SELECT "cli_pin_hash"
              FROM "User"
              WHERE "id" = ${user.id}
              LIMIT 1
            `;
            const pinHash = pinRows[0]?.cli_pin_hash ?? null;
            if (!pinHash) return null;
            const pinValid = await compare(parsed.data.pin, pinHash);
            if (!pinValid) return null;
          } else {
            if (!user.passwordHash || !parsed.data.password) return null;
            const passwordValid = await compare(parsed.data.password, user.passwordHash);
            if (!passwordValid) return null;
          }

          if (!user.apiToken) {
            const refreshed = await prisma.user.update({
              where: { id: user.id },
              data: { apiToken: createAuthApiToken() },
            });
            user.apiToken = refreshed.apiToken;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            planTier: user.planTier,
            apiToken: user.apiToken,
          };
        },
        null,
      );
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }) as ReturnType<typeof Google>,
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }) as ReturnType<typeof GitHub>,
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      const mutableToken = token as {
        id?: string;
        planTier?: PlanTier;
        apiToken?: string | null;
        email?: string | null;
      };

      if (user) {
        mutableToken.id = user.id;
        mutableToken.planTier = (user as { planTier?: PlanTier }).planTier ?? "FREE";
        mutableToken.apiToken = (user as { apiToken?: string | null }).apiToken ?? null;
      }

      if (!mutableToken.id && typeof mutableToken.email === "string") {
        const email = mutableToken.email;
        const dbUser = await withPrismaResilience(
          "auth.jwt.userLookup",
          () => prisma.user.findUnique({ where: { email } }),
          null,
        );
        if (dbUser) {
          mutableToken.id = dbUser.id;
          mutableToken.planTier = dbUser.planTier;
          mutableToken.apiToken = dbUser.apiToken;
        }
      }

      return mutableToken;
    },
    async session({ session, token }) {
      const mutableToken = token as {
        id?: string;
        planTier?: PlanTier;
        apiToken?: string | null;
      };
      if (session.user) {
        session.user.id = mutableToken.id ?? "";
        session.user.planTier = mutableToken.planTier ?? "FREE";
        session.user.apiToken = mutableToken.apiToken ?? null;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      const dbUser = await withPrismaResilience(
        "auth.events.signIn.findUser",
        () => prisma.user.findUnique({ where: { id: user.id } }),
        null,
      );
      if (!dbUser?.apiToken) {
        await withPrismaResilience(
          "auth.events.signIn.ensureToken",
          () =>
            prisma.user.update({
              where: { id: user.id },
              data: { apiToken: createAuthApiToken() },
            }),
          null,
        );
      }
    },
  },
});
