"use client";

import { useState, useTransition } from "react";
import { BookOpen, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  addChecklistItem,
  addDealClause,
  deleteChecklistItem,
  deleteDeal,
  deleteDealClause,
  toggleChecklistItem,
  updateDealClause,
  updateDealStage,
} from "@/lib/actions/deals";
import { DEAL_STAGES, type DealStage } from "@/lib/constants";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";
import type { DealChecklistItem, DealClause } from "@/types";
import { ClauseLibrary } from "../clause-library";

type Result = { error?: string; message?: string };

function useRunner() {
  const [pending, startTransition] = useTransition();
  const run = (fn: () => Promise<Result>, onDone?: () => void) =>
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast.error(result.error);
      else {
        if (result.message) toast.success(result.message);
        onDone?.();
      }
    });
  return { pending, run };
}

export function DealHeaderActions({ dealId }: { dealId: string }) {
  return (
    <ConfirmAction
      action={() => deleteDeal(dealId)}
      title="거래를 삭제할까요?"
      description="체크리스트와 특약이 함께 삭제돼요. 매물 상태는 바뀌지 않아요."
      trigger={
        <Button variant="outline" className="text-destructive">
          <Trash2 data-icon="inline-start" />
          삭제
        </Button>
      }
    />
  );
}

export function DealStageSelect({ dealId, stage }: { dealId: string; stage: string }) {
  const { pending, run } = useRunner();
  const currentIndex = DEAL_STAGES.indexOf(stage as DealStage);
  return (
    <ol className="space-y-1">
      {DEAL_STAGES.map((s, i) => {
        const active = s === stage;
        const passed = s !== "취소" && stage !== "취소" && i < currentIndex;
        return (
          <li key={s}>
            <button
              type="button"
              disabled={pending || active}
              onClick={() => run(() => updateDealStage(dealId, s))}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                s === "취소" && !active && "text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[10px]",
                  active && "border-primary-foreground",
                  passed && "border-success bg-success text-white"
                )}
              >
                {passed ? <Check className="size-3" /> : i + 1}
              </span>
              {s}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function DealChecklist({ dealId, items }: { dealId: string; items: DealChecklistItem[] }) {
  const { pending, run } = useRunner();
  const { state, pending: adding, onSubmit } = useFormAction(addChecklistItem.bind(null, dealId), {
    onSuccess: (_r, form) => form.reset(),
  });
  const done = items.filter((i) => i.done).length;
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>진행률</span>
          <span className="text-muted-foreground tabular-nums">
            {done}/{items.length}
          </span>
        </div>
        <Progress value={items.length ? (done / items.length) * 100 : 0} />
      </div>

      {categories.map((category) => (
        <div key={category} className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">{category}</p>
          {items
            .filter((i) => i.category === category)
            .map((item) => (
              <div key={item.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
                <Checkbox
                  checked={item.done}
                  disabled={pending}
                  onCheckedChange={(v) => run(() => toggleChecklistItem(item.id, dealId, Boolean(v)))}
                  aria-label={item.label}
                />
                <span className={cn("flex-1 text-sm", item.done && "text-muted-foreground line-through")}>{item.label}</span>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label="항목 삭제"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  disabled={pending}
                  onClick={() => run(() => deleteChecklistItem(item.id, dealId))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
        </div>
      ))}

      <form onSubmit={onSubmit} className="flex gap-2">
        <Input name="category" placeholder="분류" list="checklist-categories" className="w-28" />
        <datalist id="checklist-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Input name="label" placeholder="확인 항목 추가" required className="flex-1" />
        <SubmitButton size="sm" variant="outline" pending={adding} className="h-8">
          <Plus data-icon="inline-start" />
          추가
        </SubmitButton>
      </form>
      <FormMessage state={state} />
    </div>
  );
}

interface OfficeClauseItem {
  id: string;
  category: string;
  title: string;
  body: string;
}

export function DealClauses({
  dealId,
  clauses,
  officeClauses,
}: {
  dealId: string;
  clauses: DealClause[];
  officeClauses: OfficeClauseItem[];
}) {
  const { pending, run } = useRunner();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const copyAll = async () => {
    const text = clauses.map((c, i) => `${i + 1}. ${c.body}`).join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("특약 전체를 복사했어요.");
  };

  return (
    <div className="space-y-4">
      {clauses.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">추가한 특약이 없어요.</p>}
      <ol className="space-y-2">
        {clauses.map((clause, i) => (
          <li key={clause.id} className="flex gap-2 rounded-lg border p-3">
            <span className="text-sm font-medium text-muted-foreground">{i + 1}.</span>
            {editing?.id === clause.id ? (
              <div className="flex-1 space-y-2">
                <Textarea rows={4} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    <X data-icon="inline-start" />
                    취소
                  </Button>
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => updateDealClause(clause.id, dealId, editing.body), () => setEditing(null))}
                  >
                    <Check data-icon="inline-start" />
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="flex-1 text-sm leading-relaxed whitespace-pre-wrap">{clause.body}</p>
                <div className="flex shrink-0 gap-0.5">
                  <Button size="icon-xs" variant="ghost" aria-label="수정" onClick={() => setEditing({ id: clause.id, body: clause.body })}>
                    <Pencil />
                  </Button>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label="삭제"
                    disabled={pending}
                    onClick={() => run(() => deleteDealClause(clause.id, dealId))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>

      <div className="space-y-2">
        <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="특약 문구 직접 입력" />
        <div className="flex flex-wrap justify-end gap-2">
          {clauses.length > 0 && (
            <Button size="sm" variant="ghost" onClick={copyAll}>
              전체 복사
            </Button>
          )}
          <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
            <DialogTrigger
              render={
                <Button size="sm" variant="outline">
                  <BookOpen data-icon="inline-start" />
                  라이브러리에서 선택
                </Button>
              }
            />
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>특약 라이브러리</DialogTitle>
                <DialogDescription>추가한 뒤 거래 조건(금액, 날짜 등)에 맞게 수정하세요.</DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-3">
                <ClauseLibrary
                  officeClauses={officeClauses}
                  pickDisabled={pending}
                  onPick={(body) => run(() => addDealClause(dealId, body))}
                />
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Button size="sm" disabled={pending || !draft.trim()} onClick={() => run(() => addDealClause(dealId, draft), () => setDraft(""))}>
            <Plus data-icon="inline-start" />
            특약 추가
          </Button>
        </div>
      </div>
    </div>
  );
}
