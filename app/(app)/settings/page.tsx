import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSession } from "@/lib/auth";
import type { AiProviderId, BillingModeId, PlanId } from "@/lib/constants";
import { AI_PROVIDERS, BILLING_MODES, PLANS } from "@/lib/constants";
import { isPast } from "@/lib/format";
import { signedUrls } from "@/lib/storage";
import { AiBillingSettings } from "./ai-billing-settings";
import { AccountForms, MemberManager, OfficeInfo } from "./settings-forms";

export const metadata: Metadata = { title: "설정" };

const TABS = ["office", "members", "account", "subscription"] as const;

function asProvider(v: string | null): AiProviderId | null {
  return AI_PROVIDERS.some((p) => p.id === v) ? (v as AiProviderId) : null;
}

function asBillingMode(v: string | null): BillingModeId | null {
  return BILLING_MODES.some((m) => m.id === v) ? (v as BillingModeId) : null;
}

function asPlanId(v: string | null | undefined): PlanId {
  return PLANS.some((p) => p.id === v) ? (v as PlanId) : "free";
}

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const { tab } = await searchParams;
  const { supabase, profile, office } = await getSession();
  const isOwner = profile.role === "owner";
  const defaultTab = TABS.includes(tab as (typeof TABS)[number]) ? (tab as string) : "office";

  const [{ data: members }, { data: invites }, guaranteeUrls] = await Promise.all([
    supabase.from("profiles").select("id, name, email, phone, role, active, verification_status, created_at").order("created_at"),
    isOwner
      ? supabase.from("office_invites").select("id, email, role, token, expires_at, accepted_at").is("accepted_at", null).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    office.guarantee_certificate_path
      ? signedUrls(supabase, "office-docs", [office.guarantee_certificate_path])
      : Promise.resolve({} as Record<string, string>),
  ]);
  const guaranteeDownloadUrl = office.guarantee_certificate_path
    ? (guaranteeUrls[office.guarantee_certificate_path] ?? null)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="설정" description="사무소 정보, 구성원, 계정과 구독을 관리해요." />
      <Tabs key={defaultTab} defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="office">사무소 정보</TabsTrigger>
          <TabsTrigger value="members">구성원</TabsTrigger>
          <TabsTrigger value="account">계정</TabsTrigger>
          <TabsTrigger value="subscription">AI·요금</TabsTrigger>
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
              <OfficeInfo office={office} isOwner={isOwner} guaranteeDownloadUrl={guaranteeDownloadUrl} />
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

        <TabsContent value="subscription" className="pt-4">
          <AiBillingSettings
            isOwner={isOwner}
            aiProvider={asProvider(office.ai_provider)}
            billingMode={asBillingMode(office.billing_mode)}
            planId={asPlanId(office.plan_id)}
            creditBalance={office.ai_credit_balance ?? 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
