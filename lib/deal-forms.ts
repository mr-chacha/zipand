/** 거래 서식 종류·기본값·필드 키 (웹 작성 / 공유 공용) */

export const DEAL_FORM_KINDS = ["contract", "disclosure", "receipt", "other"] as const;
export type DealFormKind = (typeof DEAL_FORM_KINDS)[number];

export const DEAL_FORM_KIND_LABELS: Record<DealFormKind, string> = {
  contract: "계약서",
  disclosure: "확인설명서",
  receipt: "영수증",
  other: "기타 서식",
};

export const DEAL_FORM_STATUSES = ["draft", "finalized"] as const;
export type DealFormStatus = (typeof DEAL_FORM_STATUSES)[number];

export const DEAL_FORM_STATUS_LABELS: Record<DealFormStatus, string> = {
  draft: "작성 중",
  finalized: "확정",
};

export type DealFormPrefill = {
  dealType: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyType: string;
  amount: number | null;
  monthlyRent: number | null;
  downPayment: number | null;
  balanceDate: string | null;
  contractDate: string | null;
  moveInDate: string | null;
  lessorName: string | null;
  lessorPhone: string | null;
  lessorAccount: string | null;
  lesseeName: string | null;
  lesseePhone: string | null;
  termsNote: string | null;
  clauses: string[];
  officeName: string;
  officePhone: string | null;
  officeAddress: string | null;
  agentName: string;
  agentPhone: string | null;
};

function str(v: string | null | undefined) {
  return v ?? "";
}

function money(v: number | null | undefined) {
  return v == null ? "" : String(v);
}

/** 거래·매물 정보로 서식 초안 data 채우기 */
export function buildDealFormDefaults(kind: DealFormKind, p: DealFormPrefill): Record<string, string> {
  const clauses = p.clauses.length ? p.clauses.map((c, i) => `${i + 1}. ${c}`).join("\n") : "";
  const common = {
    property_title: p.propertyTitle,
    property_address: p.propertyAddress,
    property_type: p.propertyType,
    deal_type: p.dealType,
    template_id: "",
    template_title: "",
    office_name: p.officeName,
    office_phone: str(p.officePhone),
    office_address: str(p.officeAddress),
    agent_name: p.agentName,
    agent_phone: str(p.agentPhone),
  };

  switch (kind) {
    case "contract":
      return {
        ...common,
        lessor_name: str(p.lessorName),
        lessor_phone: str(p.lessorPhone),
        lessor_account: str(p.lessorAccount),
        lessee_name: str(p.lesseeName),
        lessee_phone: str(p.lesseePhone),
        amount: money(p.amount),
        monthly_rent: money(p.monthlyRent),
        down_payment: money(p.downPayment),
        down_payment_date: str(p.contractDate),
        loan_amount: "",
        loan_assume: "승계",
        current_deposit: "",
        deposit_assume: "승계",
        interim_payment_1: "",
        interim_date_1: "",
        interim_payment_2: "",
        interim_date_2: "",
        balance_amount: "",
        contract_date: str(p.contractDate),
        expiry_date: "",
        balance_date: str(p.balanceDate),
        delivery_date: str(p.moveInDate),
        move_in_date: str(p.moveInDate),
        building: "",
        unit: "",
        land_category: "대",
        land_area: "",
        land_right_type: "",
        land_right_ratio: "",
        land_right_ratio_den: "",
        land_right_ratio_num: "",
        building_structure: "철근콘크리트구조",
        building_use: p.propertyType || "아파트",
        building_area: "",
        memo: "",
        completed: "",
        sender_name: "",
        receiver_name: "",
        contract_no: "",
        terms_note: str(p.termsNote),
        special_terms: clauses,
        extra_note: "",
      };
    case "disclosure":
      return {
        ...common,
        lessor_name: str(p.lessorName),
        lessee_name: str(p.lesseeName),
        ownership_note: "",
        rights_note: "",
        building_note: "",
        land_use_note: "",
        explanation_note: str(p.termsNote),
        confirmation_note: "중개대상물의 상태에 대하여 설명하였으며, 당사자는 내용을 확인하였습니다.",
        contract_date: str(p.contractDate),
      };
    case "receipt":
      return {
        ...common,
        receipt_type: "계약금",
        payer_name: str(p.lesseeName),
        payee_name: str(p.lessorName),
        amount: money(p.downPayment ?? p.amount),
        paid_at: str(p.contractDate),
        payment_method: "계좌이체",
        purpose: `${p.dealType} ${p.propertyTitle} 관련`,
        account: str(p.lessorAccount),
        note: "",
      };
    case "other":
      return {
        ...common,
        body: "",
        note: "",
      };
  }
}

export function defaultTitle(kind: DealFormKind, propertyTitle: string, propertyType?: string) {
  if (kind === "contract" && propertyType) return `부동산(${propertyType})`;
  if (kind === "contract" && propertyTitle) return propertyTitle;
  const label = DEAL_FORM_KIND_LABELS[kind];
  return propertyTitle ? `${propertyTitle} ${label}` : label;
}

/** 목록 테이블용 짧은 날짜 YY-MM-DD */
export function formatShortDate(value: string | null | undefined) {
  if (!value) return "";
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1].slice(2)}-${m[2]}-${m[3]}`;
  return value;
}

/** 보증금/월세 표시 (예: 3,000/230) */
export function formatDealAmount(amount: string, monthlyRent: string) {
  const a = amount.replace(/,/g, "").trim();
  const m = monthlyRent.replace(/,/g, "").trim();
  const fmt = (v: string) => {
    if (!v) return "";
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString("ko-KR") : v;
  };
  if (a && m) return `${fmt(a)}/${fmt(m)}`;
  return fmt(a) || fmt(m);
}

export function newContractNo() {
  return String(Date.now()).slice(-8);
}

/** FormData / jsonb → 문자열 맵 */
export function readFormDataRecord(fd: FormData, keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    const v = fd.get(key);
    out[key] = typeof v === "string" ? v.trim() : "";
  }
  return out;
}

export function formFieldKeys(kind: DealFormKind): string[] {
  return Object.keys(buildDealFormDefaults(kind, {
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
  }));
}

export function asStringRecord(data: unknown): Record<string, string> {
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (v == null) out[k] = "";
    else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = String(v);
  }
  return out;
}
