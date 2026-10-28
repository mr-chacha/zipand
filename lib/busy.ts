"use client";

import { useEffect, useSyncExternalStore } from "react";

export const BUSY_LABELS = {
  save: "저장 중입니다…",
  delete: "삭제 중입니다…",
  default: "처리 중입니다…",
} as const;

let seq = 0;
let entries: { id: number; label: string }[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 진행 중인 작업을 등록하고 루트의 전체 화면 로딩 오버레이에 표시한다. */
export function useBusy(active: boolean, label: string = BUSY_LABELS.default) {
  useEffect(() => {
    if (!active) return;
    const id = ++seq;
    entries = [...entries, { id, label }];
    emit();
    return () => {
      entries = entries.filter((entry) => entry.id !== id);
      emit();
    };
  }, [active, label]);
}

/** 가장 최근에 시작된 작업의 문구. 진행 중인 작업이 없으면 null */
export function useBusyLabel() {
  return useSyncExternalStore(
    subscribe,
    () => entries.at(-1)?.label ?? null,
    () => null
  );
}
