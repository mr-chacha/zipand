import type { DealFormPrefill } from "@/lib/deal-forms";

/** 영수증등 관련 서식 탭 */
export const RELATED_FORM_TABS = [
  { id: "receipt", label: "영수증", kind: "receipt" as const, formTemplate: "receipt" },
  { id: "broker_fee_receipt", label: "중개보수 영수증", kind: "receipt" as const, formTemplate: "broker_fee_receipt" },
  { id: "power_of_attorney", label: "위임장", kind: "other" as const, formTemplate: "power_of_attorney" },
  { id: "balance_settlement", label: "잔금 정산서", kind: "other" as const, formTemplate: "balance_settlement" },
  { id: "utility_settlement", label: "공과금 정산서", kind: "other" as const, formTemplate: "utility_settlement" },
] as const;

export type RelatedFormTabId = (typeof RELATED_FORM_TABS)[number]["id"];

export const RECEIPT_AMOUNT_PRESETS = [
  { id: "total", label: "총금액", purpose: "매매대금(보증금)" },
  { id: "down", label: "계약금", purpose: "계약금" },
  { id: "interim1", label: "중도금(1차)", purpose: "중도금(1차)" },
  { id: "interim2", label: "중도금(2차)", purpose: "중도금(2차)" },
  { id: "balance", label: "잔금", purpose: "잔금" },
] as const;

function str(v: string | null | undefined) {
  return v?.trim() ?? "";
}

function todayKstYmd() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function relatedFormTitle(tabId: RelatedFormTabId, dealType?: string) {
  const tab = RELATED_FORM_TABS.find((t) => t.id === tabId);
  const label = tab?.label ?? "서식";
  return dealType ? `${label} [${dealType}]` : label;
}

function officeFields(p: DealFormPrefill) {
  return {
    office_name: str(p.officeName),
    office_phone: str(p.officePhone),
    office_address: str(p.officeAddress),
    office_representative: str(p.officeRepresentative),
    office_registration_no: str(p.officeRegistrationNo),
    agent_name: str(p.agentName),
    agent_phone: str(p.agentPhone),
  };
}

/** 수기 작성용: 사무소·담당·발행일만 채우고 나머지는 비움 */
export function buildReceiptDefaults(p: DealFormPrefill): Record<string, string> {
  const issued = todayKstYmd();
  return {
    form_template: "receipt",
    receipt_doc_kind: "영수증",
    receipt_no: "",
    recipient_name: "",
    amount_won: "",
    property_label: "",
    purpose_line1: "",
    purpose_line2: "",
    issued_at: issued,
    issuer_address: str(p.officeAddress),
    issuer_name: str(p.agentName) || str(p.officeName),
    ...officeFields(p),
    property_title: "",
    property_address: "",
    property_type: "",
    deal_type: "",
    lessor_name: "",
    lessee_name: "",
    receipt_type: "",
    payer_name: "",
    payee_name: str(p.agentName) || str(p.officeName),
    amount: "",
    paid_at: issued,
    payment_method: "",
    purpose: "",
    account: "",
    note: "",
  };
}

export function buildBrokerFeeReceiptDefaults(p: DealFormPrefill): Record<string, string> {
  const issued = todayKstYmd();
  return {
    form_template: "broker_fee_receipt",
    receipt_no: "",
    recipient_name: "",
    lessor_name: "",
    lessee_name: "",
    tax_id: "",
    property_label: "",
    deal_amount_won: "",
    fee_amount_won: "",
    fee_vat_won: "",
    summary_amount_won: "",
    summary_note: "",
    txn_date: issued,
    fee_total_won: "",
    fee_total_vat_won: "",
    fee_lessor_won: "",
    fee_lessor_vat_won: "",
    fee_lessee_won: "",
    fee_lessee_vat_won: "",
    issued_at: issued,
    ...officeFields(p),
    property_title: "",
    property_address: "",
    property_type: "",
    deal_type: "",
    note: "",
  };
}

export function buildPowerOfAttorneyDefaults(p: DealFormPrefill): Record<string, string> {
  return {
    form_template: "power_of_attorney",
    subject_label: "",
    principal_name: "",
    principal_resident_id: "",
    principal_address: "",
    principal_phone: "",
    mandate_body: "",
    agent_relation: "",
    agent_name_poa: "",
    agent_resident_id: "",
    agent_address: "",
    agent_phone_poa: "",
    issued_at: todayKstYmd(),
    sign_name: "",
    ...officeFields(p),
    property_title: "",
    property_address: "",
    property_type: "",
    deal_type: "",
    note: "",
  };
}

export function buildBalanceSettlementDefaults(p: DealFormPrefill): Record<string, string> {
  const lines: Record<string, string> = {};
  for (let i = 0; i < 12; i++) {
    lines[`line_${i}_desc`] = "";
    lines[`line_${i}_sign`] = "";
    lines[`line_${i}_amount`] = "";
    lines[`line_${i}_note`] = "";
  }
  return {
    form_template: "balance_settlement",
    property_label: "",
    ...lines,
    total_amount: "",
    remarks: "",
    issued_at: todayKstYmd(),
    lessor_name: "",
    lessee_name: "",
    ...officeFields(p),
    property_title: "",
    property_address: "",
    property_type: "",
    deal_type: "",
    note: "",
  };
}

export function buildUtilitySettlementDefaults(p: DealFormPrefill): Record<string, string> {
  return {
    form_template: "utility_settlement",
    property_label: "",
    management_desc: "관리비 정산액(관리사무소 확인분)",
    management_amount: "",
    gas_meter: "",
    gas_usage: "",
    gas_period: "",
    gas_amount: "",
    electric_meter: "",
    electric_usage: "",
    electric_period: "",
    electric_amount: "",
    water_meter: "",
    water_usage: "",
    water_period: "",
    water_amount: "",
    repair_period: "",
    repair_months: "",
    repair_monthly: "",
    repair_amount: "",
    other_item: "",
    other_amount: "",
    total_amount: "",
    total_detail: "",
    remarks: "",
    issued_at: todayKstYmd(),
    ...officeFields(p),
    property_title: "",
    property_address: "",
    property_type: "",
    deal_type: "",
    note: "",
  };
}

export function buildRelatedFormDefaults(tabId: RelatedFormTabId, p: DealFormPrefill) {
  switch (tabId) {
    case "broker_fee_receipt":
      return buildBrokerFeeReceiptDefaults(p);
    case "power_of_attorney":
      return buildPowerOfAttorneyDefaults(p);
    case "balance_settlement":
      return buildBalanceSettlementDefaults(p);
    case "utility_settlement":
      return buildUtilitySettlementDefaults(p);
    default:
      return buildReceiptDefaults(p);
  }
}

export function isReceiptForm(data: Record<string, string>) {
  return data.form_template === "receipt" || data.form_template === "broker_fee_receipt" || (!data.form_template && Boolean(data.receipt_type));
}

export function isUtilitySettlementForm(data: Record<string, string>) {
  return data.form_template === "utility_settlement";
}

export function isBrokerFeeReceiptForm(data: Record<string, string>) {
  return data.form_template === "broker_fee_receipt";
}

export function isPowerOfAttorneyForm(data: Record<string, string>) {
  return data.form_template === "power_of_attorney";
}

export function isBalanceSettlementForm(data: Record<string, string>) {
  return data.form_template === "balance_settlement";
}
