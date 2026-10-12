"use client";

import Link from "next/link";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/actions/auth";
import { useFormAction } from "@/lib/use-form-action";

export function SignupForm({ inviteToken, inviteEmail }: { inviteToken: string | null; inviteEmail?: string }) {
  const { state, pending, onSubmit } = useFormAction(signup);

  if (state?.message) {
    return <FormMessage state={state} />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {inviteToken && <input type="hidden" name="invite_token" value={inviteToken} />}

      <section className="space-y-4">
        <p className="text-sm font-semibold">계정 정보</p>
        <div className="space-y-2">
          <Label htmlFor="name">이름 *</Label>
          <Input id="name" name="name" autoComplete="name" placeholder="홍길동" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">이메일 *</Label>
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
          <Label htmlFor="password">비밀번호 *</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="8자 이상"
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">휴대폰 번호</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="010-0000-0000" />
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-sm font-semibold">중개사 정보</p>
        <div className="space-y-2">
          <Label htmlFor="license_no">개설등록번호 / 자격증 번호</Label>
          <Input id="license_no" name="license_no" placeholder="예: 11440-2026-00000" />
          <p className="text-xs text-muted-foreground">
            입력한 번호는 관리자 확인 후 인증 완료로 바뀌어요. 인증 전에도 모든 기능을 사용할 수 있어요.
          </p>
        </div>
        {!inviteToken && (
          <div className="space-y-2">
            <Label htmlFor="office_name">사무소 이름 *</Label>
            <Input id="office_name" name="office_name" placeholder="○○ 공인중개사사무소" required />
          </div>
        )}
      </section>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2">
            <Checkbox name="agree_terms" />
            [필수] 서비스 이용약관 동의
          </label>
          <Link href="/terms" target="_blank" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            보기
          </Link>
        </div>
        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2">
            <Checkbox name="agree_privacy" />
            [필수] 개인정보 수집·이용 동의
          </label>
          <Link href="/privacy" target="_blank" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            보기
          </Link>
        </div>
        <label className="flex items-center gap-2">
          <Checkbox name="agree_marketing" />
          [선택] 실무 콘텐츠·혜택 알림 수신
        </label>
      </div>

      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pending={pending} pendingText="가입 중…">
        가입하기
      </SubmitButton>
    </form>
  );
}
