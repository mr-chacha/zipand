import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Mic, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "매물 등록" };

const dealTypes = ["매매", "전세", "월세"];
const propertyTypes = ["아파트", "오피스텔", "빌라", "원룸", "상가"];

function ChoiceGroup({ name, options, defaultValue }: { name: string; options: string[]; defaultValue: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <label key={option} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option}
            defaultChecked={option === defaultValue}
            className="peer sr-only"
          />
          <span className="flex h-8 items-center rounded-lg border px-3 text-sm transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary hover:bg-muted">
            {option}
          </span>
        </label>
      ))}
    </div>
  );
}

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="매물 등록"
        description="필수 정보만 먼저 입력하고, 상세 정보는 나중에 보완할 수 있어요."
        backHref="/properties"
        backLabel="매물 목록"
      />

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <div className="flex-1">
            <p className="font-medium">현장에 있나요? 사진과 음성으로 시작하세요</p>
            <p className="text-sm text-muted-foreground">
              음성 메모를 AI가 방향·채광·수리 필요 항목으로 정리해 매물 정보에 채워 넣어요.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Camera data-icon="inline-start" />
              사진
            </Button>
            <Button variant="outline">
              <Mic data-icon="inline-start" />
              음성
            </Button>
          </div>
        </CardContent>
      </Card>

      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>* 표시는 필수 항목이에요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>거래 유형 *</Label>
              <ChoiceGroup name="dealType" options={dealTypes} defaultValue="전세" />
            </div>
            <div className="space-y-2">
              <Label>매물 유형 *</Label>
              <ChoiceGroup name="propertyType" options={propertyTypes} defaultValue="아파트" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">매물명 *</Label>
              <Input id="title" placeholder="예: 래미안 리버뷰 102동 1503호" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">주소 *</Label>
              <div className="flex gap-2">
                <Input id="address" placeholder="도로명 또는 지번 주소" />
                <Button type="button" variant="outline">
                  주소 검색
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>가격 및 면적</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">매매가 / 보증금 (만원) *</Label>
              <Input id="price" inputMode="numeric" placeholder="52000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent">월세 (만원)</Label>
              <Input id="rent" inputMode="numeric" placeholder="월세인 경우 입력" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">전용면적 (㎡) *</Label>
              <Input id="area" inputMode="decimal" placeholder="84.9" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee">관리비 (만원)</Label>
              <Input id="fee" inputMode="numeric" placeholder="25" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="floor">해당 층</Label>
                <Input id="floor" inputMode="numeric" placeholder="15" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalFloors">전체 층</Label>
                <Input id="totalFloors" inputMode="numeric" placeholder="25" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="available">입주 가능일</Label>
              <Input id="available" type="date" />
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
              <Textarea id="description" rows={3} placeholder="장점, 주변 환경 등" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="memo">내부 메모 (비공개)</Label>
              <Textarea id="memo" rows={3} placeholder="임대인 협의 사항, 확인 필요 사항 등" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline">
            임시 저장
          </Button>
          <Link href="/properties/p-1001" className={cn(buttonVariants())}>
            저장하고 임장 기록하기
          </Link>
        </div>
      </form>
    </div>
  );
}
