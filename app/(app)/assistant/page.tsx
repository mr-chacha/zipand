import type { Metadata } from "next";
import Link from "next/link";
import { Bot, FileSearch, MessageSquareText, Mic, PenLine, Sparkles } from "lucide-react";
import { AiAccessBadge } from "@/components/ai/ai-access-badge";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAiAccess } from "@/lib/ai/access";
import { getSession } from "@/lib/auth";
import { AI_PROVIDERS, BILLING_MODES, PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "AI 실무 도우미" };

const features = [
  {
    icon: Mic,
    title: "AI 임장 정리",
    description: "현장 음성 메모를 받아쓰고 방향·채광·수리 필요 항목으로 정리해요.",
    href: "/properties",
    cta: "매물 → 임장 기록",
  },
  {
    icon: FileSearch,
    title: "문서 자동 추출",
    description: "등기·건축물대장 PDF에서 규칙 기반으로 핵심 항목을 추출해요. (AI 추출은 당분간 비활성)",
    href: "/documents",
    cta: "문서 관리",
  },
  {
    icon: Sparkles,
    title: "AI 브리핑 작성",
    description: "확인된 정보만으로 고객 맞춤 매물 설명을 작성해요.",
    href: "/properties",
    cta: "매물 → 고객 브리핑",
  },
  {
    icon: MessageSquareText,
    title: "상담 요약 · 문자 초안",
    description: "통화 녹음을 요약하고 고객에게 보낼 문자를 만들어요.",
    href: "/customers",
    cta: "고객 및 상담",
  },
  {
    icon: PenLine,
    title: "특약 추천",
    description: "거래 조건에 맞는 특약 초안을 추천해요. 문구는 반드시 검토하세요.",
    href: "/contracts",
    cta: "계약관리",
  },
  {
    icon: Bot,
    title: "광고 문구 · 주변 입지",
    description: "카카오 주변 장소를 조회해 AI 광고 문구와 확인설명서 입지 조건을 채워요.",
    href: "/properties",
    cta: "매물 관리",
  },
];

export default async function AssistantPage() {
  const { office } = await getSession();
  const available = hasAiAccess(office);
  const provider = AI_PROVIDERS.find((p) => p.id === office.ai_provider);
  const mode = BILLING_MODES.find((m) => m.id === office.billing_mode);
  const plan = PLANS.find((p) => p.id === office.plan_id) ?? PLANS[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI 실무 도우미"
        description="통화·임장·문서·브리핑·특약 초안을 한곳에서 안내해요. 결과는 항상 검토 후 사용하세요."
      />

      <div className="flex flex-wrap items-center gap-2">
        <AiAccessBadge available={available} />
        <Badge variant={provider ? "secondary" : "outline"}>
          <Sparkles data-icon="inline-start" />
          {provider ? provider.name : "AI 엔진 미선택"}
        </Badge>
        <Badge variant={mode ? "secondary" : "outline"}>{mode ? mode.name : "과금 방식 미선택"}</Badge>
        {office.billing_mode === "subscription" && <Badge variant="outline">플랜 {plan.name}</Badge>}
        {office.billing_mode === "credits" && (
          <Badge variant="outline">잔액 {(office.ai_credit_balance ?? 0).toLocaleString("ko-KR")} 크레딧</Badge>
        )}
        <Link
          href="/settings?tab=subscription"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto")}
        >
          AI·요금 설정
        </Link>
      </div>

      {!available && (
        <p className="rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
          Free 플랜이거나 크레딧이 없으면 AI를 쓸 수 없어요.{" "}
          <Link href="/settings?tab=subscription" className="text-primary hover:underline">
            설정 → AI·요금
          </Link>
          에서 구독 플랜을 고르거나 테스트 크레딧을 넣어 주세요.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} size="sm">
            <CardHeader>
              <f.icon className="mb-1 size-5 text-primary" />
              <CardTitle className="flex flex-wrap items-center gap-2">
                {f.title}
                <AiAccessBadge available={available} compact />
              </CardTitle>
              <CardDescription>{f.description}</CardDescription>
              <Link href={f.href} className={cn(buttonVariants({ variant: "link" }), "h-auto justify-start p-0 pt-1 text-xs")}>
                {f.cta} →
              </Link>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
