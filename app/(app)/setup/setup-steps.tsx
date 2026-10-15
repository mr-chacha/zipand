"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Copy, ExternalLink, Link2, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_SECTIONS } from "@/components/briefing-view";
import { FormMessage } from "@/components/form/form-message";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { OfficeDocumentRequestNotice, type VerificationRequest } from "@/components/office-document-request";
import { OfficeRegisterForm } from "@/components/office-register-form";
import { OfficeSearch, RegistryOfficeInfo } from "@/components/office-search";
import { OfficeUnregisterButton } from "@/components/office-unregister-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBriefing } from "@/lib/actions/briefings";
import { createInvite } from "@/lib/actions/settings";
import { finishSetup, saveSetupProfile } from "@/lib/actions/setup";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import type { RegistryOffice } from "@/lib/office-registry";
import { useFormAction } from "@/lib/use-form-action";

function Field({
  label,
  name,
  hint,
  defaultValue,
  ...props
}: { label: string; name: string; hint?: string; defaultValue?: string | null } & Omit<
  React.ComponentProps<"input">,
  "defaultValue"
>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>
        {label}
        {!props.required && <span className="font-normal text-muted-foreground">(선택)</span>}
      </Label>
      <Input id={name} name={name} defaultValue={defaultValue ?? ""} {...props} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** 이전 단계 링크. 첫 단계에서는 자리만 차지한다. */
function PrevLink({ href }: { href?: string }) {
  if (!href) return <span />;
  return (
    <Link href={href} className={buttonVariants({ variant: "outline" })}>
      <ArrowLeft data-icon="inline-start" />
      이전
    </Link>
  );
}

function FinishButton({ label, variant = "default" }: { label: string; variant?: "default" | "ghost" }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={variant}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await finishSetup();
          if (result?.error) toast.error(result.error);
        })
      }
    >
      {pending && <Loader2 className="animate-spin" data-icon="inline-start" />}
      {label}
    </Button>
  );
}

interface StepNav {
  prevHref?: string;
  /** 다음 단계 주소. 없으면 마지막 단계 */
  nextHref?: string;
}

export function ProfileStep({
  name,
  phone,
  prevHref,
  nextHref,
}: StepNav & { name: string; phone: string }) {
  const { state, pending, onSubmit } = useFormAction(saveSetupProfile);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={nextHref ?? "/setup"} />
      <Field label="이름" name="name" defaultValue={name} placeholder="홍길동" autoComplete="name" required autoFocus />
      <Field
        label="휴대폰 번호"
        name="phone"
        type="tel"
        defaultValue={phone}
        placeholder="010-0000-0000"
        autoComplete="tel"
        hint="고객 브리핑에 담당자 연락처로 표시돼요."
        required
      />
      <FormMessage state={state} />
      <div className="flex items-center justify-between gap-2 pt-2">
        <PrevLink href={prevHref} />
        <SubmitButton pending={pending}>저장하고 다음</SubmitButton>
      </div>
    </form>
  );
}

const formatBusinessNo = (no: string | null) => no?.replace(/^(\d{3})(\d{2})(\d{5})$/, "$1-$2-$3") ?? "-";

/** 사무소 조회 → 사업자등록정보 인증까지 마쳐야 다음 단계로 갈 수 있다 */
export function OfficeStep({
  officeId,
  phone,
  representative,
  registry,
  business,
  request,
  prevHref,
  nextHref,
}: StepNav & {
  officeId: string;
  phone: string;
  representative: string;
  /** 인증(등록)된 사무소면 그 정보 */
  registry: RegistryOffice | null;
  /** 국세청 사업자등록 진위확인 결과 */
  business: { no: string | null; status: string | null; startDate: string | null; verifiedAt: string | null } | null;
  /** 서류 심사 신청 내역(가장 최근) */
  request: VerificationRequest | null;
}) {
  const [selected, setSelected] = useState<RegistryOffice | null>(null);

  if (registry) {
    return (
      <div className="space-y-4">
        <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <BadgeCheck className="size-4" />
            인증된 사무소
          </div>
          <RegistryOfficeInfo office={registry} />
          {business && (
            <div className="space-y-1 rounded-md border bg-background p-2.5 text-xs">
              <p className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="size-3.5 text-primary" />
                사업자 인증 완료
                {business.verifiedAt && (
                  <span className="font-normal text-muted-foreground">· {formatDateTime(business.verifiedAt)} 국세청 확인</span>
                )}
              </p>
              <p className="text-muted-foreground">
                사업자등록번호 {formatBusinessNo(business.no)}
                {business.startDate && ` · 개업일자 ${business.startDate}`}
                {business.status && ` · ${business.status}`}
              </p>
            </div>
          )}
          <OfficeUnregisterButton />
        </div>
        <StepFooter prevHref={prevHref} nextHref={nextHref} canNext />
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <OfficeRegisterForm
          key={selected.regNo}
          office={selected}
          next={nextHref ?? "/setup"}
          phone={phone}
          onBack={() => setSelected(null)}
          footerStart={<PrevLink href={prevHref} />}
          submitLabel="인증하고 다음"
        />
        <OfficeDocumentRequestNotice officeId={officeId} request={request} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OfficeSearch onSelect={setSelected} selectLabel="이 사무소 선택" defaultRepresentative={representative} />
      <OfficeDocumentRequestNotice officeId={officeId} request={request} />
      <StepFooter prevHref={prevHref} nextHref={nextHref} canNext={false} />
    </div>
  );
}

/** 이미 끝낸 단계로 돌아왔을 때의 이동 버튼 */
export function StepFooter({ prevHref, nextHref, canNext }: StepNav & { canNext: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <PrevLink href={prevHref} />
      {nextHref ? (
        canNext ? (
          <Link href={nextHref} className={buttonVariants()}>
            다음
          </Link>
        ) : (
          <Button disabled>다음</Button>
        )
      ) : (
        <FinishButton label="시작하기 완료" />
      )}
    </div>
  );
}

export function BriefingStep({
  properties,
  done,
  prevHref,
  nextHref,
}: StepNav & { properties: { id: string; title: string }[]; done: boolean }) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [token, setToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const url = token ? `${window.location.origin}/b/${token}` : "";

  const create = () =>
    startTransition(async () => {
      const result = await createBriefing(propertyId, DEFAULT_SECTIONS, "", 14);
      if (result.error || !result.token) {
        toast.error(result.error ?? "링크를 만들지 못했어요.");
        return;
      }
      setToken(result.token);
      toast.success("브리핑 링크를 만들었어요.");
    });

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    toast.success("링크를 복사했어요. 고객에게 메시지로 보내주세요.");
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="briefing-property">브리핑할 매물</Label>
        <NativeSelect
          id="briefing-property"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          options={properties.map((p) => ({ value: p.id, label: p.title }))}
        />
        <p className="text-xs text-muted-foreground">
          사진·가격·주요 정보가 담긴 고객용 페이지가 만들어져요. 상세 주소와 내부 메모는 공개되지 않아요.
        </p>
      </div>

      {token ? (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <p className="text-sm font-medium">공유 링크 (14일간 유효)</p>
          <div className="flex gap-2">
            <Input value={url} readOnly className="flex-1 font-mono text-xs" />
            <Button variant="outline" onClick={copy}>
              <Copy data-icon="inline-start" />
              복사
            </Button>
            <a href={url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
              <ExternalLink data-icon="inline-start" />
              미리보기
            </a>
          </div>
        </div>
      ) : (
        <Button variant="outline" className="w-full" onClick={create} disabled={pending || !propertyId}>
          {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
          브리핑 링크 만들기
        </Button>
      )}
      {!token && done && <p className="text-xs text-muted-foreground">이미 만든 브리핑이 있어요. 다음 단계로 넘어가도 돼요.</p>}

      <StepFooter prevHref={prevHref} nextHref={nextHref} canNext={done || Boolean(token)} />
    </div>
  );
}

export function InviteStep({
  invites,
  done,
  prevHref,
  siteUrl,
}: Omit<StepNav, "nextHref"> & {
  invites: { id: string; email: string; role: string; token: string }[];
  done: boolean;
  siteUrl: string;
}) {
  const invite = useFormAction(createInvite, {
    onSuccess: (r, form) => {
      form.reset();
      if (r.message) toast.success(r.message);
    },
  });

  const copy = async (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : siteUrl;
    await navigator.clipboard.writeText(`${origin}/signup?invite=${token}`);
    toast.success("초대 링크를 복사했어요.");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={invite.onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <Input name="email" type="email" placeholder="초대할 이메일" required className="flex-1" />
        <NativeSelect
          name="role"
          defaultValue="agent"
          options={[
            { value: "agent", label: ROLE_LABELS.agent },
            { value: "staff", label: ROLE_LABELS.staff },
          ]}
          className="sm:w-36"
        />
        <SubmitButton pending={invite.pending}>
          <UserPlus data-icon="inline-start" />
          초대 링크 만들기
        </SubmitButton>
      </form>
      <FormMessage state={invite.state} />

      {invites.length > 0 && (
        <div className="divide-y rounded-lg border">
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center gap-2 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{inv.email}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[inv.role]}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => copy(inv.token)}>
                <Copy data-icon="inline-start" />
                링크 복사
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        초대 링크로 가입하면 사무소 구성원이 돼요. 링크는 7일간 유효하고, 메일 자동 발송은 준비중이라 직접 전달해 주세요.
      </p>

      <div className="flex items-center justify-between gap-2 pt-2">
        <PrevLink href={prevHref} />
        <div className="flex gap-2">
          {!done && <FinishButton label="나중에 초대할게요" variant="ghost" />}
          {done ? <FinishButton label="시작하기 완료" /> : <Button disabled>시작하기 완료</Button>}
        </div>
      </div>
    </div>
  );
}
