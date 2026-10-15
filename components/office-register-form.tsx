"use client";

import { useState } from "react";
import { BadgeCheck, Search, ShieldCheck } from "lucide-react";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { RegistryOfficeInfo } from "@/components/office-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerOffice } from "@/lib/actions/office";
import type { RegistryOffice } from "@/lib/office-registry";
import { useFormAction } from "@/lib/use-form-action";

const formatBusinessNo = (value: string) => {
  const d = value.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
};

const formatDateDigits = (value: string) => {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
};

/**
 * 조회해서 고른 사무소를 사업자등록정보로 인증하고 등록한다.
 * 국세청에서 사업자등록번호·개업일자·대표자명(개설등록 대표자)이 일치해야 등록된다.
 */
export function OfficeRegisterForm({
  office,
  next,
  onBack,
  phone,
  footerStart,
  submitLabel = "인증하고 등록",
}: {
  office: RegistryOffice;
  next: string;
  onBack: () => void;
  /** 지정하면 대표 전화 입력칸을 보여준다 */
  phone?: string;
  footerStart?: React.ReactNode;
  submitLabel?: string;
}) {
  const { state, pending, onSubmit } = useFormAction(registerOffice);
  const [businessNo, setBusinessNo] = useState("");
  const [startDate, setStartDate] = useState("");

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="reg_no" value={office.regNo} />
      <input type="hidden" name="next" value={next} />
      <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <BadgeCheck className="size-4" />
          공공데이터에서 찾은 사무소
        </div>
        <RegistryOfficeInfo office={office} />
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <Search data-icon="inline-start" />
          다른 사무소 찾기
        </Button>
      </div>

      <div className="space-y-3 rounded-lg border p-3">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium">사업자등록정보로 대표자 인증</p>
            <p className="text-xs text-muted-foreground">
              사업자등록증의 대표자가 개설등록 대표자
              {office.representative ? <b className="font-semibold text-foreground"> {office.representative}</b> : null}
              님과 같아야 등록돼요. 입력한 정보는 국세청 사업자등록 진위확인에만 사용해요.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="business_no">사업자등록번호</Label>
            <Input
              id="business_no"
              name="business_no"
              inputMode="numeric"
              placeholder="예) 123-45-67890"
              value={businessNo}
              onChange={(e) => setBusinessNo(formatBusinessNo(e.target.value))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start_date">개업일자</Label>
            <Input
              id="start_date"
              name="start_date"
              inputMode="numeric"
              placeholder="예) 2020-01-31"
              value={startDate}
              onChange={(e) => setStartDate(formatDateDigits(e.target.value))}
              required
            />
            <p className="text-xs text-muted-foreground">사업자등록증의 &lsquo;개업연월일&rsquo;</p>
          </div>
        </div>
      </div>

      {phone !== undefined && (
        <div className="space-y-1.5">
          <Label htmlFor="office_phone">대표 전화</Label>
          <Input id="office_phone" name="phone" type="tel" defaultValue={phone || office.phone || ""} placeholder="02-000-0000" required />
          <p className="text-xs text-muted-foreground">휴대폰 번호를 대표 번호로 써도 돼요.</p>
        </div>
      )}

      <FormMessage state={state} />
      <div className="flex items-center justify-between gap-2 pt-1">
        {footerStart ?? <span />}
        <SubmitButton pending={pending} pendingText="확인 중…">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
