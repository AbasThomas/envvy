import { LoginClient } from "@/app/login/login-client";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const nextPath = params.next ?? "/dashboard";
  return <LoginClient nextPath={nextPath} mode="login" />;
}
