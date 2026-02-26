"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, EyeIcon, EyeOffIcon, GithubIcon, KeyRoundIcon, MailIcon, RefreshCwIcon, ShieldCheckIcon } from "@/components/ui/icons";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      const callbackUrl = isSignup ? "/onboarding" : nextPath;
      const credentialsPayload: {
        email: string;
        redirect: false;
        callbackUrl: string;
        password?: string;
        pin?: string;
      } = {
        email: values.email,
        redirect: false,
        callbackUrl,
      };
      if (isSignup || loginMethod === "password") {
        credentialsPayload.password = values.password;
      }
      if (!isSignup && loginMethod === "pin") {
        credentialsPayload.pin = values.pin;
      }

      const result = await signIn("credentials", credentialsPayload);

      if (!result || result.error) {
        throw new Error(result?.error ?? "Could not sign in");
      }

      if (isSignup) {
        toast.success("Account created");
        router.replace(result.url ?? "/onboarding");
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
      router.replace(redirectPath);
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
    <div className="mx-auto flex min-h-[80vh] w-full max-w-6xl items-center justify-center py-12">
      <div className="relative grid w-full gap-8 md:grid-cols-[1.1fr_0.9fr]">
        {/* Background decorative elements */}
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[#D4A574]/5 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[#1B4D3E]/10 blur-3xl" />

        <div className="flex flex-col justify-center space-y-8 pr-4">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center">
              <span className="text-3xl font-black tracking-tighter text-[#f5f5f0]">Envii</span>
            </Link>
            <h1 className="text-5xl font-black tracking-tight text-[#f5f5f0] lg:text-6xl">
              {isSignup ? (
                <>
                  Start your <span className="text-[#D4A574]">secure</span> journey.
                </>
              ) : (
                <>
                  Welcome back to the <span className="text-[#D4A574]">vault</span>.
                </>
              )}
            </h1>
            <p className="text-lg leading-relaxed text-[#a8b3af]">
              {isSignup
                ? "Join thousands of developers versioning their environment variables with AES-256 encryption and zero-knowledge architecture."
                : "Your encrypted environment backups and team workspace are waiting for your secure access."}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: ShieldCheckIcon, label: "AES-256 Encrypted", color: "text-emerald-400" },
              { icon: KeyRoundIcon, label: "PIN Protected", color: "text-[#D4A574]" },
              { icon: GithubIcon, label: "GitHub Integrated", color: "text-blue-400" },
              { icon: MailIcon, label: "Team Sharing", color: "text-purple-400" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#D4A574]/10 bg-[#1B4D3E]/5 p-4 transition-colors hover:border-[#D4A574]/20">
                <item.icon className={cn("h-5 w-5", item.color)} />
                <span className="text-sm font-bold text-[#f5f5f0]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="glass relative z-10 overflow-hidden border-[#D4A574]/20 bg-[#02120e]/60 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B4D3E]/5 via-transparent to-transparent" />
          
          <CardHeader className="relative space-y-1 pb-8 pt-8 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isSignup ? "Create Account" : "Secure Login"}
            </CardTitle>
            <CardDescription className="text-sm font-medium text-[#a8b3af]">
              {isSignup ? "Get started with your free developer account" : "Enter your credentials to access your vault"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative space-y-6 px-8 pb-10">
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-4">
                {isSignup && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4A574]">Full Name</label>
                    <Input 
                      placeholder="John Doe" 
                      className="bg-[#02120e]/80 border-[#D4A574]/15 focus:ring-[#D4A574]/30 h-11"
                      {...form.register("name")} 
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4A574]">Email Address</label>
                  <Input 
                    placeholder="you@example.com" 
                    className="bg-[#02120e]/80 border-[#D4A574]/15 focus:ring-[#D4A574]/30 h-11"
                    {...form.register("email")} 
                  />
                </div>

                {!isSignup && (
                  <div className="flex gap-2 p-1 rounded-xl bg-[#02120e]/80 border border-[#D4A574]/10">
                    <button
                      type="button"
                      className={cn(
                        "flex-1 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                        loginMethod === "password"
                          ? "bg-[#D4A574] text-[#02120e] shadow-lg"
                          : "text-[#a8b3af] hover:text-[#f5f5f0]"
                      )}
                      onClick={() => setLoginMethod("password")}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "flex-1 rounded-lg py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                        loginMethod === "pin"
                          ? "bg-[#D4A574] text-[#02120e] shadow-lg"
                          : "text-[#a8b3af] hover:text-[#f5f5f0]"
                      )}
                      onClick={() => setLoginMethod("pin")}
                    >
                      6-Digit PIN
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4A574]">
                      {isSignup || loginMethod === "password" ? "Secure Password" : "6-Digit CLI PIN"}
                    </label>
                    {!isSignup && loginMethod === "password" && (
                      <Link href="#" className="text-[10px] font-bold text-[#a8b3af] hover:text-[#D4A574] transition-colors">
                        Forgot Password?
                      </Link>
                    )}
                  </div>
                  {isSignup || loginMethod === "password" ? (
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password"
                        className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 pr-11 focus:ring-[#D4A574]/30"
                        {...form.register("password")}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-3 inline-flex items-center text-[#a8b3af] transition-colors hover:text-[#f5f5f0]"
                      >
                        {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : (
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 text-center text-xl font-black tracking-[0.5em] focus:ring-[#D4A574]/30"
                      {...form.register("pin")}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, "").slice(0, 6);
                        form.setValue("pin", value, { shouldValidate: true, shouldDirty: true });
                      }}
                    />
                  )}
                </div>

                {isSignup && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4A574]">Confirm Password</label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm password"
                          className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 pr-11 focus:ring-[#D4A574]/30"
                          {...form.register("confirmPassword")}
                        />
                        <button
                          type="button"
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          className="absolute inset-y-0 right-3 inline-flex items-center text-[#a8b3af] transition-colors hover:text-[#f5f5f0]"
                        >
                          {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4A574]">Referral Code (Optional)</label>
                      <Input 
                        placeholder="REF-XXXX" 
                        className="bg-[#02120e]/80 border-[#D4A574]/15 focus:ring-[#D4A574]/30 h-11"
                        {...form.register("referralCode")} 
                      />
                    </div>
                    <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-[#D4A574]/10 bg-[#1B4D3E]/5 p-4 transition-colors hover:bg-[#1B4D3E]/10">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-[#D4A574]/30 bg-transparent accent-[#D4A574]"
                        {...form.register("termsAccepted")}
                      />
                      <span className="text-xs font-medium leading-relaxed text-[#a8b3af] group-hover:text-[#f5f5f0]">
                        I agree to the <Link href="#" className="text-[#D4A574] hover:underline">Terms of Service</Link> and <Link href="#" className="text-[#D4A574] hover:underline">Privacy Policy</Link>.
                      </span>
                    </label>
                  </>
                )}
              </div>

              <Button 
                className="group w-full h-12 bg-gradient-to-r from-[#D4A574] to-[#C85A3A] text-[#02120e] font-black uppercase tracking-widest shadow-xl shadow-[#D4A574]/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCwIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {isSignup ? "Create Secure Account" : "Unlock My Vault"}
                    <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#D4A574]/10" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest">
                <span className="bg-[#02120e] px-4 text-[#4d6d62]">New to envii?</span>
              </div>
            </div>

            <Link href={alternateHref} className="block text-center">
              <button className="text-sm font-bold text-[#a8b3af] hover:text-[#D4A574] transition-colors">
                {isSignup ? "Already have an account? Log In" : "Don't have an account? Sign Up Free"}
              </button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
