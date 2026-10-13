"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, BadgeCheck, Copy, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { CompleteProfileDialog } from "@/components/complete-profile-dialog";
import { ConfirmAction } from "@/components/form/confirm-action";
import { FormMessage } from "@/components/form/form-message";
import { NativeSelect } from "@/components/form/native-select";
import { PasswordInput } from "@/components/form/password-input";
import { SubmitButton } from "@/components/form/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { changePassword, createInvite, revokeInvite, updateMember, updateOffice, updateProfile } from "@/lib/actions/settings";
import { ROLE_LABELS, VERIFICATION_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";
import type { ActionState, Office, Profile, ProfileNeed } from "@/types";

function Field({
  label,
  name,
  defaultValue,
  ...props
}: { label: string; name: string; defaultValue?: string | null } & Omit<React.ComponentProps<"input">, "defaultValue">) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue ?? ""} {...props} />
    </div>
  );
}

const toastOnSuccess = { onSuccess: (r: { message?: string }) => r.message && toast.success(r.message) };

export function OfficeForm({ office, readOnly }: { office: Office; readOnly: boolean }) {
  const { state, pending, onSubmit } = useFormAction(updateOffice, toastOnSuccess);
  const registered = office.registered_at !== null;
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div
        className={cn(
          "flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center",
          registered ? "border-primary/30 bg-primary/5" : "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10"
        )}
      >
        {registered ? (
          <BadgeCheck className="size-5 shrink-0 text-primary" />
        ) : (
          <AlertTriangle className="size-5 shrink-0 text-amber-600" />
        )}
        <div className="flex-1 text-sm">
          <p className="font-medium">{registered ? "공공데이터로 확인된 사무소예요" : "사무소 정보가 등록되지 않았어요"}</p>
          <p className="text-xs text-muted-foreground">
            {registered
              ? `${formatDate(office.registered_at)} 등록 · 개설등록번호와 대표자는 조회 결과로만 변경할 수 있어요.`
              : "등록 전에는 매물·고객을 1건까지만 등록할 수 있고, 문서·계약 관리는 사용할 수 없어요."}
          </p>
        </div>
        {!readOnly && (
          <Link
            href="/office/register"
            className={buttonVariants({ size: "sm", variant: registered ? "outline" : "default" })}
          >
            {registered ? "다시 조회" : "사무소 등록하기"}
          </Link>
        )}
      </div>
      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
        <Field label="사무소명 *" name="name" defaultValue={office.name} required />
        <Field label="대표자" name="representative" defaultValue={office.representative} readOnly={registered} className={cn(registered && "bg-muted")} />
        <Field label="개설등록번호" name="registration_no" defaultValue={office.registration_no} readOnly={registered} className={cn(registered && "bg-muted")} />
        <Field label="대표 전화" name="phone" type="tel" defaultValue={office.phone} />
        <div className="sm:col-span-2">
          <Field label="주소" name="address" defaultValue={office.address} />
        </div>
      </fieldset>
      <FormMessage state={state} />
      {!readOnly && (
        <div className="flex justify-end">
          <SubmitButton pending={pending}>저장</SubmitButton>
        </div>
      )}
    </form>
  );
}

export function AccountForms({ profile }: { profile: Profile }) {
  const info = useFormAction(updateProfile, toastOnSuccess);
  const password = useFormAction(changePassword, {
    onSuccess: (r, form) => {
      form.reset();
      if (r.message) toast.success(r.message);
    },
  });

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>내 정보</CardTitle>
          <CardDescription className="flex items-center gap-2">
            {profile.email}
            <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={info.onSubmit} className="space-y-4">
            <Field label="이름 *" name="name" defaultValue={profile.name} required />
            <Field label="휴대폰 번호" name="phone" type="tel" defaultValue={profile.phone} />
            <div className="space-y-1.5">
              <Field label="중개사 자격번호" name="license_no" defaultValue={profile.license_no} />
              <p className="text-xs text-muted-foreground">
                자격 인증: {VERIFICATION_LABELS[profile.verification_status]} · 인증 심사는 서비스 준비중이에요
              </p>
            </div>
            <FormMessage state={info.state} />
            <div className="flex justify-end">
              <SubmitButton pending={info.pending}>저장</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>비밀번호 변경</CardTitle>
          <CardDescription>8자 이상으로 입력해 주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={password.onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">새 비밀번호</Label>
              <PasswordInput id="password" name="password" autoComplete="new-password" placeholder="영문·숫자 포함 8자 이상" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password_confirm">새 비밀번호 확인</Label>
              <PasswordInput id="password_confirm" name="password_confirm" autoComplete="new-password" required />
            </div>
            <FormMessage state={password.state} />
            <div className="flex justify-end">
              <SubmitButton pending={password.pending}>변경</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface MemberItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  active: boolean;
  verification_status: string;
  created_at: string;
}

interface InviteItem {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  expired: boolean;
}

export function MemberManager({
  members,
  invites,
  currentUserId,
  isOwner,
  siteUrl,
}: {
  members: MemberItem[];
  invites: InviteItem[];
  currentUserId: string;
  isOwner: boolean;
  siteUrl: string;
}) {
  const [pending, startTransition] = useTransition();
  const [needs, setNeeds] = useState<ProfileNeed[]>([]);
  const inviteForm = useRef<HTMLFormElement>(null);
  const invite = useFormAction(async (prev: ActionState | null, fd: FormData) => {
    const result = await createInvite(prev, fd);
    if (result.needs) {
      setNeeds(result.needs);
      return;
    }
    return result;
  }, {
    onSuccess: (r, form) => {
      form.reset();
      if (r.message) toast.success(r.message);
    },
  });

  const run = (fn: () => Promise<{ error?: string; message?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast.error(result.error);
      else if (result.message) toast.success(result.message);
    });

  const copyInvite = async (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : siteUrl;
    await navigator.clipboard.writeText(`${origin}/signup?invite=${token}`);
    toast.success("초대 링크를 복사했어요.");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>구성원 ({members.length})</CardTitle>
          <CardDescription>
            {isOwner ? "역할과 활성 상태를 변경할 수 있어요. 비활성 구성원은 로그인할 수 없어요." : "구성원 관리는 대표만 할 수 있어요."}
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {members.map((m) => {
            const editable = isOwner && m.id !== currentUserId && m.role !== "owner";
            return (
              <div key={m.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {m.name}
                    {m.id === currentUserId && <Badge variant="outline">나</Badge>}
                    {!m.active && <Badge variant="secondary">비활성</Badge>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                    {m.phone && ` · ${m.phone}`} · {VERIFICATION_LABELS[m.verification_status]} · {formatDate(m.created_at)} 가입
                  </p>
                </div>
                {editable ? (
                  <div className="flex items-center gap-3">
                    <NativeSelect
                      aria-label="역할"
                      value={m.role}
                      disabled={pending}
                      onChange={(e) => run(() => updateMember(m.id, e.target.value, m.active))}
                      options={[
                        { value: "agent", label: ROLE_LABELS.agent },
                        { value: "staff", label: ROLE_LABELS.staff },
                      ]}
                      className="w-32"
                    />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={m.active}
                        disabled={pending}
                        onCheckedChange={(v) => run(() => updateMember(m.id, m.role, Boolean(v)))}
                      />
                      활성
                    </label>
                  </div>
                ) : (
                  <Badge variant="secondary">{ROLE_LABELS[m.role]}</Badge>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>구성원 초대</CardTitle>
            <CardDescription>초대 링크로 가입하면 이 사무소의 구성원이 돼요. 링크는 7일간 유효해요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CompleteProfileDialog
              needs={needs}
              onOpenChange={(open) => !open && setNeeds([])}
              onCompleted={() => inviteForm.current?.requestSubmit()}
              title="사무소 이름을 먼저 정해주세요"
              description="초대받은 분이 어느 사무소에 합류하는지 알 수 있도록 사무소 이름이 필요해요."
            />
            <form ref={inviteForm} onSubmit={invite.onSubmit} className="flex flex-col gap-2 sm:flex-row">
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
                {invites.map((inv) => {
                  const expired = inv.expired;
                  return (
                    <div key={inv.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {ROLE_LABELS[inv.role]} · {expired ? "만료됨" : `${formatDate(inv.expires_at)}까지`}
                        </p>
                      </div>
                      {!expired && (
                        <Button size="sm" variant="outline" onClick={() => copyInvite(inv.token)}>
                          <Copy data-icon="inline-start" />
                          링크 복사
                        </Button>
                      )}
                      <ConfirmAction
                        action={() => revokeInvite(inv.id)}
                        title="초대를 취소할까요?"
                        description="이 링크로는 더 이상 가입할 수 없어요."
                        confirmLabel="초대 취소"
                        successMessage="초대를 취소했어요."
                        trigger={
                          <Button size="icon-sm" variant="ghost" aria-label="초대 취소">
                            <Trash2 />
                          </Button>
                        }
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">초대 메일 자동 발송은 서비스 준비중이에요. 링크를 메시지로 전달해 주세요.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
