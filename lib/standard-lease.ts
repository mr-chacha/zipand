import type { DealFormPrefill } from "@/lib/deal-forms";

export const STANDARD_LEASE_TEMPLATE = "standard_lease";
export const STANDARD_LEASE_TITLE = "표준임대차계약서";

export type ContractFormStyle = "general" | "standard_lease";

export const CONTRACT_FORM_STYLE_OPTIONS: { value: ContractFormStyle; label: string }[] = [
  { value: "general", label: "일반 계약서" },
  { value: "standard_lease", label: "표준임대차 계약서" },
];

export function isStandardLeaseForm(data: Record<string, string> | null | undefined) {
  return (data?.form_template ?? "") === STANDARD_LEASE_TEMPLATE;
}

function str(v: string | null | undefined) {
  return v?.trim() ?? "";
}

function money(v: number | null | undefined) {
  return v != null && Number.isFinite(v) ? String(Math.floor(v)) : "";
}

function todayKstYmd() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 민간임대주택 표준임대차계약서 기본값 */
export function buildStandardLeaseDefaults(p: DealFormPrefill): Record<string, string> {
  const deposit = money(p.amount);
  const rent = money(p.monthlyRent);
  const down = money(p.downPayment);

  return {
    form_template: STANDARD_LEASE_TEMPLATE,
    template_title: STANDARD_LEASE_TITLE,
    property_title: str(p.propertyTitle),
    property_address: str(p.propertyAddress),
    property_type: str(p.propertyType),
    deal_type: str(p.dealType) || "월세",
    contract_date: str(p.contractDate) || todayKstYmd(),
    contract_no: "",

    // 1. 당사자
    lessor_name: str(p.lessorName),
    lessor_address: "",
    lessor_id_front: "",
    lessor_id_back: "",
    lessor_phone: str(p.lessorPhone),
    lessor_biz_no: "",
    lessee_name: str(p.lesseeName),
    lessee_address: "",
    lessee_id_front: "",
    lessee_id_back: "",
    lessee_phone: str(p.lesseePhone),

    // 2. 중개사
    office_name: str(p.officeName),
    office_representative: str(p.officeRepresentative),
    office_address: str(p.officeAddress),
    office_registration_no: str(p.officeRegistrationNo),
    office_phone: str(p.officePhone),
    agent_name: str(p.agentName),
    agent_phone: str(p.agentPhone),

    // 3. 물건
    building: str(p.building),
    unit: str(p.unit),
    building_area: str(p.buildingArea),
    land_area: str(p.landArea),
    housing_type: str(p.buildingUse) || str(p.propertyType) || "아파트",
    rental_reg_type: "미등록",

    // 4. 계약조건
    amount: deposit,
    amount_korean: "",
    monthly_rent: rent,
    monthly_rent_korean: "",
    lease_start: str(p.contractDate) || todayKstYmd(),
    lease_end: str(p.moveInDate) || "",
    day_count_rule: "초일불산입",
    balance_mode: "자동계산",
    down_payment: down,
    interim_payment_1: "",
    interim_date_1: "",
    balance_amount: "",
    balance_date: str(p.balanceDate),
    bank_name: "",
    bank_account: str(p.lessorAccount),
    bank_holder: str(p.lessorName),

    // 조항 입력란
    late_fee_rate: "",
    private_rental_start: "",
    private_rental_end: "",
    special_terms: (p.clauses ?? []).filter(Boolean).join("\n") || str(p.termsNote),
    explanation_ack: "0",
    privacy_consent: "0",

    // 공동 당사자·중개사 (별지)
    co_lessor_name: "",
    co_lessor_address: "",
    co_lessor_id_front: "",
    co_lessor_id_back: "",
    co_lessor_phone: "",
    co_lessee_name: "",
    co_lessee_address: "",
    co_lessee_id_front: "",
    co_lessee_id_back: "",
    co_lessee_phone: "",
    joint_office_name: "",
    joint_office_phone: "",
    joint_office_address: "",
    joint_office_representative: "",
    joint_office_registration_no: "",
    joint_agent_name: "",

    // 하위 호환(일반 계약서 키)
    expiry_date: str(p.moveInDate) || "",
    move_in_date: str(p.moveInDate) || "",
    lessor_account: str(p.lessorAccount),
    memo: "",
    completed: "",
    sender_name: "",
    receiver_name: "",
    terms_note: str(p.termsNote),
    extra_note: "",
  };
}
