"use client";

import { useState, useTransition } from "react";
import { EyeOff, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { createDealFormShare, deleteDealFormShare } from "@/lib/actions/deal-forms";
import { useBusy } from "@/lib/busy";
import { formatDate } from "@/lib/format";

type ShareLink = { id: string; token: string; expires_at: string; view_count: number; expired: boolean };

/** 확정된 서식을 임대인·임차인에게 보내는 링크 (웹·앱 공통) */
export function DealFormShareLinks({
  formId,
  dealId,
  links,
  siteUrl,
}: {
  formId: string;
  dealId: string;
  links: ShareLink[];
  siteUrl: string;
}) {
  const [days, setDays] = useState("14");
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  const linkUrl = (token: string) => `${typeof window !== "undefined" ? window.location.origin : siteUrl}/f/${token}`;

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(linkUrl(token));
    toast.success("링크를 복사했어요. 임대인·임차인에게 보내주세요.");
  };

  const create = () =>
    startTransition(async () => {
      const result = await createDealFormShare(formId, Number(days));
      if (result.error || !result.token) {
        toast.error(result.error ?? "링크를 만들지 못했어요.");
        return;
      }
      await copy(result.token).catch(() => toast.success(result.message));
    });

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <p className="font-medium">임대인·임차인 공유</p>
        <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
          <EyeOff className="mt-0.5 size-3.5 shrink-0" />
          확정된 서식 내용과 사무소·매물 요약이 보여요.
        </p>
      </div>
      <div className="flex items-end gap-2 app:flex-col app:items-stretch">
        <NativeSelect
          aria-label="유효 기간"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="flex-1"
          options={[
            { value: "3", label: "3일" },
            { value: "7", label: "7일" },
            { value: "14", label: "14일" },
            { value: "30", label: "30일" },
          ]}
        />
        <Button onClick={create} disabled={pending} className="app:w-full">
          <Link2 data-icon="inline-start" />
          링크 생성·복사
        </Button>
      </div>
      {links.length > 0 && (
        <div className="divide-y rounded-lg border">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-1 px-3 py-2 text-xs">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono">/f/{link.token.slice(0, 10)}…</p>
                <p className="text-muted-foreground">
                  조회 {link.view_count}회 · {formatDate(link.expires_at)}까지
                  {link.expired && " · 만료"}
                </p>
              </div>
              <Button size="icon-sm" variant="ghost" aria-label="복사" disabled={link.expired} onClick={() => void copy(link.token)}>
                <Link2 />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="삭제"
                className="app:opacity-100"
                onClick={() =>
                  startTransition(async () => {
                    const result = await deleteDealFormShare(link.id, formId, dealId);
                    if (result.error) toast.error(result.error);
                    else if (result.message) toast.success(result.message);
                  })
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
