"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { FormMessage } from "@/components/form/form-message";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { SignalBadge } from "@/components/status-badge";
import { DatePicker } from "@/components/form/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useBusy } from "@/lib/busy";
import { extractDocumentFields, extractDocumentFieldsAi } from "@/lib/actions/document-extract";
import {
  addDocumentField,
  addDocumentSignal,
  completeReview,
  deleteDocument,
  deleteDocumentField,
  deleteDocumentSignal,
  reopenReview,
  setAllFieldsReviewed,
  setFieldReviewed,
  setSignalReviewed,
  updateDocumentIssuedAt,
} from "@/lib/actions/documents";
import { SIGNAL_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useFormAction } from "@/lib/use-form-action";
import type { DocumentField, DocumentSignal } from "@/types";

interface DocumentReviewProps {
  documentId: string;
  docType: string;
  status: string;
  issuedAt: string | null;
  presets: string[];
  fields: DocumentField[];
  signals: DocumentSignal[];
}

export function DocumentReview({
  documentId,
  docType,
  status,
  issuedAt,
  presets,
  fields,
  signals,
}: DocumentReviewProps) {
  const [pending, startTransition] = useTransition();
  const [reviewPending, startReviewToggle] = useTransition();
  const [extracting, setExtracting] = useState(false);
  const [localFields, setLocalFields] = useState(fields);
  const [localSignals, setLocalSignals] = useState(signals);
  useBusy(pending || extracting || reviewPending);
  const reviewedCount = localFields.filter((f) => f.reviewed).length;
  const reviewedSignalCount = localSignals.filter((signal) => signal.reviewed).length;
  const allReviewed = localFields.length > 0 && reviewedCount === localFields.length;
  const hasAiResult = localFields.some((field) => field.ai_generated);
  const done = status === "검토 완료";

  const run = (fn: () => Promise<{ error?: string; message?: string }>) =>
    startTransition(async () => {
      const result = await fn();
      if (result.error) toast.error(result.error);
      else if (result.message) toast.success(result.message);
    });

  const toggleReviewed = (fieldId: string, reviewed: boolean) => {
    const prev = localFields;
    setLocalFields((rows) => rows.map((f) => (f.id === fieldId ? { ...f, reviewed } : f)));
    startReviewToggle(async () => {
      const result = await setFieldReviewed(fieldId, documentId, reviewed);
      if (result.error) {
        setLocalFields(prev);
        toast.error(result.error);
      }
    });
  };

  const toggleAllReviewed = (reviewed: boolean) => {
    if (!localFields.length) return;
    const prev = localFields;
    setLocalFields((rows) => rows.map((f) => ({ ...f, reviewed })));
    startReviewToggle(async () => {
      const result = await setAllFieldsReviewed(documentId, reviewed);
      if (result.error) {
        setLocalFields(prev);
        toast.error(result.error);
      }
    });
  };

  const toggleSignalReviewed = (signalId: string, reviewed: boolean) => {
    const prev = localSignals;
    setLocalSignals((rows) => rows.map((signal) => (signal.id === signalId ? { ...signal, reviewed } : signal)));
    startReviewToggle(async () => {
      const result = await setSignalReviewed(signalId, documentId, reviewed);
      if (result.error) {
        setLocalSignals(prev);
        toast.error(result.error);
      }
    });
  };

  const runExtract = () => {
    setExtracting(true);
    startTransition(async () => {
      try {
        const result =
          docType === "등기사항증명서"
            ? await extractDocumentFieldsAi(documentId)
            : await extractDocumentFields(documentId);
        if (result.error) toast.error(result.error);
        else if (result.message) toast.success(result.message);
      } finally {
        setExtracting(false);
      }
    });
  };

  return (
    <Card className="flex min-h-0 flex-col xl:sticky xl:top-4 xl:max-h-[calc(100vh-5.5rem)]">
      <CardHeader className="shrink-0 space-y-2 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>핵심 항목 정리</CardTitle>
            <CardDescription>
              {docType === "등기사항증명서"
                ? "AI가 원문을 정리한 결과예요. 항목과 확인 사항을 모두 원문과 대조해 주세요."
                : "체크는 「원문과 대조했다」는 표시예요. 전부 체크해야 검토 완료할 수 있어요."}
            </CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={pending || extracting || done} onClick={runExtract}>
            {extracting ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : docType === "등기사항증명서" ? (
              <Sparkles data-icon="inline-start" />
            ) : null}
            {extracting
              ? "정리 중…"
              : docType === "등기사항증명서"
                ? hasAiResult
                  ? "AI 다시 요약"
                  : "AI 요약"
                : "자동 추출"}
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="issued_at">발급일</Label>
            <DatePicker
              id="issued_at"
              defaultValue={issuedAt ?? ""}
              className="w-44"
              onChange={(value) => {
                if (value !== (issuedAt ?? "")) run(() => updateDocumentIssuedAt(documentId, value || null));
              }}
            />
          </div>
          <p className="pb-2 text-xs text-muted-foreground">계약 직전 최신본인지 확인</p>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pt-0">
        <Tabs defaultValue="fields" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="shrink-0">
            <TabsTrigger value="fields">
              추출 항목 {fields.length > 0 && `(${reviewedCount}/${fields.length})`}
            </TabsTrigger>
            <TabsTrigger value="signals">
              확인 사항 {localSignals.length > 0 && `(${reviewedSignalCount}/${localSignals.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pt-2 data-[state=inactive]:hidden">
            <div className="space-y-3 pb-1">
              {localFields.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">아직 입력한 항목이 없어요.</p>
              )}
              {localFields.length > 0 && (
                <label
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm",
                    done ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted/40"
                  )}
                >
                  <Checkbox
                    checked={allReviewed}
                    disabled={done}
                    onCheckedChange={(v) => toggleAllReviewed(Boolean(v))}
                    aria-label="추출 항목 전체 확인"
                  />
                  <span className="font-medium">전체 확인</span>
                  <span className="text-xs text-muted-foreground">
                    ({reviewedCount}/{localFields.length})
                  </span>
                </label>
              )}
              {localFields.map((field) => (
                <div
                  key={field.id}
                  role="button"
                  tabIndex={done ? -1 : 0}
                  aria-pressed={field.reviewed}
                  aria-label={`${field.label} 원문 대조 ${field.reviewed ? "확인됨" : "미확인"}`}
                  onClick={() => {
                    if (!done) toggleReviewed(field.id, !field.reviewed);
                  }}
                  onKeyDown={(e) => {
                    if (done) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleReviewed(field.id, !field.reviewed);
                    }
                  }}
                  className={cn(
                    "flex gap-3 rounded-lg border p-3 outline-none transition-colors",
                    done ? "cursor-default" : "cursor-pointer hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50",
                    field.reviewed && "border-primary/30 bg-primary/5"
                  )}
                >
                  <Checkbox
                    checked={field.reviewed}
                    disabled={done}
                    tabIndex={-1}
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={(v) => toggleReviewed(field.id, Boolean(v))}
                    aria-label="원문과 대조 확인"
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-xs text-muted-foreground">{field.label}</span>
                      {field.ai_generated && (
                        <span className="text-[10px] font-medium text-primary">
                          AI · 신뢰도 {field.confidence ?? 50}%
                        </span>
                      )}
                      <span className="whitespace-pre-wrap text-sm font-medium">{field.value}</span>
                    </div>
                    {(field.evidence_text || field.page) && (
                      <p className="rounded bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                        {field.page && <span className="mr-1 font-medium">p.{field.page}</span>}
                        {field.evidence_text && `"${field.evidence_text}"`}
                      </p>
                    )}
                  </div>
                  <div
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <ConfirmAction
                      appOnly
                      action={() => deleteDocumentField(field.id, documentId)}
                      title="추출 항목을 삭제할까요?"
                      description="삭제하면 되돌릴 수 없어요."
                      trigger={
                        <Button size="icon-sm" variant="ghost" aria-label="항목 삭제" disabled={pending}>
                          <Trash2 />
                        </Button>
                      }
                    />
                  </div>
                </div>
              ))}
              <FieldForm documentId={documentId} presets={presets} />
            </div>
          </TabsContent>

          <TabsContent value="signals" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 pt-2 data-[state=inactive]:hidden">
            <div className="space-y-3 pb-1">
              {localSignals.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">기록된 확인 사항이 없어요.</p>
              )}
              {localSignals.map((signal) => (
                <div
                  key={signal.id}
                  className={cn(
                    "space-y-1.5 rounded-lg border p-3 transition-colors",
                    signal.reviewed && "border-primary/30 bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={signal.reviewed}
                      disabled={done}
                      onCheckedChange={(value) => toggleSignalReviewed(signal.id, Boolean(value))}
                      aria-label={`${signal.title} 원문 대조 확인`}
                    />
                    <SignalBadge level={signal.level} />
                    <p className="flex-1 text-sm font-medium">{signal.title}</p>
                    {signal.ai_generated && (
                      <span className="text-[10px] font-medium text-primary">
                        AI · 신뢰도 {signal.confidence ?? 50}%
                      </span>
                    )}
                    <ConfirmAction
                      appOnly
                      action={() => deleteDocumentSignal(signal.id, documentId)}
                      title="확인 사항을 삭제할까요?"
                      description="삭제하면 되돌릴 수 없어요."
                      trigger={
                        <Button size="icon-sm" variant="ghost" aria-label="확인 사항 삭제" disabled={pending}>
                          <Trash2 />
                        </Button>
                      }
                    />
                  </div>
                  {signal.description && <p className="text-sm text-muted-foreground">{signal.description}</p>}
                  {(signal.evidence_text || signal.page) && (
                    <p className="rounded bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                      {signal.page && <span className="mr-1 font-medium">p.{signal.page}</span>}
                      {signal.evidence_text && `"${signal.evidence_text}"`}
                    </p>
                  )}
                  {signal.next_action && <p className="text-xs">다음 행동: {signal.next_action}</p>}
                </div>
              ))}
              <SignalForm documentId={documentId} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex shrink-0 items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>
            {docType === "등기사항증명서"
              ? "AI 요약은 법률 판단이 아닌 업무 참고용입니다. 신뢰도와 원문 근거를 확인하고, 복잡한 권리관계는 전문가에게 검토받으세요."
              : "정리 결과는 업무 참고용입니다. 정리 결과를 확인한 후 계약서를 작성해 주세요."}
          </span>
        </div>
      </CardContent>
      <CardFooter className="shrink-0 flex flex-wrap justify-between gap-2 border-t bg-card">
        <ConfirmAction
          action={() => deleteDocument(documentId)}
          title="문서를 삭제할까요?"
          description="원본 파일과 정리한 항목이 모두 삭제되며 되돌릴 수 없어요."
          trigger={
            <Button variant="ghost" className="text-destructive">
              <Trash2 data-icon="inline-start" />
              문서 삭제
            </Button>
          }
        />
        {done ? (
          <Button variant="outline" disabled={pending} onClick={() => run(() => reopenReview(documentId))}>
            <RotateCcw data-icon="inline-start" />
            다시 검토
          </Button>
        ) : (
          <Button
            disabled={
              pending ||
              reviewPending ||
              localFields.length === 0 ||
              reviewedCount < localFields.length ||
              reviewedSignalCount < localSignals.length
            }
            onClick={() => run(() => completeReview(documentId))}
            title={
              localFields.length > 0 && reviewedCount < localFields.length
                ? `확인하지 않은 항목이 ${localFields.length - reviewedCount}개 있어요`
                : reviewedSignalCount < localSignals.length
                  ? `확인하지 않은 확인 사항이 ${localSignals.length - reviewedSignalCount}개 있어요`
                : undefined
            }
          >
            <CheckCircle2 data-icon="inline-start" />
            검토 완료
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

function FieldForm({ documentId, presets }: { documentId: string; presets: string[] }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const { state, pending, onSubmit } = useFormAction(addDocumentField.bind(null, documentId), {
    onSuccess: (_s, form) => {
      form.reset();
      setLabel("");
    },
  });

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        항목 추가
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-dashed p-3">
      <div className="flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setLabel(p)}
            className="rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-primary/10 hover:text-primary"
          >
            {p}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input name="label" placeholder="항목명" value={label} onChange={(e) => setLabel(e.target.value)} required />
        <Input name="value" placeholder="값 (예: 1억 2천만원)" required />
      </div>
      <div className="grid gap-2 sm:grid-cols-[80px_1fr]">
        <Input name="page" type="number" min={1} placeholder="페이지" />
        <Input name="evidence_text" placeholder="원문 근거 문구" />
      </div>
      <FormMessage state={state} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          닫기
        </Button>
        <SubmitButton size="sm" pending={pending}>
          추가
        </SubmitButton>
      </div>
    </form>
  );
}

function SignalForm({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const { state, pending, onSubmit } = useFormAction(addDocumentSignal.bind(null, documentId), {
    onSuccess: (_s, form) => form.reset(),
  });

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(true)}>
        <Plus data-icon="inline-start" />
        확인 사항 추가
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-lg border border-dashed p-3">
      <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
        <NativeSelect name="level" options={SIGNAL_LEVELS} defaultValue="확인 필요" />
        <Input name="title" placeholder="제목 (예: 채권최고액이 매매가 대비 높음)" required />
      </div>
      <Textarea name="description" rows={2} placeholder="설명" />
      <div className="grid gap-2 sm:grid-cols-[80px_1fr]">
        <Input name="page" type="number" min={1} placeholder="페이지" />
        <Input name="evidence_text" placeholder="원문 근거 문구" />
      </div>
      <Input name="next_action" placeholder="다음 행동 (예: 임대인에게 말소 계획 확인)" />
      <FormMessage state={state} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          닫기
        </Button>
        <SubmitButton size="sm" pending={pending}>
          추가
        </SubmitButton>
      </div>
    </form>
  );
}
