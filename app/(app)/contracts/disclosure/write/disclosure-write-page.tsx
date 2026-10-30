"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  WriteDealOption,
  WritePropertyOption,
} from "@/components/deal-forms/contract-write-dialog";
import {
  DisclosureWriteDialog,
  type DisclosureWriteSeed,
} from "@/components/deal-forms/disclosure-write-dialog";
import {
  clearDisclosureWriteSeed,
  peekDisclosureWriteSeed,
} from "@/lib/disclosure-write-seed";
import { refreshContractWriteOpener } from "@/lib/open-contract-write";

/** 계약서 작성에서 새 탭으로 연 확인설명서 전용 페이지 */
export function DisclosureWritePageClient({
  deals,
  properties,
}: {
  deals: WriteDealOption[];
  properties: WritePropertyOption[];
}) {
  const router = useRouter();
  const [seed, setSeed] = useState<DisclosureWriteSeed | null>(null);
  const [ready, setReady] = useState(false);
  const seedRead = useRef(false);

  useEffect(() => {
    if (seedRead.current) return;
    seedRead.current = true;
    const next = peekDisclosureWriteSeed();
    setSeed(next);
    // 새 탭 핸드오프용 — 한 번 읽으면 제거
    if (next) clearDisclosureWriteSeed();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background text-sm text-muted-foreground">
        확인설명서를 불러오는 중…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-scroll bg-background print:static">
      <div className="box-border min-h-[900px] w-[1200px] min-w-[1200px]">
        <DisclosureWriteDialog
          open
          presentation="page"
          deals={deals}
          properties={properties}
          seed={seed}
          onOpenChange={(next) => {
            if (next) return;
            clearDisclosureWriteSeed();
            refreshContractWriteOpener();
            if (typeof window !== "undefined" && window.opener) {
              window.close();
              return;
            }
            router.push("/contracts");
          }}
        />
      </div>
    </div>
  );
}
