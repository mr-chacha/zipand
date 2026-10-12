"use client";

import { useEffect, useRef, useState } from "react";
import { FileAudio, Loader2, Mic, Plus, Square, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ComingSoonButton } from "@/components/coming-soon";
import { FormMessage } from "@/components/form/form-message";
import { SubmitButton } from "@/components/form/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVisit } from "@/lib/actions/visits";
import { DEFAULT_VISIT_CHECKLIST, VISIT_FIELD_LABELS } from "@/lib/constants";
import { isoToKstLocal } from "@/lib/format";
import { uploadToStorage } from "@/lib/upload-client";
import { useFormAction } from "@/lib/use-form-action";

interface FieldRow {
  key: number;
  label: string;
}

const initialFields = (): FieldRow[] => VISIT_FIELD_LABELS.slice(0, 6).map((label, i) => ({ key: i, label }));

function formatSeconds(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

export function VisitForm({ officeId, propertyId }: { officeId: string; propertyId: string }) {
  const [fields, setFields] = useState<FieldRow[]>(initialFields);
  const [checklist, setChecklist] = useState<string[]>(DEFAULT_VISIT_CHECKLIST);
  const [newCheck, setNewCheck] = useState("");
  const [audio, setAudio] = useState<{ path: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const nextKey = useRef(100);
  const [visitedAt] = useState(() => isoToKstLocal(null));

  const { state, pending, onSubmit } = useFormAction(createVisit.bind(null, propertyId), {
    onSuccess: (result, form) => {
      form.reset();
      setFields(initialFields());
      setChecklist(DEFAULT_VISIT_CHECKLIST);
      setAudio(null);
      toast.success(result.message);
    },
  });

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const uploadAudio = async (file: File) => {
    setUploading(true);
    try {
      const path = await uploadToStorage("visit-audio", officeId, propertyId, file);
      setAudio({ path, name: file.name });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "음성 파일 업로드에 실패했어요.");
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("이 브라우저에서는 녹음을 지원하지 않아요. 음성 파일을 업로드해 주세요.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = recorder.mimeType.split(";")[0] || "audio/webm";
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(chunksRef.current, { type });
        uploadAudio(new File([blob], `임장메모-${Date.now()}.${ext}`, { type }));
      };
      recorder.start();
      recorderRef.current = recorder;
      setElapsed(0);
      setRecording(true);
    } catch {
      toast.error("마이크 권한이 필요해요. 브라우저 설정에서 마이크를 허용해 주세요.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const addCheck = () => {
    const label = newCheck.trim();
    if (label && !checklist.includes(label)) setChecklist((c) => [...c, label]);
    setNewCheck("");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" name="audio_path" value={audio?.path ?? ""} />

      <Card>
        <CardHeader>
          <CardTitle>음성 메모</CardTitle>
          <CardDescription>현장에서 녹음하거나 녹음 파일을 올려 기록에 첨부해요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-4">
            <Button
              type="button"
              size="icon-lg"
              variant={recording ? "destructive" : "default"}
              className="size-14 rounded-full"
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading}
              aria-label={recording ? "녹음 중지" : "녹음 시작"}
            >
              {recording ? <Square className="size-5" /> : <Mic className="size-6" />}
            </Button>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">
                {recording
                  ? `녹음 중… ${formatSeconds(elapsed)}`
                  : uploading
                    ? "업로드 중…"
                    : audio
                      ? "음성 메모가 첨부됐어요"
                      : "버튼을 눌러 녹음을 시작하세요"}
              </p>
              {audio && !recording && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileAudio className="size-3.5" />
                  {audio.name}
                  <button type="button" onClick={() => setAudio(null)} className="hover:text-foreground" aria-label="첨부 해제">
                    <X className="size-3.5" />
                  </button>
                </p>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" disabled={uploading || recording} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <FileAudio data-icon="inline-start" />}
              파일 업로드
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAudio(file);
                e.target.value = "";
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <ComingSoonButton size="sm">음성 → 텍스트 변환</ComingSoonButton>
            <ComingSoonButton size="sm">AI 항목 자동 정리</ComingSoonButton>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>현장 정보</CardTitle>
          <CardDescription>구두로 들은 정보는 메모 칸에 출처를 남겨주세요 (예: 임대인 구두 안내)</CardDescription>
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
            <Input id="visited_at" name="visited_at" type="datetime-local" defaultValue={visitedAt} className="w-fit" />
          </div>
          {fields.map((field) => (
            <div key={field.key} className="grid grid-cols-[7rem_1fr_auto] gap-2 sm:grid-cols-[7rem_1fr_10rem_auto]">
              <Input name="field_label" defaultValue={field.label} placeholder="항목" aria-label="항목명" />
              <Input name="field_value" placeholder="내용" aria-label={`${field.label} 내용`} />
              <Input name="field_note" placeholder="출처·메모" aria-label="출처 메모" className="hidden sm:block" />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="항목 삭제"
                onClick={() => setFields((f) => f.filter((x) => x.key !== field.key))}
              >
                <Trash2 />
              </Button>
            </div>
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
      <div className="flex justify-end">
        <SubmitButton pending={pending} disabled={uploading || recording} pendingText="저장 중…">
          임장 기록 저장
        </SubmitButton>
      </div>
    </form>
  );
}
