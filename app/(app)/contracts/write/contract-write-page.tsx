"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ContractWriteDialog,
  type ContractWriteEditSeed,
  type WriteDealOption,
  type WritePropertyOption,
} from "@/components/deal-forms/contract-write-dialog";
import type { RelatedFormsOfficeDefaults } from "@/components/deal-forms/related-forms-dialog";
import { refreshContractWriteOpener, tagContractWriteFormId } from "@/lib/open-contract-write";

/** 새 창·전용 페이지용 계약서 작성 셸 */
export function ContractWritePageClient({
  properties,
  deals,
  office,
  edit = null,
}: {
  properties: WritePropertyOption[];
  deals: WriteDealOption[];
  office: RelatedFormsOfficeDefaults;
  edit?: ContractWriteEditSeed | null;
}) {
  const router = useRouter();

  useEffect(() => {
    tagContractWriteFormId(edit?.formId ?? "");
  }, [edit?.formId]);

  return (
    <div className="fixed inset-0 z-50 overflow-scroll bg-background print:static">
      {/* 내용 최소 1200×900 — 창을 줄이면 이 래퍼에서 상하·좌우 스크롤 */}
      <div className="box-border min-h-[900px] w-[1200px] min-w-[1200px]">
        <ContractWriteDialog
          open
          presentation="page"
          properties={properties}
          deals={deals}
          office={office}
          edit={edit}
          onOpenChange={(next) => {
            if (next) return;
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
