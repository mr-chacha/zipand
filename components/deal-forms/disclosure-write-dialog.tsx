"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer, Save } from "lucide-react";
import { toast } from "sonner";
import type {
  WriteDealOption,
  WritePropertyOption,
} from "@/components/deal-forms/contract-write-dialog";
import {
  DisclosureFormSheet,
  DisclosurePageTabs,
  NonResidentialDisclosureFormSheet,
  type DisclosurePageNo,
} from "@/components/deal-forms/disclosure-form-sheet";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { suggestDisclosureLocation } from "@/lib/actions/ai-assist";
import { createDealFormForDeal, updateDealForm } from "@/lib/actions/deal-forms";
import { ensureDealForProperty } from "@/lib/actions/deals";
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
import { clearDisclosureWriteSeed } from "@/lib/disclosure-write-seed";
import { refreshContractWriteOpener } from "@/lib/open-contract-write";
import { printContractSheet } from "@/lib/print-contract";
import { cn } from "@/lib/utils";

export type DisclosureWriteSeed = {
  buildingKind?: "residential" | "nonresidential";
  propertyType: ContractPropertyType;
  dealType: ContractDealType;
  dealId: string;
  /** 계약서에서 연결한 매물 — 서류함 채우기용 */
  propertyId?: string;
  /** 계약서 「연결 매물」에 보이던 이름 그대로 */
  propertyLabel?: string;
  /** 계약서 작성 중인 값(또는 저장된 계약서) — 소재지·면적·인적사항 반영 */
  contractData?: Record<string, string>;
};

type DisclosureBuildingKind = "residential" | "nonresidential";

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
  properties = [],
  seed,
  onClose,
  presentation = "dialog",
}: {
  deals: WriteDealOption[];
  properties?: WritePropertyOption[];
  seed: DisclosureWriteSeed | null;
  onClose: () => void;
  presentation?: "dialog" | "page";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  const isPage = presentation === "page";

  const handleClose = () => {
    clearDisclosureWriteSeed();
    if (isPage) {
      refreshContractWriteOpener();
      if (typeof window !== "undefined" && window.opener) {
        window.close();
        return;
      }
      router.push("/contracts");
      return;
    }
    onClose();
  };

  const resolvedDealId = (() => {
    if (seed?.dealId) return seed.dealId;
    if (seed?.propertyId) {
      return deals.find((d) => d.propertyId === seed.propertyId)?.value ?? "";
    }
    return "";
  })();
  const resolvedPropertyId =
    seed?.propertyId ||
    deals.find((d) => d.value === resolvedDealId)?.propertyId ||
    "";

  const [pickProperty, setPickProperty] = useState<ContractPropertyType>(seed?.propertyType ?? "아파트");
  const [pickDeal, setPickDeal] = useState<ContractDealType>(seed?.dealType ?? "매매");
  const [dealId, setDealId] = useState(resolvedDealId);
  const [propertyId, setPropertyId] = useState(resolvedPropertyId);
  const [formId, setFormId] = useState<string | null>(null);
  const [formEpoch, setFormEpoch] = useState(0);
  const [liveContractData, setLiveContractData] = useState<Record<string, string> | null>(seed?.contractData ?? null);
  const [page, setPage] = useState<DisclosurePageNo>(1);
  const [disclosureKind, setDisclosureKind] = useState<DisclosureBuildingKind | null>(seed?.buildingKind ?? null);
  const [pendingDisclosureKind, setPendingDisclosureKind] = useState<DisclosureBuildingKind>(seed?.buildingKind ?? "residential");
  const [autoFillPending, setAutoFillPending] = useState(false);
  useBusy(autoFillPending, "매물 서류·입지 정보를 반영하고 있습니다…");

  const matchedDeals = useMemo(() => matchDeals(deals, pickProperty, pickDeal), [deals, pickProperty, pickDeal]);
  const linkedPropertyLabel =
    seed?.propertyLabel?.trim() ||
    properties.find((p) => p.value === propertyId)?.label ||
    seed?.contractData?.property_title?.trim() ||
    deals.find((d) => d.propertyId === propertyId)?.prefill?.propertyTitle?.trim() ||
    seed?.contractData?.property_address?.trim() ||
    "연결 매물";

  /** 셀렉트에는 계약서와 같은 매물 이름 표시 (거래 라벨 대신) */
  const propertySelectOptions = useMemo(() => {
    const labelFor = (d: WriteDealOption) => {
      if (propertyId && d.propertyId === propertyId && linkedPropertyLabel !== "연결 매물") {
        return linkedPropertyLabel;
      }
      if (d.propertyId) {
        const fromProp = properties.find((p) => p.value === d.propertyId)?.label;
        if (fromProp) return fromProp;
      }
      return (
        d.prefill?.propertyTitle?.trim() ||
        d.label
      );
    };

    const base = matchedDeals.length ? matchedDeals : deals;
    let list = base;
    if (propertyId) {
      const linked = deals.filter((d) => d.propertyId === propertyId);
      const rest = base.filter((d) => d.propertyId !== propertyId);
      if (linked.length) {
        list = [...linked, ...rest.filter((d) => !linked.some((l) => l.value === d.value))];
      }
    }
    if (dealId && !list.some((d) => d.value === dealId)) {
      const extra = deals.find((d) => d.value === dealId);
      if (extra) {
        list = [extra, ...list];
      } else {
        list = [
          {
            value: dealId,
            label: linkedPropertyLabel,
            propertyType: pickProperty,
            dealType: pickDeal,
            propertyId: propertyId || undefined,
          },
          ...list,
        ];
      }
    }
    return list.map((d) => ({ value: d.value, label: labelFor(d) }));
  }, [
    matchedDeals,
    deals,
    properties,
    dealId,
    propertyId,
    linkedPropertyLabel,
    pickProperty,
    pickDeal,
  ]);

  const active = useMemo(() => {
    const base = buildActiveDisclosure(pickProperty, pickDeal, dealId, deals, liveContractData);
    if (!base || !disclosureKind) return base;
    const nonresidential = disclosureKind === "nonresidential";
    const title = nonresidential ? "비주거용 건축물 확인설명서" : base.title;
    // 저장 액션은 기존 서식 ID를 검증하므로, 비주거 여부는 별도 데이터 필드로 저장한다.
    const templateId = base.templateId;
    return {
      ...base,
      title,
      templateId,
      data: {
        ...base.data,
        template_id: templateId,
        template_title: title,
        form_template: nonresidential ? "disclosure_nonresidential_v1" : "disclosure_v1",
        disclosure_building_type: disclosureKind,
      },
    };
  }, [pickProperty, pickDeal, dealId, deals, liveContractData, disclosureKind]);

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
    const deal = deals.find((d) => d.value === value);
    const pid = deal?.propertyId ?? "";
    setPropertyId(pid);
    setLiveContractData((prev) => ({ ...(deal?.contractData ?? {}), ...(prev ?? {}) }));
    setPage(1);
    setFormEpoch((n) => n + 1);
  };

  // 열릴 때: 연결 거래 확정 → 검토완료 서류 + 카카오 입지 자동 반영
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      let pid = propertyId;
      let did = dealId;
      if (!did && pid) {
        const linked = deals.find((d) => d.propertyId === pid);
        if (linked) {
          did = linked.value;
        } else {
          const ensured = await ensureDealForProperty(pid);
          if (ensured.ok) did = ensured.dealId;
        }
        if (did && !cancelled) setDealId(did);
      }
      if (!pid && did) {
        pid = deals.find((d) => d.value === did)?.propertyId ?? "";
        if (pid && !cancelled) setPropertyId(pid);
      }
      if (!pid && !did) return;

      setAutoFillPending(true);
      try {
        const patch: Record<string, string> = {};
        let hasCachedLocation = false;
        if (pid || did) {
          const res = pid
            ? await loadDisclosureFromProperty(pid)
            : await loadDisclosureFromDealProperty(did);
          if (!cancelled && res.ok) {
            Object.assign(patch, res.result.fields);
            hasCachedLocation = Boolean(
              res.result.locationFields && Object.keys(res.result.locationFields).length
            );
          }
        }
        // 매물에 저장된 입지가 없으면 주소로 카카오 조회(기존 매물 호환)
        if (!hasCachedLocation) {
          const addr =
            seed?.contractData?.property_address?.trim() ||
            patch.property_address?.trim() ||
            deals.find((d) => d.value === did)?.prefill?.propertyAddress?.trim() ||
            "";
          if (addr) {
            const loc = await suggestDisclosureLocation(addr);
            if (!cancelled && loc.ok) {
              const { note: _note, ...fields } = loc.fields;
              for (const [k, v] of Object.entries(fields)) {
                if (v) patch[k] = v;
              }
            }
          }
        }
        if (!cancelled && Object.keys(patch).length) {
          setLiveContractData((prev) => ({ ...(prev ?? {}), ...patch }));
          setFormEpoch((n) => n + 1);
        }
      } finally {
        if (!cancelled) setAutoFillPending(false);
      }
    };
    const t = window.setTimeout(() => void boot(), 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
    // 마운트·시드 기준 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (fd: FormData) => {
    if (!active) {
      toast.error("확인설명서 양식을 불러오지 못했어요.");
      return;
    }
    startTransition(async () => {
      // 계약서와 세트로 묶이도록 연결 매물·소재지 보존
      if (propertyId) fd.set("property_id", propertyId);
      const address =
        String(fd.get("property_address") ?? "").trim() ||
        liveContractData?.property_address?.trim() ||
        "";
      if (address) fd.set("property_address", address);

      if (formId) {
        const result = await updateDealForm(formId, null, fd);
        if (result.error) toast.error(result.error);
        else {
          toast.success(result.message ?? "저장했어요.");
          refreshContractWriteOpener();
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
      refreshContractWriteOpener();
      router.refresh();
    });
  };

  const shellClass = cn(
    "flex flex-col gap-0 bg-background",
    isPage
      ? "min-h-[900px] w-full overflow-visible"
      : "max-h-[min(96vh,960px)] w-[min(98vw,1100px)] max-w-none overflow-hidden",
    "print:fixed print:inset-0 print:max-h-none print:h-auto print:w-full print:max-w-none print:overflow-visible print:translate-x-0 print:translate-y-0 print:rounded-none print:border-0 print:bg-white print:shadow-none"
  );

  const body = (
    <>
      {isPage ? (
        <div className="space-y-0 border-b px-4 py-3 print:hidden">
          <h1 className="text-base font-semibold">확인설명서 작성</h1>
          <p className="sr-only">계약서의 소재지·면적·인적사항이 반영됩니다. 1~4페이지를 눌러 확인하세요.</p>
        </div>
      ) : (
        <DialogHeader className="space-y-0 border-b px-4 py-3 print:hidden">
          <DialogTitle>확인설명서 작성</DialogTitle>
          <DialogDescription className="sr-only">
            계약서의 소재지·면적·인적사항이 반영됩니다. 1~4페이지를 눌러 확인하세요.
          </DialogDescription>
        </DialogHeader>
      )}

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
          <Label htmlFor="dw-link-property" className="text-[14px] text-white/70">
            연결 매물
          </Label>
          {propertyId && linkedPropertyLabel !== "연결 매물" ? (
            <p
              id="dw-link-property"
              className="flex h-8 min-w-48 max-w-xs items-center truncate rounded-lg border border-input bg-white px-2.5 text-sm text-foreground"
              title={linkedPropertyLabel}
            >
              {linkedPropertyLabel}
            </p>
          ) : propertySelectOptions.length > 0 ? (
            <NativeSelect
              id="dw-link-property"
              value={dealId}
              onChange={(e) => changeDealId(e.target.value)}
              placeholder="선택안함"
              options={propertySelectOptions}
              className="min-w-48 max-w-xs bg-white text-foreground"
            />
          ) : (
            <p className="max-w-xs text-[14px] text-white/80">
              매물이 없어요.{" "}
              <Link href="/properties/new" className="underline">
                매물 등록
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 border-b bg-muted/40 print:hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2">
          <Button type="submit" form="disclosure-write-form" size="sm" disabled={pending || !active || !disclosureKind}>
            <Save data-icon="inline-start" />
            저장
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!active || !disclosureKind}
            onClick={() => printContractSheet(active?.title, "disclosure-print-root")}
          >
            <Printer data-icon="inline-start" />
            인쇄 · PDF
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleClose}>
            닫기
          </Button>
          {disclosureKind ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => setDisclosureKind(null)}>
              서식 종류 변경
            </Button>
          ) : null}
          {propertyId || dealId ? (
            <span className="text-[14px] text-muted-foreground">
              연결 매물의 검토 완료 서류·입지 정보를 자동 반영합니다
            </span>
          ) : null}
        </div>
        {active && disclosureKind ? (
          <DisclosurePageTabs
            page={page}
            onPageChange={(next) => {
              setPage(next);
              document.getElementById("disclosure-scroll")?.scrollTo({ top: 0 });
            }}
            className="border-t border-border/60"
            pageCount={disclosureKind === "nonresidential" ? 3 : 4}
          />
        ) : null}
      </div>

      <div
        id="disclosure-scroll"
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-[14px] print:overflow-visible print:p-0"
      >
        {!active || !disclosureKind ? (
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
            <input type="hidden" name="property_id" value={propertyId} />
            {disclosureKind === "nonresidential" ? (
              <NonResidentialDisclosureFormSheet title={active.title} data={active.data} page={page} />
            ) : (
              <DisclosureFormSheet
                propertyType={active.propertyType}
                dealType={active.dealType}
                title={active.title}
                data={active.data}
                page={page}
                onPageChange={setPage}
                showPageTabs={false}
              />
            )}
          </form>
        )}
      </div>
      {!disclosureKind ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4 print:hidden">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="disclosure-kind-title"
            className="w-full max-w-[440px] border border-border bg-background p-4 shadow-xl"
          >
            <h2 id="disclosure-kind-title" className="mb-4 text-center text-[15px] font-semibold">
              확인설명서 종류를 선택하세요
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["residential", "주거용"],
                ["nonresidential", "비주거용"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={pendingDisclosureKind === value}
                  onClick={() => setPendingDisclosureKind(value)}
                  className={cn(
                    "h-14 border text-[14px] font-medium transition-colors",
                    pendingDisclosureKind === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted/40 hover:bg-muted"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[12px] text-muted-foreground">
              주거용은 기존 서식, 비주거용은 3쪽 서식으로 작성합니다.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setDisclosureKind(pendingDisclosureKind);
                  setPage(1);
                }}
              >
                확인
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleClose}>
                취소
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );

  if (isPage) {
    return <div className={shellClass}>{body}</div>;
  }

  return (
    <DialogContent showCloseButton className={cn(shellClass, "p-0 sm:max-w-none")}>
      {body}
    </DialogContent>
  );
}

/** 확인설명서 작성 창 — 계약서 작성에서 열어 소재지·면적·인적사항 반영 */
export function DisclosureWriteDialog({
  open,
  onOpenChange,
  deals,
  properties = [],
  seed = null,
  presentation = "dialog",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deals: WriteDealOption[];
  properties?: WritePropertyOption[];
  seed?: DisclosureWriteSeed | null;
  presentation?: "dialog" | "page";
}) {
  const sessionKey = seed
    ? `${seed.dealId}:${seed.propertyId ?? ""}:${seed.propertyLabel ?? ""}:${seed.propertyType}:${seed.dealType}:${seed.contractData ? Object.keys(seed.contractData).length : 0}`
    : "blank";

  if (presentation === "page") {
    if (!open) return null;
    return (
      <DisclosureWriteBody
        key={sessionKey}
        deals={deals}
        properties={properties}
        seed={seed}
        presentation="page"
        onClose={() => onOpenChange(false)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} disablePointerDismissal>
      {open ? (
        <DisclosureWriteBody
          key={sessionKey}
          deals={deals}
          properties={properties}
          seed={seed}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}
