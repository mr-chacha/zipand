import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ComingSoonBadge } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "@/lib/auth";
import { PLANS } from "@/lib/constants";
import { isPast } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AccountForms, MemberManager, OfficeInfo } from "./settings-forms";

export const metadata: Metadata = { title: "설정" };

const TABS = ["office", "members", "account", "subscription"] as const;

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const { tab } = await searchParams;
  const { supabase, profile, office } = await getSession();
  const isOwner = profile.role === "owner";
  const defaultTab = TABS.includes(tab as (typeof TABS)[number]) ? (tab as string) : "office";

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase.from("profiles").select("id, name, email, phone, role, active, verification_status, created_at").order("created_at"),
    isOwner
      ? supabase.from("office_invites").select("id, email, role, token, expires_at, accepted_at").is("accepted_at", null).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="설정" description="사무소 정보, 구성원, 계정과 구독을 관리해요." />
      <Tabs key={defaultTab} defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="office">사무소 정보</TabsTrigger>
          <TabsTrigger value="members">구성원</TabsTrigger>
          <TabsTrigger value="account">계정</TabsTrigger>
          <TabsTrigger value="subscription">구독·결제</TabsTrigger>
        </TabsList>

        <TabsContent value="office" className="pt-4">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>사무소 정보</CardTitle>
              <CardDescription>
                {isOwner ? "공공데이터에서 조회해 등록한 사무소 정보예요. 고객 브리핑의 연락처에 표시돼요." : "사무소 정보는 대표만 등록할 수 있어요."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OfficeInfo office={office} isOwner={isOwner} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="pt-4">
          <MemberManager
            members={members ?? []}
            invites={(invites ?? []).map((i) => ({ ...i, expired: isPast(i.expires_at) }))}
            currentUserId={profile.id}
            isOwner={isOwner}
            siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
            inviteBlocked={office.registered_at === null}
          />
        </TabsContent>

        <TabsContent value="account" className="pt-4">
          <AccountForms profile={profile} />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                현재 플랜: Free
                <ComingSoonBadge />
              </CardTitle>
              <CardDescription>결제 서비스 준비중이에요. 출시 전까지 모든 기본 기능을 무료로 사용할 수 있어요.</CardDescription>
            </CardHeader>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((plan) => (
              <Card key={plan.id} className={cn(plan.id === "free" && "ring-2 ring-primary")}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {plan.name}
                    {plan.id === "free" && <Badge>사용 중</Badge>}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">
                    {plan.price === 0 ? "무료" : `${plan.price.toLocaleString("ko-KR")}원`}
                    {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground"> /월</span>}
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="size-4 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
