"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AudioAttach, type AttachedAudio } from "@/components/audio-attach";
import { ComingSoonButton } from "@/components/coming-soon";
import { FormMessage } from "@/components/form/form-message";
import { FormActions } from "@/components/form/form-actions";
import { SubmitButton } from "@/components/form/submit-button";
import { DatePicker } from "@/components/form/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVisit } from "@/lib/actions/visits";
import { NativeSelect } from "@/components/form/native-select";
import { CUSTOM_OPTION, DEFAULT_VISIT_CHECKLIST, VISIT_FIELD_LABELS, VISIT_FIELD_PLACEHOLDERS } from "@/lib/constants";
import { isoToKstLocal } from "@/lib/format";
import { useFormAction } from "@/lib/use-form-action";

interface FieldRow {
  key: number;
  label: string;
}

const initialFields = (): FieldRow[] => VISIT_FIELD_LABELS.slice(0, 6).map((label, i) => ({ key: i, label }));

function VisitFieldRow({ initialLabel, onRemove }: { initialLabel: string; onRemove: () => void }) {
  const [labelChoice, setLabelChoice] = useState(initialLabel || CUSTOM_OPTION);
  const [customLabel, setCustomLabel] = useState("");
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
          onChange={(e) => setLabelChoice(e.target.value)}
        />
        {custom && (
          <Input value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="항목명" aria-label="항목명" />
        )}
      </div>
      <Input
        name="field_value"
        placeholder={(!custom && VISIT_FIELD_PLACEHOLDERS[labelChoice]) || "내용"}
        aria-label={`${label || "항목"} 내용`}
      />
      <Button type="button" size="icon" variant="ghost" aria-label="항목 삭제" onClick={onRemove}>
        <Trash2 />
      </Button>
    </div>
  );
}

export function VisitForm({ officeId, propertyId }: { officeId: string; propertyId: string }) {
  const [fields, setFields] = useState<FieldRow[]>(initialFields);
  const [generation, setGeneration] = useState(0);
  const [checklist, setChecklist] = useState<string[]>(DEFAULT_VISIT_CHECKLIST);
  const [newCheck, setNewCheck] = useState("");
  const [audio, setAudio] = useState<AttachedAudio | null>(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const nextKey = useRef(100);
  const [visitedAt, setVisitedAt] = useState(() => isoToKstLocal(null));

  const { state, pending, onSubmit } = useFormAction(createVisit.bind(null, propertyId), {
    onSuccess: (result) => {
      // 체크박스 등 내부 상태가 있는 입력은 form.reset()으로 초기화되지 않아 폼을 다시 마운트한다
      setFields(initialFields());
      setVisitedAt(isoToKstLocal(null));
      setGeneration((g) => g + 1);
      setChecklist(DEFAULT_VISIT_CHECKLIST);
      setAudio(null);
      toast.success(result.message);
    },
  });

  const addCheck = () => {
    const label = newCheck.trim();
    if (label && !checklist.includes(label)) setChecklist((c) => [...c, label]);
    setNewCheck("");
  };

  return (
    <form key={generation} onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>음성 메모</CardTitle>
          <CardDescription>현장에서 녹음하거나 녹음 파일을 올려 기록에 첨부해요</CardDescription>
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
          <div className="flex flex-wrap gap-2">
            <ComingSoonButton size="sm">음성 → 텍스트 변환</ComingSoonButton>
            <ComingSoonButton size="sm">AI 항목 자동 정리</ComingSoonButton>
          </div>
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
              onClick={() => setFields((f) => [...f, { key: nextKey.current++, label: "" }])}
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
              initialLabel={field.label}
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
                <Checkbox name={`check:${label}`} />
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
            <Textarea id="follow_ups" name="follow_ups" rows={3} placeholder={"임대인에게 입주 가능일 서면 확인\n관리실에 주차 대수 확인"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">메모 (내부용)</Label>
            <Textarea id="memo" name="memo" rows={3} placeholder="자유롭게 기록하세요" />
          </div>
        </CardContent>
      </Card>

      <FormMessage state={state?.error ? state : null} />
      <FormActions>
        <SubmitButton pending={pending} disabled={audioBusy} pendingText="저장 중…">
          임장 기록 저장
        </SubmitButton>
      </FormActions>
    </form>
  );
}
