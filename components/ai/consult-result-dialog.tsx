"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyConsultationDraft } from "@/lib/actions/ai-assist";
import type { ConsultationDraft, PropertyMatch } from "@/lib/ai/types";
import { useBusy } from "@/lib/busy";
import { formatManwon } from "@/lib/format";

function DraftBody({
  draft,
  matches,
  customerId,
  consultationId,
  onClose,
}: {
  draft: ConsultationDraft;
  matches: PropertyMatch[];
  customerId: string | null;
  consultationId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [applyCustomer, setApplyCustomer] = useState(true);
  const [sms, setSms] = useState(draft.sms_draft);
  const [summary, setSummary] = useState(draft.summary);
  useBusy(pending, "상담 분석 결과를 반영하고 있습니다…");

  return (
    <>
      <div className="space-y-4 text-sm">
        <dl className="grid grid-cols-2 gap-2 rounded-lg border p-3 text-xs">
          <div>
            <dt className="text-muted-foreground">고객명</dt>
            <dd>{draft.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">전화(파일명)</dt>
            <dd>{draft.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">거래</dt>
            <dd>{draft.deal_type || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">희망지역</dt>
            <dd>{draft.regions || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">예산(만원)</dt>
            <dd>
              {draft.budget_min ?? "—"} ~ {draft.budget_max ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">입주희망일</dt>
            <dd>{draft.move_in_date || "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">필수 / 제외</dt>
            <dd>
              {draft.must_have || "—"} / {draft.exclude || "—"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-muted-foreground">메모</dt>
            <dd className="whitespace-pre-wrap">{draft.memo || "—"}</dd>
          </div>
        </dl>

        <div className="space-y-1.5">
          <Label>상담 요약</Label>
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} />
        </div>
        {draft.transcript_excerpt && (
          <div className="rounded-lg border bg-muted/30 p-2 text-xs text-muted-foreground whitespace-pre-wrap">
            <p className="mb-1 font-medium text-foreground">근거 발화</p>
            {draft.transcript_excerpt}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>문자 초안</Label>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={async () => {
                await navigator.clipboard.writeText(sms);
                toast.success("문자를 복사했어요.");
              }}
            >
              <Copy data-icon="inline-start" />
              복사
            </Button>
          </div>
          <Textarea value={sms} onChange={(e) => setSms(e.target.value)} rows={3} />
        </div>

        {matches.length > 0 && (
          <div className="space-y-2">
            <p className="font-medium">추천 매물</p>
            <ul className="space-y-1.5">
              {matches.map((m) => (
                <li key={m.id} className="rounded-lg border px-3 py-2">
                  <Link href={`/properties/${m.id}`} className="font-medium hover:underline">
                    {m.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {m.deal_type}
                    {m.price != null ? ` · ${formatManwon(m.price)}` : ""}
                    {m.reason ? ` · ${m.reason}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {customerId && (
          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={applyCustomer} onCheckedChange={(v) => setApplyCustomer(v === true)} />
            고객 정보(이름·전화·희망조건 등)에도 반영
          </label>
        )}
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          닫기
        </Button>
        {customerId ? (
          <Button
            type="button"
            disabled={pending}
            onClick={() => {
              start(async () => {
                const payload = { ...draft, summary, sms_draft: sms };
                const r = await applyConsultationDraft(customerId, consultationId, payload, applyCustomer);
                if (!r.ok) toast.error(r.error);
                else {
                  toast.success(r.message);
                  onClose();
                  router.refresh();
                }
              });
            }}
          >
            검토 후 반영
          </Button>
        ) : null}
      </DialogFooter>
    </>
  );
}

export function ConsultResultDialog({
  open,
  onOpenChange,
  customerId,
  consultationId,
  draft,
  matches,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
  consultationId: string | null;
  draft: ConsultationDraft | null;
  matches: PropertyMatch[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            AI 상담 초안
          </DialogTitle>
          <DialogDescription>
            {draft?.provider === "gemini" ? "Gemini" : "OpenAI"} 결과예요. 저장 전에 꼭 검토하세요. 전화번호는
            파일명에 있을 때만 채워집니다.
          </DialogDescription>
        </DialogHeader>
        {draft ? (
          <DraftBody
            key={`${consultationId ?? "new"}-${draft.summary.slice(0, 40)}`}
            draft={draft}
            matches={matches}
            customerId={customerId}
            consultationId={consultationId}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
