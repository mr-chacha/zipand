"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { ContractFormSheet } from "@/components/deal-forms/contract-form-sheet";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createDealFormForDeal, updateDealForm } from "@/lib/actions/deal-forms";
import { useBusy } from "@/lib/busy";
import {
  CONTRACT_DEAL_TYPES,
  CONTRACT_PROPERTY_TYPES,
  contractFormHeading,
  findContractFormTemplate,
  type ContractDealType,
  type ContractPropertyType,
} from "@/lib/contract-templates";
import { buildDealFormDefaults, newContractNo, type DealFormPrefill } from "@/lib/deal-forms";
import { cn } from "@/lib/utils";

export type WriteDealOption = {
  value: string;
  label: string;
  propertyType: string;
  dealType: string;
  prefill?: Partial<DealFormPrefill>;
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

function buildActiveForm(
  propertyType: ContractPropertyType,
  dealType: ContractDealType,
  dealId: string,
  deals: WriteDealOption[]
) {
  const template = findContractFormTemplate(propertyType, dealType);
  if (!template) return null;
  const deal = deals.find((d) => d.value === dealId);
  const data = buildDealFormDefaults("contract", {
    ...emptyPrefill(),
    ...deal?.prefill,
    propertyType,
    dealType,
  });
  data.template_id = template.id;
  data.template_title = template.title;
  data.property_type = propertyType;
  data.deal_type = dealType;
  data.contract_no = data.contract_no || newContractNo();
  data.building_use = data.building_use || propertyType;
  return {
    propertyType,
    dealType,
    title: contractFormHeading(propertyType, dealType),
    templateId: template.id,
    data,
  };
}

/** 계약서 작성 창: 상단 종류 선택 즉시 하단 양식 표시 */
export function ContractWriteDialog({
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

  const [pickProperty, setPickProperty] = useState<ContractPropertyType>("아파트");
  const [pickDeal, setPickDeal] = useState<ContractDealType>("매매");
  const [dealId, setDealId] = useState(deals[0]?.value ?? "");
  const [formId, setFormId] = useState<string | null>(null);
  /** 종류·거래가 바뀔 때 양식을 다시 마운트하기 위한 키 */
  const [formEpoch, setFormEpoch] = useState(0);

  const matchedDeals = useMemo(
    () => matchDeals(deals, pickProperty, pickDeal),
    [deals, pickProperty, pickDeal]
  );

  const active = useMemo(
    () => (open ? buildActiveForm(pickProperty, pickDeal, dealId, deals) : null),
    [open, pickProperty, pickDeal, dealId, deals]
  );

  const reset = () => {
    setFormId(null);
    setPickProperty("아파트");
    setPickDeal("매매");
    setDealId(deals[0]?.value ?? "");
    setFormEpoch(0);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    else {
      const initial = matchDeals(deals, "아파트", "매매");
      setDealId(initial[0]?.value ?? deals[0]?.value ?? "");
      setFormEpoch((n) => n + 1);
    }
    onOpenChange(next);
  };

  const changeProperty = (value: ContractPropertyType) => {
    setPickProperty(value);
    setFormId(null);
    const next = matchDeals(deals, value, pickDeal);
    setDealId(next[0]?.value ?? deals[0]?.value ?? "");
    setFormEpoch((n) => n + 1);
  };

  const changeDealType = (value: ContractDealType) => {
    setPickDeal(value);
    setFormId(null);
    const next = matchDeals(deals, pickProperty, value);
    setDealId(next[0]?.value ?? deals[0]?.value ?? "");
    setFormEpoch((n) => n + 1);
  };

  const changeDealId = (value: string) => {
    setDealId(value);
    setFormId(null);
    setFormEpoch((n) => n + 1);
  };

  const save = (fd: FormData) => {
    if (!active) {
      toast.error("계약서 양식을 불러오지 못했어요.");
      return;
    }
    if (!dealId) {
      toast.error("연결할 거래를 선택해 주세요.");
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
      const created = await createDealFormForDeal(dealId, {
        templateId: active.templateId,
        kind: "contract",
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
      toast.success("계약서를 저장했어요.");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(96vh,920px)] w-[min(96vw,960px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
          "print:fixed print:inset-0 print:max-h-none print:w-full print:max-w-none print:translate-x-0 print:translate-y-0 print:rounded-none print:border-0 print:bg-white print:shadow-none"
        )}
      >
        <DialogHeader className="space-y-0 border-b px-4 py-3 print:hidden">
          <DialogTitle>계약서 작성</DialogTitle>
          <DialogDescription className="sr-only">부동산·거래 종류를 바꾸면 아래 계약서 양식이 바로 바뀝니다.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3 border-b bg-slate-800 px-4 py-3 text-white print:hidden">
          <p className="w-full text-xs font-medium text-white/80 sm:w-auto sm:pb-2">계약서종류</p>
          <div className="space-y-1">
            <Label htmlFor="cw-property" className="text-xs text-white/70">
              부동산 종류
            </Label>
            <NativeSelect
              id="cw-property"
              value={pickProperty}
              onChange={(e) => changeProperty(e.target.value as ContractPropertyType)}
              options={[...CONTRACT_PROPERTY_TYPES]}
              className="w-36 bg-white text-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cw-deal" className="text-xs text-white/70">
              거래 종류
            </Label>
            <NativeSelect
              id="cw-deal"
              value={pickDeal}
              onChange={(e) => changeDealType(e.target.value as ContractDealType)}
              options={[...CONTRACT_DEAL_TYPES]}
              className="w-28 bg-white text-foreground"
            />
          </div>
          <div className="ml-auto space-y-1">
            <Label htmlFor="cw-link-deal" className="text-xs text-white/70">
              연결 거래
            </Label>
            {deals.length === 0 ? (
              <p className="max-w-xs text-xs text-white/80">
                거래가 없어요.{" "}
                <Link href="/contracts/new" className="underline">
                  계약 시작
                </Link>
              </p>
            ) : (
              <NativeSelect
                id="cw-link-deal"
                value={dealId}
                onChange={(e) => changeDealId(e.target.value)}
                options={(matchedDeals.length ? matchedDeals : deals).map((d) => ({ value: d.value, label: d.label }))}
                className="min-w-48 max-w-xs bg-white text-foreground"
              />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-4 py-2 print:hidden">
          <Button type="submit" form="contract-write-form" size="sm" disabled={pending || !active || !dealId}>
            <Save data-icon="inline-start" />
            계약서저장
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={!active} onClick={() => window.print()}>
            <Printer data-icon="inline-start" />
            인쇄 · PDF
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => handleOpenChange(false)}>
            닫기
          </Button>
          {formId && <span className="text-xs text-muted-foreground">저장됨</span>}
          {!formId && active && (
            <span className="text-xs text-destructive">신규계약서작성 모드 · 아직 저장되지 않았어요</span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 print:overflow-visible print:p-6">
          {!active ? (
            <p className="py-16 text-center text-sm text-muted-foreground">해당 종류의 계약서 서식이 없어요.</p>
          ) : (
            <form
              id="contract-write-form"
              onSubmit={(e) => {
                e.preventDefault();
                save(new FormData(e.currentTarget));
              }}
            >
              <input type="hidden" name="title" value={active.title} />
              <ContractFormSheet
                key={`${active.templateId}-${dealId}-${formEpoch}`}
                propertyType={active.propertyType}
                dealType={active.dealType}
                title={active.title}
                data={active.data}
              />
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ContractWriteButton({
  deals,
  variant = "default",
  size = "default",
  className,
  children = "계약서 작성",
}: {
  deals: WriteDealOption[];
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <ContractWriteDialog open={open} onOpenChange={setOpen} deals={deals} />
    </>
  );
}
