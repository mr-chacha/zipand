"use client";

import { Loader2 } from "lucide-react";
import { useBusyLabel } from "@/lib/busy";

/** 저장·삭제 등 서버 작업 중 화면 전체를 덮는 로딩 표시 (앱 전용) */
export function BusyOverlay() {
  const label = useBusyLabel();
  if (!label) return null;
  return (
    <div
      role="alertdialog"
      aria-busy="true"
      aria-live="assertive"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 backdrop-blur-[1px] animate-in fade-in duration-150"
    >
      <div className="flex min-w-44 flex-col items-center gap-3 rounded-2xl bg-background px-8 py-6 shadow-xl">
        <Loader2 className="size-9 animate-spin text-primary" />
        <p className="text-base font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">잠시만 기다려 주세요</p>
      </div>
    </div>
  );
}
