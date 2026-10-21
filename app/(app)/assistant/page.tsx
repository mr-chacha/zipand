import type { Metadata } from "next";
import Link from "next/link";
import { Bot, FileSearch, MessageSquareText, Mic, PenLine, Smartphone, Sparkles } from "lucide-react";
import { ComingSoonBadge, ComingSoonScreen } from "@/components/coming-soon";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { AI_PROVIDERS, BILLING_MODES, PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "AI 실무 도우미" };

const features = [
  { icon: Mic, title: "AI 임장 정리", description: "현장 음성 메모를 받아쓰고 방향·채광·수리 필요 항목으로 정리해요.", manual: "임장 기록에서 직접 입력" },
  { icon: FileSearch, title: "AI 문서 분석", description: "등기·건축물대장에서 핵심 항목을 추출하고 원문 근거를 연결해요.", manual: "문서 상세에서 직접 정리" },
  { icon: Sparkles, title: "AI 브리핑 작성", description: "확인된 정보만으로 고객 맞춤 매물 설명을 작성해요.", manual: "브리핑에서 설명 편집" },
  { icon: MessageSquareText, title: "상담 요약 · 문자 초안", description: "통화 녹음을 요약하고 고객에게 보낼 문자를 만들어요.", manual: "고객 상세에서 상담 기록" },
  { icon: PenLine, title: "특약 추천 · 계약서 초안", description: "거래 조건에 맞는 특약과 계약서·확인설명서 초안을 작성해요.", manual: "특약 라이브러리 사용" },
  { icon: Smartphone, title: "모바일 앱", description: "현장에서 사진·음성을 바로 남기고 오프라인에서도 기록해요.", manual: "모바일 웹으로 접속" },
];

export default async function AssistantPage() {
  const { office } = await getSession();
  const provider = AI_PROVIDERS.find((p) => p.id === office.ai_provider);
  const mode = BILLING_MODES.find((m) => m.id === office.billing_mode);
  const plan = PLANS.find((p) => p.id === office.plan_id) ?? PLANS[0];

  return (
    <ComingSoonScreen
      icon={Bot}
      title="AI 실무 도우미를 준비하고 있어요"
      description="기능 호출은 곧 연결돼요. 먼저 설정에서 AI 엔진과 과금 방식을 골라 주세요."
      alternatives={[
        { label: "AI·요금 설정", href: "/settings?tab=subscription" },
        { label: "매물 관리로 이동", href: "/properties" },
      ]}
    >
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <Badge variant={provider ? "secondary" : "outline"}>
          <Sparkles data-icon="inline-start" />
          {provider ? provider.name : "AI 엔진 미선택"}
        </Badge>
        <Badge variant={mode ? "secondary" : "outline"}>
          {mode ? mode.name : "과금 방식 미선택"}
        </Badge>
        {office.billing_mode === "subscription" && <Badge variant="outline">플랜 {plan.name}</Badge>}
        {office.billing_mode === "credits" && (
          <Badge variant="outline">잔액 {(office.ai_credit_balance ?? 0).toLocaleString("ko-KR")} 크레딧</Badge>
        )}
        <ComingSoonBadge />
      </div>
      <p className="mb-4 text-center text-xs text-muted-foreground">
        선택이 비어 있으면{" "}
        <Link href="/settings?tab=subscription" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-xs")}>
          설정 → AI·요금
        </Link>
        에서 고를 수 있어요.
      </p>
      <div className="grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} size="sm">
            <CardHeader>
              <f.icon className="mb-1 size-5 text-primary" />
              <CardTitle>{f.title}</CardTitle>
              <CardDescription>{f.description}</CardDescription>
              <p className="pt-1 text-xs text-primary">지금은: {f.manual}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
    </ComingSoonScreen>
  );
}
