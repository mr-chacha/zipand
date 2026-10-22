"use client";

import { useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AiAccessBadge } from "@/components/ai/ai-access-badge";
import { Button } from "@/components/ui/button";
import { suggestPropertyAdCopy } from "@/lib/actions/ai-assist";

/** 같은 form 안의 필드를 읽어 매물 설명·장점 키워드를 채운다 */
export function AdCopyButton({ formId, aiAvailable = true }: { formId?: string; aiAvailable?: boolean }) {
  const [pending, start] = useTransition();

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!aiAvailable) {
            toast.error("구독 후 혹은 크레딧 결제 후 사용할 수 있어요. 설정 → AI·요금에서 확인해 주세요.");
            return;
          }
          start(async () => {
            const form = (formId ? document.getElementById(formId) : null) ?? document.querySelector("form");
            if (!(form instanceof HTMLFormElement)) {
              toast.error("매물 폼을 찾지 못했어요.");
              return;
            }
            const fd = new FormData(form);
            const r = await suggestPropertyAdCopy(fd);
            if (!r.ok) {
              toast.error(r.error);
              return;
            }
            const desc = form.elements.namedItem("description");
            const hl = form.elements.namedItem("highlights");
            if (desc instanceof HTMLTextAreaElement && r.description) desc.value = r.description;
            if (hl instanceof HTMLInputElement && r.highlights) hl.value = r.highlights;
            toast.success("광고 문구 초안을 채웠어요. 확인하고 저장하세요.");
          });
        }}
      >
        {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
        AI 광고 문구
      </Button>
      <AiAccessBadge available={aiAvailable} compact />
    </span>
  );
}
