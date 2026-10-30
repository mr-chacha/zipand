"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import {
  ContractWriteButton,
  type WriteDealOption,
  type WritePropertyOption,
} from "@/components/deal-forms/contract-write-dialog";
import type { RelatedFormsOfficeDefaults } from "@/components/deal-forms/related-forms-dialog";
import { OfficeRequiredDialog } from "@/components/office-gate";
import { Button, buttonVariants } from "@/components/ui/button";
import { openContractWriteWindow } from "@/lib/open-contract-write";
import { cn } from "@/lib/utils";

/** 계약관리 헤더용: 게이트 + 새 창 작성 */
export function ContractWriteEntry({
  properties,
  deals = [],
  office = null,
  blocked,
  isOwner,
  variant = "outline",
}: {
  properties: WritePropertyOption[];
  deals?: WriteDealOption[];
  office?: RelatedFormsOfficeDefaults | null;
  blocked: boolean;
  isOwner: boolean;
  variant?: "default" | "outline" | "secondary";
}) {
  const [gateOpen, setGateOpen] = useState(false);
  if (blocked) {
    return (
      <>
        <button type="button" className={cn(buttonVariants({ variant }))} onClick={() => setGateOpen(true)}>
          <FileText data-icon="inline-start" />
          계약서 작성
        </button>
        <OfficeRequiredDialog open={gateOpen} onOpenChange={setGateOpen} kind="deal" isOwner={isOwner} next="/contracts" />
      </>
    );
  }
  return (
    <ContractWriteButton properties={properties} deals={deals} office={office} variant={variant}>
      <FileText data-icon="inline-start" />
      계약서 작성
    </ContractWriteButton>
  );
}

/** 계약서 관리 툴바 — 작성은 새 창으로 연다 */
export function DocumentsWriteControls({
  children,
  trailing,
}: {
  properties?: WritePropertyOption[];
  deals?: WriteDealOption[];
  office?: RelatedFormsOfficeDefaults | null;
  children?: React.ReactNode;
  trailing?: React.ReactNode;
  editSeed?: unknown;
  onEditSeedChange?: (seed: null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => openContractWriteWindow()}>
          <FileText data-icon="inline-start" />
          계약서 작성
        </Button>
        {children}
      </div>
      {trailing}
    </div>
  );
}
