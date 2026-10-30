"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { BalanceSettlementSheet } from "@/components/deal-forms/balance-settlement-sheet";
import { BrokerFeeReceiptSheet } from "@/components/deal-forms/broker-fee-receipt-sheet";
import { PowerOfAttorneySheet } from "@/components/deal-forms/power-of-attorney-sheet";
import { ReceiptSheet } from "@/components/deal-forms/receipt-sheet";
import { UtilitySettlementSheet } from "@/components/deal-forms/utility-settlement-sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createStandaloneRelatedForm, updateDealForm } from "@/lib/actions/deal-forms";
import { useBusy } from "@/lib/busy";
import type { DealFormPrefill } from "@/lib/deal-forms";
import { printContractSheet } from "@/lib/print-contract";
import {
  RELATED_FORM_TABS,
  type RelatedFormTabId,
  buildRelatedFormDefaults,
  relatedFormTitle,
} from "@/lib/related-forms";
import { cn } from "@/lib/utils";

export type RelatedFormsOfficeDefaults = Pick<
  DealFormPrefill,
  | "officeName"
  | "officePhone"
  | "officeAddress"
  | "officeRepresentative"
  | "officeRegistrationNo"
  | "agentName"
  | "agentPhone"
>;

function emptyPrefill(office: RelatedFormsOfficeDefaults): DealFormPrefill {
  return {
    dealType: "",
    propertyTitle: "",
    propertyAddress: "",
    propertyType: "",
    amount: null,
    monthlyRent: null,
    downPayment: null,
    balanceDate: null,
    contractDate: null,
    moveInDate: null,
    lessorName: null,
    lessorPhone: null,
    lessorAccount: null,
    lesseeName: null,
    lesseePhone: null,
    termsNote: null,
    clauses: [],
    officeName: office.officeName ?? "",
    officePhone: office.officePhone ?? null,
    officeAddress: office.officeAddress ?? null,
    officeRepresentative: office.officeRepresentative ?? null,
    officeRegistrationNo: office.officeRegistrationNo ?? null,
    agentName: office.agentName ?? "",
    agentPhone: office.agentPhone ?? null,
  };
}

/** 영수증·중개보수 영수증·공과금 정산서 작성 창 (수기 작성, 거래 연결 없음) */
export function RelatedFormsDialog({
  open,
  onOpenChange,
  office,
  initialTab = "receipt",
  presentation = "dialog",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  office: RelatedFormsOfficeDefaults;
  initialTab?: RelatedFormTabId;
  presentation?: "dialog" | "page";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useBusy(pending);

  const [tabId, setTabId] = useState<RelatedFormTabId>(initialTab);
  const [formIds, setFormIds] = useState<Partial<Record<RelatedFormTabId, string>>>({});

  const tab = RELATED_FORM_TABS.find((t) => t.id === tabId) ?? RELATED_FORM_TABS[0];
  const prefill = useMemo(() => emptyPrefill(office), [office]);
  const data = useMemo(() => buildRelatedFormDefaults(tabId, prefill), [tabId, prefill]);
  const title = relatedFormTitle(tabId);
  const formId = formIds[tabId] ?? null;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setFormIds({});
      setTabId(initialTab);
    } else {
      setTabId(initialTab);
      setFormIds({});
    }
    onOpenChange(next);
  };

  const save = (fd: FormData) => {
    fd.set("title", title);
    startTransition(async () => {
      if (formId) {
        const result = await updateDealForm(formId, null, fd);
        if (result.error) toast.error(result.error);
        else {
          toast.success(result.message ?? "저장했어요.");
          router.refresh();
        }
        return;
      }
      const created = await createStandaloneRelatedForm({
        formTemplate: tab.formTemplate,
        title,
      });
      if (created.error || !created.id) {
        toast.error(created.error ?? "저장하지 못했어요.");
        return;
      }
      const updated = await updateDealForm(created.id, null, fd);
      if (updated.error) {
        toast.error(updated.error);
        setFormIds((prev) => ({ ...prev, [tabId]: created.id }));
        return;
      }
      setFormIds((prev) => ({ ...prev, [tabId]: created.id }));
      toast.success(`${tab.label}을(를) 저장했어요.`);
      router.refresh();
    });
  };

  const titleBar = presentation === "page" ? (
    <div className="border-b px-4 py-3 print:hidden">
      <h1 className="font-semibold">영수증 관련서식</h1>
      <p className="sr-only">영수증·공과금 정산서 등 관련 서식을 수기로 작성합니다.</p>
    </div>
  ) : (
    <DialogHeader className="space-y-0 border-b px-4 py-3 print:hidden">
      <DialogTitle>영수증 관련서식</DialogTitle>
      <DialogDescription className="sr-only">영수증·공과금 정산서 등 관련 서식을 수기로 작성합니다.</DialogDescription>
    </DialogHeader>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center justify-end gap-2 border-b bg-muted/40 px-4 py-3 print:hidden">
          <Button type="submit" form="related-forms-form" size="sm" disabled={pending}>
            <Save data-icon="inline-start" />
            저장
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => printContractSheet(title)}>
            <Printer data-icon="inline-start" />
            인쇄 · PDF
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => handleOpenChange(false)}>
            닫기
          </Button>
    </div>
  );

  const tabs = (
    <div className="flex flex-wrap gap-1 border-b px-3 py-2 print:hidden">
          {RELATED_FORM_TABS.map((t) => (
            <Button
              key={t.id}
              type="button"
              size="sm"
              variant={tabId === t.id ? "default" : "outline"}
              className="h-8"
              onClick={() => setTabId(t.id)}
            >
              {t.label}
            </Button>
          ))}
    </div>
  );

  const formContent = (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 print:overflow-visible print:p-6">
          <form
            id="related-forms-form"
            key={tabId}
            onSubmit={(e) => {
              e.preventDefault();
              save(new FormData(e.currentTarget));
            }}
          >
            <input type="hidden" name="title" value={title} />
            {tabId === "receipt" && <ReceiptSheet data={data} />}
            {tabId === "broker_fee_receipt" && <BrokerFeeReceiptSheet data={data} />}
            {tabId === "power_of_attorney" && <PowerOfAttorneySheet data={data} />}
            {tabId === "balance_settlement" && <BalanceSettlementSheet data={data} />}
            {tabId === "utility_settlement" && <UtilitySettlementSheet data={data} />}
          </form>
    </div>
  );

  if (presentation === "page") {
    return (
      <div className="fixed inset-0 z-50 overflow-auto bg-background print:static">
        <div className="mx-auto flex min-h-screen w-[920px] min-w-[920px] flex-col bg-background print:w-full print:min-w-0">
          {titleBar}
          {toolbar}
          {tabs}
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(96vh,960px)] w-[min(96vw,920px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
          "print:fixed print:inset-0 print:max-h-none print:w-full print:max-w-none print:translate-x-0 print:translate-y-0 print:rounded-none print:border-0 print:bg-white print:shadow-none",
        )}
      >
        {titleBar}
        {toolbar}
        {tabs}
        {formContent}
      </DialogContent>
    </Dialog>
  );
}

export function RelatedFormsWriteButton({ office }: { office: RelatedFormsOfficeDefaults }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        영수증 관련서식
      </Button>
      <RelatedFormsDialog key={String(open)} open={open} onOpenChange={setOpen} office={office} />
    </>
  );
}
