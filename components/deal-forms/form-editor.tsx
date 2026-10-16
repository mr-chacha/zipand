"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { FormActions } from "@/components/form/form-actions";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { DealFormFields } from "@/components/deal-forms/form-fields";
import { DealFormShareLinks } from "@/components/deal-forms/form-share-links";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteDealForm,
  duplicateDealForm,
  finalizeDealForm,
  updateDealForm,
} from "@/lib/actions/deal-forms";
import type { DealFormKind } from "@/lib/deal-forms";
import { useFormAction } from "@/lib/use-form-action";
import { useIsApp } from "@/lib/use-is-app";
import { cn } from "@/lib/utils";

type ShareLink = { id: string; token: string; expires_at: string; view_count: number; expired: boolean };

export function DealFormEditor({
  formId,
  dealId,
  kind,
  title,
  status,
  data,
  shares,
  siteUrl,
}: {
  formId: string;
  dealId: string;
  kind: DealFormKind;
  title: string;
  status: "draft" | "finalized";
  data: Record<string, string>;
  shares: ShareLink[];
  siteUrl: string;
}) {
  const isApp = useIsApp();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const finalized = status === "finalized";
  const readOnly = finalized || isApp;

  const { state, pending: saving, onSubmit } = useFormAction(updateDealForm.bind(null, formId), {
    onSuccess: (result) => result.message && toast.success(result.message),
  });

  const runFinalize = () =>
    startTransition(async () => {
      const result = await finalizeDealForm(formId);
      if (result.error) toast.error(result.error);
      else if (result.message) toast.success(result.message);
    });

  const runDuplicate = () =>
    startTransition(async () => {
      const result = await duplicateDealForm(formId);
      if (result.error) toast.error(result.error);
      else if (result.id) {
        toast.success(result.message);
        router.push(`/contracts/${dealId}/forms/${result.id}`);
      }
    });

  return (
    <div className="space-y-6">
      {isApp && !finalized && (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          서식 작성·수정은 웹에서만 할 수 있어요. 확정된 서식은 아래에서 공유할 수 있어요.
        </p>
      )}

      {finalized && (
        <DealFormShareLinks formId={formId} dealId={dealId} links={shares} siteUrl={siteUrl} />
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" defaultValue={title} required disabled={readOnly} />
        </div>

        <DealFormFields kind={kind} data={data} readOnly={readOnly} />

        <FormMessage state={state} />

        {!isApp && !finalized && (
          <FormActions>
            <Link href={`/contracts/${dealId}/forms`} className={buttonVariants({ variant: "outline" })}>
              목록
            </Link>
            <SubmitButton pending={saving}>저장</SubmitButton>
          </FormActions>
        )}
      </form>

      {!isApp && (
        <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap">
          {!finalized && (
            <Button type="button" onClick={runFinalize} disabled={pending || saving}>
              확정하기
            </Button>
          )}
          {finalized && (
            <Button type="button" variant="outline" onClick={runDuplicate} disabled={pending}>
              사본 만들어 수정
            </Button>
          )}
          <ConfirmAction
            appOnly
            action={async () => {
              const result = await deleteDealForm(formId);
              if (!result.error) router.push(`/contracts/${dealId}/forms`);
              return result;
            }}
            title="서식을 삭제할까요?"
            description="삭제하면 되돌릴 수 없어요. 공유 링크도 함께 삭제돼요."
            successMessage="서식을 삭제했어요."
            trigger={
              <Button type="button" variant="outline" className="text-destructive">
                삭제
              </Button>
            }
          />
        </div>
      )}

      {isApp && (
        <Link
          href={`/contracts/${dealId}`}
          className={cn(buttonVariants({ variant: "outline" }), "flex w-full justify-center")}
        >
          거래로 돌아가기
        </Link>
      )}
    </div>
  );
}
