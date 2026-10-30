"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CreditCard, Lock, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AiAccessBadge } from "@/components/ai/ai-access-badge";
import { AudioAttach, type AttachedAudio } from "@/components/audio-attach";
import { useBusy } from "@/lib/busy";
import { FormMessage } from "@/components/form/form-message";
import { FormActions } from "@/components/form/form-actions";
import { SubmitButton } from "@/components/form/submit-button";
import { DatePicker } from "@/components/form/date-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { organizeVisitAudio, transcribeVisitAudio } from "@/lib/actions/ai-assist";
import { createVisit } from "@/lib/actions/visits";
import { NativeSelect } from "@/components/form/native-select";
import { CUSTOM_OPTION, DEFAULT_VISIT_CHECKLIST, VISIT_FIELD_LABELS, VISIT_FIELD_PLACEHOLDERS } from "@/lib/constants";
import { isoToKstLocal } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";
import { cn } from "@/lib/utils";

interface FieldRow {
  key: number;
  label: string;
  value: string;
}

const initialFields = (): FieldRow[] => VISIT_FIELD_LABELS.slice(0, 6).map((label, i) => ({ key: i, label, value: "" }));

function VisitFieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: FieldRow;
  onChange: (patch: Partial<FieldRow>) => void;
  onRemove: () => void;
}) {
  const known = (VISIT_FIELD_LABELS as readonly string[]).includes(field.label);
  const [labelChoice, setLabelChoice] = useState(known ? field.label : CUSTOM_OPTION);
  const [customLabel, setCustomLabel] = useState(known ? "" : field.label);
  const custom = labelChoice === CUSTOM_OPTION;
  const label = custom ? customLabel : labelChoice;

  return (
    <div className="grid grid-cols-[8rem_1fr_auto] items-start gap-2 sm:grid-cols-[10rem_1fr_auto]">
      <input type="hidden" name="field_label" value={label} />
      <div className="space-y-2">
        <NativeSelect
          aria-label="항목"
          options={[...VISIT_FIELD_LABELS, { value: CUSTOM_OPTION, label: "직접 입력" }]}
          value={labelChoice}
          onChange={(e) => {
            const next = e.target.value;
            setLabelChoice(next);
            onChange({ label: next === CUSTOM_OPTION ? customLabel : next });
          }}
        />
        {custom && (
          <Input
            value={customLabel}
            onChange={(e) => {
              setCustomLabel(e.target.value);
              onChange({ label: e.target.value });
            }}
            placeholder="항목명"
            aria-label="항목명"
          />
        )}
      </div>
      <Input
        name="field_value"
        value={field.value}
        onChange={(e) => onChange({ value: e.target.value })}
        placeholder={(!custom && VISIT_FIELD_PLACEHOLDERS[labelChoice]) || "내용"}
        aria-label={`${label || "항목"} 내용`}
      />
      <Button type="button" size="icon" variant="ghost" aria-label="항목 삭제" onClick={onRemove}>
        <Trash2 />
      </Button>
    </div>
  );
}

export function VisitForm({
  officeId,
  propertyId,
  aiAvailable,
}: {
  officeId: string;
  propertyId: string;
  aiAvailable: boolean;
}) {
  const [fields, setFields] = useState<FieldRow[]>(initialFields);
  const [generation, setGeneration] = useState(0);
  const [checklist, setChecklist] = useState<string[]>(DEFAULT_VISIT_CHECKLIST);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [newCheck, setNewCheck] = useState("");
  const [audio, setAudio] = useState<AttachedAudio | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [followUps, setFollowUps] = useState("");
  const [memo, setMemo] = useState("");
  const [aiPending, startAi] = useTransition();
  useBusy(aiPending, "임장 기록을 AI로 정리하고 있습니다…");
  const nextKey = useRef(100);
  const [visitedAt, setVisitedAt] = useState(() => isoToKstLocal(null));

  const { state, pending, onSubmit } = useFormAction(createVisit.bind(null, propertyId), {
    onSuccess: (result) => {
      setFields(initialFields());
      setVisitedAt(isoToKstLocal(null));
      setGeneration((g) => g + 1);
      setChecklist(DEFAULT_VISIT_CHECKLIST);
      setChecked({});
      setAudio(null);
      setTranscript("");
      setFollowUps("");
      setMemo("");
      toast.success(result.message);
    },
  });

  const addCheck = () => {
    const label = newCheck.trim();
    if (label && !checklist.includes(label)) setChecklist((c) => [...c, label]);
    setNewCheck("");
  };

  const needAudio = () => {
    if (!audio) {
      toast.error("음성 메모를 먼저 녹음하거나 올려 주세요.");
      return false;
    }
    if (!aiAvailable) {
      toast.error("구독 후 혹은 크레딧 결제 후 사용할 수 있어요. 설정 → AI·요금에서 확인해 주세요.");
      return false;
    }
    return true;
  };

  const runTranscribe = () => {
    if (!needAudio() || !audio) return;
    startAi(async () => {
      const r = await transcribeVisitAudio(propertyId, audio.path, audio.name);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      setTranscript(r.transcript);
      setMemo((m) => (m.trim() ? m : r.transcript));
      toast.success("받아쓰기를 채웠어요. 내용을 확인하고 저장하세요.");
    });
  };

  const runOrganize = () => {
    if (!needAudio() || !audio) return;
    startAi(async () => {
      const r = await organizeVisitAudio(propertyId, audio.path, audio.name);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const { draft } = r;
      if (draft.transcript) setTranscript(draft.transcript);
      if (draft.fields.length) {
        setFields(
          draft.fields.map((f) => ({
            key: nextKey.current++,
            label: f.label,
            value: f.value,
          }))
        );
        setGeneration((g) => g + 1);
      }
      if (draft.checklist_ok.length) {
        const nextChecks = { ...checked };
        const nextList = [...checklist];
        for (const label of draft.checklist_ok) {
          if (!nextList.includes(label)) nextList.push(label);
          nextChecks[label] = true;
        }
        setChecklist(nextList);
        setChecked(nextChecks);
      }
      if (draft.follow_ups.length) setFollowUps(draft.follow_ups.join("\n"));
      if (draft.memo) setMemo(draft.memo);
      else if (draft.transcript) setMemo((m) => (m.trim() ? m : draft.transcript));
      toast.success("AI가 항목을 정리했어요. 검토한 뒤 저장하세요.");
    });
  };

  return (
    <form key={generation} onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>음성 메모</CardTitle>
          <CardDescription>
          현장에서 녹음한 파일을 올려 기록 할 수 있습니다.<br/>
          텍스트 변환과 항목 자동 정리는 구독 또는 크레딧이 필요합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AudioAttach
            bucket="visit-audio"
            officeId={officeId}
            folderId={propertyId}
            filePrefix="임장메모"
            value={audio}
            onChange={setAudio}
            onBusyChange={setAudioBusy}
          />

          <div
            className={cn(
              "space-y-3 rounded-xl border p-3",
              aiAvailable ? "border-primary/25 bg-primary/5" : "border-amber-500/40 bg-amber-500/5"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {aiAvailable ? (
                    <Sparkles className="size-4 text-primary" />
                  ) : (
                    <Lock className="size-4 text-amber-700 dark:text-amber-400" />
                  )}
                  AI 음성 정리
                  <AiAccessBadge available={aiAvailable} />
                </p>
                <p className="text-xs text-muted-foreground">
                  {aiAvailable
                    ? "음성을 올린 뒤 아래 버튼으로 받아쓰기·항목 정리를 실행하세요."
                    : "텍스트 변환·항목 자동 정리는 결제(구독 또는 크레딧) 후에 사용할 수 있습니다."}
                </p>
              </div>
              {!aiAvailable && (
                <Link
                  href="/settings?tab=subscription"
                  className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
                >
                  <CreditCard data-icon="inline-start" />
                  구독·크레딧 결제
                </Link>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!aiAvailable || aiPending || audioBusy || !audio}
                title={
                  !aiAvailable
                    ? "구독 후 혹은 크레딧 결제 후 사용 가능"
                    : !audio
                      ? "음성을 먼저 올려 주세요"
                      : undefined
                }
                onClick={runTranscribe}
              >
                {!aiAvailable ? (
                  <Lock data-icon="inline-start" />
                ) : (
                  <Sparkles data-icon="inline-start" />
                )}
                음성 → 텍스트 변환
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!aiAvailable || aiPending || audioBusy || !audio}
                title={
                  !aiAvailable
                    ? "구독 후 혹은 크레딧 결제 후 사용 가능"
                    : !audio
                      ? "음성을 먼저 올려 주세요"
                      : undefined
                }
                onClick={runOrganize}
              >
                {!aiAvailable ? (
                  <Lock data-icon="inline-start" />
                ) : (
                  <Sparkles data-icon="inline-start" />
                )}
                AI 항목 자동 정리
              </Button>
            </div>

            {!aiAvailable && (
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                설정 → AI·요금에서 유료 플랜을 고르거나 크레딧을 충전하면 버튼이 활성화 됩니다.
              </p>
            )}
          </div>

          {transcript && (
            <div className="space-y-2">
              <Label htmlFor="transcript">받아쓰기 (참고용 · 저장 시 메모와 별개)</Label>
              <Textarea id="transcript" rows={4} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>현장 정보</CardTitle>
          <CardDescription>방향과 입주 가능일(날짜로 적은 경우)은 매물 정보에도 반영돼요.</CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFields((f) => [...f, { key: nextKey.current++, label: "", value: "" }])}
            >
              <Plus data-icon="inline-start" />
              항목 추가
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="visited_at">임장 일시</Label>
            <DatePicker id="visited_at" name="visited_at" withTime defaultValue={visitedAt} className="w-56" />
          </div>
          {fields.map((field) => (
            <VisitFieldRow
              key={field.key}
              field={field}
              onChange={(patch) => setFields((rows) => rows.map((r) => (r.key === field.key ? { ...r, ...patch } : r)))}
              onRemove={() => setFields((f) => f.filter((x) => x.key !== field.key))}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>시설 체크리스트</CardTitle>
          <CardDescription>이상 없음을 확인한 항목을 체크하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {checklist.map((label) => (
              <label key={label} className="flex items-center gap-2 text-sm">
                <input type="hidden" name="check_label" value={label} />
                {checked[label] && <input type="hidden" name={`check:${label}`} value="on" />}
                <Checkbox
                  checked={Boolean(checked[label])}
                  onCheckedChange={(v) => setChecked((c) => ({ ...c, [label]: Boolean(v) }))}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCheck}
              onChange={(e) => setNewCheck(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCheck();
                }
              }}
              placeholder="체크 항목 추가"
              className="max-w-xs"
            />
            <Button type="button" variant="outline" onClick={addCheck}>
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>추가 확인 사항 · 메모</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="follow_ups">추가 확인 사항 (줄바꿈으로 구분 · 고객 브리핑에 표시돼요)</Label>
            <Textarea
              id="follow_ups"
              name="follow_ups"
              rows={3}
              value={followUps}
              onChange={(e) => setFollowUps(e.target.value)}
              placeholder={"임대인에게 입주 가능일 서면 확인\n관리실에 주차 대수 확인"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">메모 (내부용)</Label>
            <Textarea
              id="memo"
              name="memo"
              rows={3}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="자유롭게 기록하세요"
            />
          </div>
        </CardContent>
      </Card>

      <FormMessage state={state?.error ? state : null} />
      <FormActions>
        <SubmitButton pending={pending} disabled={audioBusy || aiPending} pendingText="저장 중…">
          임장 기록 저장
        </SubmitButton>
      </FormActions>
    </form>
  );
}
