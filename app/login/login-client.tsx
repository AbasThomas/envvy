"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, GithubIcon, KeyRoundIcon, MailIcon, ShieldCheckIcon } from "lucide-react";
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
  name: z.string().trim().max(64).optional().or(z.literal("")),
  email: z.string().email(),
  password: z.string().optional().or(z.literal("")),
  pin: z.string().optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
  referralCode: z.string().trim().max(64).optional().or(z.literal("")),
  termsAccepted: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

type LoginClientProps = {
  nextPath: string;
  mode: "login" | "signup";
  defaultReferralCode?: string;
};

type CliPinStateResponse = {
  state: {
    hasCliPin: boolean;
    onboardingCompleted: boolean;
  };
};

export function LoginClient({ nextPath, mode, defaultReferralCode }: LoginClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"password" | "pin">("password");

  const isSignup = mode === "signup";

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      pin: "",
      confirmPassword: "",
      referralCode: defaultReferralCode ?? "",
      termsAccepted: false,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      if (isSignup) {
        const trimmedName = values.name?.trim();
        if (values.password !== values.confirmPassword) {
          throw new Error("Password confirmation does not match");
        }
        if (!values.password || values.password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
        if (!values.termsAccepted) {
          throw new Error("You must agree to terms and privacy");
        }

        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName || undefined,
            email: values.email,
            password: values.password,
            referralCode: values.referralCode?.trim() || undefined,
            termsAccepted: true,
          }),
        });
        const registerData = await registerResponse.json();
        if (!registerResponse.ok) {
          throw new Error(registerData.error ?? "Could not create account");
        }
      }

      if (!isSignup && loginMethod === "password") {
        if (!values.password || values.password.length < 8) {
          throw new Error("Enter your account password");
        }
      }
      if (!isSignup && loginMethod === "pin") {
        if (!/^\d{6}$/.test(values.pin ?? "")) {
          throw new Error("Enter your 6-digit PIN");
        }
      }

      const result = await signIn("credentials", {
        email: values.email,
        password: isSignup || loginMethod === "password" ? values.password : undefined,
        pin: !isSignup && loginMethod === "pin" ? values.pin : undefined,
        redirect: false,
      });

      if (!result || result.error) {
        throw new Error(result?.error ?? "Could not sign in");
      }

      if (isSignup) {
        toast.success("Account created");
        router.push("/onboarding");
        router.refresh();
        return;
      }

      let redirectPath = nextPath;
      try {
        const stateRes = await fetch("/api/auth/cli-pin");
        if (stateRes.ok) {
          const stateData = (await stateRes.json()) as CliPinStateResponse;
          if (!stateData.state.hasCliPin || !stateData.state.onboardingCompleted) {
            redirectPath = "/onboarding";
          }
        }
      } catch {
        redirectPath = nextPath;
      }

      toast.success("Signed in");
      router.push(redirectPath);
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
    <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-[1.08fr_0.92fr]">
      <Card className="glass border-[#D4A574]/20">
        <CardHeader>
          <CardTitle className="text-3xl">
            {isSignup ? "Create your envii account" : "Welcome back to envii"}
          </CardTitle>
          <CardDescription>
            {isSignup
              ? "Sign up, generate your CLI PIN, and start versioning env files securely."
              : "Log in to manage private repos, backups, team access, and deployment-safe history."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={onSubmit}>
            {isSignup ? <Input placeholder="Full name" {...form.register("name")} /> : null}
            <Input placeholder="you@example.com" {...form.register("email")} />
            {!isSignup ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    loginMethod === "password"
                      ? "border-[#D4A574]/50 bg-[#1B4D3E]/35 text-[#f5f5f0]"
                      : "border-[#D4A574]/20 bg-[#02120e]/55 text-[#a8b3af] hover:text-[#f5f5f0]"
                  }`}
                  onClick={() => setLoginMethod("password")}
                >
                  Password
                </button>
                <button
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    loginMethod === "pin"
                      ? "border-[#D4A574]/50 bg-[#1B4D3E]/35 text-[#f5f5f0]"
                      : "border-[#D4A574]/20 bg-[#02120e]/55 text-[#a8b3af] hover:text-[#f5f5f0]"
                  }`}
                  onClick={() => setLoginMethod("pin")}
                >
                  6-digit PIN
                </button>
              </div>
            ) : null}
            {isSignup || loginMethod === "password" ? (
              <Input type="password" placeholder="Password" {...form.register("password")} />
            ) : (
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit PIN"
                {...form.register("pin")}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                  form.setValue("pin", value, { shouldValidate: true, shouldDirty: true });
                }}
              />
            )}
            {isSignup ? (
              <>
                <Input
                  type="password"
                  placeholder="Confirm password"
                  {...form.register("confirmPassword")}
                />
                <Input placeholder="Referral code (optional)" {...form.register("referralCode")} />
                <label className="inline-flex items-start gap-2 text-xs text-[#a8b3af]">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-[#D4A574]"
                    {...form.register("termsAccepted")}
                  />
                  <span>I agree to the terms and privacy policy.</span>
                </label>
              </>
            ) : null}

            {!isSignup ? (
              <div className="flex items-center justify-between text-xs">
                <Link href="#" className="text-[#a8b3af] hover:text-[#D4A574]">
                  Forgot password?
                </Link>
                <button
                  type="button"
                  onClick={() =>
                    setLoginMethod((current) => (current === "password" ? "pin" : "password"))
                  }
                  className="inline-flex items-center gap-1 text-[#a8b3af] hover:text-[#D4A574]"
                >
                  <KeyRoundIcon className="h-3.5 w-3.5" />
                  {loginMethod === "password" ? "Use PIN instead" : "Use password instead"}
                </button>
              </div>
            ) : null}

            <Button className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" onClick={() => signIn("google", { callbackUrl: nextPath })}>
              <MailIcon className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" onClick={() => signIn("github", { callbackUrl: nextPath })}>
              <GithubIcon className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>

          <div className="pt-1 text-sm text-[#a8b3af]">
            {isSignup ? "Already have an account?" : "Need an account?"}{" "}
            <Link href={alternateHref} className="font-semibold text-[#D4A574] hover:text-[#f5f5f0]">
              {isSignup ? "Log in" : "Sign up"}
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="grid-bg border-[#D4A574]/15">
        <CardHeader>
          <CardTitle className="text-xl">Core workflow</CardTitle>
          <CardDescription>CLI-first with secure web management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[#c8d2ce]">
          <p className="inline-flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-[#D4A574]" />
            Every repo is private by default and protected with a repo PIN.
          </p>
          <pre className="overflow-auto rounded-lg bg-[#02120e]/80 p-3 text-xs text-[#a8b3af]">
{`envii login
envii login --pin
envii init my-awesome-app
envii add .env
envii commit -m "Rotate JWT secret"
envii push`}
          </pre>
          <p className="text-xs text-[#8d9a95]">
            After signup you will be redirected to onboarding to generate your 6-digit CLI PIN.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
