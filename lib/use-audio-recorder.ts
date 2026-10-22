"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { hasNativeRecorder, readNativeFile, ZipandRecorder } from "@/lib/native-recorder";

export interface Recording {
  file: File;
  durationSec: number;
  /** 앱 녹음 원본 경로 — 업로드에 성공한 뒤 discardRecording으로 지운다 */
  nativePath?: string;
}

/** 업로드가 끝난 앱 녹음 원본 삭제 (실패 시에는 남겨 두어 다시 시도할 수 있게) */
export function discardRecording(recording: Recording) {
  if (recording.nativePath) ZipandRecorder.discard({ path: recording.nativePath }).catch(() => {});
}

const noopSubscribe = () => () => {};

/**
 * 녹음 공용 훅.
 * - 안드로이드 앱: 네이티브 녹음(포그라운드 서비스) — 화면이 꺼지거나 다른 앱을 써도 계속 녹음
 * - 웹: 바로 녹음 불가 — 파일 업로드만 (AudioAttach에서 안내)
 */
export function useAudioRecorder({ filePrefix, onRecorded }: { filePrefix: string; onRecorded: (recording: Recording) => void }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const native = useSyncExternalStore(noopSubscribe, hasNativeRecorder, () => false);
  const onRecordedRef = useRef(onRecorded);
  useEffect(() => {
    onRecordedRef.current = onRecorded;
  });

  const recording = startedAt !== null;

  // 다른 화면에 갔다 와도 앱 녹음이 이어지고 있으면 상태를 되살린다
  useEffect(() => {
    if (!native) return;
    ZipandRecorder.status()
      .then((s) => s.recording && s.startedAt && setStartedAt(s.startedAt))
      .catch(() => {});
  }, [native]);

  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  const stamp = () => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  };

  const start = async () => {
    if (!native) {
      toast.error("바로 녹음은 앱에서만 가능해요. 음성 파일을 업로드해 주세요.");
      return;
    }
    try {
      const { startedAt } = await ZipandRecorder.start();
      setNow(Date.now());
      setStartedAt(startedAt);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "녹음을 시작하지 못했어요.");
    }
  };

  const stop = async () => {
    if (!native) {
      setStartedAt(null);
      return;
    }
    setStartedAt(null);
    try {
      const result = await ZipandRecorder.stop();
      const file = await readNativeFile(result.path, `${filePrefix}-${stamp()}.m4a`, result.mimeType);
      onRecordedRef.current({ file, durationSec: Math.round(result.durationMs / 1000), nativePath: result.path });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "녹음을 저장하지 못했어요.");
    }
  };

  return {
    native,
    recording,
    elapsedSec: startedAt === null ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000)),
    start,
    stop,
  };
}
