"use client";

import { useState } from "react";
import { Download, EyeOff, Link2, Phone, Sparkles } from "lucide-react";
import { PropertyThumbnail } from "@/components/property-thumbnail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, toPyeong } from "@/lib/format";
import type { Property } from "@/types";

const sectionOptions = [
  { key: "photos", label: "사진" },
  { key: "price", label: "거래 금액" },
  { key: "specs", label: "면적·층·방향" },
  { key: "description", label: "중개사 설명" },
  { key: "highlights", label: "확인된 장점" },
  { key: "followUps", label: "추가 확인 사항" },
  { key: "contact", label: "중개사 연락처" },
] as const;

type SectionKey = (typeof sectionOptions)[number]["key"];

interface BriefingBuilderProps {
  property: Property;
  followUps: string[];
  broker: { name: string; office: string; phone: string };
}

export function BriefingBuilder({ property, followUps, broker }: BriefingBuilderProps) {
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    photos: true,
    price: true,
    specs: true,
    description: true,
    highlights: true,
    followUps: true,
    contact: true,
  });
  const [comment, setComment] = useState(property.description);

  const toggle = (key: SectionKey) => setSections((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>포함할 항목</CardTitle>
            <CardDescription>미리보기에 바로 반영돼요</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {sectionOptions.map((option) => (
              <label key={option.key} className="flex items-center gap-2 text-sm">
                <Checkbox checked={sections[option.key]} onCheckedChange={() => toggle(option.key)} />
                {option.label}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>중개사 설명</CardTitle>
            <CardDescription>AI 초안을 수정해 사용하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={5} value={comment} onChange={(e) => setComment(e.target.value)} />
            <Button variant="outline" size="sm">
              <Sparkles data-icon="inline-start" />
              AI로 다시 작성
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          <EyeOff className="mt-0.5 size-4 shrink-0" />
          내부 메모, 임대인·고객 개인정보, 협의 중인 가격 조정 내용은 브리핑에 포함되지 않아요.
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline">
            <Link2 data-icon="inline-start" />
            모바일 링크 공유
          </Button>
          <Button>
            <Download data-icon="inline-start" />
            PDF 다운로드
          </Button>
        </div>
      </div>

      <div className="lg:col-span-3">
        <Label className="mb-2 block text-xs text-muted-foreground">미리보기</Label>
        <div className="mx-auto max-w-xl overflow-hidden rounded-xl border bg-white text-neutral-900 shadow-sm">
          {sections.photos && (
            <div className="grid grid-cols-3 gap-1">
              <PropertyThumbnail type={property.propertyType} className="col-span-3 aspect-[2/1]" />
              {[0, 1, 2].map((i) => (
                <PropertyThumbnail key={i} type={property.propertyType} className="aspect-[4/3] opacity-70" />
              ))}
            </div>
          )}
          <div className="space-y-5 p-6">
            <div className="space-y-1">
              <Badge variant="secondary">
                {property.propertyType} · {property.dealType}
              </Badge>
              <h2 className="text-xl font-bold">{property.title}</h2>
              <p className="text-sm text-neutral-500">{property.region}</p>
            </div>

            {sections.price && (
              <p className="text-2xl font-bold text-primary">
                {property.dealType} {formatPrice(property)}
                <span className="ml-1 text-sm font-normal text-neutral-500">만원</span>
              </p>
            )}

            {sections.specs && (
              <div className="grid grid-cols-3 gap-2 rounded-lg bg-neutral-50 p-3 text-center text-sm">
                <div>
                  <p className="text-xs text-neutral-500">전용면적</p>
                  <p className="font-medium">
                    {property.areaM2}㎡ ({toPyeong(property.areaM2)}평)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">층</p>
                  <p className="font-medium">
                    {property.floor}/{property.totalFloors}층
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">방향</p>
                  <p className="font-medium">{property.direction}</p>
                </div>
              </div>
            )}

            {sections.description && comment && (
              <div className="space-y-1">
                <p className="text-sm font-semibold">중개사 설명</p>
                <p className="text-sm leading-relaxed text-neutral-600">{comment}</p>
              </div>
            )}

            {sections.highlights && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">확인된 장점</p>
                <div className="flex flex-wrap gap-1.5">
                  {property.highlights.map((h) => (
                    <span key={h} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sections.followUps && followUps.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">추가 확인 사항</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600">
                  {followUps.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}

            {sections.contact && (
              <div className="flex items-center justify-between border-t pt-4 text-sm">
                <div>
                  <p className="font-semibold">{broker.office}</p>
                  <p className="text-neutral-500">담당 {broker.name}</p>
                </div>
                <span className="flex items-center gap-1 font-medium">
                  <Phone className="size-4" />
                  {broker.phone}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
