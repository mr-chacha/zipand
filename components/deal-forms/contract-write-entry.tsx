"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import {
  ContractWriteButton,
  ContractWriteDialog,
  type WriteDealOption,
  type WritePropertyOption,
} from "@/components/deal-forms/contract-write-dialog";
import type { RelatedFormsOfficeDefaults } from "@/components/deal-forms/related-forms-dialog";
import { OfficeRequiredDialog } from "@/components/office-gate";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** 계약관리 헤더용: 게이트 + 작성 창 */
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

/** 계약서 관리 툴바 + ?write=1 로 창 열기 */
export function DocumentsWriteControls({
  properties,
  deals = [],
  office = null,
  children,
}: {
  properties: WritePropertyOption[];
  deals?: WriteDealOption[];
  office?: RelatedFormsOfficeDefaults | null;
  children?: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const writeParam = searchParams.get("write") === "1";
  const [manualOpen, setManualOpen] = useState(false);
  const open = manualOpen || writeParam;

  const setOpen = (next: boolean) => {
    setManualOpen(next);
    if (!next && writeParam) router.replace(pathname, { scroll: false });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={() => setOpen(true)}>
          <FileText data-icon="inline-start" />
          계약서 작성
        </Button>
        {children}
      </div>
      <ContractWriteDialog
        open={open}
        onOpenChange={setOpen}
        properties={properties}
        deals={deals}
        office={office}
      />
    </>
  );
}
