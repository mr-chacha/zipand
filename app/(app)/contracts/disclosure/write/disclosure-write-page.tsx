"use client";

import { useEffect, useState } from "react";
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

/** 계약서 작성 창에서 전환된 확인설명서 전용 페이지 */
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

  useEffect(() => {
    setSeed(peekDisclosureWriteSeed());
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
