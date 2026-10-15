"use client";

import { toast } from "sonner";
import { FormMessage } from "@/components/form/form-message";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDeal, updateDeal } from "@/lib/actions/deals";
import { useFormAction } from "@/lib/use-form-action";

type Option = { value: string; label: string };

interface DealFormProps {
  properties?: Option[];
  customers: Option[];
  defaultPropertyId?: string;
  defaultCustomerId?: string;
  deal?: {
    id: string;
    customer_id: string | null;
    memo: string | null;
  };
}

/** 거래 생성(매물·고객) / 기본 정보 수정. 금액·날짜 등은 단계별 화면에서 입력한다 */
export function DealForm({ properties, customers, defaultPropertyId, defaultCustomerId, deal }: DealFormProps) {
  const { state, pending, onSubmit } = useFormAction(deal ? updateDeal.bind(null, deal.id) : createDeal, {
    onSuccess: (result) => result.message && toast.success(result.message),
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {properties && (
        <div className="space-y-1.5">
          <Label htmlFor="property_id">매물 *</Label>
          <NativeSelect id="property_id" name="property_id" options={properties} defaultValue={defaultPropertyId ?? ""} placeholder="선택" required />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="customer_id">고객</Label>
        <NativeSelect
          id="customer_id"
          name="customer_id"
          options={customers}
          defaultValue={deal?.customer_id ?? defaultCustomerId ?? ""}
          placeholder="미지정"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="memo">메모</Label>
        <Textarea id="memo" name="memo" rows={3} defaultValue={deal?.memo ?? ""} placeholder="거래 관련 내부 메모" />
      </div>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pending={pending}>{deal ? "저장" : "계약 시작"}</SubmitButton>
      </div>
    </form>
  );
}
