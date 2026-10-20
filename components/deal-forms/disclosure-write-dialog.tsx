"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, FileStack, Loader2, Printer, Save } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupBuildingHubForDisclosure } from "@/lib/actions/building-hub";
import { createDealFormForDeal, updateDealForm } from "@/lib/actions/deal-forms";
import { loadDisclosureFromDealProperty, loadDisclosureFromProperty } from "@/lib/actions/disclosure-docs";
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
import { mergeContractIntoDisclosure, mergeDisclosurePatch } from "@/lib/disclosure-form";
import { openKakaoPostcode } from "@/lib/kakao-postcode";
import { printContractSheet } from "@/lib/print-contract";
import { cn } from "@/lib/utils";

export type DisclosureWriteSeed = {
  propertyType: ContractPropertyType;
  dealType: ContractDealType;
  dealId: string;
  /** 계약서에서 연결한 매물 — 서류함 채우기용 */
  propertyId?: string;
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
  let data = mergeContractIntoDisclosure(base, {
    ...deal?.contractData,
    ...contractDataOverride,
  });
  // 매물 서류·건축HUB 등 COPY_KEYS 밖 필드(근거자료 체크·권리관계 등)
  data = mergeDisclosurePatch(data, contractDataOverride);
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
  const [propertyId, setPropertyId] = useState(seed?.propertyId ?? "");
  const [formId, setFormId] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);
  const [liveContractData, setLiveContractData] = useState<Record<string, string> | null>(seed?.contractData ?? null);
  const [page, setPage] = useState<DisclosurePageNo>(1);
  const [hubOpen, setHubOpen] = useState(false);
  const [hubDong, setHubDong] = useState("");
  const [hubHo, setHubHo] = useState("");
  const [hubAddr, setHubAddr] = useState<{
    label: string;
    bcode: string;
    bun: string;
    ji: string;
  } | null>(null);
  const [hubPending, setHubPending] = useState(false);
  const [docsPending, setDocsPending] = useState(false);

  const matchedDeals = useMemo(() => matchDeals(deals, pickProperty, pickDeal), [deals, pickProperty, pickDeal]);

  const active = useMemo(
    () => buildActiveDisclosure(pickProperty, pickDeal, dealId, deals, liveContractData),
    [pickProperty, pickDeal, dealId, deals, liveContractData]
  );

  const pickHubAddress = async () => {
    try {
      const parts = await openKakaoPostcode();
      if (!parts) return;
      if (!parts.bcode || parts.bcode.length < 10) {
        toast.error("법정동코드를 받지 못했어요. 다른 주소로 다시 검색해 주세요.");
        return;
      }
      setHubAddr({
        label: parts.roadAddress || parts.jibunAddress,
        bcode: parts.bcode,
        bun: parts.bun,
        ji: parts.ji,
      });
      if (parts.apartment) {
        /* 동·호 입력 유도 */
      }
      toast.success("주소를 선택했어요. 동·호를 넣고 조회하세요.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "주소 검색에 실패했어요.");
    }
  };

  const applyHubLookup = async () => {
    if (!hubAddr) {
      toast.error("주소를 먼저 검색해 주세요.");
      return;
    }
    setHubPending(true);
    try {
      const result = await lookupBuildingHubForDisclosure({
        bcode: hubAddr.bcode,
        bun: hubAddr.bun,
        ji: hubAddr.ji,
        dong: hubDong || undefined,
        ho: hubHo || undefined,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const f = result.fields;
      setLiveContractData((prev) => ({
        ...(prev ?? {}),
        ...(f.land_area ? { land_area: f.land_area } : {}),
        ...(f.building_area ? { building_area: f.building_area } : {}),
        ...(f.building_use ? { building_use: f.building_use } : {}),
        ...(f.building_structure ? { building_structure: f.building_structure } : {}),
        ...(f.building_year ? { building_year: f.building_year } : {}),
        ...(hubAddr.label ? { property_address: hubAddr.label } : {}),
      }));
      setFormEpoch((n) => n + 1);
      setPage(1);
      setHubOpen(false);
      toast.success(result.message);
    } finally {
      setHubPending(false);
    }
  };

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

  const applyDocsFromLinked = async (opts?: {
    silentEmpty?: boolean;
    propertyId?: string;
    dealId?: string;
  }) => {
    const pid =
      (opts?.propertyId ?? propertyId) ||
      deals.find((d) => d.value === (opts?.dealId ?? dealId))?.propertyId ||
      "";
    const did = opts?.dealId ?? dealId;
    if (!pid && !did) {
      if (!opts?.silentEmpty) toast.message("연결 매물 또는 거래를 선택해 주세요.");
      return;
    }
    setDocsPending(true);
    try {
      const res = pid
        ? await loadDisclosureFromProperty(pid)
        : await loadDisclosureFromDealProperty(did);
      if (!res.ok) {
        if (!opts?.silentEmpty) toast.message(res.error);
        return;
      }
      setLiveContractData((prev) => ({ ...(prev ?? {}), ...res.result.fields }));
      setFormEpoch((n) => n + 1);
      setPage(1);
      const head = res.result.summary.slice(0, 3).join(", ");
      toast.success(
        `매물 서류 ${res.result.documentCount}건을 반영했어요${head ? `: ${head}` : ""}. 문서 상세에 입력한 항목만 채워집니다.`
      );
    } finally {
      setDocsPending(false);
    }
  };

  const changeDealId = (value: string) => {
    setDealId(value);
    setFormId(null);
    const deal = deals.find((d) => d.value === value);
    const pid = deal?.propertyId ?? "";
    setPropertyId(pid);
    setLiveContractData(deal?.contractData ?? null);
    setPage(1);
    setFormEpoch((n) => n + 1);
    if (pid || value) {
      void applyDocsFromLinked({ silentEmpty: true, propertyId: pid, dealId: value });
    }
  };

  // 열릴 때 연결 매물·거래가 있으면 서류 추출값을 바로 반영
  useEffect(() => {
    if (!propertyId && !dealId) return;
    const t = window.setTimeout(() => {
      void applyDocsFromLinked({ silentEmpty: true, propertyId, dealId });
    }, 0);
    return () => window.clearTimeout(t);
    // 마운트·시드 기준 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!active || (!propertyId && !dealId) || docsPending}
            onClick={() => void applyDocsFromLinked()}
          >
            {docsPending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <FileStack data-icon="inline-start" />
            )}
            매물 서류에서 채우기
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!active || hubPending}
            onClick={() => setHubOpen(true)}
          >
            <Building2 data-icon="inline-start" />
            건축HUB 채우기
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            닫기
          </Button>
          {propertyId || dealId ? (
            <span className="text-[14px] text-muted-foreground">
              매물 서류함·자동 추출·수동 입력값을 반영합니다
            </span>
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
        {hubOpen ? (
          <div className="mb-4 space-y-3 rounded-lg border bg-muted/30 p-4 print:hidden">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">건축HUB로 면적·용도 채우기</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  공공데이터 속성 조회입니다(공식 등본 PDF 아님). 「건축HUB 건축물대장」 활용신청이 필요합니다.
                </p>
              </div>
              <Button type="button" size="sm" variant="ghost" onClick={() => setHubOpen(false)}>
                닫기
              </Button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label>주소</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => void pickHubAddress()}>
                  주소 검색
                </Button>
              </div>
              <p className="rounded-md border bg-background px-2.5 py-1.5 text-xs text-muted-foreground">
                {hubAddr?.label || "카카오 주소검색으로 선택하세요."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hub-dong">동 (아파트 등)</Label>
                <Input
                  id="hub-dong"
                  value={hubDong}
                  onChange={(e) => setHubDong(e.target.value)}
                  placeholder="예: 101"
                  disabled={hubPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hub-ho">호</Label>
                <Input
                  id="hub-ho"
                  value={hubHo}
                  onChange={(e) => setHubHo(e.target.value)}
                  placeholder="예: 410"
                  disabled={hubPending}
                />
              </div>
            </div>
            <Button type="button" disabled={hubPending || !hubAddr} onClick={() => void applyHubLookup()}>
              {hubPending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Building2 data-icon="inline-start" />
              )}
              조회 후 반영
            </Button>
          </div>
        ) : null}

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
    ? `${seed.dealId}:${seed.propertyId ?? ""}:${seed.propertyType}:${seed.dealType}:${seed.contractData ? Object.keys(seed.contractData).length : 0}`
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
