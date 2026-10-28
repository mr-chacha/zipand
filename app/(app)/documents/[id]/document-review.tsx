"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/form/confirm-action";
import { FormMessage } from "@/components/form/form-message";
import { NativeSelect } from "@/components/form/native-select";
import { SubmitButton } from "@/components/form/submit-button";
import { SignalBadge } from "@/components/status-badge";
import { DatePicker } from "@/components/form/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useBusy } from "@/lib/busy";
import { extractDocumentFieldsAi } from "@/lib/actions/document-extract";
import {
  addDocumentField,
  addDocumentSignal,
  completeReview,
  deleteDocumentField,
  deleteDocumentSignal,
  reopenReview,
  setAllFieldsReviewed,
  setFieldReviewed,
  setSignalReviewed,
  updateDocumentField,
  updateDocumentIssuedAt,
} from "@/lib/actions/documents";
import { SIGNAL_LEVELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useFormAction } from "@/lib/use-form-action";
import type { DocumentField, DocumentSignal } from "@/types";

interface DocumentReviewProps {
  documentId: string;
  docType: string;
  extractionStatus: string;
  extractionError: string | null;
  status: string;
  issuedAt: string | null;
  presets: string[];
  fields: DocumentField[];
  signals: DocumentSignal[];
}

export function DocumentReview({
  documentId,
  docType,
  extractionStatus,
  extractionError,
  status,
  issuedAt,
  presets,
  fields,
  signals,
}: DocumentReviewProps) {
  const [pending, startTransition] = useTransition();
  const [reviewPending, startReviewToggle] = useTransition();
  const [extracting, setExtracting] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [localFields, setLocalFields] = useState(fields);
  const [localSignals, setLocalSignals] = useState(signals);
  useBusy(pending || extracting || reviewPending, extracting ? "서류를 AI로 추출하고 있습니다…" : undefined);
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
        const result = await extractDocumentFieldsAi(documentId);
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
           AI를 사용하여 서류의 핵심 내용을 추출하여, 계약서 작성시 자동으로 입력하여 계약서 작성 시간을 줄이세요.
            </CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" disabled={pending || extracting} onClick={runExtract}>
            <Sparkles data-icon="inline-start" />
            {hasAiResult ? "AI 다시 추출" : "AI 추출"}
          </Button>
        </div>
        {extractionStatus === "미추출" && (
          <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            아직 AI 추출하지 않은 서류예요. 목록에서 선택하거나 위 버튼으로 추출하세요.
          </p>
        )}
        {extractionStatus === "추출 실패" && extractionError && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{extractionError}</p>
        )}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                {localFields.length > 0 ? (
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
                ) : (
                  <span />
                )}
                {done ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => run(() => reopenReview(documentId))}
                  >
                    <RotateCcw data-icon="inline-start" />
                    다시 검토
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
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
              </div>
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
                    "flex flex-wrap gap-3 rounded-lg border p-3 outline-none transition-colors",
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
                    className="flex items-center"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="항목 수정"
                      disabled={pending}
                      onClick={() => setEditingFieldId((current) => (current === field.id ? null : field.id))}
                    >
                      <Pencil />
                    </Button>
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
                  {editingFieldId === field.id && (
                    <div
                      className="w-full"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <FieldEditForm
                        documentId={documentId}
                        field={field}
                        presets={presets}
                        onClose={() => setEditingFieldId(null)}
                      />
                    </div>
                  )}
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
            추출결과는 필히 검토하시고, 잘못된 내용은 수정 후 계약서를 작성해주세요.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldEditForm({
  documentId,
  field,
  presets,
  onClose,
}: {
  documentId: string;
  field: DocumentField;
  presets: string[];
  onClose: () => void;
}) {
  const [label, setLabel] = useState(field.label);
  const { state, pending, onSubmit } = useFormAction(
    updateDocumentField.bind(null, field.id, documentId),
    { onSuccess: onClose }
  );

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-dashed bg-background p-3">
      <div className="flex flex-wrap gap-1">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setLabel(preset)}
            className="rounded-full bg-muted px-2 py-0.5 text-xs hover:bg-primary/10 hover:text-primary"
          >
            {preset}
          </button>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input name="label" value={label} onChange={(event) => setLabel(event.target.value)} required />
        <Input name="value" defaultValue={field.value} required />
      </div>
      <div className="grid gap-2 sm:grid-cols-[80px_1fr]">
        <Input name="page" type="number" min={1} defaultValue={field.page ?? ""} placeholder="페이지" />
        <Input name="evidence_text" defaultValue={field.evidence_text ?? ""} placeholder="원문 근거 문구" />
      </div>
      <FormMessage state={state} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          취소
        </Button>
        <SubmitButton size="sm" pending={pending}>
          수정 저장
        </SubmitButton>
      </div>
    </form>
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
