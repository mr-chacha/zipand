"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, MailCheck, X } from "lucide-react";
import { FormMessage } from "@/components/form/form-message";
import { PasswordInput } from "@/components/form/password-input";
import { SubmitButton } from "@/components/form/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/actions/auth";
import { PASSWORD_RULES } from "@/lib/password";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";

const agreements = [
  { name: "agree_terms", label: "[필수] 서비스 이용약관 동의", href: "/terms" },
  { name: "agree_privacy", label: "[필수] 개인정보 수집·이용 동의", href: "/privacy" },] as const;

type AgreementName = (typeof agreements)[number]["name"];

function RuleItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={cn("flex items-center gap-1", ok ? "text-primary" : "text-muted-foreground")}>
      {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      {label}
    </li>
  );
}

interface SignupFormProps {
  inviteToken: string | null;
  inviteEmail?: string;
  /** 초대 안내 등 제목 아래에 표시할 문구 */
  notice?: React.ReactNode;
}

export function SignupForm({ inviteToken, inviteEmail, notice }: SignupFormProps) {
  const { state, pending, onSubmit } = useFormAction(signup);
  const [agreed, setAgreed] = useState<Record<AgreementName, boolean>>({
    agree_terms: false,
    agree_privacy: false,
  });
  const allAgreed = Object.values(agreed).every(Boolean);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const passwordValid = PASSWORD_RULES.every((rule) => rule.test(password));
  const confirmMatches = confirm === password;

  if (state?.message) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">회원가입 완료</h1>
        <div className="flex items-start gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
          <MailCheck className="mt-1 size-4 shrink-0" />
          <p className="leading-7 whitespace-pre-line">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">회원가입</h1>
        {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        {inviteToken && <input type="hidden" name="invite_token" value={inviteToken} />}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="broker@example.com"
              defaultValue={inviteEmail}
              readOnly={Boolean(inviteEmail)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              placeholder="영문·숫자 포함 8자 이상"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={password.length > 0 && !passwordValid}
              required
            />
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
              {PASSWORD_RULES.map((rule) => (
                <RuleItem key={rule.label} ok={rule.test(password)} label={rule.label} />
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password_confirm">비밀번호 확인</Label>
            <PasswordInput
              id="password_confirm"
              name="password_confirm"
              autoComplete="new-password"
              placeholder="비밀번호를 한 번 더 입력"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={confirm.length > 0 && !confirmMatches}
              required
            />
            {confirm.length > 0 && (
              <p className={cn("text-xs", confirmMatches ? "text-primary" : "text-destructive")}>
                {confirmMatches ? "비밀번호가 일치해요." : "비밀번호가 일치하지 않아요."}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-3 text-sm">
          <label className="flex items-center gap-2 font-medium">
            <Checkbox
              checked={allAgreed}
              onCheckedChange={(v) =>
                setAgreed({ agree_terms: Boolean(v), agree_privacy: Boolean(v) })
              }
            />
            전체 동의
          </label>
          <div className="space-y-2 border-t pt-3">
            {agreements.map((a) => (
              <div key={a.name} className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <Checkbox
                    name={a.name}
                    checked={agreed[a.name]}
                    onCheckedChange={(v) => setAgreed((prev) => ({ ...prev, [a.name]: Boolean(v) }))}
                  />
                  {a.label}
                </label>
                {"href" in a && (
                  <Link href={a.href} target="_blank" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
                    보기
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        <FormMessage state={state} />
        <SubmitButton size="lg" className="w-full" pending={pending} pendingText="가입 중…">
          {inviteToken ? "가입하고 사무소 참여하기" : "무료로 시작하기"}
        </SubmitButton>
      </form>
    </div>
  );
}
