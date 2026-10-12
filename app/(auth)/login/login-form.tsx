"use client";

import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/actions/auth";
import { useFormAction } from "@/lib/use-form-action";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const { state, pending, onSubmit } = useFormAction(login, {
    initialState: initialError ? { error: initialError } : null,
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="broker@example.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pending={pending} pendingText="로그인 중…">
        로그인
      </SubmitButton>
    </form>
  );
}
