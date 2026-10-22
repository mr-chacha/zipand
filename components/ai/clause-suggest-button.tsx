"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AiAccessBadge } from "@/components/ai/ai-access-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addDealClause } from "@/lib/actions/deals";
import { suggestDealClauses } from "@/lib/actions/ai-assist";
import type { ClauseSuggestion } from "@/lib/ai/types";
import { useBusy } from "@/lib/busy";

export function ClauseSuggestButton({ dealId, aiAvailable }: { dealId: string; aiAvailable: boolean }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ClauseSuggestion[]>([]);
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  useBusy(pending);

  const run = () => {
    if (!aiAvailable) {
      toast.error("구독 후 혹은 크레딧 결제 후 사용할 수 있어요. 설정 → AI·요금에서 확인해 주세요.");
      return;
    }
    start(async () => {
      const r = await suggestDealClauses(dealId);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setItems(r.suggestions);
      setPicked(Object.fromEntries(r.suggestions.map((_, i) => [i, true])));
      setOpen(true);
    });
  };

  const apply = () => {
    start(async () => {
      const selected = items.filter((_, i) => picked[i]);
      if (!selected.length) {
        toast.error("넣을 특약을 선택해 주세요.");
        return;
      }
      for (const s of selected) {
        const res = await addDealClause(dealId, s.body);
        if (res.error) {
          toast.error(res.error);
          return;
        }
      }
      setOpen(false);
      toast.success(`${selected.length}개 특약 초안을 추가했어요. 문구를 검토하세요.`);
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={run}>
          {pending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Sparkles data-icon="inline-start" />}
          AI 특약 추천
        </Button>
        <AiAccessBadge available={aiAvailable} compact />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>AI 특약 추천</DialogTitle>
            <DialogDescription>초안이에요. 거래 조건에 맞게 수정한 뒤 사용하세요.</DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {items.map((s, i) => (
              <li key={`${s.title}-${i}`} className="rounded-lg border p-3">
                <label className="flex items-start gap-2">
                  <Checkbox
                    checked={Boolean(picked[i])}
                    onCheckedChange={(v) => setPicked((p) => ({ ...p, [i]: Boolean(v) }))}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 space-y-1">
                    <span className="block text-sm font-medium">{s.title}</span>
                    {s.reason && <span className="block text-xs text-muted-foreground">{s.reason}</span>}
                    <span className="block text-sm whitespace-pre-wrap">{s.body}</span>
                    {s.expert_review && (
                      <span className="block text-xs text-warning">전문가 검토 권장</span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              닫기
            </Button>
            <Button type="button" disabled={pending} onClick={apply}>
              선택한 특약 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
