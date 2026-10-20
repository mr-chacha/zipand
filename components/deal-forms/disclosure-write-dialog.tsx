"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer, Save } from "lucide-react";
import { toast } from "sonner";
import type { WriteDealOption } from "@/components/deal-forms/contract-write-dialog";
import {
  DisclosureFormSheet,
  DisclosurePageTabs,
  type DisclosurePageNo,
} from "@/components/deal-forms/disclosure-form-sheet";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createDealFormForDeal, updateDealForm } from "@/lib/actions/deal-forms";
import { useBusy } from "@/lib/busy";
import {
  CONTRACT_DEAL_TYPES,
  CONTRACT_PROPERTY_TYPES,
  disclosureFormHeading,
  findDisclosureFormTemplate,
  type ContractDealType,
  type ContractPropertyType,
} from "@/lib/contract-templates";
import { buildDealFormDefaults, type DealFormPrefill } from "@/lib/deal-forms";
import { mergeContractIntoDisclosure } from "@/lib/disclosure-form";
import { printContractSheet } from "@/lib/print-contract";
import { cn } from "@/lib/utils";

export type DisclosureWriteSeed = {
  propertyType: ContractPropertyType;
  dealType: ContractDealType;
  dealId: string;
  /** 계약서 작성 중인 값(또는 저장된 계약서) — 소재지·면적·인적사항 반영 */
  contractData?: Record<string, string>;
};

function emptyPrefill(): DealFormPrefill {
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
    officeName: "",
    officePhone: null,
    officeAddress: null,
    officeRepresentative: null,
    officeRegistrationNo: null,
    agentName: "",
    agentPhone: null,
  };
}

function matchDeals(deals: WriteDealOption[], propertyType: ContractPropertyType, dealType: ContractDealType) {
  const aliases: Record<string, string[]> = {
    아파트: ["아파트"],
    다가구: ["다가구", "빌라", "원룸"],
    다세대: ["다세대", "빌라"],
  };
  const types = aliases[propertyType] ?? [propertyType];
  const exact = deals.filter((d) => types.includes(d.propertyType) && d.dealType === dealType);
  if (exact.length) return exact;
  const byDeal = deals.filter((d) => d.dealType === dealType);
  return byDeal.length ? byDeal : deals;
}

function buildActiveDisclosure(
  propertyType: ContractPropertyType,
  dealType: ContractDealType,
  dealId: string,
  deals: WriteDealOption[],
  contractDataOverride?: Record<string, string> | null
) {
  const template = findDisclosureFormTemplate(propertyType, dealType);
  if (!template) return null;
  const deal = deals.find((d) => d.value === dealId);
  const base = buildDealFormDefaults("disclosure", {
    ...emptyPrefill(),
    ...deal?.prefill,
    propertyType,
    dealType,
  });
  const data = mergeContractIntoDisclosure(base, {
    ...deal?.contractData,
    ...contractDataOverride,
  });
  data.template_id = template.id;
  data.template_title = template.title;
  data.property_type = propertyType;
  data.deal_type = dealType;
  return {
    propertyType,
    dealType,
    title: disclosureFormHeading(propertyType, dealType),
    templateId: template.id,
    data,
  };
}

function DisclosureWriteBody({
  deals,
  seed,
  onClose,
}: {
  deals: WriteDealOption[];
  seed: DisclosureWriteSeed | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useBusy(pending);

  const [pickProperty, setPickProperty] = useState<ContractPropertyType>(seed?.propertyType ?? "아파트");
  const [pickDeal, setPickDeal] = useState<ContractDealType>(seed?.dealType ?? "매매");
  const [dealId, setDealId] = useState(seed?.dealId ?? "");
  const [formId, setFormId] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);
  const [liveContractData, setLiveContractData] = useState<Record<string, string> | null>(seed?.contractData ?? null);
  const [page, setPage] = useState<DisclosurePageNo>(1);

  const matchedDeals = useMemo(() => matchDeals(deals, pickProperty, pickDeal), [deals, pickProperty, pickDeal]);

  const active = useMemo(
    () => buildActiveDisclosure(pickProperty, pickDeal, dealId, deals, liveContractData),
    [pickProperty, pickDeal, dealId, deals, liveContractData]
  );

  const keepOrClearDeal = (nextDeals: WriteDealOption[], prev: string) =>
    prev && nextDeals.some((d) => d.value === prev) ? prev : "";

  const changeProperty = (value: ContractPropertyType) => {
    setPickProperty(value);
    setFormId(null);
    setLiveContractData(null);
    setPage(1);
    const next = matchDeals(deals, value, pickDeal);
    setDealId((prev) => keepOrClearDeal(next, prev));
    setFormEpoch((n) => n + 1);
  };

  const changeDealType = (value: ContractDealType) => {
    setPickDeal(value);
    setFormId(null);
    setLiveContractData(null);
    setPage(1);
    const next = matchDeals(deals, pickProperty, value);
    setDealId((prev) => keepOrClearDeal(next, prev));
    setFormEpoch((n) => n + 1);
  };

  const changeDealId = (value: string) => {
    setDealId(value);
    setFormId(null);
    setLiveContractData(null);
    setPage(1);
    setFormEpoch((n) => n + 1);
  };

  const save = (fd: FormData) => {
    if (!active) {
      toast.error("확인설명서 양식을 불러오지 못했어요.");
      return;
    }
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
      const created = await createDealFormForDeal(dealId || null, {
        templateId: active.templateId,
        kind: "disclosure",
        title: active.title,
      });
      if (created.error || !created.id) {
        toast.error(created.error ?? "저장하지 못했어요.");
        return;
      }
      fd.set("title", active.title);
      const updated = await updateDealForm(created.id, null, fd);
      if (updated.error) {
        toast.error(updated.error);
        setFormId(created.id);
        return;
      }
      setFormId(created.id);
      toast.success("확인설명서를 저장했어요.");
      router.refresh();
    });
  };

  return (
    <DialogContent
      showCloseButton
      className={cn(
        "flex max-h-[min(96vh,960px)] w-[min(98vw,1100px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
        "print:fixed print:inset-0 print:max-h-none print:w-full print:max-w-none print:translate-x-0 print:translate-y-0 print:rounded-none print:border-0 print:bg-white print:shadow-none",
      )}
    >
      <DialogHeader className="space-y-0 border-b px-4 py-3 print:hidden">
        <DialogTitle>확인설명서 작성</DialogTitle>
        <DialogDescription className="sr-only">
          계약서의 소재지·면적·인적사항이 반영됩니다. 1~4페이지를 눌러 확인하세요.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-end gap-3 border-b bg-slate-800 px-4 py-3 text-white print:hidden">
        <p className="w-full text-[14px] font-medium text-white/80 sm:w-auto sm:pb-2">확인설명서 종류</p>
        <div className="space-y-1">
          <Label htmlFor="dw-property" className="text-[14px] text-white/70">
            부동산 종류
          </Label>
          <NativeSelect
            id="dw-property"
            value={pickProperty}
            onChange={(e) => changeProperty(e.target.value as ContractPropertyType)}
            options={[...CONTRACT_PROPERTY_TYPES]}
            className="w-36 bg-white text-foreground"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dw-deal" className="text-[14px] text-white/70">
            거래 종류
          </Label>
          <NativeSelect
            id="dw-deal"
            value={pickDeal}
            onChange={(e) => changeDealType(e.target.value as ContractDealType)}
            options={[...CONTRACT_DEAL_TYPES]}
            className="w-28 bg-white text-foreground"
          />
        </div>
        <div className="ml-auto space-y-1">
          <Label htmlFor="dw-link-deal" className="text-[14px] text-white/70">
            연결 거래
          </Label>
          {deals.length === 0 ? (
            <p className="max-w-xs text-[14px] text-white/80">
              거래가 없어요.{" "}
              <Link href="/contracts/new" className="underline">
                계약 시작
              </Link>
            </p>
          ) : (
            <NativeSelect
              id="dw-link-deal"
              value={dealId}
              onChange={(e) => changeDealId(e.target.value)}
              placeholder="선택안함"
              options={(matchedDeals.length ? matchedDeals : deals).map((d) => ({ value: d.value, label: d.label }))}
              className="min-w-48 max-w-xs bg-white text-foreground"
            />
          )}
        </div>
      </div>

      <div className="shrink-0 border-b bg-muted/40 print:hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2">
          <Button type="submit" form="disclosure-write-form" size="sm" disabled={pending || !active}>
            <Save data-icon="inline-start" />
            저장
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!active}
            onClick={() => printContractSheet(active?.title, "disclosure-print-root")}
          >
            <Printer data-icon="inline-start" />
            인쇄 · PDF
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            닫기
          </Button>
          {dealId && (liveContractData || deals.find((d) => d.value === dealId)?.contractData) ? (
            <span className="text-[14px] text-muted-foreground">계약서 소재지·면적·인적사항을 불러왔어요</span>
          ) : dealId ? (
            <span className="text-[14px] text-muted-foreground">계약서가 없으면 거래·사무소 정보만 채워요</span>
          ) : null}
        </div>
        {active ? (
          <DisclosurePageTabs
            page={page}
            onPageChange={(next) => {
              setPage(next);
              document.getElementById("disclosure-scroll")?.scrollTo({ top: 0 });
            }}
            className="border-t border-border/60"
          />
        ) : null}
      </div>

      <div
        id="disclosure-scroll"
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-[14px] print:overflow-visible print:p-0"
      >
        {!active ? (
          <p className="py-16 text-center text-[14px] text-muted-foreground">해당 종류의 확인설명서 서식이 없어요.</p>
        ) : (
          <form
            id="disclosure-write-form"
            key={`${active.templateId}-${dealId}-${formEpoch}`}
            onSubmit={(e) => {
              e.preventDefault();
              save(new FormData(e.currentTarget));
            }}
          >
            <input type="hidden" name="title" value={active.title} />
            <DisclosureFormSheet
              propertyType={active.propertyType}
              dealType={active.dealType}
              title={active.title}
              data={active.data}
              page={page}
              onPageChange={setPage}
              showPageTabs={false}
            />
          </form>
        )}
      </div>
    </DialogContent>
  );
}

/** 확인설명서 작성 창 — 계약서 작성에서 열어 소재지·면적·인적사항 반영 */
export function DisclosureWriteDialog({
  open,
  onOpenChange,
  deals,
  seed = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: WriteDealOption[];
  seed?: DisclosureWriteSeed | null;
}) {
  const sessionKey = seed
    ? `${seed.dealId}:${seed.propertyType}:${seed.dealType}:${seed.contractData ? Object.keys(seed.contractData).length : 0}`
    : "blank";

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      {open ? (
        <DisclosureWriteBody
          key={sessionKey}
          deals={deals}
          seed={seed}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}
