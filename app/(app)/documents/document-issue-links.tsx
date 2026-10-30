"use client";

import { useMemo, useState } from "react";
import { Building2, ExternalLink, Landmark, MapPinned } from "lucide-react";
import { NativeSelect } from "@/components/form/native-select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KRAS_REGIONS, resolveKrasRegion } from "@/lib/kras";
import { cn } from "@/lib/utils";

const DIRECT_ISSUE_LINKS = [
  {
    label: "인터넷등기소",
    shortLabel: "인터넷등기",
    href: "https://www.iros.go.kr/",
    hint: "등기사항증명서",
    icon: Landmark,
  },
  {
    label: "건축물대장",
    shortLabel: "건축물대장",
    href: "https://plus.gov.kr/",
    hint: "정부24",
    icon: Building2,
  },
] as const;

type DocumentIssueLinksProps = {
  /** 매물 주소 — 있으면 해당 시·도 KRAS로 연결 */
  address?: string | null;
  /** card: 문서관리 안내 카드 / inline: 서류 탭 버튼 줄 */
  variant?: "card" | "inline";
};

function DirectIssueButtons({ compact }: { compact?: boolean }) {
  return (
    <>
      {DIRECT_ISSUE_LINKS.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            title={link.hint}
          >
            <Icon data-icon="inline-start" />
            {compact ? link.shortLabel : link.label}
            <ExternalLink data-icon="inline-end" className="opacity-60" />
          </a>
        );
      })}
    </>
  );
}

export function DocumentIssueLinks({ address, variant = "card" }: DocumentIssueLinksProps) {
  const matched = useMemo(() => resolveKrasRegion(address), [address]);
  const [region, setRegion] = useState<string>(() => matched?.label ?? KRAS_REGIONS[0].label);

  const selectedLabel = matched?.label ?? region;
  const selected = KRAS_REGIONS.find((r) => r.label === selectedLabel) ?? KRAS_REGIONS[0];

  function openKras() {
    window.open(selected.url, "_blank", "noopener,noreferrer");
  }

  if (variant === "inline") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <DirectIssueButtons compact />
        {matched ? (
          <a
            href={matched.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            title={`${matched.label} 부동산정보 통합 열람`}
          >
            <MapPinned data-icon="inline-start" />
            부동산종합공부
            <ExternalLink data-icon="inline-end" className="opacity-60" />
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ExternalLink className="size-4 text-primary" />
          서류 발급
        </CardTitle>
        <CardDescription>부동산 계약에 필요한 서류를 발급받을 수 있습니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <DirectIssueButtons />
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <MapPinned className="size-4 text-primary" />
            부동산종합 (KRAS)
          </div>
          <p className="text-xs text-muted-foreground">
            토지대장·건축물대장·토지이용계획·개별공시지가 정보를 열람할 수 있습니다.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <NativeSelect
              aria-label="시·도 선택"
              value={selectedLabel}
              onChange={(e) => setRegion(e.target.value)}
              options={KRAS_REGIONS.map((r) => ({ value: r.label, label: r.label }))}
              className="min-w-[10rem] flex-1"
              disabled={Boolean(matched)}
            />
            <Button type="button" size="sm" variant="outline" onClick={openKras}>
              <ExternalLink data-icon="inline-start" />
              열기
            </Button>
          </div>
          {matched ? (
            <p className="text-[11px] text-muted-foreground">매물 주소 기준 · {matched.label}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
