"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Printer, Save } from "lucide-react";
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
import { ConfirmDialog } from "@/components/dialogs";
import { NativeSelect } from "@/components/form/native-select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { createDealFormForDeal, updateDealForm } from "@/lib/actions/deal-forms";
import { ensureDealForProperty } from "@/lib/actions/deals";
import { useBusy } from "@/lib/busy";
import {
  CONTRACT_DEAL_TYPES,
  CONTRACT_PROPERTY_TYPES,
  contractFormHeading,
  findContractFormTemplate,
  type ContractDealType,
  type ContractPropertyType,
} from "@/lib/contract-templates";
import {
  buildDealFormDefaults,
  leasedPortionFromBuildingUnit,
  newContractNo,
  type DealFormPrefill,
} from "@/lib/deal-forms";
import { stashDisclosureWriteSeed } from "@/lib/disclosure-write-seed";
import { refreshContractWriteOpener, tagContractWriteFormId } from "@/lib/open-contract-write";
import { printContractSheet } from "@/lib/print-contract";
import {
  CONTRACT_FORM_STYLE_OPTIONS,
  STANDARD_LEASE_TITLE,
  buildStandardLeaseDefaults,
  isStandardLeaseForm,
  type ContractFormStyle,
} from "@/lib/standard-lease";
import { cn } from "@/lib/utils";

/** 목록에서 제목 클릭 시 기존 계약서를 같은 작성 UI로 연다 */
export type ContractWriteEditSeed = {
  formId: string;
  title: string;
  data: Record<string, string>;
  propertyId?: string;
  /** deal_forms.deal_id — 확인설명서 연결 거래 시드 */
  dealId?: string;
  status?: "draft" | "finalized";
};

function inferPropertyType(data: Record<string, string>): ContractPropertyType {
  const t = data.property_type?.trim() ?? "";
  if ((CONTRACT_PROPERTY_TYPES as readonly string[]).includes(t)) return t as ContractPropertyType;
  if (t === "빌라" || t === "원룸") return "다가구";
  return "아파트";
}

function inferDealType(data: Record<string, string>): ContractDealType {
  const t = data.deal_type?.trim() ?? "";
  if ((CONTRACT_DEAL_TYPES as readonly string[]).includes(t)) return t as ContractDealType;
  return "매매";
}

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
  /** 연결 매물 — 서류함·확인설명서 채우기용 */
  propertyId?: string;
  prefill?: Partial<DealFormPrefill>;
  /** 해당 거래의 최신 계약서 data (확인설명서 등에서 소재지·면적·인적사항 반영) */
  contractData?: Record<string, string>;
};

/** 계약서 작성 「연결 매물」 */
export type WritePropertyOption = {
  value: string;
  label: string;
  propertyType: string;
  dealType: string;
  prefill?: Partial<DealFormPrefill>;
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

function matchProperties(
  properties: WritePropertyOption[],
  propertyType: ContractPropertyType,
  dealType: ContractDealType
) {
  const aliases: Record<string, string[]> = {
    아파트: ["아파트"],
    다가구: ["다가구", "빌라", "원룸"],
    다세대: ["다세대", "빌라"],
  };
  const types = aliases[propertyType] ?? [propertyType];
  const exact = properties.filter((p) => types.includes(p.propertyType) && p.dealType === dealType);
  if (exact.length) return exact;
  const byDeal = properties.filter((p) => p.dealType === dealType);
  return byDeal.length ? byDeal : properties;
}

/** 2. 계약내용 — 금액·지급일정 (연결 매물과 거래종류가 다를 때 비움) */
const CONTRACT_CONTENT_KEYS = [
  "amount",
  "monthly_rent",
  "down_payment",
  "down_payment_date",
  "loan_amount",
  "current_deposit",
  "interim_payment_1",
  "interim_date_1",
  "interim_payment_2",
  "interim_date_2",
  "balance_amount",
  "balance_date",
  "contract_date",
  "expiry_date",
  "delivery_date",
  "move_in_date",
  "lease_months",
  "rent_pay_day",
  "rent_pay_timing",
] as const;

function clearContractContent(data: Record<string, string>) {
  const next = { ...data };
  for (const key of CONTRACT_CONTENT_KEYS) next[key] = "";
  return next;
}

function mapPropertyType(raw: string | undefined): ContractPropertyType | null {
  if (!raw) return null;
  if ((CONTRACT_PROPERTY_TYPES as readonly string[]).includes(raw)) return raw as ContractPropertyType;
  if (raw === "빌라" || raw === "원룸") return "다가구";
  return null;
}

function mapDealType(raw: string | undefined): ContractDealType | null {
  if (!raw) return null;
  if ((CONTRACT_DEAL_TYPES as readonly string[]).includes(raw)) return raw as ContractDealType;
  return null;
}

/** 연결 매물에서 오는 소재지·동·호 등 — 저장된 빈 값이 prefill을 덮어쓰지 않게 */
const LINKED_LOCATION_KEYS = [
  "property_address",
  "property_title",
  "building",
  "unit",
  "building_area",
  "building_structure",
  "building_use",
  "land_area",
  "land_category",
  "leased_portion",
] as const;

function mergeKeepingLinkedLocation(
  base: Record<string, string>,
  overlay: Record<string, string>
) {
  const out = { ...base, ...overlay };
  for (const key of LINKED_LOCATION_KEYS) {
    if (!String(out[key] ?? "").trim() && String(base[key] ?? "").trim()) {
      out[key] = base[key];
    }
  }
  return out;
}

function linkedLocationFromProperty(p: WritePropertyOption | undefined): Partial<Record<string, string>> {
  if (!p?.prefill) return {};
  const f = p.prefill;
  return {
    property_address: f.propertyAddress?.trim() || "",
    property_title: f.propertyTitle?.trim() || "",
    building: f.building?.trim() || "",
    unit: f.unit?.trim() || "",
    building_area: f.buildingArea?.trim() || "",
    building_structure: f.buildingStructure?.trim() || "",
    building_use: f.buildingUse?.trim() || "",
    land_area: f.landArea?.trim() || "",
    land_category: f.landCategory?.trim() || "",
  };
}

function buildActiveForm(
  propertyType: ContractPropertyType,
  dealType: ContractDealType,
  propertyId: string,
  properties: WritePropertyOption[],
  formStyle: ContractFormStyle,
  office?: RelatedFormsOfficeDefaults | null
) {
  const template = findContractFormTemplate(propertyType, dealType);
  if (!template) return null;
  const linked = properties.find((p) => p.value === propertyId);
  const prefill = withOfficeDefaults(
    {
      ...emptyPrefill(office),
      ...linked?.prefill,
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
  // 연결 매물 주소·동·호를 확실히 반영 (prefill 누락·빈 저장값 대비)
  if (linked) {
    const loc = linkedLocationFromProperty(linked);
    for (const key of LINKED_LOCATION_KEYS) {
      const v = loc[key]?.trim();
      if (!v) continue;
      if (
        key === "property_address" ||
        key === "building" ||
        key === "unit" ||
        key === "property_title" ||
        !String(data[key] ?? "").trim()
      ) {
        data[key] = v;
      }
    }
    // 전세·월세: 동·호가 있으면 임대할 부분에 자동 입력 (이미 값 있으면 유지)
    if (dealType !== "매매" && !String(data.leased_portion ?? "").trim()) {
      const portion = leasedPortionFromBuildingUnit(data.building, data.unit);
      if (portion) data.leased_portion = portion;
    }
  }
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
  properties,
  deals = [],
  office = null,
  edit = null,
  presentation = "dialog",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: WritePropertyOption[];
  /** 매물에 연결된 거래가 있으면 저장 시 deal_id 연결·확인설명서 시드용 */
  deals?: WriteDealOption[];
  /** 설정에 등록된 사무소·담당자 — 개업공인중개사 란에 반영 */
  office?: RelatedFormsOfficeDefaults | null;
  /** 기존 계약서 열람·수정 */
  edit?: ContractWriteEditSeed | null;
  /** dialog: 모달 / page: 새 창·전용 페이지 */
  presentation?: "dialog" | "page";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useBusy(pending);
  const isPage = presentation === "page";

  const [pickProperty, setPickProperty] = useState<ContractPropertyType>("아파트");
  const [pickDeal, setPickDeal] = useState<ContractDealType>("매매");
  const [formStyle, setFormStyle] = useState<ContractFormStyle>("general");
  /** 기본은 연결 안 함 — 선택 시에만 매물 정보 prefill */
  const [propertyId, setPropertyId] = useState("");
  /** 연결 매물에 대응하는 deals.id (확인설명서·저장 시 deal_id) */
  const [linkedDealIdState, setLinkedDealIdState] = useState("");
  const [formId, setFormId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, string> | null>(null);
  const [editTitle, setEditTitle] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<"draft" | "finalized" | null>(null);
  /** 종류·거래가 바뀔 때 양식을 다시 마운트하기 위한 키 */
  const [formEpoch, setFormEpoch] = useState(0);
  const [leasePage, setLeasePage] = useState<StandardLeasePageNo>(1);
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [disclosureSeed, setDisclosureSeed] = useState<DisclosureWriteSeed | null>(null);
  const [propertyConfirmOpen, setPropertyConfirmOpen] = useState(false);
  const [pendingPropertyId, setPendingPropertyId] = useState<string | null>(null);
  const [dealTypeConfirmOpen, setDealTypeConfirmOpen] = useState(false);
  const [pendingDealType, setPendingDealType] = useState<ContractDealType | null>(null);
  /** 표준임대차 전환 등으로 거래종류 확인이 필요할 때 함께 적용 */
  const [pendingFormStyle, setPendingFormStyle] = useState<ContractFormStyle | null>(null);
  const editing = Boolean(formId && editData);
  const readOnly = editStatus === "finalized";
  const prevEditIdRef = useRef<string | null>(null);
  const linkedProperty = propertyId ? properties.find((p) => p.value === propertyId) : undefined;
  const linkedPropertyDealType = mapDealType(linkedProperty?.dealType);

  /** 연결 매물은 전체 표시, 현재 서식과 맞는 매물을 위로 */
  const propertyOptions = useMemo(() => {
    const matched = new Set(matchProperties(properties, pickProperty, pickDeal).map((p) => p.value));
    return [...properties].sort((a, b) => {
      const am = matched.has(a.value) ? 0 : 1;
      const bm = matched.has(b.value) ? 0 : 1;
      return am - bm;
    });
  }, [properties, pickProperty, pickDeal]);

  const active = useMemo(() => {
    if (!open) return null;
    const base = buildActiveForm(pickProperty, pickDeal, propertyId, properties, formStyle, office);
    if (!base) return null;
    if (!editData) return base;
    return {
      ...base,
      title: editTitle || base.title,
      // 저장된 빈 소재지가 연결 매물 주소를 지우지 않도록
      data: mergeKeepingLinkedLocation(base.data, editData),
    };
  }, [open, pickProperty, pickDeal, propertyId, properties, formStyle, office, editData, editTitle]);

  const findDealIdForProperty = (pid: string) =>
    deals.find((d) => d.propertyId === pid)?.value ?? null;

  const reset = () => {
    setFormId(null);
    setEditData(null);
    setEditTitle(null);
    setEditStatus(null);
    setPickProperty("아파트");
    setPickDeal("매매");
    setFormStyle("general");
    setPropertyId("");
    setLinkedDealIdState("");
    setFormEpoch(0);
    setLeasePage(1);
    setDisclosureOpen(false);
    setDisclosureSeed(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      reset();
      if (isPage) {
        refreshContractWriteOpener();
        // 팝업이면 창 닫기, 아니면 목록으로
        if (typeof window !== "undefined" && window.opener) {
          window.close();
          return;
        }
        router.push("/contracts");
        return;
      }
    } else if (!edit) {
      setPropertyId("");
      setLinkedDealIdState("");
      setFormEpoch((n) => n + 1);
    }
    onOpenChange(next);
  };

  useEffect(() => {
    if (!open || !isPage) return;
    tagContractWriteFormId(formId ?? edit?.formId ?? "");
  }, [open, isPage, formId, edit?.formId]);

  useEffect(() => {
    if (!open) {
      prevEditIdRef.current = null;
      return;
    }
    if (edit) {
      prevEditIdRef.current = edit.formId;
      setFormId(edit.formId);
      setEditData(edit.data);
      setEditTitle(edit.title);
      setEditStatus(edit.status ?? "draft");
      setPickProperty(inferPropertyType(edit.data));
      setPickDeal(inferDealType(edit.data));
      setFormStyle(isStandardLeaseForm(edit.data) ? "standard_lease" : "general");
      const nextPropertyId = edit.propertyId ?? edit.data.property_id ?? "";
      setPropertyId(nextPropertyId);
      setLinkedDealIdState(
        edit.dealId ||
          (nextPropertyId ? findDealIdForProperty(nextPropertyId) : "") ||
          ""
      );
      setLeasePage(1);
      setFormEpoch((n) => n + 1);
      return;
    }
    // 목록 수정 → 신규 작성으로 전환할 때만 초기화 (저장 직후 formId·연결매물을 지우지 않음)
    if (prevEditIdRef.current) {
      prevEditIdRef.current = null;
      setFormId(null);
      setEditData(null);
      setEditTitle(null);
      setEditStatus(null);
      setPickProperty("아파트");
      setPickDeal("매매");
      setFormStyle("general");
      setPropertyId("");
      setLinkedDealIdState("");
      setLeasePage(1);
      setFormEpoch((n) => n + 1);
    }
  }, [open, edit]);

  const openDisclosure = () => {
    const live = readFormRecord("contract-write-form");
    const fromProperty = linkedLocationFromProperty(linkedProperty);
    const address = (
      live.property_address ||
      editData?.property_address ||
      fromProperty.property_address ||
      ""
    ).trim();
    if (!address) {
      toast.error("계약서에 소재지(주소)를 먼저 입력해 주세요. 연결 매물을 선택하거나 주소를 입력한 뒤 작성할 수 있어요.");
      return;
    }

    startTransition(async () => {
      let dealId =
        linkedDealIdState ||
        (propertyId ? findDealIdForProperty(propertyId) : null) ||
        "";
      if (propertyId && !dealId) {
        const ensured = await ensureDealForProperty(propertyId);
        if (!ensured.ok) {
          toast.error(ensured.error);
          return;
        }
        dealId = ensured.dealId;
        setLinkedDealIdState(dealId);
      }
      const deal = dealId ? deals.find((d) => d.value === dealId) : undefined;
      const contractData = mergeKeepingLinkedLocation(
        {
          ...fromProperty,
          property_address: address,
          building: fromProperty.building || "",
          unit: fromProperty.unit || "",
        } as Record<string, string>,
        { ...deal?.contractData, ...live, property_address: address }
      );
      if (propertyId) contractData.property_id = propertyId;
      if (!contractData.building?.trim() && fromProperty.building) {
        contractData.building = fromProperty.building;
      }
      if (!contractData.unit?.trim() && fromProperty.unit) {
        contractData.unit = fromProperty.unit;
      }
      const seed = {
        propertyType: pickProperty,
        dealType: pickDeal,
        dealId: dealId || "",
        propertyId: propertyId || "",
        propertyLabel: linkedProperty?.label || "",
        contractData,
      };
      // 웹·전용 작성 창에서는 같은 창을 확인설명서 페이지로 전환
      if (isPage) {
        tagContractWriteFormId(formId ?? edit?.formId ?? "");
        stashDisclosureWriteSeed(seed);
        router.replace("/contracts/disclosure/write");
        return;
      }
      setDisclosureSeed(seed);
      setDisclosureOpen(true);
    });
  };

  /** 서식·종류 변경 시 현재 입력값을 새 양식에 최대한 유지 */
  const remountWithTypes = ({
    nextProperty = pickProperty,
    nextDeal = pickDeal,
    nextStyle = formStyle,
    skipContractContent = false,
  }: {
    nextProperty?: ContractPropertyType;
    nextDeal?: ContractDealType;
    nextStyle?: ContractFormStyle;
    skipContractContent?: boolean;
  }) => {
    const live = typeof document !== "undefined" ? readFormRecord("contract-write-form") : {};
    const base = buildActiveForm(nextProperty, nextDeal, propertyId, properties, nextStyle, office);
    if (!base) {
      setPickProperty(nextProperty);
      setPickDeal(nextDeal);
      setFormStyle(nextStyle);
      setLeasePage(1);
      setFormEpoch((n) => n + 1);
      return;
    }

    let data: Record<string, string> = mergeKeepingLinkedLocation(base.data, live);
    if (editData) data = mergeKeepingLinkedLocation(data, { ...editData, ...live });
    data = mergeKeepingLinkedLocation(base.data, data);
    data.template_id = base.data.template_id;
    data.template_title = base.data.template_title;
    data.property_type = nextProperty;
    data.deal_type = nextDeal;
    data.form_template = base.data.form_template;
    data.building_use = data.building_use || nextProperty;
    if (skipContractContent) data = clearContractContent(data);

    setPickProperty(nextProperty);
    setPickDeal(nextDeal);
    setFormStyle(nextStyle);
    setEditData(data);
    setEditTitle(base.title);
    setLeasePage(1);
    setFormEpoch((n) => n + 1);
  };

  const changeProperty = (value: ContractPropertyType) => {
    if (readOnly || value === pickProperty) return;
    remountWithTypes({ nextProperty: value });
  };

  const applyDealType = (value: ContractDealType, skipContractContent: boolean) => {
    remountWithTypes({ nextDeal: value, skipContractContent });
  };

  const changeDealType = (value: ContractDealType) => {
    if (readOnly || value === pickDeal) return;
    if (
      linkedPropertyDealType &&
      linkedPropertyDealType !== value
    ) {
      setPendingDealType(value);
      setDealTypeConfirmOpen(true);
      return;
    }
    applyDealType(value, false);
  };

  const confirmDealTypeChange = () => {
    if (!pendingDealType) return;
    remountWithTypes({
      nextDeal: pendingDealType,
      nextStyle: pendingFormStyle ?? formStyle,
      skipContractContent: true,
    });
    setPendingDealType(null);
    setPendingFormStyle(null);
    setDealTypeConfirmOpen(false);
  };

  const changeFormStyle = (value: ContractFormStyle) => {
    if (readOnly || value === formStyle) return;
    if (value === "standard_lease" && pickDeal === "매매") {
      if (linkedPropertyDealType && linkedPropertyDealType !== "전세") {
        setPendingFormStyle(value);
        setPendingDealType("전세");
        setDealTypeConfirmOpen(true);
        return;
      }
      remountWithTypes({ nextStyle: value, nextDeal: "전세" });
      return;
    }
    remountWithTypes({ nextStyle: value });
  };

  const applyPropertyId = (value: string) => {
    const p = properties.find((x) => x.value === value);
    const nextProperty = mapPropertyType(p?.propertyType) ?? pickProperty;
    const nextDeal = mapDealType(p?.dealType) ?? pickDeal;
    setPropertyId(value);
    setLinkedDealIdState(value ? findDealIdForProperty(value) || "" : "");
    // 매물 변경 확인 후 — 매물 정보(주소·동·호 포함)로 다시 채움
    const base = buildActiveForm(nextProperty, nextDeal, value, properties, formStyle, office);
    setPickProperty(nextProperty);
    setPickDeal(nextDeal);
    if (base) {
      const loc = linkedLocationFromProperty(p);
      const data = { ...base.data };
      for (const key of LINKED_LOCATION_KEYS) {
        const v = loc[key]?.trim();
        if (v) data[key] = v;
      }
      if (nextDeal !== "매매") {
        const portion = leasedPortionFromBuildingUnit(data.building, data.unit);
        if (portion) data.leased_portion = portion;
        else data.leased_portion = "";
      }
      setEditData(data);
      setEditTitle(base.title);
    } else {
      setEditData(null);
    }
    setLeasePage(1);
    setFormEpoch((n) => n + 1);
  };

  const requestPropertyIdChange = (value: string) => {
    if (value === propertyId) return;
    const mayLoseValues = Boolean(propertyId || formId || editData);
    if (mayLoseValues) {
      setPendingPropertyId(value);
      setPropertyConfirmOpen(true);
      return;
    }
    applyPropertyId(value);
  };

  const confirmPropertyIdChange = () => {
    if (pendingPropertyId === null) return;
    applyPropertyId(pendingPropertyId);
    setPendingPropertyId(null);
    setPropertyConfirmOpen(false);
  };

  const makeCopy = () => {
    if (!active) {
      toast.error("계약서 양식을 불러오지 못했어요.");
      return;
    }
    startTransition(async () => {
      const live = readFormRecord("contract-write-form");
      if (propertyId) live.property_id = propertyId;
      else delete live.property_id;
      live.contract_no = newContractNo();

      const baseTitle = (editTitle || active.title).replace(/\s*\(사본\)\s*$/u, "").trim() || active.title;
      const copyTitle = `${baseTitle} (사본)`;
      live.template_title = copyTitle;

      const dealId =
        linkedDealIdState ||
        (propertyId ? findDealIdForProperty(propertyId) : null) ||
        null;
      const created = await createDealFormForDeal(dealId, {
        templateId: active.templateId,
        kind: "contract",
        title: copyTitle,
      });
      if (created.error || !created.id) {
        toast.error(created.error ?? "사본을 만들지 못했어요.");
        return;
      }

      const fd = new FormData();
      fd.set("title", copyTitle);
      for (const [key, value] of Object.entries(live)) {
        fd.set(key, value);
      }
      if (propertyId) fd.set("property_id", propertyId);

      const updated = await updateDealForm(created.id, null, fd);
      if (updated.error) {
        toast.error(updated.error);
        return;
      }

      setFormId(created.id);
      tagContractWriteFormId(created.id);
      setEditData(live);
      setEditTitle(copyTitle);
      setEditStatus("draft");
      setFormEpoch((n) => n + 1);
      toast.success("사본을 만들었어요.");
      refreshContractWriteOpener();
      router.refresh();
    });
  };

  const save = (fd: FormData) => {
    if (!active) {
      toast.error("계약서 양식을 불러오지 못했어요.");
      return;
    }
    if (readOnly) {
      toast.error("확정된 계약서는 수정할 수 없어요.");
      return;
    }
    startTransition(async () => {
      if (propertyId) fd.set("property_id", propertyId);
      if (formId) {
        const result = await updateDealForm(formId, null, fd);
        if (result.error) toast.error(result.error);
        else {
          toast.success(result.message ?? "저장했어요.");
          const live = readFormRecord("contract-write-form");
          if (propertyId) live.property_id = propertyId;
          else delete live.property_id;
          setEditData(live);
          refreshContractWriteOpener();
          router.refresh();
        }
        return;
      }
      let dealId =
        linkedDealIdState ||
        (propertyId ? findDealIdForProperty(propertyId) : null) ||
        null;
      if (propertyId && !dealId) {
        const ensured = await ensureDealForProperty(propertyId);
        if (ensured.ok) {
          dealId = ensured.dealId;
          setLinkedDealIdState(dealId);
        }
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
      tagContractWriteFormId(created.id);
      const live = readFormRecord("contract-write-form");
      if (propertyId) live.property_id = propertyId;
      setEditData(live);
      setEditTitle(active.title);
      setEditStatus("draft");
      toast.success("계약서를 저장했어요.");
      refreshContractWriteOpener();
      if (isPage) router.replace(`/contracts/write?id=${created.id}`);
      else router.refresh();
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
            <h1 className="text-base font-semibold">{editing ? "계약서 조회·수정" : "계약서 작성"}</h1>
            <p className="sr-only">
              일반 계약서 또는 표준임대차 계약서를 선택하고 부동산·거래 종류를 바꾸면 아래 양식이 바뀝니다.
            </p>
          </div>
        ) : (
          <DialogHeader className="space-y-0 border-b px-4 py-3 print:hidden">
            <DialogTitle>{editing ? "계약서 조회·수정" : "계약서 작성"}</DialogTitle>
            <DialogDescription className="sr-only">
              일반 계약서 또는 표준임대차 계약서를 선택하고 부동산·거래 종류를 바꾸면 아래 양식이 바뀝니다.
            </DialogDescription>
          </DialogHeader>
        )}

        <div className="flex flex-wrap items-end gap-3 border-b bg-slate-800 px-4 py-3 text-white print:hidden">
          <p className="w-full text-[14px] font-medium text-white/80 sm:w-auto sm:pb-2">계약서종류</p>
          <div className="space-y-1">
            <Label htmlFor="cw-style" className="text-[14px] text-white/70">
              서식
            </Label>
            <NativeSelect
              id="cw-style"
              value={formStyle}
              disabled={readOnly}
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
              disabled={readOnly}
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
              disabled={readOnly}
              onChange={(e) => changeDealType(e.target.value as ContractDealType)}
              options={[...CONTRACT_DEAL_TYPES]}
              className="w-28 bg-white text-foreground"
            />
          </div>
          <div className="ml-auto space-y-1">
            <Label htmlFor="cw-link-property" className="text-[14px] text-white/70">
              연결 매물
            </Label>
            {properties.length === 0 ? (
              <p className="max-w-xs text-[14px] text-white/80">
                매물이 없어요.{" "}
                <Link href="/properties/new" className="underline">
                  매물 등록
                </Link>
              </p>
            ) : (
              <NativeSelect
                id="cw-link-property"
                value={propertyId}
                disabled={readOnly}
                onChange={(e) => requestPropertyIdChange(e.target.value)}
                placeholder="선택안함"
                options={propertyOptions.map((p) => ({
                  value: p.value,
                  label: p.label,
                }))}
                className="min-w-48 max-w-xs bg-white text-foreground"
              />
            )}
          </div>
        </div>

        <div className="shrink-0 border-b bg-muted/40 print:hidden">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2">
            <Button
              type="submit"
              form="contract-write-form"
              size="sm"
              disabled={pending || !active || readOnly}
            >
              <Save data-icon="inline-start" />
              계약서저장
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || !active}
              onClick={makeCopy}
            >
              <Copy data-icon="inline-start" />
              사본만들기
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
            {readOnly && <span className="text-[14px] text-muted-foreground">확정됨 · 조회만 가능해요</span>}
            {!readOnly && formId && <span className="text-[14px] text-muted-foreground">저장됨</span>}
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
          className={cn(
            "px-4 py-4 text-[14px] print:overflow-visible print:p-0",
            // 팝업(page): 바깥 래퍼가 스크롤. 모달: 이 영역만 세로 스크롤.
            isPage ? "overflow-visible" : "min-h-0 flex-1 overflow-y-auto"
          )}
        >
          {!active ? (
            <p className="py-16 text-center text-[14px] text-muted-foreground">해당 종류의 계약서 서식이 없어요.</p>
          ) : (
            <form
              id="contract-write-form"
              key={`${active.formStyle}-${active.templateId}-${propertyId}-${formEpoch}-${formId ?? "new"}`}
              onSubmit={(e) => {
                e.preventDefault();
                save(new FormData(e.currentTarget));
              }}
            >
              <input type="hidden" name="title" value={active.title} />
              <input type="hidden" name="property_id" value={propertyId} />
              <fieldset disabled={readOnly} className="min-w-0 border-0 p-0">
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
              </fieldset>
            </form>
          )}
        </div>
    </>
  );

  return (
    <>
    {isPage ? (
      open ? <div className={shellClass}>{body}</div> : null
    ) : (
      <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal>
        <DialogContent showCloseButton className={cn(shellClass, "p-0 sm:max-w-none")}>
          {body}
        </DialogContent>
      </Dialog>
    )}

    <DisclosureWriteDialog
      open={disclosureOpen}
      onOpenChange={setDisclosureOpen}
      deals={deals}
      properties={properties}
      seed={disclosureSeed}
    />

    <ConfirmDialog
      open={propertyConfirmOpen}
      onOpenChange={(next) => {
        setPropertyConfirmOpen(next);
        if (!next) setPendingPropertyId(null);
      }}
      title="연결 매물을 바꿀까요?"
      description="매물을 바꾸면 이전에 입력한 값이 모두 사라집니다."
      confirmLabel="매물 변경"
      destructive
      onConfirm={confirmPropertyIdChange}
    />

    <ConfirmDialog
      open={dealTypeConfirmOpen}
      onOpenChange={(next) => {
        setDealTypeConfirmOpen(next);
        if (!next) {
          setPendingDealType(null);
          setPendingFormStyle(null);
        }
      }}
      title="거래 종류를 바꿀까요?"
      description={
        linkedPropertyDealType && pendingDealType
          ? `해당 연결 매물은 "${linkedPropertyDealType}"매물로 등록되어 있습니다.\n거래 종류를 "${pendingDealType}"로 변경하시겠습니까?`
          : "거래 종류를 바꾸면 계약서 양식이 바뀌어요."
      }
      confirmLabel="변경"
      onConfirm={confirmDealTypeChange}
    />
    </>
  );
}

export function ContractWriteButton({
  variant = "default",
  size = "default",
  className,
  children = "계약서 작성",
  formId,
}: {
  properties?: WritePropertyOption[];
  deals?: WriteDealOption[];
  office?: RelatedFormsOfficeDefaults | null;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  children?: React.ReactNode;
  formId?: string;
}) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => {
        void import("@/lib/open-contract-write").then(({ openContractWriteWindow }) =>
          openContractWriteWindow(formId)
        );
      }}
    >
      {children}
    </Button>
  );
}
