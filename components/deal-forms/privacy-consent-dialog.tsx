"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { PrivacyConsentSheet } from "@/components/deal-forms/privacy-consent-sheet";
import type { WriteDealOption } from "@/components/deal-forms/contract-write-dialog";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createDealFormForDeal, updateDealForm } from "@/lib/actions/deal-forms";
import { useBusy } from "@/lib/busy";
import { PRIVACY_CONSENT_TITLE, buildPrivacyConsentDefaults } from "@/lib/privacy-consent";
import { printContractSheet } from "@/lib/print-contract";
import { cn } from "@/lib/utils";

/** 개인정보 수집·이용 동의서 작성 창 */
export function PrivacyConsentDialog({
  open,
  onOpenChange,
  deals,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: WriteDealOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  const [dealId, setDealId] = useState(deals[0]?.value ?? "");
  const [formId, setFormId] = useState<string | null>(null);

  const deal = deals.find((d) => d.value === dealId);
  const data = buildPrivacyConsentDefaults({
    dealType: deal?.prefill?.dealType ?? deal?.dealType ?? "",
    propertyTitle: deal?.prefill?.propertyTitle ?? "",
    propertyAddress: deal?.prefill?.propertyAddress ?? "",
    propertyType: deal?.prefill?.propertyType ?? deal?.propertyType ?? "",
    amount: deal?.prefill?.amount ?? null,
    monthlyRent: deal?.prefill?.monthlyRent ?? null,
    downPayment: deal?.prefill?.downPayment ?? null,
    balanceDate: deal?.prefill?.balanceDate ?? null,
    contractDate: deal?.prefill?.contractDate ?? null,
    moveInDate: deal?.prefill?.moveInDate ?? null,
    lessorName: deal?.prefill?.lessorName ?? null,
    lessorPhone: deal?.prefill?.lessorPhone ?? null,
    lessorAccount: deal?.prefill?.lessorAccount ?? null,
    lesseeName: deal?.prefill?.lesseeName ?? null,
    lesseePhone: deal?.prefill?.lesseePhone ?? null,
    termsNote: deal?.prefill?.termsNote ?? null,
    clauses: [],
    officeName: deal?.prefill?.officeName ?? "",
    officePhone: deal?.prefill?.officePhone ?? null,
    officeAddress: deal?.prefill?.officeAddress ?? null,
    officeRepresentative: deal?.prefill?.officeRepresentative ?? null,
    officeRegistrationNo: deal?.prefill?.officeRegistrationNo ?? null,
    agentName: deal?.prefill?.agentName ?? "",
    agentPhone: deal?.prefill?.agentPhone ?? null,
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setFormId(null);
      setDealId(deals[0]?.value ?? "");
    }
    onOpenChange(next);
  };

  const save = (fd: FormData) => {
    if (!dealId) {
      toast.error("연결할 거래를 선택해 주세요.");
      return;
    }
    fd.set("title", PRIVACY_CONSENT_TITLE);
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
      const created = await createDealFormForDeal(dealId, {
        kind: "other",
        title: PRIVACY_CONSENT_TITLE,
        formTemplate: "privacy_consent",
      });
      if (created.error || !created.id) {
        toast.error(created.error ?? "저장하지 못했어요.");
        return;
      }
      const updated = await updateDealForm(created.id, null, fd);
      if (updated.error) {
        toast.error(updated.error);
        setFormId(created.id);
        return;
      }
      setFormId(created.id);
      toast.success("동의서를 저장했어요.");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(96vh,920px)] w-[min(96vw,800px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
          "print:fixed print:inset-0 print:max-h-none print:w-full print:max-w-none print:translate-x-0 print:translate-y-0 print:rounded-none print:border-0 print:bg-white print:shadow-none",
        )}
      >
        <DialogHeader className="space-y-0 border-b px-4 py-3 print:hidden">
          <DialogTitle>개인정보 수집 동의서</DialogTitle>
          <DialogDescription className="sr-only">개인정보 수집 및 이용 동의서를 작성합니다.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3 border-b bg-muted/40 px-4 py-3 print:hidden">
          <div className="space-y-1">
            <Label htmlFor="privacy-deal" className="text-xs text-muted-foreground">
              연결 거래
            </Label>
            {deals.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                거래가 없어요.{" "}
                <Link href="/contracts/new" className="underline">
                  계약 시작
                </Link>
              </p>
            ) : (
              <NativeSelect
                id="privacy-deal"
                value={dealId}
                onChange={(e) => {
                  setDealId(e.target.value);
                  setFormId(null);
                }}
                options={deals.map((d) => ({ value: d.value, label: d.label }))}
                className="min-w-56 bg-background"
              />
            )}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="submit" form="privacy-consent-form" size="sm" disabled={pending || !dealId}>
              <Save data-icon="inline-start" />
              저장
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => printContractSheet(PRIVACY_CONSENT_TITLE)}>
              <Printer data-icon="inline-start" />
              인쇄 · PDF
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => handleOpenChange(false)}>
              닫기
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 print:overflow-visible print:p-6">
          <form
            id="privacy-consent-form"
            key={dealId}
            onSubmit={(e) => {
              e.preventDefault();
              save(new FormData(e.currentTarget));
            }}
          >
            <input type="hidden" name="title" value={PRIVACY_CONSENT_TITLE} />
            <PrivacyConsentSheet data={data} />
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PrivacyConsentWriteButton({ deals }: { deals: WriteDealOption[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        개인정보수집동의서
      </Button>
      <PrivacyConsentDialog open={open} onOpenChange={setOpen} deals={deals} />
    </>
  );
}
