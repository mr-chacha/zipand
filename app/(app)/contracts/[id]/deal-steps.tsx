"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Ban, Check, CheckCircle2, Lock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/form/date-picker";
import { FormMessage } from "@/components/form/form-message";
import { MoneyInput } from "@/components/form/number-input";
import { SubmitButton } from "@/components/form/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { completeDeal, saveDealStep } from "@/lib/actions/deals";
import { DEAL_AMOUNT_LABEL, type DealStep } from "@/lib/constants";
import { STEP_TITLES, stageIndex } from "@/lib/deal-steps";
import { formatDate, formatManwon } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";
import type { Deal } from "@/types";

const stepHref = (dealId: string, step: number) => `/contracts/${dealId}?step=${step}`;

const isLease = (dealType: string) => dealType !== "매매";

/* ───────────────────────── 오른쪽 진행 단계 ───────────────────────── */

export function DealStepNav({ dealId, stage, viewing }: { dealId: string; stage: string; viewing: number }) {
  const current = stageIndex(stage);
  const closed = stage === "완료" || stage === "취소";
  return (
    <ol className="space-y-1">
      {STEP_TITLES.map((title, i) => {
        const step = i + 1;
        const last = i === STEP_TITLES.length - 1;
        const passed = i < current;
        const reachable = last || i <= current;
        const active = step === viewing;
        const label = last && closed ? stage : title;
        const content = (
          <>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                active && "border-primary-foreground",
                passed && !last && "border-success bg-success text-white",
                last && stage === "완료" && "border-success bg-success text-white",
                last && stage === "취소" && "border-destructive bg-destructive text-white"
              )}
            >
              {last && stage === "취소" ? <XCircle className="size-3" /> : passed || (last && stage === "완료") ? <Check className="size-3" /> : step}
            </span>
            <span className="flex-1">{label}</span>
            {i === current && !closed && !active && <span className="text-[11px] text-primary">진행 중</span>}
            {!reachable && <Lock className="size-3.5 text-muted-foreground" />}
          </>
        );
        const className = cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
          active ? "bg-primary text-primary-foreground" : reachable ? "hover:bg-muted" : "cursor-not-allowed text-muted-foreground"
        );
        return (
          <li key={title}>
            {reachable ? (
              <Link href={stepHref(dealId, step)} className={className} aria-current={active ? "step" : undefined}>
                {content}
              </Link>
            ) : (
              <span className={className} title="이전 단계를 마치면 열려요">
                {content}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ───────────────────────── 공통 ───────────────────────── */

function Field({ label, htmlFor, hint, className, children }: { label: string; htmlFor: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function PrevLink({ dealId, step }: { dealId: string; step: number }) {
  if (step <= 1) return <span />;
  return (
    <Link href={stepHref(dealId, step - 1)} className={buttonVariants({ variant: "ghost" })}>
      <ArrowLeft data-icon="inline-start" />
      이전
    </Link>
  );
}

function StepButtons({ dealId, step, pending, saveable = true }: { dealId: string; step: number; pending: boolean; saveable?: boolean }) {
  const nextTitle = STEP_TITLES[step];
  return (
    <div className="flex items-center justify-between gap-2 border-t pt-4">
      <PrevLink dealId={dealId} step={step} />
      <div className="flex gap-2">
        {saveable && (
          <SubmitButton name="intent" value="save" variant="outline" pending={pending}>
            저장
          </SubmitButton>
        )}
        <SubmitButton name="intent" value="next" pending={pending}>
          다음: {nextTitle}
          <ArrowRight data-icon="inline-end" />
        </SubmitButton>
      </div>
    </div>
  );
}

function useStepForm(dealId: string, step: DealStep) {
  return useFormAction(saveDealStep.bind(null, dealId, step), {
    onSuccess: (result) => result.message && toast.success(result.message),
  });
}

/* ───────────────────────── 1. 서류 확인 ───────────────────────── */

export function DocsStepFooter({ dealId, done, total }: { dealId: string; done: number; total: number }) {
  const { state, pending, onSubmit } = useStepForm(dealId, "서류 확인");
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {done < total && (
        <p className="text-xs text-muted-foreground">
          아직 확인하지 않은 항목이 {total - done}개 있어요. 다음 단계로 넘어가도 나중에 다시 돌아와 체크할 수 있어요.
        </p>
      )}
      <FormMessage state={state?.error ? state : null} />
      <StepButtons dealId={dealId} step={1} pending={pending} saveable={false} />
    </form>
  );
}

/* ───────────────────────── 2. 조건 협의 ───────────────────────── */

export function TermsStep({ deal, dealType }: { deal: Deal; dealType: string }) {
  const { state, pending, onSubmit } = useStepForm(deal.id, "조건 협의");
  const amountLabel = DEAL_AMOUNT_LABEL[dealType] ?? "거래대금";
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="거래대금" description={`${dealType} 거래 · 매물 광고 금액으로 시작하니 협의한 금액으로 고쳐 주세요 (만원)`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${amountLabel} *`} htmlFor="amount">
            <MoneyInput id="amount" name="amount" defaultValue={deal.amount} placeholder="예) 52,000" />
          </Field>
          {dealType === "월세" && (
            <Field label="월세" htmlFor="monthly_rent">
              <MoneyInput id="monthly_rent" name="monthly_rent" defaultValue={deal.monthly_rent} placeholder="예) 80" />
            </Field>
          )}
        </div>
      </Section>
      <Section title="입주">
        <Field label="입주 날짜" htmlFor="move_in_date" className="max-w-56">
          <DatePicker id="move_in_date" name="move_in_date" defaultValue={deal.move_in_date ?? ""} />
        </Field>
      </Section>
      <Section title="기타 사항">
        <Textarea
          id="terms_note"
          name="terms_note"
          rows={4}
          defaultValue={deal.terms_note ?? ""}
          placeholder={"예) 도배·장판 임대인 부담, 반려동물 가능 여부, 옵션(에어컨·냉장고) 포함"}
          aria-label="기타 사항"
        />
      </Section>
      <FormMessage state={state?.error ? state : null} />
      <StepButtons dealId={deal.id} step={2} pending={pending} />
    </form>
  );
}

/* ───────────────────────── 3. 계약 준비 ───────────────────────── */

export function PrepStep({ deal, dealType, customer }: { deal: Deal; dealType: string; customer: { name: string; phone: string | null } | null }) {
  const { state, pending, onSubmit } = useStepForm(deal.id, "계약 준비");
  const lease = isLease(dealType);
  const owner = lease ? "임대인" : "매도인";
  const buyer = lease ? "임차인" : "매수인";
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="계약금 · 잔금 · 중개수수료" description="금액은 만원 단위">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="계약금" htmlFor="down_payment">
            <MoneyInput id="down_payment" name="down_payment" defaultValue={deal.down_payment} placeholder="예) 5,000" />
          </Field>
          <Field label="계약금 입금 날짜" htmlFor="down_payment_date">
            <DatePicker id="down_payment_date" name="down_payment_date" defaultValue={deal.down_payment_date ?? ""} />
          </Field>
          <Field label="잔금 날짜" htmlFor="balance_date">
            <DatePicker id="balance_date" name="balance_date" defaultValue={deal.balance_date ?? ""} />
          </Field>
          <Field label="중개수수료" htmlFor="commission">
            <MoneyInput id="commission" name="commission" defaultValue={deal.commission} placeholder="예) 250" />
          </Field>
          <Field label="계약서 작성일" htmlFor="contract_date">
            <DatePicker id="contract_date" name="contract_date" defaultValue={deal.contract_date ?? ""} />
          </Field>
        </div>
      </Section>

      <Section title={`${owner} 인적사항 · 통장계좌`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${owner} 이름`} htmlFor="lessor_name">
            <Input id="lessor_name" name="lessor_name" defaultValue={deal.lessor_name ?? ""} placeholder="홍길동" />
          </Field>
          <Field label="연락처" htmlFor="lessor_phone">
            <Input id="lessor_phone" name="lessor_phone" type="tel" defaultValue={deal.lessor_phone ?? ""} placeholder="010-0000-0000" />
          </Field>
          <Field label="입금 계좌" htmlFor="lessor_account" hint={`계약금·잔금을 받을 ${owner} 본인 명의 계좌인지 확인하세요`} className="sm:col-span-2">
            <Input id="lessor_account" name="lessor_account" defaultValue={deal.lessor_account ?? ""} placeholder="예) 국민은행 123456-01-234567 (예금주 홍길동)" />
          </Field>
        </div>
      </Section>

      <Section title={`${buyer} 인적사항 · 입주날짜 재확인`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`${buyer} 이름`} htmlFor="lessee_name">
            <Input id="lessee_name" name="lessee_name" defaultValue={deal.lessee_name ?? customer?.name ?? ""} placeholder="김고객" />
          </Field>
          <Field label="연락처" htmlFor="lessee_phone">
            <Input id="lessee_phone" name="lessee_phone" type="tel" defaultValue={deal.lessee_phone ?? customer?.phone ?? ""} placeholder="010-0000-0000" />
          </Field>
          <Field label="입주 날짜" htmlFor="move_in_date" hint="조건 협의에서 정한 날짜를 다시 확인하세요">
            <DatePicker id="move_in_date" name="move_in_date" defaultValue={deal.move_in_date ?? ""} />
          </Field>
        </div>
      </Section>

      {dealType !== "월세" && (
        <Section title="은행 대출 확인" description={`${dealType} 거래는 대출 가능 여부를 계약 전에 확인하세요`}>
          <Input id="loan_note" name="loan_note" defaultValue={deal.loan_note ?? ""} placeholder="예) ○○은행 전세자금대출 사전 승인 완료 / 대출 없음" aria-label="은행 대출 확인" />
        </Section>
      )}

      <Section title="기타 사항">
        <Textarea id="prep_note" name="prep_note" rows={3} defaultValue={deal.prep_note ?? ""} placeholder="기타 서류 작업, 전달 사항" aria-label="기타 사항" />
      </Section>

      <FormMessage state={state?.error ? state : null} />
      <StepButtons dealId={deal.id} step={3} pending={pending} />
    </form>
  );
}

/* ───────────────────────── 4. 잔금 대기 ───────────────────────── */

export function BalanceStep({ deal }: { deal: Deal }) {
  const { state, pending, onSubmit } = useStepForm(deal.id, "잔금 대기");
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">잔금 날짜</dt>
          <dd className="font-medium">{formatDate(deal.balance_date)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">잔금</dt>
          <dd className="font-medium">
            {deal.amount !== null ? `${formatManwon(Math.max(deal.amount - (deal.down_payment ?? 0), 0))}원` : "-"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">중개수수료</dt>
          <dd className="font-medium">{deal.commission !== null ? `${formatManwon(deal.commission)}원` : "-"}</dd>
        </div>
      </dl>

      <Section title="중개수수료 입금">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="commission_paid" defaultChecked={deal.commission_paid} />
          중개수수료 입금 완료
        </label>
      </Section>

      <Section title="기타 확인 사항">
        <Textarea id="balance_note" name="balance_note" rows={3} defaultValue={deal.balance_note ?? ""} placeholder="예) 잔금 당일 등기 재열람 완료, 관리비 정산 영수증 전달" aria-label="기타 확인 사항" />
      </Section>

      <FormMessage state={state?.error ? state : null} />
      <StepButtons dealId={deal.id} step={4} pending={pending} />
    </form>
  );
}

/* ───────────────────────── 5. 거래 완료 ───────────────────────── */

export function CompleteStep({ deal }: { deal: Deal }) {
  const router = useRouter();
  const { state, pending, onSubmit } = useFormAction(completeDeal.bind(null, deal.id), {
    onSuccess: (result) => {
      if (result.message) toast.success(result.message);
      router.refresh();
    },
  });
  const canComplete = deal.stage === "잔금 대기";

  if (deal.stage === "취소") {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <Ban className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">취소된 계약이에요</p>
            {deal.cancel_reason && <p className="whitespace-pre-wrap">사유: {deal.cancel_reason}</p>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">중개수수료 입금: {deal.commission_paid ? "입금 완료" : "미입금"}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {deal.stage === "완료" ? (
        <p className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-sm text-success">
          <CheckCircle2 className="size-4" />
          거래가 완료됐어요.
        </p>
      ) : (
        !canComplete && (
          <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">잔금 대기 단계까지 진행하면 거래를 완료할 수 있어요.</p>
        )
      )}

      <Section title="중개수수료 입금 여부">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox name="commission_paid" defaultChecked={deal.commission_paid} />
          중개수수료 입금 완료
          {deal.commission !== null && <span className="text-muted-foreground">({formatManwon(deal.commission)}원)</span>}
        </label>
      </Section>

      <Section title="기타 사항">
        <Textarea id="closing_note" name="closing_note" rows={3} defaultValue={deal.closing_note ?? ""} placeholder="거래 후 전달 사항, 사후 관리 메모" aria-label="기타 사항" />
      </Section>

      <FormMessage state={state?.error ? state : null} />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <PrevLink dealId={deal.id} step={5} />
        <div className="flex flex-wrap gap-2">
          <SubmitButton name="intent" value="save" variant="outline" pending={pending}>
            저장
          </SubmitButton>
          {deal.stage !== "완료" && (
            <SubmitButton name="intent" value="complete" pending={pending} disabled={!canComplete} title={canComplete ? undefined : "잔금 대기 단계까지 진행해야 완료할 수 있어요"}>
              <CheckCircle2 data-icon="inline-start" />
              거래 완료
            </SubmitButton>
          )}
        </div>
      </div>
    </form>
  );
}
