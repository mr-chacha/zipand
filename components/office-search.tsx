"use client";

import { Building2, Loader2, MapPin, Phone, Search, UserRound } from "lucide-react";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { searchOfficeRegistry, type RegistrySearchState } from "@/lib/actions/office";
import type { RegistryOffice } from "@/lib/office-registry";
import { useFormAction } from "@/lib/use-form-action";

/** 공공데이터 공인중개사사무소 검색 + 결과 목록. 결과를 고르면 onSelect로 넘긴다. */
export function OfficeSearch({
  onSelect,
  selectLabel = "선택",
  currentRegNo,
  busyRegNo,
  disabled,
  defaultRepresentative,
}: {
  onSelect: (office: RegistryOffice) => void;
  selectLabel?: string;
  currentRegNo?: string | null;
  busyRegNo?: string | null;
  disabled?: boolean;
  defaultRepresentative?: string;
}) {
  const search = useFormAction(searchOfficeRegistry);
  const result = search.state as RegistrySearchState | null;

  return (
    <div className="space-y-4">
      <form onSubmit={search.onSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="registry-name">사무소명</Label>
            <Input id="registry-name" name="name" placeholder="예) 행복공인중개사사무소" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="registry-reg-no">개설등록번호</Label>
            <Input id="registry-reg-no" name="reg_no" placeholder="예) 11440-2020-00123" />
            <p className="text-xs text-muted-foreground">등록증에 적힌 그대로 &lsquo;-&rsquo;까지 입력해 주세요.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="registry-representative">대표자명</Label>
            <Input id="registry-representative" name="representative" placeholder="예) 홍길동" defaultValue={defaultRepresentative} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          등록증에 적힌 이름·번호와 정확히 일치해야 검색돼요(띄어쓰기 포함). 둘 이상 입력하면 모두 일치하는 사무소만 보여요.
        </p>
        <FormMessage state={result?.error ? result : null} />
        <div className="flex justify-end">
          <SubmitButton variant="outline" pending={search.pending} pendingText="조회 중…">
            <Search data-icon="inline-start" />
            사무소 조회
          </SubmitButton>
        </div>
      </form>

      {result?.searched && (
        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">
            조회 결과 {result.total ?? 0}건
            {(result.total ?? 0) > (result.items?.length ?? 0) && (
              <span className="font-normal text-muted-foreground"> · 상위 {result.items?.length}건만 표시돼요. 조건을 더 입력해 주세요.</span>
            )}
          </p>
          {result.items?.length === 0 && (
            <p className="rounded-lg bg-muted/50 py-6 text-center text-sm text-muted-foreground">
              일치하는 사무소가 없어요. 이름 띄어쓰기나 등록번호를 확인해 주세요.
            </p>
          )}
          <ul className="space-y-2">
            {result.items?.map((o) => (
              <li key={o.regNo} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
                <RegistryOfficeInfo office={o} current={o.regNo === currentRegNo} />
                <Button type="button" size="sm" onClick={() => onSelect(o)} disabled={disabled || Boolean(busyRegNo)}>
                  {busyRegNo === o.regNo && <Loader2 data-icon="inline-start" className="animate-spin" />}
                  {selectLabel}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function RegistryOfficeInfo({ office: o, current }: { office: RegistryOffice; current?: boolean }) {
  return (
    <div className="min-w-0 flex-1 space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Building2 className="size-4 text-muted-foreground" />
        <p className="font-semibold">{o.name}</p>
        {o.type && <Badge variant="secondary">{o.type}</Badge>}
        {current && <Badge>현재 등록됨</Badge>}
      </div>
      <dl className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
        <div>개설등록번호 {o.regNo}</div>
        {o.representative && (
          <div className="flex items-center gap-1">
            <UserRound className="size-3" />
            대표 {o.representative}
          </div>
        )}
        {(o.roadAddress || o.lotAddress) && (
          <div className="flex items-center gap-1 sm:col-span-2">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{o.roadAddress ?? o.lotAddress}</span>
          </div>
        )}
        {o.phone && (
          <div className="flex items-center gap-1">
            <Phone className="size-3" />
            {o.phone}
          </div>
        )}
        {o.baseDate && <div>데이터 기준 {o.baseDate}</div>}
      </dl>
    </div>
  );
}
