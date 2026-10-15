"use client";

import { useEffect, useRef, useState } from "react";
import { FileAudio, Loader2, Mic, RotateCcw, Square, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AUDIO_MAX_BYTES, formatDuration, normalizeAudioFile, readAudioDuration } from "@/lib/audio";
import { toErrorMessage } from "@/lib/errors";
import { formatFileSize } from "@/lib/format";
import type { Bucket } from "@/lib/storage";
import { discardRecording, useAudioRecorder, type Recording } from "@/lib/use-audio-recorder";
import { removeFromStorage, uploadToStorage } from "@/lib/upload-client";

export interface AttachedAudio {
  path: string;
  name: string;
  size: number;
  durationSec: number | null;
}

/**
 * 녹음하기 / 녹음 파일 선택 → Storage 업로드 후 hidden input(audio_path·audio_name·audio_size·audio_duration_sec)으로 폼에 전달.
 * 앱에서는 화면이 꺼져도 녹음이 이어진다. 업로드 실패 시 녹음을 보관해 다시 시도할 수 있다.
 */
export function AudioAttach({
  bucket,
  officeId,
  folderId,
  filePrefix,
  value,
  onChange,
  onBusyChange,
  fileLabel = "파일 업로드",
  idleText = "버튼을 눌러 녹음을 시작하세요",
}: {
  bucket: Bucket;
  officeId: string;
  folderId: string;
  filePrefix: string;
  value: AttachedAudio | null;
  onChange: (value: AttachedAudio | null) => void;
  onBusyChange?: (busy: boolean) => void;
  fileLabel?: string;
  idleText?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState<Recording | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const setBusy = setUploading;

  const upload = async (recording: Recording) => {
    const file = normalizeAudioFile(recording.file);
    if (!file) {
      toast.error("m4a, mp3, wav, amr 등 음성 파일만 올릴 수 있어요.");
      return;
    }
    if (file.size > AUDIO_MAX_BYTES) {
      toast.error(`${formatFileSize(AUDIO_MAX_BYTES)} 이하 파일만 올릴 수 있어요.`);
      return;
    }
    setBusy(true);
    try {
      if (value) await removeFromStorage(bucket, [value.path]);
      const path = await uploadToStorage(bucket, officeId, folderId, file);
      onChange({ path, name: file.name, size: file.size, durationSec: recording.durationSec || null });
      discardRecording(recording);
      setFailed(null);
    } catch (e) {
      setFailed(recording);
      toast.error(`업로드하지 못했어요. 다시 시도해 주세요. (${toErrorMessage(e)})`);
    } finally {
      setBusy(false);
    }
  };

  const recorder = useAudioRecorder({ filePrefix, onRecorded: upload });
  const busy = uploading || recorder.recording;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  const pickFile = async (file: File) => {
    const durationSec = await readAudioDuration(file);
    await upload({ file, durationSec: durationSec ?? 0 });
  };

  const detach = () => {
    if (value) removeFromStorage(bucket, [value.path]);
    onChange(null);
  };

  const status = recorder.recording
    ? `녹음 중… ${formatDuration(recorder.elapsedSec)}`
    : uploading
      ? "업로드 중…"
      : failed
        ? "업로드에 실패했어요"
        : value
          ? "녹음이 첨부됐어요"
          : idleText;

  return (
    <div className="space-y-2">
      <input type="hidden" name="audio_path" value={value?.path ?? ""} />
      <input type="hidden" name="audio_name" value={value?.name ?? ""} />
      <input type="hidden" name="audio_size" value={value?.size ?? ""} />
      <input type="hidden" name="audio_duration_sec" value={value?.durationSec ?? ""} />
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 p-3">
        <Button
          type="button"
          size="icon-lg"
          variant={recorder.recording ? "destructive" : "default"}
          className="size-12 shrink-0 rounded-full"
          onClick={recorder.recording ? recorder.stop : recorder.start}
          disabled={uploading}
          aria-label={recorder.recording ? "녹음 중지" : "녹음 시작"}
        >
          {recorder.recording ? <Square className="size-5" /> : <Mic className="size-5" />}
        </Button>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{status}</p>
          {recorder.recording && (
            <p className="text-xs text-muted-foreground">
              {recorder.native ? "화면을 꺼도 녹음이 계속돼요" : "녹음이 끝날 때까지 이 화면을 켜 두세요"}
            </p>
          )}
          {value && !recorder.recording && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileAudio className="size-3.5 shrink-0" />
              <span className="truncate">{value.name}</span>
              {value.durationSec ? <span className="shrink-0">· {formatDuration(value.durationSec)}</span> : null}
              <button type="button" onClick={detach} className="shrink-0 hover:text-foreground" aria-label="첨부 해제">
                <X className="size-3.5" />
              </button>
            </p>
          )}
        </div>
        {failed && !uploading ? (
          <Button type="button" variant="outline" size="sm" onClick={() => upload(failed)}>
            <RotateCcw data-icon="inline-start" />
            다시 업로드
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={uploading || recorder.recording} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 data-icon="inline-start" className="animate-spin" /> : <FileAudio data-icon="inline-start" />}
            {fileLabel}
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="audio/*,.m4a,.amr,.3gp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) pickFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
