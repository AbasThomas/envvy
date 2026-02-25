"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  CopyIcon, 
  ExternalLinkIcon, 
  GithubIcon, 
  GlobeIcon, 
  KeyRoundIcon, 
  MailIcon, 
  MapPinIcon, 
  MessageSquareIcon,
  SaveIcon, 
  ShieldCheckIcon, 
  SparklesIcon, 
  StarIcon, 
  UsersIcon, 
  ZapIcon,
  UserIcon,
  FolderGit2Icon,
  HistoryIcon,
  CreditCardIcon,
  LinkIcon,
  CalendarIcon
} from "@/components/ui/icons";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

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
  const stats = profileQuery.data?.stats;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="app-page space-y-6 pb-20 sm:space-y-10"
    >
      {/* Hero Header */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#D4A574]">
          <div className="h-1 w-8 rounded-full bg-gradient-to-r from-[#D4A574] to-transparent" />
          <span>Creator Hub</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-[#f5f5f0] sm:text-5xl lg:text-6xl">
          Creator <span className="text-[#D4A574]">Profile</span>
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#a8b3af] font-medium sm:text-lg">
          Manage your public identity, team-facing details, and community contributions.
        </p>
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Profile Card */}
        <Card className="glass relative overflow-hidden border-[#D4A574]/20 bg-[#02120e]/60">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4A574]/5 blur-3xl" />
          <CardHeader className="relative z-10 border-b border-[#D4A574]/10 pb-6 sm:pb-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start sm:gap-3">
              <div className="flex items-start gap-4 sm:space-y-4 sm:block">
                <div className="relative group h-16 w-16 overflow-hidden rounded-xl border-2 border-[#D4A574]/20 bg-[#1B4D3E]/20 transition-all hover:border-[#D4A574]/40 sm:h-24 sm:w-24 sm:rounded-2xl">
                  {profile?.image ? (
                    <img 
                      src={profile.image} 
                      alt={profile.name ?? "Profile"} 
                      className="h-full w-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#D4A574]">
                      <UserIcon className="h-6 w-6 sm:h-10 sm:w-10" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
                    <SparklesIcon className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-0">
                  <h3 className="text-xl font-black tracking-tight text-[#f5f5f0] sm:text-2xl">{profile?.name || "Dev Ghost"}</h3>
                  <p className="text-xs text-[#a8b3af] sm:text-sm">{profile?.email}</p>
                </div>
              </div>
              <Badge className="bg-gradient-to-br from-[#D4A574] to-[#C85A3A] text-[9px] font-black uppercase tracking-widest text-[#02120e] shadow-lg shadow-[#D4A574]/10 sm:text-[10px]">
                {profile?.planTier ?? "FREE"}
              </Badge>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2 sm:mt-8 sm:gap-4">
              {[
                { label: "Repos", value: stats?.repos ?? 0, icon: FolderGit2Icon },
                { label: "Stars", value: stats?.stars ?? 0, icon: StarIcon },
                { label: "Followers", value: stats?.followers ?? 0, icon: UsersIcon },
                { label: "Following", value: stats?.following ?? 0, icon: UsersIcon },
              ].map((stat) => (
                <div key={stat.label} className="text-center space-y-0.5 sm:space-y-1">
                  <div className="flex justify-center">
                    <stat.icon className="h-3 w-3 text-[#D4A574]/60 sm:h-3.5 sm:w-3.5" />
                  </div>
                  <p className="text-base font-black text-[#f5f5f0] sm:text-lg">{stat.value}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-[#8d9a95] sm:text-[9px]">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6 pt-6 sm:pt-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">
                  <UserIcon className="h-3 w-3" />
                  Display Name
                </label>
                <Input
                  defaultValue={profile?.name ?? ""}
                  placeholder="e.g. Satoshi Nakamoto"
                  className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 focus:ring-[#D4A574]/30"
                  onBlur={(event) => updateMutation.mutate({ name: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">
                  <MessageSquareIcon className="h-3 w-3" />
                  Bio
                </label>
                <Textarea
                  defaultValue={profile?.bio ?? ""}
                  placeholder="Tell the community about your secure stack..."
                  className="min-h-[100px] border-[#D4A574]/15 bg-[#02120e]/80 focus:ring-[#D4A574]/30"
                  onBlur={(event) => updateMutation.mutate({ bio: event.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">
                  <LinkIcon className="h-3 w-3" />
                  Avatar URL
                </label>
                <Input
                  defaultValue={profile?.image ?? ""}
                  placeholder="https://..."
                  className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 focus:ring-[#D4A574]/30"
                  onBlur={(event) => updateMutation.mutate({ image: event.target.value })}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#D4A574]/10 bg-[#1B4D3E]/5 p-4 space-y-2 sm:rounded-2xl sm:p-5 sm:space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-[#D4A574]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A574]">Privacy Tip</p>
              </div>
              <p className="text-xs leading-relaxed text-[#a8b3af]">
                Your email remains private and is only visible to you. Only your display name, bio, and avatar are public.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Referrals Card */}
        <Card className="glass relative overflow-hidden border-[#D4A574]/20 bg-[#02120e]/60">
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#1B4D3E]/10 blur-3xl" />
          <CardHeader className="relative z-10 border-b border-[#D4A574]/10 pb-6 sm:pb-8">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#D4A574]">
              <ZapIcon className="h-4 w-4" />
              Referral Program
            </div>
            <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#f5f5f0] sm:text-3xl">Earn <span className="text-[#D4A574]">Credits</span></CardTitle>
            <CardDescription className="text-sm text-[#a8b3af] sm:text-base">
              Earn $1 equivalent credit for every developer who joins through your link.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6 pt-6 sm:space-y-8 sm:pt-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">Your Invitation Link</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input 
                  readOnly 
                  value={referralQuery.data?.referralUrl ?? ""} 
                  className="h-11 border-[#D4A574]/15 bg-[#02120e]/80 font-mono text-xs focus:ring-0 sm:h-12"
                />
                <Button
                  className="group h-11 flex items-center gap-2 px-6 bg-[#1B4D3E]/30 border border-[#D4A574]/20 text-[#f5f5f0] hover:bg-[#1B4D3E]/50 transition-all active:scale-95 sm:h-12"
                  onClick={() => {
                    navigator.clipboard.writeText(referralQuery.data?.referralUrl ?? "");
                    toast.success("Referral URL copied");
                  }}
                >
                  <CopyIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Copy</span>
                </Button>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center justify-between rounded-xl border border-[#D4A574]/15 bg-[#02120e]/40 px-5 py-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8d9a95]">Balance</p>
                    <p className="text-2xl font-black text-emerald-400">${referralQuery.data?.referralCredits ?? 0}.00</p>
                  </div>
                  <CreditCardIcon className="h-8 w-8 text-[#D4A574]/20" />
                </div>
                <Button className="h-12 flex-1 bg-gradient-to-br from-[#D4A574] to-[#C85A3A] font-black uppercase tracking-widest text-[#02120e] shadow-lg shadow-[#D4A574]/10 transition-all hover:scale-[1.02] active:scale-[0.98] sm:h-14">
                  Redeem Now
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4A574]/70">
                <UsersIcon className="h-3 w-3" />
                Recent Referrals
              </label>
              <div className="space-y-3">
                {referralQuery.data?.referredUsers.length ? (
                  referralQuery.data.referredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="group flex items-center justify-between rounded-xl border border-[#D4A574]/10 bg-[#02120e]/40 p-4 transition-all hover:border-[#D4A574]/30 hover:bg-[#1B4D3E]/5 sm:rounded-2xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1B4D3E]/20 text-[#D4A574]">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#f5f5f0] line-clamp-1">{user.email}</p>
                          <div className="flex items-center gap-2 text-[10px] text-[#8d9a95]">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="muted" className="bg-[#02120e]/60 font-black text-[10px] whitespace-nowrap">{user.planTier}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 border-2 border-dashed border-[#D4A574]/10 rounded-2xl sm:py-12">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B4D3E]/20 text-[#4d6d62] sm:h-12 sm:w-12">
                      <UsersIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-[#f5f5f0]">No referrals yet</p>
                      <p className="text-xs text-[#8d9a95]">Invite your team to start earning credits.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
