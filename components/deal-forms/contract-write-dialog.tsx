"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer, Save } from "lucide-react";
import { toast } from "sonner";
import { ContractFormSheet } from "@/components/deal-forms/contract-form-sheet";
import {
  DisclosureWriteDialog,
  type DisclosureWriteSeed,
} from "@/components/deal-forms/disclosure-write-dialog";
import type { RelatedFormsOfficeDefaults } from "@/components/deal-forms/related-forms-dialog";
import {
  StandardLeaseFormSheet,
  StandardLeasePageTabs,
  type StandardLeasePageNo,
} from "@/components/deal-forms/standard-lease-form-sheet";
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
import { printContractSheet } from "@/lib/print-contract";
import {
  CONTRACT_FORM_STYLE_OPTIONS,
  STANDARD_LEASE_TITLE,
  buildStandardLeaseDefaults,
  type ContractFormStyle,
} from "@/lib/standard-lease";
import { cn } from "@/lib/utils";

function readFormRecord(formId: string): Record<string, string> {
  const form = document.getElementById(formId);
  if (!(form instanceof HTMLFormElement)) return {};
  const out: Record<string, string> = {};
  new FormData(form).forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

export type WriteDealOption = {
  value: string;
  label: string;
  propertyType: string;
  dealType: string;
  prefill?: Partial<DealFormPrefill>;
  /** 해당 거래의 최신 계약서 data (확인설명서 등에서 소재지·면적·인적사항 반영) */
  contractData?: Record<string, string>;
};

function emptyPrefill(office?: RelatedFormsOfficeDefaults | null): DealFormPrefill {
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
    officeName: office?.officeName ?? "",
    officePhone: office?.officePhone ?? null,
    officeAddress: office?.officeAddress ?? null,
    officeRepresentative: office?.officeRepresentative ?? null,
    officeRegistrationNo: office?.officeRegistrationNo ?? null,
    agentName: office?.agentName ?? "",
    agentPhone: office?.agentPhone ?? null,
  };
}

/** 개업공인중개사 란 — 설정(마이페이지) 사무소·담당자 등록값 */
function withOfficeDefaults(
  prefill: DealFormPrefill,
  office?: RelatedFormsOfficeDefaults | null
): DealFormPrefill {
  if (!office) return prefill;
  return {
    ...prefill,
    officeName: office.officeName || prefill.officeName,
    officePhone: office.officePhone ?? prefill.officePhone,
    officeAddress: office.officeAddress ?? prefill.officeAddress,
    officeRepresentative: office.officeRepresentative ?? prefill.officeRepresentative,
    officeRegistrationNo: office.officeRegistrationNo ?? prefill.officeRegistrationNo,
    agentName: office.agentName || prefill.agentName,
    agentPhone: office.agentPhone ?? prefill.agentPhone,
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
  deals: WriteDealOption[],
  formStyle: ContractFormStyle,
  office?: RelatedFormsOfficeDefaults | null
) {
  const template = findContractFormTemplate(propertyType, dealType);
  if (!template) return null;
  const deal = deals.find((d) => d.value === dealId);
  const prefill = withOfficeDefaults(
    {
      ...emptyPrefill(office),
      ...deal?.prefill,
      propertyType,
      dealType,
    },
    office
  );
  const isStandard = formStyle === "standard_lease";
  const data = isStandard
    ? {
        ...buildDealFormDefaults("contract", prefill),
        ...buildStandardLeaseDefaults(prefill),
      }
    : buildDealFormDefaults("contract", prefill);
  data.template_id = template.id;
  data.template_title = isStandard ? STANDARD_LEASE_TITLE : template.title;
  data.property_type = propertyType;
  data.deal_type = dealType;
  data.form_template = isStandard ? "standard_lease" : "";
  data.contract_no = data.contract_no || newContractNo();
  data.building_use = data.building_use || propertyType;
  return {
    propertyType,
    dealType,
    formStyle,
    title: isStandard ? STANDARD_LEASE_TITLE : contractFormHeading(propertyType, dealType),
    templateId: template.id,
    data,
  };
}

/** 계약서 작성 창: 상단 종류 선택 즉시 하단 양식 표시 */
export function ContractWriteDialog({
  open,
  onOpenChange,
  deals,
  office = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: WriteDealOption[];
  /** 설정에 등록된 사무소·담당자 — 개업공인중개사 란에 반영 */
  office?: RelatedFormsOfficeDefaults | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useBusy(pending);

  const [pickProperty, setPickProperty] = useState<ContractPropertyType>("아파트");
  const [pickDeal, setPickDeal] = useState<ContractDealType>("매매");
  const [formStyle, setFormStyle] = useState<ContractFormStyle>("general");
  /** 기본은 연결 안 함 — 선택 시에만 매물·금액 prefill */
  const [dealId, setDealId] = useState("");
  const [formId, setFormId] = useState<string | null>(null);
  /** 종류·거래가 바뀔 때 양식을 다시 마운트하기 위한 키 */
  const [formEpoch, setFormEpoch] = useState(0);
  const [leasePage, setLeasePage] = useState<StandardLeasePageNo>(1);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [disclosureSeed, setDisclosureSeed] = useState<DisclosureWriteSeed | null>(null);

  const matchedDeals = useMemo(
    () => matchDeals(deals, pickProperty, pickDeal),
    [deals, pickProperty, pickDeal]
  );

  const active = useMemo(
    () => (open ? buildActiveForm(pickProperty, pickDeal, dealId, deals, formStyle, office) : null),
    [open, pickProperty, pickDeal, dealId, deals, formStyle, office]
  );

  const reset = () => {
    setFormId(null);
    setPickProperty("아파트");
    setPickDeal("매매");
    setFormStyle("general");
    setDealId("");
    setFormEpoch(0);
    setLeasePage(1);
    setDisclosureOpen(false);
    setDisclosureSeed(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    else {
      setDealId("");
      setFormEpoch((n) => n + 1);
    }
    onOpenChange(next);
  };

  const openDisclosure = () => {
    const deal = dealId ? deals.find((d) => d.value === dealId) : undefined;
    const live = readFormRecord("contract-write-form");
    setDisclosureSeed({
      propertyType: pickProperty,
      dealType: pickDeal,
      dealId: dealId || "",
      contractData: { ...deal?.contractData, ...live },
    });
    setDisclosureOpen(true);
  };

  const keepOrClearDeal = (nextDeals: WriteDealOption[], prev: string) =>
    prev && nextDeals.some((d) => d.value === prev) ? prev : "";

  const changeProperty = (value: ContractPropertyType) => {
    setPickProperty(value);
    setFormId(null);
    setLeasePage(1);
    const next = matchDeals(deals, value, pickDeal);
    setDealId((prev) => keepOrClearDeal(next, prev));
    setFormEpoch((n) => n + 1);
  };

  const changeDealType = (value: ContractDealType) => {
    setPickDeal(value);
    setFormId(null);
    setLeasePage(1);
    const next = matchDeals(deals, pickProperty, value);
    setDealId((prev) => keepOrClearDeal(next, prev));
    setFormEpoch((n) => n + 1);
  };

  const changeFormStyle = (value: ContractFormStyle) => {
    setFormStyle(value);
    setFormId(null);
    setLeasePage(1);
    setFormEpoch((n) => n + 1);
    if (value === "standard_lease" && pickDeal === "매매") {
      setPickDeal("전세");
      const next = matchDeals(deals, pickProperty, "전세");
      setDealId((prev) => keepOrClearDeal(next, prev));
    }
  };

  const changeDealId = (value: string) => {
    setDealId(value);
    setFormId(null);
    setLeasePage(1);
    setFormEpoch((n) => n + 1);
  };

  const save = (fd: FormData) => {
    if (!active) {
      toast.error("계약서 양식을 불러오지 못했어요.");
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
    <>
    <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(96vh,960px)] w-[min(98vw,1100px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none",
          "print:fixed print:inset-0 print:max-h-none print:w-full print:max-w-none print:translate-x-0 print:translate-y-0 print:rounded-none print:border-0 print:bg-white print:shadow-none"
        )}
      >
        <DialogHeader className="space-y-0 border-b px-4 py-3 print:hidden">
          <DialogTitle>계약서 작성</DialogTitle>
          <DialogDescription className="sr-only">
            일반 계약서 또는 표준임대차 계약서를 선택하고 부동산·거래 종류를 바꾸면 아래 양식이 바뀝니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3 border-b bg-slate-800 px-4 py-3 text-white print:hidden">
          <p className="w-full text-[14px] font-medium text-white/80 sm:w-auto sm:pb-2">계약서종류</p>
          <div className="space-y-1">
            <Label htmlFor="cw-style" className="text-[14px] text-white/70">
              서식
            </Label>
            <NativeSelect
              id="cw-style"
              value={formStyle}
              onChange={(e) => changeFormStyle(e.target.value as ContractFormStyle)}
              options={[...CONTRACT_FORM_STYLE_OPTIONS]}
              className="w-44 bg-white text-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cw-property" className="text-[14px] text-white/70">
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
            <Label htmlFor="cw-deal" className="text-[14px] text-white/70">
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
            <Label htmlFor="cw-link-deal" className="text-[14px] text-white/70">
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
                id="cw-link-deal"
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
            <Button type="submit" form="contract-write-form" size="sm" disabled={pending || !active}>
              <Save data-icon="inline-start" />
              계약서저장
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={!active} onClick={openDisclosure}>
              확인설명서 작성
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!active}
              onClick={() =>
                printContractSheet(
                  active?.title,
                  formStyle === "standard_lease" ? "standard-lease-print-root" : "contract-print-root"
                )
              }
            >
              <Printer data-icon="inline-start" />
              인쇄 · PDF
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => handleOpenChange(false)}>
              닫기
            </Button>
            {formId && <span className="text-[14px] text-muted-foreground">저장됨</span>}
            {!formId && active && (
              <span className="text-[14px] text-destructive">신규계약서작성 모드 · 아직 저장되지 않았어요</span>
            )}
          </div>
          {active?.formStyle === "standard_lease" ? (
            <StandardLeasePageTabs
              page={leasePage}
              onPageChange={(next) => {
                setLeasePage(next);
                document.getElementById("contract-write-scroll")?.scrollTo({ top: 0 });
              }}
              className="border-t border-border/60"
            />
          ) : null}
        </div>

        <div
          id="contract-write-scroll"
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-[14px] print:overflow-visible print:p-0"
        >
          {!active ? (
            <p className="py-16 text-center text-[14px] text-muted-foreground">해당 종류의 계약서 서식이 없어요.</p>
          ) : (
            <form
              id="contract-write-form"
              key={`${active.formStyle}-${active.templateId}-${dealId}-${formEpoch}`}
              onSubmit={(e) => {
                e.preventDefault();
                save(new FormData(e.currentTarget));
              }}
            >
              <input type="hidden" name="title" value={active.title} />
              {active.formStyle === "standard_lease" ? (
                <StandardLeaseFormSheet
                  title={active.title}
                  data={active.data}
                  page={leasePage}
                  onPageChange={setLeasePage}
                  showPageTabs={false}
                />
              ) : (
                <ContractFormSheet
                  propertyType={active.propertyType}
                  dealType={active.dealType}
                  title={active.title}
                  data={active.data}
                />
              )}
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>

    <DisclosureWriteDialog
      open={disclosureOpen}
      onOpenChange={setDisclosureOpen}
      deals={deals}
      seed={disclosureSeed}
    />
    </>
  );
}

export function ContractWriteButton({
  deals,
  office = null,
  variant = "default",
  size = "default",
  className,
  children = "계약서 작성",
}: {
  deals: WriteDealOption[];
  office?: RelatedFormsOfficeDefaults | null;
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
      <ContractWriteDialog open={open} onOpenChange={setOpen} deals={deals} office={office} />
    </>
  );
}
