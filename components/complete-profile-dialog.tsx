"use client";

import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeProfileFields } from "@/lib/actions/settings";
import { useFormAction } from "@/lib/use-form-action";
import type { ProfileNeed } from "@/types";

const FIELDS: Record<ProfileNeed, { label: string; placeholder: string; type: string; hint: string }> = {
  phone: {
    label: "내 휴대폰 번호",
    placeholder: "010-0000-0000",
    type: "tel",
    hint: "고객 브리핑에 담당자 연락처로 표시돼요.",
  },
  office_name: {
    label: "사무소 이름",
    placeholder: "○○ 공인중개사사무소",
    type: "text",
    hint: "초대받는 구성원과 고객에게 보이는 이름이에요.",
  },
};

interface CompleteProfileDialogProps {
  needs: ProfileNeed[];
  onOpenChange: (open: boolean) => void;
  /** 저장 후 원래 하려던 작업을 이어서 실행한다 */
  onCompleted: () => void;
  title?: string;
  description?: string;
}

/** 기능 사용 중 부족한 정보만 받아 저장하는 다이얼로그. needs가 비어 있으면 닫힌다. */
export function CompleteProfileDialog({
  needs,
  onOpenChange,
  onCompleted,
  title = "정보를 조금만 더 알려주세요",
  description = "이 기능을 쓰려면 아래 정보가 필요해요. 한 번만 입력하면 돼요.",
}: CompleteProfileDialogProps) {
  const { state, pending, onSubmit, setState } = useFormAction(completeProfileFields, {
    onSuccess: () => {
      onOpenChange(false);
      onCompleted();
    },
  });

  return (
    <Dialog
      open={needs.length > 0}
      onOpenChange={(open) => {
        if (!open) setState(null);
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {needs.map((need) => {
            const field = FIELDS[need];
            return (
              <div key={need} className="space-y-1.5">
                <Label htmlFor={`need-${need}`}>{field.label}</Label>
                <Input id={`need-${need}`} name={need} type={field.type} placeholder={field.placeholder} required autoFocus />
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              </div>
            );
          })}
          <FormMessage state={state} />
          <SubmitButton className="w-full" pending={pending}>
            저장하고 계속하기
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
