"use client";

import Link from "next/link";
import { FormMessage } from "@/components/form/form-message";
import { FormActions } from "@/components/form/form-actions";
import { MoneyInput } from "@/components/form/number-input";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { DatePicker } from "@/components/form/date-picker";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CUSTOMER_STATUSES, DEAL_TYPES } from "@/lib/constants";
import { useFormAction } from "@/lib/use-form-action";
import type { ActionState, Customer } from "@/types";

interface CustomerFormProps {
  action: (prev: ActionState | null, fd: FormData) => Promise<ActionState>;
  members: { id: string; name: string }[];
  defaultValues?: Partial<Customer>;
  currentUserId: string;
  cancelHref: string;
}

export function CustomerForm({ action, members, defaultValues: d, currentUserId, cancelHref }: CustomerFormProps) {
  const { state, pending, onSubmit } = useFormAction(action);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>고객 정보</CardTitle>
          <CardDescription>고객 개인정보는 사무소 구성원만 볼 수 있고, 브리핑에는 노출되지 않아요</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">고객명 *</Label>
            <Input id="name" name="name" defaultValue={d?.name} placeholder="예: 김OO (신혼부부)" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">연락처</Label>
            <Input id="phone" name="phone" type="tel" defaultValue={d?.phone ?? ""} placeholder="010-0000-0000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">상태 *</Label>
            <NativeSelect id="status" name="status" options={CUSTOMER_STATUSES} defaultValue={d?.status ?? "연락 전"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager_id">담당자</Label>
            <NativeSelect
              id="manager_id"
              name="manager_id"
              options={members.map((m) => ({ value: m.id, label: m.name }))}
              defaultValue={d?.manager_id ?? currentUserId}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>희망 조건</CardTitle>
          <CardDescription>조건을 입력하면 맞는 매물을 추천해 드려요. 금액은 만원 단위예요</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="deal_type">거래 유형</Label>
            <NativeSelect id="deal_type" name="deal_type" options={DEAL_TYPES} placeholder="미정" defaultValue={d?.deal_type ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="regions">희망 지역 (쉼표로 구분)</Label>
            <Input id="regions" name="regions" defaultValue={d?.regions ?? ""} placeholder="마포구, 용산구" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="budget_min">예산 최소</Label>
              <MoneyInput id="budget_min" name="budget_min" defaultValue={d?.budget_min} placeholder="예) 30,000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_max">예산 최대</Label>
              <MoneyInput id="budget_max" name="budget_max" defaultValue={d?.budget_max} placeholder="예) 45,000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="move_in_date">입주 희망일</Label>
            <DatePicker id="move_in_date" name="move_in_date" defaultValue={d?.move_in_date ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="must_have">필수 조건</Label>
            <Input id="must_have" name="must_have" defaultValue={d?.must_have ?? ""} placeholder="방 2개 이상, 주차" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exclude">제외 조건</Label>
            <Input id="exclude" name="exclude" defaultValue={d?.exclude ?? ""} placeholder="1층, 반지하" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="memo">메모</Label>
            <Textarea id="memo" name="memo" rows={3} defaultValue={d?.memo ?? ""} placeholder="가족 구성, 출퇴근 동선 등" />
          </div>
        </CardContent>
      </Card>

      <FormMessage state={state} />
      <FormActions>
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          취소
        </Link>
        <SubmitButton pending={pending} pendingText="저장 중…">
          {d ? "변경 저장" : "고객 저장"}
        </SubmitButton>
      </FormActions>
    </form>
  );
}
