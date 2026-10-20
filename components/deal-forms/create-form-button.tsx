"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FormMessage } from "@/components/form/form-message";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createDealForm } from "@/lib/actions/deal-forms";
import { DEAL_FORM_KIND_LABELS, DEAL_FORM_KINDS } from "@/lib/deal-forms";
import { useFormAction } from "@/lib/use-form-action";
import { useIsApp } from "@/lib/use-is-app";

/** 웹 전용: 새 서식 초안 만들기 */
export function CreateDealFormButton({ dealId }: { dealId: string }) {
  const isApp = useIsApp();
  const [open, setOpen] = useState(false);
  const { state, pending, onSubmit, setState } = useFormAction(createDealForm.bind(null, dealId));

  if (isApp) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) setState(null);
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus data-icon="inline-start" />
            서식 작성
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 서식</DialogTitle>
          <DialogDescription>계약관리에 입력한 내용으로 초안을 채워요. 작성·수정은 웹에서만 가능해요.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="kind">서식 종류</Label>
            <NativeSelect
              id="kind"
              name="kind"
              options={DEAL_FORM_KINDS.map((k) => ({ value: k, label: DEAL_FORM_KIND_LABELS[k] }))}
              defaultValue="contract"
              required
            />
          </div>
          <FormMessage state={state} />
          <SubmitButton pending={pending} className="w-full">
            초안 만들기
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
