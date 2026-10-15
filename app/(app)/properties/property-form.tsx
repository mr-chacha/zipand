"use client";

import { useState } from "react";
import Link from "next/link";
import { ComingSoonPanel } from "@/components/coming-soon";
import { FormMessage } from "@/components/form/form-message";
import { AreaInput, MoneyInput } from "@/components/form/number-input";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { DatePicker } from "@/components/form/date-picker";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEAL_TYPES, DIRECTIONS, PROPERTY_STATUSES, PROPERTY_TYPES } from "@/lib/constants";
import { useFormAction } from "@/lib/use-form-action";
import { removeFromStorage, uploadToStorage } from "@/lib/upload-client";
import type { ActionState, Property } from "@/types";
import { MaintenanceField } from "./maintenance-field";
import { MediaPicker, type PickedMedia } from "./media-picker";

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

const CONTACT_ROLES = [
  { key: "landlord", label: "임대인" },
  { key: "caretaker", label: "관리인" },
  { key: "tenant", label: "세입자" },
] as const;

interface PropertyFormProps {
  action: (prev: ActionState | null, fd: FormData) => Promise<ActionState>;
  members: { id: string; name: string }[];
  defaultValues?: Property;
  currentUserId: string;
  cancelHref: string;
  cancelLabel?: string;
  submitLabel?: string;
  /** 저장 후 이동할 주소 (시작하기 단계에서 사용) */
  redirectTo?: string;
  hideAutoFill?: boolean;
  /** 있으면 새 매물 등록 시 사진·동영상을 함께 올린다 */
  officeId?: string;
}

export function PropertyForm({
  action,
  members,
  defaultValues: d,
  currentUserId,
  cancelHref,
  cancelLabel = "취소",
  submitLabel,
  redirectTo,
  hideAutoFill,
  officeId,
}: PropertyFormProps) {
  const [photos, setPhotos] = useState<PickedMedia[]>([]);
  const [videos, setVideos] = useState<PickedMedia[]>([]);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  /** 새 매물: id를 먼저 정하고 사진·동영상을 Storage에 올린 뒤 경로만 서버로 보낸다 */
  const uploadMedia = async (fd: FormData) => {
    if (d || !officeId || (!photos.length && !videos.length)) return;
    const propertyId = crypto.randomUUID();
    fd.set("id", propertyId);
    const total = photos.length + videos.length;
    let done = 0;
    const uploaded: { photo: string[]; video: string[] } = { photo: [], video: [] };
    setUploadStatus(`업로드 중 0/${total}`);
    try {
      for (const photo of photos) {
        uploaded.photo.push(await uploadToStorage("property-photos", officeId, propertyId, photo.file));
        setUploadStatus(`업로드 중 ${++done}/${total}`);
      }
      for (const video of videos) {
        uploaded.video.push(await uploadToStorage("property-videos", officeId, propertyId, video.file));
        setUploadStatus(`업로드 중 ${++done}/${total}`);
      }
    } catch (e) {
      await Promise.all([
        removeFromStorage("property-photos", uploaded.photo),
        removeFromStorage("property-videos", uploaded.video),
      ]);
      throw e;
    } finally {
      setUploadStatus(null);
    }
    uploaded.photo.forEach((path) => fd.append("photo_paths", path));
    uploaded.video.forEach((path, i) => {
      fd.append("video_paths", path);
      fd.append("video_names", videos[i].file.name);
      fd.append("video_sizes", String(videos[i].file.size));
    });
  };

  const { state, pending, onSubmit } = useFormAction(action, { prepare: uploadMedia });
  const [dealType, setDealType] = useState<string>(d?.deal_type ?? "전세");
  const [propertyType, setPropertyType] = useState<string>(d?.property_type ?? "아파트");
  const [availableMode, setAvailableMode] = useState(d?.available_negotiable ? "negotiable" : d?.available_from ? "date" : "");

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}
      {!d && !hideAutoFill && (
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
            <Input id="title" name="title" defaultValue={d?.title} placeholder="예) 래미안 리버뷰 102동 1503호" required />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">주소 *</Label>
              <Input id="address" name="address" defaultValue={d?.address} placeholder="예) 서울시 마포구 월드컵북로 123" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">지역 (시·구)</Label>
              <Input id="region" name="region" defaultValue={d?.region ?? ""} placeholder="예) 마포구" />
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
            <MoneyInput id="price" name="price" defaultValue={d?.price} placeholder="예) 52,000" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthly_rent">월세 (만원)</Label>
            <MoneyInput
              id="monthly_rent"
              name="monthly_rent"
              defaultValue={d?.monthly_rent}
              placeholder={dealType === "월세" ? "예) 85" : "월세 거래만 입력"}
              disabled={dealType !== "월세"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="area_m2">전용면적 (㎡)</Label>
            <AreaInput id="area_m2" name="area_m2" defaultValue={d?.area_m2} placeholder="예) 84.9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="floor">해당 층</Label>
              <Input id="floor" name="floor" inputMode="numeric" defaultValue={d?.floor ?? ""} placeholder="예) 15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_floors">전체 층</Label>
              <Input id="total_floors" name="total_floors" inputMode="numeric" defaultValue={d?.total_floors ?? ""} placeholder="예) 25" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direction">방향</Label>
            <NativeSelect id="direction" name="direction" options={DIRECTIONS} placeholder="선택 안 함" defaultValue={d?.direction ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="rooms">방</Label>
              <Input id="rooms" name="rooms" inputMode="numeric" defaultValue={d?.rooms ?? ""} placeholder="예) 3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baths">욕실</Label>
              <Input id="baths" name="baths" inputMode="numeric" defaultValue={d?.baths ?? ""} placeholder="예) 2" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="available_mode">입주 가능일</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <NativeSelect
                id="available_mode"
                name="available_mode"
                options={[
                  { value: "negotiable", label: "협의 가능" },
                  { value: "date", label: "날짜 선택" },
                ]}
                placeholder="선택 안 함"
                value={availableMode}
                onChange={(e) => setAvailableMode(e.target.value)}
              />
              {availableMode === "date" && (
                <DatePicker
                  id="available_from"
                  name="available_from"
                  defaultValue={d?.available_from ?? ""}
                  aria-label="입주 가능 날짜"
                  defaultOpen={!d?.available_from}
                  required
                />
              )}
            </div>
          </div>
          <MaintenanceField status={d?.maintenance_status} fee={d?.maintenance_fee} items={d?.maintenance_items} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>관계자 연락처</CardTitle>
          <CardDescription>사무소 내부에서만 보이고 고객 브리핑에는 노출되지 않아요</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          {CONTACT_ROLES.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`${key}_phone`}>{label} 연락처</Label>
              <Input
                id={`${key}_phone`}
                name={`${key}_phone`}
                type="tel"
                defaultValue={d?.[`${key}_phone`] ?? ""}
                placeholder="예) 010-0000-0000"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {!d && officeId && (
        <Card>
          <CardHeader>
            <CardTitle>사진·동영상</CardTitle>
            <CardDescription>
              매물 저장 시 함께 올라가요. 저장 후에도 매물 상세에서 추가·삭제할 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MediaPicker
              photos={photos}
              videos={videos}
              onPhotosChange={setPhotos}
              onVideosChange={setVideos}
              disabled={pending}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>설명 및 메모</CardTitle>
          <CardDescription>내부 메모는 고객 브리핑에 노출되지 않아요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="description">매물 설명 (고객 공개)</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={d?.description ?? ""} placeholder="예) 한강 조망, 초등학교 도보 5분" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="highlights">장점 키워드 (쉼표 또는 줄바꿈으로 구분)</Label>
            <Input id="highlights" name="highlights" defaultValue={d?.highlights.join(", ") ?? ""} placeholder="예) 남향, 역세권, 주차 1.5대" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="internal_memo">내부 메모 (비공개)</Label>
            <Textarea id="internal_memo" name="internal_memo" rows={3} defaultValue={d?.internal_memo ?? ""} placeholder="예) 임대인 협의 사항, 확인 필요 사항" />
          </div>
        </CardContent>
      </Card>

      <FormMessage state={state} />
      <div className="flex justify-end gap-2">
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          {cancelLabel}
        </Link>
        <SubmitButton pending={pending} pendingText={uploadStatus ?? "저장 중…"}>
          {submitLabel ?? (d ? "변경 저장" : "매물 저장")}
        </SubmitButton>
      </div>
    </form>
  );
}
