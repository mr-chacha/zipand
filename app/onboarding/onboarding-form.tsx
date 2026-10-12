"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding, skipOnboarding } from "@/lib/actions/settings";
import { useFormAction } from "@/lib/use-form-action";

interface OnboardingFormProps {
  isOwner: boolean;
  defaultName: string;
  defaultOfficeName: string;
  defaultPhone: string;
}

export function OnboardingForm({ isOwner, defaultName, defaultOfficeName, defaultPhone }: OnboardingFormProps) {
  const { state, pending, onSubmit } = useFormAction(completeOnboarding);
  const [skipping, startSkip] = useTransition();

  const skip = () =>
    startSkip(async () => {
      const result = await skipOnboarding();
      if (result?.error) toast.error(result.error);
    });

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" name="name" defaultValue={defaultName} placeholder="홍길동" autoComplete="name" required autoFocus />
          </div>
          {isOwner && (
            <div className="space-y-2">
              <Label htmlFor="office_name">사무소 이름</Label>
              <Input id="office_name" name="office_name" defaultValue={defaultOfficeName} placeholder="○○ 공인중개사사무소" />
              <p className="text-xs text-muted-foreground">비워두면 &lsquo;내 중개사무소&rsquo;로 만들어지고, 설정에서 바꿀 수 있어요.</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="phone">
              휴대폰 번호 <span className="font-normal text-muted-foreground">(선택)</span>
            </Label>
            <Input id="phone" name="phone" type="tel" defaultValue={defaultPhone} placeholder="010-0000-0000" autoComplete="tel" />
            <p className="text-xs text-muted-foreground">고객 브리핑에 담당자 연락처로 표시돼요.</p>
          </div>
          <FormMessage state={state} />
          <SubmitButton className="w-full" size="lg" pending={pending} disabled={skipping}>
            시작하기
          </SubmitButton>
          <Button type="button" variant="ghost" className="w-full text-muted-foreground" onClick={skip} disabled={pending || skipping}>
            나중에 할게요
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
