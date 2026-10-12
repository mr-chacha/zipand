"use client";

import { useState } from "react";
import Link from "next/link";
import { ComingSoonPanel } from "@/components/coming-soon";
import { FormMessage } from "@/components/form/form-message";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEAL_TYPES, DIRECTIONS, PROPERTY_STATUSES, PROPERTY_TYPES } from "@/lib/constants";
import { useFormAction } from "@/lib/use-form-action";
import type { ActionState, Property } from "@/types";

function ChoiceGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly string[];
  value: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option}
            checked={option === value}
            onChange={() => onChange?.(option)}
            className="peer sr-only"
          />
          <span className="flex h-8 items-center rounded-lg border px-3 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:bg-muted">
            {option}
          </span>
        </label>
      ))}
    </div>
  );
}

interface PropertyFormProps {
  action: (prev: ActionState | null, fd: FormData) => Promise<ActionState>;
  members: { id: string; name: string }[];
  defaultValues?: Property;
  currentUserId: string;
  cancelHref: string;
}

export function PropertyForm({ action, members, defaultValues: d, currentUserId, cancelHref }: PropertyFormProps) {
  const { state, pending, onSubmit } = useFormAction(action);
  const [dealType, setDealType] = useState<string>(d?.deal_type ?? "전세");
  const [propertyType, setPropertyType] = useState<string>(d?.property_type ?? "아파트");

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {!d && (
        <ComingSoonPanel
          title="사진·음성으로 자동 입력"
          description="현장 음성 메모를 AI가 방향·채광·수리 필요 항목으로 정리해 채워주는 기능은 서비스 준비중이에요. 매물 저장 후 임장 기록에서 직접 입력할 수 있어요."
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>* 표시는 필수 항목이에요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>거래 유형 *</Label>
            <ChoiceGroup name="deal_type" options={DEAL_TYPES} value={dealType} onChange={setDealType} />
          </div>
          <div className="space-y-2">
            <Label>매물 유형 *</Label>
            <ChoiceGroup name="property_type" options={PROPERTY_TYPES} value={propertyType} onChange={setPropertyType} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">매물명 *</Label>
            <Input id="title" name="title" defaultValue={d?.title} placeholder="예: 래미안 리버뷰 102동 1503호" required />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">주소 *</Label>
              <Input id="address" name="address" defaultValue={d?.address} placeholder="도로명 또는 지번 주소" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">지역 (시·구)</Label>
              <Input id="region" name="region" defaultValue={d?.region ?? ""} placeholder="예: 마포구" />
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">상태 *</Label>
              <NativeSelect id="status" name="status" options={PROPERTY_STATUSES} defaultValue={d?.status ?? "임장 전"} />
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>가격 및 면적</CardTitle>
          <CardDescription>금액은 만원 단위로 입력해요</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="price">{dealType === "매매" ? "매매가" : "보증금"} (만원) *</Label>
            <Input id="price" name="price" inputMode="numeric" defaultValue={d?.price ?? ""} placeholder="52000" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthly_rent">월세 (만원)</Label>
            <Input
              id="monthly_rent"
              name="monthly_rent"
              inputMode="numeric"
              defaultValue={d?.monthly_rent ?? ""}
              placeholder={dealType === "월세" ? "85" : "월세 거래만 입력"}
              disabled={dealType !== "월세"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area_m2">전용면적 (㎡)</Label>
            <Input id="area_m2" name="area_m2" inputMode="decimal" defaultValue={d?.area_m2 ?? ""} placeholder="84.9" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenance_fee">관리비 (만원)</Label>
            <Input id="maintenance_fee" name="maintenance_fee" inputMode="numeric" defaultValue={d?.maintenance_fee ?? ""} placeholder="25" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="floor">해당 층</Label>
              <Input id="floor" name="floor" inputMode="numeric" defaultValue={d?.floor ?? ""} placeholder="15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_floors">전체 층</Label>
              <Input id="total_floors" name="total_floors" inputMode="numeric" defaultValue={d?.total_floors ?? ""} placeholder="25" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direction">방향</Label>
            <NativeSelect id="direction" name="direction" options={DIRECTIONS} placeholder="선택 안 함" defaultValue={d?.direction ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rooms">방</Label>
              <Input id="rooms" name="rooms" inputMode="numeric" defaultValue={d?.rooms ?? ""} placeholder="3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baths">욕실</Label>
              <Input id="baths" name="baths" inputMode="numeric" defaultValue={d?.baths ?? ""} placeholder="2" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="available_from">입주 가능일</Label>
            <Input id="available_from" name="available_from" type="date" defaultValue={d?.available_from ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>설명 및 메모</CardTitle>
          <CardDescription>내부 메모는 고객 브리핑에 노출되지 않아요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="description">매물 설명 (고객 공개)</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={d?.description ?? ""} placeholder="장점, 주변 환경 등" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="highlights">장점 키워드 (쉼표 또는 줄바꿈으로 구분)</Label>
            <Input id="highlights" name="highlights" defaultValue={d?.highlights.join(", ") ?? ""} placeholder="남향, 역세권, 주차 1.5대" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internal_memo">내부 메모 (비공개)</Label>
            <Textarea id="internal_memo" name="internal_memo" rows={3} defaultValue={d?.internal_memo ?? ""} placeholder="임대인 협의 사항, 확인 필요 사항 등" />
          </div>
        </CardContent>
      </Card>

      <FormMessage state={state} />
      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          취소
        </Link>
        <SubmitButton pending={pending} pendingText="저장 중…">{d ? "변경 저장" : "매물 저장"}</SubmitButton>
      </div>
    </form>
  );
}
