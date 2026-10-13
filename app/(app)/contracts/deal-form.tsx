"use client";

import { toast } from "sonner";
import { FormMessage } from "@/components/form/form-message";
import { MoneyInput } from "@/components/form/number-input";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { DatePicker } from "@/components/form/date-picker";
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
    contract_date: string | null;
    balance_date: string | null;
    amount: number | null;
    memo: string | null;
  };
}

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
        <Label htmlFor="amount">거래 금액 (만원)</Label>
        <MoneyInput id="amount" name="amount" defaultValue={deal?.amount} placeholder="예) 52,000" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contract_date">계약일</Label>
          <DatePicker id="contract_date" name="contract_date" defaultValue={deal?.contract_date ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="balance_date">잔금일</Label>
          <DatePicker id="balance_date" name="balance_date" defaultValue={deal?.balance_date ?? ""} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="memo">메모</Label>
        <Textarea id="memo" name="memo" rows={3} defaultValue={deal?.memo ?? ""} placeholder="협의 조건, 특이 사항" />
      </div>
      <FormMessage state={state} />
      <div className="flex justify-end">
        <SubmitButton pending={pending}>{deal ? "저장" : "계약 시작"}</SubmitButton>
      </div>
    </form>
  );
}
