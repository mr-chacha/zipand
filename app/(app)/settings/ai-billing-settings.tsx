"use client";

import { useTransition } from "react";
import { Check, Coins, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ComingSoonBadge } from "@/components/coming-soon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addTestCredits, setAiProvider, setBillingMode, setPlanId } from "@/lib/actions/ai-billing";
import {
  AI_PROVIDERS,
  BILLING_MODES,
  CREDIT_PACKS,
  PLANS,
  type AiProviderId,
  type BillingModeId,
  type PlanId,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  isOwner: boolean;
  aiProvider: AiProviderId | null;
  billingMode: BillingModeId | null;
  planId: PlanId;
  creditBalance: number;
};

function ChoiceCard({
  selected,
  disabled,
  onClick,
  title,
  description,
  meta,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        selected ? "border-primary bg-primary/5 ring-2 ring-primary" : "hover:border-foreground/30",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{title}</p>
        {selected && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" />
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {meta && <p className="mt-2 text-xs text-primary">{meta}</p>}
    </button>
  );
}

export function AiBillingSettings({ isOwner, aiProvider, billingMode, planId, creditBalance }: Props) {
  const [pending, start] = useTransition();
  const providerLabel = AI_PROVIDERS.find((p) => p.id === aiProvider)?.name;
  const modeLabel = BILLING_MODES.find((m) => m.id === billingMode)?.name;
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  const run = (fn: () => Promise<{ error?: string; message?: string }>) => {
    if (!isOwner) {
      toast.error("대표만 변경할 수 있어요.");
      return;
    }
    start(async () => {
      const r = await fn();
      if (r.error) toast.error(r.error);
      else if (r.message) toast.success(r.message);
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            AI·요금 설정
            <ComingSoonBadge />
          </CardTitle>
          <CardDescription>
            AI 엔진과 과금 방식(구독 / 토큰·크레딧)을 골라 저장해요. 실제 결제는 준비중이며, 테스트 크레딧·플랜
            선택으로 AI 기능을 바로 써 볼 수 있어요. Free이거나 크레딧 0이면 AI가 잠겨요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Badge variant="secondary">
            <Sparkles data-icon="inline-start" />
            {providerLabel ?? "AI 엔진 미선택"}
          </Badge>
          <Badge variant="secondary">
            <CreditCard data-icon="inline-start" />
            {modeLabel ?? "과금 방식 미선택"}
          </Badge>
          {billingMode === "subscription" && (
            <Badge variant="outline">플랜 {plan.name}</Badge>
          )}
          {billingMode === "credits" && (
            <Badge variant="outline">
              <Coins data-icon="inline-start" />
              잔액 {creditBalance.toLocaleString("ko-KR")} 크레딧
            </Badge>
          )}
          {!isOwner && <p className="w-full text-xs text-muted-foreground">변경은 대표만 할 수 있어요.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1. AI 엔진</CardTitle>
          <CardDescription>GPT와 제미나이 중 하나를 골라 결과를 비교해 보세요.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {AI_PROVIDERS.map((p) => (
            <ChoiceCard
              key={p.id}
              selected={aiProvider === p.id}
              disabled={pending || !isOwner}
              onClick={() => run(() => setAiProvider(p.id))}
              title={p.name}
              description={p.description}
              meta={p.modelHint}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. 과금 방식</CardTitle>
          <CardDescription>월 구독과 토큰·크레딧 충전 중 하나만 선택해요.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {BILLING_MODES.map((m) => (
            <ChoiceCard
              key={m.id}
              selected={billingMode === m.id}
              disabled={pending || !isOwner}
              onClick={() => run(() => setBillingMode(m.id))}
              title={m.name}
              description={m.description}
            />
          ))}
        </CardContent>
      </Card>

      {billingMode === "subscription" && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">3. 구독 요금제</h3>
            <p className="text-xs text-muted-foreground">플랜만 저장돼요. 결제는 준비중이에요.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((p) => {
              const selected = planId === p.id;
              return (
                <Card key={p.id} className={cn(selected && "ring-2 ring-primary")}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2 text-base">
                      {p.name}
                      {selected && <Badge>선택됨</Badge>}
                    </CardTitle>
                    <CardDescription>{p.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-2xl font-bold">
                      {p.price === 0 ? "무료" : `${p.price.toLocaleString("ko-KR")}원`}
                      {p.price > 0 && <span className="text-sm font-normal text-muted-foreground"> /월</span>}
                    </p>
                    <p className="text-xs text-primary">{p.aiIncluded}</p>
                    <ul className="space-y-1.5 text-sm">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      type="button"
                      className="w-full"
                      variant={selected ? "secondary" : "default"}
                      disabled={pending || !isOwner || selected}
                      onClick={() => run(() => setPlanId(p.id))}
                    >
                      {selected ? "사용 중" : "이 플랜 선택"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {billingMode === "credits" && (
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. 크레딧 잔액</CardTitle>
              <CardDescription>
                1크레딧 ≈ 통화 요약 1회(약 5분). 광고 문구·입지 초안은 더 적게 차감할 예정이에요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tabular-nums">
                {creditBalance.toLocaleString("ko-KR")}
                <span className="ml-1 text-base font-normal text-muted-foreground">크레딧</span>
              </p>
            </CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <Card key={pack.id}>
                <CardHeader>
                  <CardTitle className="text-base">{pack.label}</CardTitle>
                  <CardDescription>{pack.credits.toLocaleString("ko-KR")} 크레딧</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-2xl font-bold">
                    {pack.price.toLocaleString("ko-KR")}
                    <span className="text-sm font-normal text-muted-foreground">원</span>
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={pending || !isOwner}
                    onClick={() => run(() => addTestCredits(pack.id))}
                  >
                    테스트로 넣기
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">실제 결제는 준비중 · 테스트 잔액만 증가</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!billingMode && (
        <p className="text-sm text-muted-foreground">과금 방식을 고르면 요금제 또는 충전 팩이 여기에 나타나요.</p>
      )}
    </div>
  );
}
