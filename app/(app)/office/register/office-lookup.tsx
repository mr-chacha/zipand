"use client";

import { useState, useTransition } from "react";
import { Building2, Loader2, MapPin, Phone, Search, UserRound } from "lucide-react";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerOffice, searchOfficeRegistry, type RegistrySearchState } from "@/lib/actions/office";
import { useFormAction } from "@/lib/use-form-action";

export function OfficeLookup({ next, currentRegNo }: { next: string | null; currentRegNo: string | null }) {
  const search = useFormAction(searchOfficeRegistry);
  const result = search.state as RegistrySearchState | null;
  const [registering, startRegister] = useTransition();
  const [selected, setSelected] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const register = (regNo: string) => {
    setSelected(regNo);
    setRegisterError(null);
    startRegister(async () => {
      const res = await registerOffice(regNo, next);
      if (res?.error) setRegisterError(res.error);
    });
  };

  return (
    <div className="space-y-5">
      <form onSubmit={search.onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">사무소명</Label>
            <Input id="name" name="name" placeholder="예) 행복공인중개사사무소" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg_no">개설등록번호</Label>
            <Input id="reg_no" name="reg_no" placeholder="예) 11440-2020-00123" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="representative">대표자명</Label>
            <Input id="representative" name="representative" placeholder="예) 홍길동" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          등록증에 적힌 이름·번호와 정확히 일치해야 검색돼요. 둘 이상 입력하면 모두 일치하는 사무소만 보여요.
        </p>
        <FormMessage state={result?.error ? result : null} />
        <div className="flex justify-end">
          <SubmitButton pending={search.pending} pendingText="조회 중…">
            <Search data-icon="inline-start" />
            조회하기
          </SubmitButton>
        </div>
      </form>

      {result?.searched && (
        <div className="space-y-3 border-t pt-5">
          <p className="text-sm font-medium">
            조회 결과 {result.total ?? 0}건
            {(result.total ?? 0) > (result.items?.length ?? 0) && (
              <span className="font-normal text-muted-foreground"> · 상위 {result.items?.length}건만 표시돼요. 조건을 더 입력해 주세요.</span>
            )}
          </p>
          {result.items?.length === 0 && (
            <p className="rounded-lg bg-muted/50 py-8 text-center text-sm text-muted-foreground">
              일치하는 사무소가 없어요. 이름 띄어쓰기나 등록번호를 확인해 주세요.
            </p>
          )}
          {registerError && <FormMessage state={{ error: registerError }} />}
          <ul className="space-y-2">
            {result.items?.map((o) => (
              <li key={o.regNo} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Building2 className="size-4 text-muted-foreground" />
                    <p className="font-semibold">{o.name}</p>
                    {o.type && <Badge variant="secondary">{o.type}</Badge>}
                    {o.regNo === currentRegNo && <Badge>현재 등록됨</Badge>}
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
                <Button type="button" onClick={() => register(o.regNo)} disabled={registering}>
                  {registering && selected === o.regNo && <Loader2 data-icon="inline-start" className="animate-spin" />}이 사무소로 등록
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
