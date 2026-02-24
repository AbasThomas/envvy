"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, GithubIcon, MailIcon, UserPlusIcon } from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  name: z.string().trim().min(2).max(64).optional().or(z.literal("")),
  email: z.string().email(),
  password: z.string().min(8),
  referralCode: z.string().trim().max(64).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

type LoginClientProps = {
  nextPath: string;
  mode: "login" | "signup";
  defaultReferralCode?: string;
};

export function LoginClient({ nextPath, mode, defaultReferralCode }: LoginClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      referralCode: defaultReferralCode ?? "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      if (isSignup) {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name?.trim() || undefined,
            email: values.email,
            password: values.password,
            referralCode: values.referralCode?.trim() || undefined,
          }),
        });
        const registerData = await registerResponse.json();
        if (!registerResponse.ok) {
          throw new Error(registerData.error ?? "Could not create account");
        }
      }

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!result || result.error) {
        throw new Error(result?.error ?? "Could not sign in");
      }

      toast.success(isSignup ? "Account created" : "Signed in");
      router.push(nextPath);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  });

  const alternateHref = isSignup
    ? `/login?next=${encodeURIComponent(nextPath)}`
    : `/signup?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-[1.1fr_0.9fr]">
      <Card className="glass border-[#D4A574]/20">
        <CardHeader>
          <CardTitle className="text-3xl">{isSignup ? "Create your envii account" : "Welcome back to envii"}</CardTitle>
          <CardDescription>
            {isSignup
              ? "Set up your private repo workspace and secure every environment with a PIN."
              : "Sign in to manage private repos, backups, and deployment-safe env history."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={onSubmit}>
            {isSignup ? <Input placeholder="Your name" {...form.register("name")} /> : null}
            <Input placeholder="you@example.com" {...form.register("email")} />
            <Input type="password" placeholder="At least 8 characters" {...form.register("password")} />
            {isSignup ? (
              <Input placeholder="Referral code (optional)" {...form.register("referralCode")} />
            ) : null}
            <Button className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create account" : "Sign in with email"}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: nextPath })}
            >
              <MailIcon className="mr-2 h-4 w-4" />
              Continue with Google
            </Button>
            <Link href={alternateHref}>
              <Button variant="ghost" className="w-full">
                {isSignup ? (
                  <>
                    <GithubIcon className="mr-2 h-4 w-4" />
                    I already have an account
                  </>
                ) : (
                  <>
                    <UserPlusIcon className="mr-2 h-4 w-4" />
                    Create new account
                  </>
                )}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="grid-bg border-[#D4A574]/15">
        <CardHeader>
          <CardTitle className="text-xl">Private repo workflow</CardTitle>
          <CardDescription>How envii is set up for secure operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-[#c8d2ce]">
          <p>
            <kbd className="rounded bg-[#1B4D3E]/55 px-2 py-1 text-xs text-[#D4A574]">1</kbd> Create a private repo in dashboard
          </p>
          <p>
            <kbd className="rounded bg-[#1B4D3E]/55 px-2 py-1 text-xs text-[#D4A574]">2</kbd> Set a required 6-digit repo PIN
          </p>
          <p>
            <kbd className="rounded bg-[#1B4D3E]/55 px-2 py-1 text-xs text-[#D4A574]">3</kbd> Run <code>envii backup</code> from CLI
          </p>
          <p>
            <kbd className="rounded bg-[#1B4D3E]/55 px-2 py-1 text-xs text-[#D4A574]">4</kbd> Unlock repo with PIN before edits/deploys
          </p>
          <p className="pt-3 text-[#8d9a95]">
            Every repo is private by default, and all critical actions require repo PIN validation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
