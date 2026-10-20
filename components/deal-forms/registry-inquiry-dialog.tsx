"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, FileUp, Landmark } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/form/native-select";
import { cn } from "@/lib/utils";

export type RegistryPropertyOption = { value: string; label: string; address?: string };

/** 대법원 인터넷등기소 */
const IROS_URL = "https://www.iros.go.kr/";
/** 세움터(건축물대장 등) */
const EAIS_URL = "https://www.eais.go.kr/";
/** 토지이음(토지이용계획 등) */
const EUM_URL = "https://www.eum.go.kr/";

/**
 * 등기·공부 발급 안내 — CODEF 자동 열람 대신 관공서 사이트 연 뒤
 * 매물 서류함에 수동 업로드하는 흐름.
 */
export function RegistryInquiryDialog({
  open,
  onOpenChange,
  properties,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: RegistryPropertyOption[];
}) {
  const [propertyId, setPropertyId] = useState(properties[0]?.value ?? "");

  const uploadHref = propertyId
    ? `/documents?property=${encodeURIComponent(propertyId)}`
    : "/documents";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>공부서류 발급·업로드</DialogTitle>
          <DialogDescription>
            인터넷등기소 등에서 등본을 열람·발급한 뒤, 선택한 매물 서류함에 업로드하세요. 확인설명서 작성 시 업로드된
            서류와 문서 상세에 입력한 항목이 반영됩니다. (PDF 자동 인식·AI 추출은 준비중)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {properties.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              먼저{" "}
              <Link href="/properties/new" className="underline underline-offset-2">
                매물을 등록
              </Link>
              한 뒤 서류를 연결해 주세요.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="reg-property">업로드할 매물</Label>
              <NativeSelect
                id="reg-property"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                options={properties.map((p) => ({ value: p.value, label: p.label }))}
                className="w-full"
              />
            </div>
          )}

          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>아래 사이트에서 등기사항증명서·건축물대장·지적도 등을 열람·저장합니다.</li>
            <li>「서류함으로 이동」에서 매물을 고르고 PDF를 업로드합니다.</li>
            <li>문서 상세에서 소유자·면적·용도 등 핵심 항목을 직접 입력합니다.</li>
            <li>계약서·확인설명서 작성 시 해당 거래(매물)를 연결하면 입력값이 채워집니다.</li>
          </ol>

          <div className="grid gap-2">
            <Button
              type="button"
              className="w-full"
              onClick={() => window.open(IROS_URL, "_blank", "noopener,noreferrer")}
            >
              <Landmark data-icon="inline-start" />
              인터넷등기소 열기
              <ExternalLink className="ml-1 size-3.5 opacity-70" />
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(EAIS_URL, "_blank", "noopener,noreferrer")}
              >
                세움터(건축물대장)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(EUM_URL, "_blank", "noopener,noreferrer")}
              >
                토지이음
              </Button>
            </div>
            <Link
              href={uploadHref}
              className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
              onClick={() => onOpenChange(false)}
            >
              <FileUp data-icon="inline-start" />
              서류함으로 이동·업로드
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RegistryInquiryButton({ properties }: { properties: RegistryPropertyOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Landmark data-icon="inline-start" />
        등기·공부 발급
      </Button>
      <RegistryInquiryDialog open={open} onOpenChange={setOpen} properties={properties} />
    </>
  );
}
