"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/fetcher";

type ProfileResponse = {
  profile: {
    id: string;
    email: string;
    name: string | null;
    bio: string | null;
    image: string | null;
    planTier: string;
    referralCode: string;
  };
  stats: {
    repos: number;
    stars: number;
    followers: number;
    following: number;
  };
};

type ReferralResponse = {
  referralUrl: string;
  referralCredits: number;
  referredUsers: Array<{ id: string; email: string; planTier: string; createdAt: string }>;
};

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetcher<ProfileResponse>("/api/profile"),
  });
  const referralQuery = useQuery({
    queryKey: ["referrals"],
    queryFn: () => fetcher<ReferralResponse>("/api/referrals"),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { name?: string; bio?: string; image?: string }) =>
      fetcher("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  });

  const profile = profileQuery.data?.profile;

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="glass border-[#D4A574]/20">
        <CardHeader>
          <CardTitle>Creator Profile</CardTitle>
          <CardDescription>Manage your public identity and team-facing details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge>{profile?.planTier ?? "FREE"}</Badge>
            <Badge variant="muted">{profileQuery.data?.stats.repos ?? 0} repos</Badge>
            <Badge variant="muted">{profileQuery.data?.stats.followers ?? 0} followers</Badge>
            <Badge variant="muted">{profileQuery.data?.stats.following ?? 0} following</Badge>
          </div>
          <Input
            defaultValue={profile?.name ?? ""}
            placeholder="Display name"
            onBlur={(event) => updateMutation.mutate({ name: event.target.value })}
          />
          <Textarea
            defaultValue={profile?.bio ?? ""}
            placeholder="Bio"
            onBlur={(event) => updateMutation.mutate({ bio: event.target.value })}
          />
          <Input
            defaultValue={profile?.image ?? ""}
            placeholder="Avatar URL"
            onBlur={(event) => updateMutation.mutate({ image: event.target.value })}
          />
        </CardContent>
      </Card>

      <Card className="border-[#D4A574]/20 bg-[#02120e]/65">
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>Earn $1 equivalent credit for every successful invite.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input readOnly value={referralQuery.data?.referralUrl ?? ""} />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(referralQuery.data?.referralUrl ?? "");
                toast.success("Referral URL copied");
              }}
            >
              Copy invite link
            </Button>
            <Badge variant="success">{referralQuery.data?.referralCredits ?? 0} credits</Badge>
          </div>
          <div className="space-y-2">
            {referralQuery.data?.referredUsers.length ? (
              referralQuery.data.referredUsers.map((user) => (
                <div
                  key={user.id}
                  className="rounded-lg border border-[#D4A574]/15 bg-[#1B4D3E]/20 p-3 text-sm"
                >
                  <p className="text-[#f5f5f0]">{user.email}</p>
                  <p className="text-[#a8b3af]">
                    {user.planTier} - Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#a8b3af]">No referrals yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
