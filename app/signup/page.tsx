import { LoginClient } from "@/app/login/login-client";

type Props = {
  searchParams: Promise<{ next?: string; ref?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = params.next ?? "/onboarding";
  const referralCode = params.ref;

  return (
    <LoginClient
      nextPath={nextPath}
      mode="signup"
      defaultReferralCode={referralCode}
    />
  );
}
