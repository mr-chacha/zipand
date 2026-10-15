"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Ban, BookOpen, Check, Copy, ExternalLink, EyeOff, Link2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { FormMessage } from "@/components/form/form-message";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useBusy } from "@/lib/busy";
import {
  addChecklistItem,
  addDealClause,
  cancelDeal,
  createDealShare,
  deleteChecklistItem,
  deleteDeal,
  deleteDealClause,
  deleteDealShare,
  toggleChecklistItem,
  updateDealClause,
} from "@/lib/actions/deals";
import type { DealChecklistStage } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";
import type { DealChecklistItem, DealClause } from "@/types";
import { ClauseLibrary } from "../clause-library";

type Result = { error?: string; message?: string };

function useRunner() {
  const [pending, startTransition] = useTransition();
  useBusy(pending);
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

/** 상단 계약 취소: 사유를 입력하면 계약이 취소로 마무리된다 */
function DealCancelButton({ dealId }: { dealId: string }) {
  const [open, setOpen] = useState(false);
  const { state, pending, onSubmit, setState } = useFormAction(cancelDeal.bind(null, dealId), {
    onSuccess: (result) => {
      setOpen(false);
      if (result.message) toast.success(result.message);
    },
  });
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setState(null);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" className="text-destructive">
            <Ban data-icon="inline-start" />
            계약 취소
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>계약을 취소할까요?</DialogTitle>
          <DialogDescription>
            취소 사유를 남기면 계약이 &lsquo;취소&rsquo;로 마무리되고, 매물 상태는 &lsquo;광고 중&rsquo;으로 돌아가요. 임대인·임차인 공유
            링크도 함께 닫혀요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Textarea name="cancel_reason" rows={3} placeholder="예) 임차인 대출 불가로 계약 해제" aria-label="계약 취소 사유" required autoFocus />
          <FormMessage state={state} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={pending} />}>닫기</DialogClose>
            <SubmitButton variant="destructive" pending={pending} pendingText="취소하는 중…">
              계약 취소
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DealHeaderActions({ dealId, cancellable }: { dealId: string; cancellable: boolean }) {
  return (
    <div className="flex gap-2">
      {cancellable && <DealCancelButton dealId={dealId} />}
      <DealDeleteButton dealId={dealId} />
    </div>
  );
}

interface ShareLink {
  id: string;
  token: string;
  expires_at: string;
  view_count: number;
  created_at: string;
  expired: boolean;
}

/** 임대인·임차인에게 보낼 계약 진행 공유 링크 */
export function DealShareLinks({ dealId, links, siteUrl, disabled }: { dealId: string; links: ShareLink[]; siteUrl: string; disabled?: boolean }) {
  const [days, setDays] = useState("14");
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  const linkUrl = (token: string) => `${typeof window !== "undefined" ? window.location.origin : siteUrl}/d/${token}`;

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(linkUrl(token));
    toast.success("링크를 복사했어요. 임대인·임차인에게 메시지로 보내주세요.");
  };

  const create = () =>
    startTransition(async () => {
      const result = await createDealShare(dealId, Number(days));
      if (result.error || !result.token) {
        toast.error(result.error ?? "링크를 만들지 못했어요.");
        return;
      }
      await copy(result.token).catch(() => toast.success(result.message));
    });

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <EyeOff className="mt-0.5 size-3.5 shrink-0" />
        거래 조건·일정, 당사자 이름, 입금 계좌, 확인 사항, 특약이 보여요. 연락처·중개수수료·내부 메모는 보이지 않아요.
      </p>
      <div className="flex items-end gap-2">
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
        <Button onClick={create} disabled={pending || disabled}>
          {pending ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <Link2 data-icon="inline-start" />}
          링크 생성·복사
        </Button>
      </div>
      {links.length > 0 && (
        <div className="divide-y rounded-lg border">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-1 px-3 py-2 text-xs">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono">/d/{link.token.slice(0, 10)}…</p>
                <p className="text-muted-foreground">
                  조회 {link.view_count}회 · {formatDate(link.expires_at)}까지
                </p>
              </div>
              {link.expired ? (
                <Badge variant="outline">만료</Badge>
              ) : (
                <>
                  <Button size="icon-sm" variant="ghost" aria-label="링크 복사" onClick={() => copy(link.token)}>
                    <Copy />
                  </Button>
                  <a
                    href={`/d/${link.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                    aria-label="열기"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </>
              )}
              <ConfirmAction
                action={() => deleteDealShare(link.id, dealId)}
                title="공유 링크를 삭제할까요?"
                description="삭제하면 이 링크로 더 이상 계약 내용을 볼 수 없어요."
                successMessage="링크를 삭제했어요."
                trigger={
                  <Button size="icon-sm" variant="ghost" aria-label="링크 삭제">
                    <Trash2 />
                  </Button>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DealDeleteButton({ dealId }: { dealId: string }) {
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

export function DealChecklist({
  dealId,
  stage,
  items: serverItems,
}: {
  dealId: string;
  stage: DealChecklistStage;
  items: DealChecklistItem[];
}) {
  const { state, pending: adding, onSubmit } = useFormAction(addChecklistItem.bind(null, dealId, stage), {
    onSuccess: (_r, form) => form.reset(),
  });
  // 체크는 서버 응답을 기다리지 않고 바로 반영한다. 실패하면 서버 값으로 되돌아간다
  const [items, setOptimisticDone] = useOptimistic(serverItems, (state, update: { id: string; done: boolean }) =>
    state.map((i) => (i.id === update.id ? { ...i, done: update.done } : i))
  );
  const [, startToggle] = useTransition();
  const toggle = (id: string, done: boolean) =>
    startToggle(async () => {
      setOptimisticDone({ id, done });
      const result = await toggleChecklistItem(id, dealId, done);
      if (result.error) toast.error(result.error);
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
                  onCheckedChange={(v) => toggle(item.id, Boolean(v))}
                  aria-label={item.label}
                />
                <span className={cn("flex-1 text-sm", item.done && "text-muted-foreground line-through")}>{item.label}</span>
                <ConfirmAction
                  appOnly
                  action={() => deleteChecklistItem(item.id, dealId)}
                  title="확인 항목을 삭제할까요?"
                  description="삭제하면 되돌릴 수 없어요."
                  trigger={
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="항목 삭제"
                      className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 app:opacity-100"
                    >
                      <Trash2 />
                    </Button>
                  }
                />
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
                  <ConfirmAction
                    appOnly
                    action={() => deleteDealClause(clause.id, dealId)}
                    title="특약을 삭제할까요?"
                    description="삭제하면 되돌릴 수 없어요."
                    trigger={
                      <Button size="icon-xs" variant="ghost" aria-label="삭제" disabled={pending}>
                        <Trash2 />
                      </Button>
                    }
                  />
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
