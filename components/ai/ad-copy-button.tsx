"use client";

import { useRef, useState, useTransition } from "react";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AiAccessBadge } from "@/components/ai/ai-access-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { suggestPropertyAdCopy } from "@/lib/actions/ai-assist";
import { useBusy } from "@/lib/busy";

type AdDraft = {
  naver: string;
  zigbangDabang: string;
  highlights: string;
  nearbyCount: number;
};

function AdResult({
  title,
  description,
  value,
  onApply,
}: {
  title: string;
  description: string;
  value: string;
  onApply: () => void;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${title} 문구를 복사했어요.`);
    } catch {
      toast.error("문구를 복사하지 못했어요. 직접 선택해 복사해 주세요.");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Textarea value={value} readOnly rows={16} className="resize-none whitespace-pre-wrap text-sm leading-6" />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          <Copy data-icon="inline-start" />
          복사
        </Button>
        <Button type="button" size="sm" onClick={onApply}>
          매물 설명에 적용
        </Button>
      </div>
    </div>
  );
}

/** 같은 form 안의 필드를 읽어 플랫폼별 광고 문구를 만든다 */
export function AdCopyButton({ formId, aiAvailable = true }: { formId?: string; aiAvailable?: boolean }) {
  const [pending, start] = useTransition();
  const [draft, setDraft] = useState<AdDraft | null>(null);
  const sourceForm = useRef<HTMLFormElement | null>(null);
  useBusy(pending, "추천 광고 문구를 작성하고 있습니다…");

  const apply = (description: string) => {
    const form = sourceForm.current;
    if (!form) return;
    const descriptionInput = form.elements.namedItem("description");
    const highlightsInput = form.elements.namedItem("highlights");
    if (descriptionInput instanceof HTMLTextAreaElement) {
      descriptionInput.value = description;
      descriptionInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (highlightsInput instanceof HTMLInputElement && draft?.highlights) {
      highlightsInput.value = draft.highlights;
      highlightsInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    toast.success("선택한 광고 문구를 매물 설명에 적용했어요. 확인하고 저장하세요.");
    setDraft(null);
  };

  return (
    <>
      <span className="inline-flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={(event) => {
            if (!aiAvailable) {
              toast.error("구독 후 혹은 크레딧 결제 후 사용할 수 있어요. 설정 → AI·요금에서 확인해 주세요.");
              return;
            }
            const form = formId
              ? document.getElementById(formId)
              : event.currentTarget.closest("form");
            if (!(form instanceof HTMLFormElement)) {
              toast.error("매물 폼을 찾지 못했어요.");
              return;
            }
            sourceForm.current = form;
            start(async () => {
              const fd = new FormData(form);
              const result = await suggestPropertyAdCopy(fd);
              if (!result.ok) {
                toast.error(result.error);
                return;
              }
              setDraft(result);
            });
          }}
        >
          <Sparkles data-icon="inline-start" />
          추천 광고 문구
        </Button>
        <AiAccessBadge available={aiAvailable} compact />
      </span>

      <Dialog open={draft !== null} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>추천 광고 문구</DialogTitle>
            <DialogDescription>
              카카오 주변 장소 {draft?.nearbyCount ?? 0}건을 반영했어요. 플랫폼별 문구의 사실관계를 확인한 뒤
              복사하거나 매물 설명에 적용하세요.
            </DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="grid gap-4 lg:grid-cols-2">
              <AdResult
                title="네이버 부동산용"
                description="정돈된 헤드라인·핵심 요약·입지·중개업소 멘트"
                value={draft.naver}
                onApply={() => apply(draft.naver)}
              />
              <AdResult
                title="직방·다방용"
                description="모바일 제목·핵심 장점 3가지·상세 설명·문의 유도"
                value={draft.zigbangDabang}
                onApply={() => apply(draft.zigbangDabang)}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDraft(null)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
