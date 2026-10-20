import type { DealFormKind } from "@/lib/deal-forms";

/** 보유 PDF 서식 기준 부동산 종류 */
export const CONTRACT_PROPERTY_TYPES = ["아파트", "다가구", "다세대"] as const;
export type ContractPropertyType = (typeof CONTRACT_PROPERTY_TYPES)[number];

/** 계약서·확인설명서에 쓰는 거래 종류 */
export const CONTRACT_DEAL_TYPES = ["매매", "전세", "월세"] as const;
export type ContractDealType = (typeof CONTRACT_DEAL_TYPES)[number];

export type ContractTemplate = {
  id: string;
  propertyType: ContractPropertyType;
  dealType: ContractDealType;
  /** deal_forms.kind */
  kind: Extract<DealFormKind, "contract" | "disclosure">;
  title: string;
  /** 원본 PDF 파일명(참고용) */
  sourceFile: string;
};

/**
 * `집앤/계약관리` 폴더의 PDF 서식 목록.
 * 아파트·다가구·다세대 × 매매·전세·월세 (확인설명서는 다가구·다세대가 거래유형 공용 1종)
 */
export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  // 아파트
  { id: "apt-sale-contract", propertyType: "아파트", dealType: "매매", kind: "contract", title: "아파트 매매 계약서", sourceFile: "아파트/아파트 매매 계약서.pdf" },
  { id: "apt-sale-disclosure", propertyType: "아파트", dealType: "매매", kind: "disclosure", title: "아파트 매매 확인설명서", sourceFile: "아파트/아파트 매매 확인설명서.pdf" },
  { id: "apt-jeonse-contract", propertyType: "아파트", dealType: "전세", kind: "contract", title: "아파트 전세 계약서", sourceFile: "아파트/아파트 전세 계약서.pdf" },
  { id: "apt-jeonse-disclosure", propertyType: "아파트", dealType: "전세", kind: "disclosure", title: "아파트 전세 확인설명서", sourceFile: "아파트/아파트 전세 확인설명서.pdf" },
  { id: "apt-monthly-contract", propertyType: "아파트", dealType: "월세", kind: "contract", title: "아파트 월세 계약서", sourceFile: "아파트/아파트 월세 계약서.pdf" },
  { id: "apt-monthly-disclosure", propertyType: "아파트", dealType: "월세", kind: "disclosure", title: "아파트 월세 확인설명서", sourceFile: "아파트/아파트 월세 확인설명서.pdf" },
  // 다가구
  { id: "multi-sale-contract", propertyType: "다가구", dealType: "매매", kind: "contract", title: "다가구 매매 계약서", sourceFile: "다가구/다가구 매매.pdf" },
  { id: "multi-jeonse-contract", propertyType: "다가구", dealType: "전세", kind: "contract", title: "다가구 전세 계약서", sourceFile: "다가구/다가구 전세.pdf" },
  { id: "multi-monthly-contract", propertyType: "다가구", dealType: "월세", kind: "contract", title: "다가구 월세 계약서", sourceFile: "다가구/다가구 월세.pdf" },
  { id: "multi-sale-disclosure", propertyType: "다가구", dealType: "매매", kind: "disclosure", title: "다가구 확인설명서", sourceFile: "다가구/다가구 확인설명서.pdf" },
  { id: "multi-jeonse-disclosure", propertyType: "다가구", dealType: "전세", kind: "disclosure", title: "다가구 확인설명서", sourceFile: "다가구/다가구 확인설명서.pdf" },
  { id: "multi-monthly-disclosure", propertyType: "다가구", dealType: "월세", kind: "disclosure", title: "다가구 확인설명서", sourceFile: "다가구/다가구 확인설명서.pdf" },
  // 다세대
  { id: "villa-sale-contract", propertyType: "다세대", dealType: "매매", kind: "contract", title: "다세대 매매 계약서", sourceFile: "다세대/다세대 매매.pdf" },
  { id: "villa-jeonse-contract", propertyType: "다세대", dealType: "전세", kind: "contract", title: "다세대 전세 계약서", sourceFile: "다세대/다세대 전세.pdf" },
  { id: "villa-monthly-contract", propertyType: "다세대", dealType: "월세", kind: "contract", title: "다세대 월세 계약서", sourceFile: "다세대/다세대 월세.pdf" },
  { id: "villa-sale-disclosure", propertyType: "다세대", dealType: "매매", kind: "disclosure", title: "다세대 확인설명서", sourceFile: "다세대/다세대 확인설명서.pdf" },
  { id: "villa-jeonse-disclosure", propertyType: "다세대", dealType: "전세", kind: "disclosure", title: "다세대 확인설명서", sourceFile: "다세대/다세대 확인설명서.pdf" },
  { id: "villa-monthly-disclosure", propertyType: "다세대", dealType: "월세", kind: "disclosure", title: "다세대 확인설명서", sourceFile: "다세대/다세대 확인설명서.pdf" },
];

export function getContractTemplate(id: string) {
  return CONTRACT_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function listContractTemplates(propertyType: ContractPropertyType, dealType: ContractDealType) {
  return CONTRACT_TEMPLATES.filter((t) => t.propertyType === propertyType && t.dealType === dealType);
}

/** 계약서(확인설명서 제외) 서식 1건 */
export function findContractFormTemplate(propertyType: ContractPropertyType, dealType: ContractDealType) {
  return CONTRACT_TEMPLATES.find((t) => t.propertyType === propertyType && t.dealType === dealType && t.kind === "contract") ?? null;
}

/** 확인설명서 서식 1건 */
export function findDisclosureFormTemplate(propertyType: ContractPropertyType, dealType: ContractDealType) {
  return CONTRACT_TEMPLATES.find((t) => t.propertyType === propertyType && t.dealType === dealType && t.kind === "disclosure") ?? null;
}

export function contractFormHeading(propertyType: ContractPropertyType, dealType: ContractDealType) {
  return `${propertyType} ${dealType}계약서`;
}

export function disclosureFormHeading(propertyType: ContractPropertyType, dealType: ContractDealType) {
  if (propertyType === "아파트") return `${propertyType} ${dealType} 확인설명서`;
  return `${propertyType} 확인설명서`;
}

/** 만원 입력을 원 단위 표시로 (예: 300000 → 3,000,000,000) */
export function manwonToWonLabel(manwon: string) {
  const n = Number(String(manwon).replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n === 0) return "";
  return (n * 10_000).toLocaleString("ko-KR");
}

/** 토지 지목 (계약서 드롭다운) */
export const LAND_CATEGORIES = [
  "대",
  "전",
  "답",
  "과수원",
  "목장용지",
  "임야",
  "공장용지",
  "학교용지",
  "주차장",
  "주유소용지",
  "창고용지",
  "도로",
  "철도용지",
  "하천",
  "공원",
  "체육용지",
  "종교용지",
  "잡종지",
  "기타",
] as const;

/** 건물 구조 (계약서 드롭다운) */
export const BUILDING_STRUCTURES = [
  "철근콘크리트구조",
  "철골철근콘크리트구조",
  "철골구조",
  "벽돌구조",
  "블록구조",
  "목조",
  "경량철골구조",
  "기타",
] as const;

/** 건물 용도 (계약서 드롭다운) */
export const BUILDING_USES = [
  "아파트",
  "다가구주택",
  "다세대주택",
  "연립주택",
  "오피스텔",
  "단독주택",
  "근린생활시설",
  "근린생활시설 및 주택",
  "업무시설",
  "판매시설",
  "숙박시설",
  "기타",
] as const;

/** 표준 매매계약서 일반조항 (제2조~제9조). 한국공인중개사협회 아파트 매매 계약서 PDF 원문 */
export const STANDARD_SALE_ARTICLES = [
  {
    no: 2,
    title: "소유권 이전 등",
    variant: "sale_delivery" as const,
    bodyBeforeDate:
      "매도인은 매매대금의 잔금 수령과 동시에 매수인에게 소유권 이전등기에 필요한 모든 서류를 교부하고 등기절차에 협력 하여야 하며, 위 부동산의 인도일은",
    bodyAfterDate: "로 한다.",
  },
  {
    no: 3,
    title: "제한물권 등의 소멸",
    body: "매도인은 위 부동산에 설정된 저당권, 지상권, 임차권 등 소유권의 행사를 제한하는 사유가 있거나 제세공과금 기타 부담금의 미납 등이 있을 때에는 잔금 수수일까지 그 권리의 하자 및 부담 등을 제거하여 완전한 소유권을 매수인에게 이전한다. 다만, 승계하기로 합의하는 권리 및 금액은 그러하지 아니하다.",
  },
  {
    no: 4,
    title: "지방세 등",
    body: "위 부동산에 관하여 발생한 수익의 귀속과 제세공과금 등의 부담은 위 부동산의 인도일을 기준으로 하되, 지방세의 납부의무 및 납부책임은 지방세법의 규정에 의한다.",
  },
  {
    no: 5,
    title: "계약의 해제",
    body: "매수인이 매도인에게 중도금(중도금이 없을때에는 잔금)을 지급하기전 까지 매도인은 계약금의 배액을 상환하고, 매수인은 계약금을 포기하고 본 계약을 해제할 수 있다.",
  },
  {
    no: 6,
    title: "채무불이행과 손해배상의 예정",
    body: "매도인 또는 매수인은 본 계약상의 내용에 대하여 불이행이 있을 경우, 그 상대방은 불이행 한 자에 대하여 서면으로 최고하고 계약을 해제할 수 있다. 그리고 계약 당사자는 계약해제에 따른 손해배상을 각각 상대방에게 청구할 수 있으며, 손해배상에 대하여 별도의 약정이 없는 한 계약금을 손해배상의 기준으로 본다.",
  },
  {
    no: 7,
    title: "중개보수",
    body: "개업공인중개사는 매도인 또는 매수인의 본 계약 불이행에 대하여 책임을 지지 않는다. 또한 중개보수는 본 계약 체결에 따라 계약 당사자 쌍방이 각각 지급하며, 개업공인중개사의 고의나 과실없이 본 계약이 무효, 취소 또는 해제 되어도 중개보수는 지급한다. 공동중개인 경우에 매도인과 매수인은 자신이 중개 의뢰한 개업공인중개사에게 각각 중개보수를 지급한다.",
  },
  {
    no: 8,
    title: "중개보수 외",
    body: "매도인 또는 매수인이 본 계약 이외의 업무를 의뢰한 경우, 이에 관한 보수는 중개보수와는 별도로 지급하며 그 금액은 합의에 의한다.",
  },
  {
    no: 9,
    title: "중개대상물확인설명서교부 등",
    variant: "explanation_delivery" as const,
    bodyBeforeDate:
      "개업공인중개사는 중개대상물확인설명서를 작성하고 업무보증관계증서 (공제증서 등) 사본을 첨부하여 거래당사자 쌍방에게 교부한다. (교부일자 :",
    bodyAfterDate: ")",
  },
] as const;

/** 임대차(전세·월세) 기본 계약기간(개월). 1~24 */
export const LEASE_MONTH_OPTIONS = Array.from({ length: 24 }, (_, i) => String(i + 1));
export const DEFAULT_LEASE_MONTHS = "24";

/** 차임 연체 기준(제4조). 기본 2기 */
export const RENT_ARREARS_OPTIONS = ["1기", "2기", "3기"] as const;
export const DEFAULT_RENT_ARREARS = "2기";

/** 전세·월세 공통 조항 (제2·3·5~9조). 제4조만 거래종류별로 다름. 협회 PDF 원문 */
const LEASE_COMMON_ARTICLES = {
  term: {
    no: 2,
    title: "존속기간",
    variant: "lease_term" as const,
  },
  use: {
    no: 3,
    title: "용도변경 및 전대 등",
    body: "임차인은 임대인의 동의없이 위 부동산의 용도나 구조를 변경하거나 전대, 임차권 양도 또는 담보제공을 하지 못하며 임대차 목적 이외의 용도로 사용할 수 없다.",
  },
  /** 월세: 차임 연체 + 제3조 위반 */
  terminateMonthly: {
    no: 4,
    title: "계약의 해지",
    variant: "lease_terminate" as const,
    bodyBefore: "임차인의 차임 연체액이",
    bodyAfter:
      "의 차임액에 달하거나, 제3조를 위반 하였을 때 임대인은 즉시 본 계약을 해지 할 수 있다.",
  },
  /** 전세: 제3조 위반만 (차임 없음) */
  terminateJeonse: {
    no: 4,
    title: "계약의 해지",
    body: "임차인이 제3조를 위반하였을때 임대인은 즉시 본 계약을 해지 할 수 있다.",
  },
  end: {
    no: 5,
    title: "계약의 종료",
    body: "임대차 계약이 종료된 경우 임차인은 위 부동산을 원상으로 회복하여 임대인에게 반환한다. 이러한 경우 임대인은 보증금을 임차인에게 반환하고, 연체 임대료 또는 손해배상금이 있을 때는 이들을 제하고 그 잔액을 반환한다.",
  },
  cancel: {
    no: 6,
    title: "계약의 해제",
    body: "임차인이 임대인에게 중도금(중도금이 없을때는 잔금)을 지급하기 전까지 임대인은 계약금의 배액을 상환 하고, 임차인은 계약금을 포기하고 이 계약을 해제할 수 있다.",
  },
  damages: {
    no: 7,
    title: "채무불이행과 손해배상의 예정",
    body: "임대인 또는 임차인은 본 계약상의 내용에 대하여 불이행이 있을 경우 그 상대방은 불이행 한 자에 대하여 서면으로 최고하고 계약을 해제 할 수 있다. 이 경우 계약 당사자는 계약해제에 따른 손해배상을 각각 상대방에게 청구할 수 있으며, 손해배상에 대하여 별도의 약정이 없는 한 계약금을 손해배상의 기준으로 본다.",
  },
  fee: {
    no: 8,
    title: "중개보수",
    body: "개업공인중개사는 임대인 또는 임차인의 본 계약 불이행에 대하여 책임을 지지 않는다. 또한 중개보수는 본 계약 체결에 따라 계약 당사자 쌍방이 각각 지급하며, 개업공인중개사의 고의나 과실 없이 본 계약이 무효, 취소 또는 해제 되어도 중개보수는 지급한다. 공동중개인 경우에 임대인과 임차인은 자신이 중개 의뢰한 개업공인중개사에게 각각 중개보수를 지급한다.",
  },
  explanation: {
    no: 9,
    title: "중개대상물확인설명서교부 등",
    variant: "explanation_delivery" as const,
    bodyBeforeDate:
      "개업공인중개사는 중개대상물확인설명서를 작성하고 업무보증관계증서 (공제증서 등) 사본을 첨부하여 거래당사자 쌍방에게 교부한다. (교부일자 :",
    bodyAfterDate: ")",
  },
} as const;

/** 전세 계약서 일반조항 */
export const STANDARD_JEONSE_ARTICLES = [
  LEASE_COMMON_ARTICLES.term,
  LEASE_COMMON_ARTICLES.use,
  LEASE_COMMON_ARTICLES.terminateJeonse,
  LEASE_COMMON_ARTICLES.end,
  LEASE_COMMON_ARTICLES.cancel,
  LEASE_COMMON_ARTICLES.damages,
  LEASE_COMMON_ARTICLES.fee,
  LEASE_COMMON_ARTICLES.explanation,
] as const;

/** 월세 계약서 일반조항 */
export const STANDARD_MONTHLY_ARTICLES = [
  LEASE_COMMON_ARTICLES.term,
  LEASE_COMMON_ARTICLES.use,
  LEASE_COMMON_ARTICLES.terminateMonthly,
  LEASE_COMMON_ARTICLES.end,
  LEASE_COMMON_ARTICLES.cancel,
  LEASE_COMMON_ARTICLES.damages,
  LEASE_COMMON_ARTICLES.fee,
  LEASE_COMMON_ARTICLES.explanation,
] as const;

/** @deprecated STANDARD_MONTHLY_ARTICLES 사용 */
export const STANDARD_LEASE_ARTICLES = STANDARD_MONTHLY_ARTICLES;

/** 인도일 + 개월 → 만기일(YYYY-MM-DD) */
export function addMonthsToYmd(ymd: string, months: number): string {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m || !Number.isFinite(months) || months < 1) return "";
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1 + months, d);
  if (Number.isNaN(dt.getTime())) return "";
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export function contractArticlesForDeal(dealType: ContractDealType) {
  if (dealType === "매매") return STANDARD_SALE_ARTICLES;
  if (dealType === "전세") return STANDARD_JEONSE_ARTICLES;
  return STANDARD_MONTHLY_ARTICLES;
}

/** 제1조 목적 문구 (협회 PDF 원문) */
export function contractArticle1Text(dealType: ContractDealType) {
  if (dealType === "매매") {
    return "제1조 [목적] 위 부동산의 매매에 대하여 매도인과 매수인은 합의에 의하여 매매대금을 아래와 같이 지급하기로 한다.";
  }
  // 전세·월세 협회 서식 제1조 문구가 동일함(전세는 차임란을 비움)
  return "제1조 [목적] 위 부동산의 임대차에 한하여 임대인과 임차인은 합의에 의하여 임차보증금 및 차임을 아래와 같이 지급하기로 한다.";
}

/** 매매계약서 특약사항 기본 문구 (수정·삭제 가능) */
export const DEFAULT_SALE_SPECIAL_TERMS = `1. 현 시설 상태에서의 매매 계약이며, 등기사항 증명서를 확인하고, 계약을 체결함.
 * 등기사항증명서 권리사항은 확인설명서에 기재하며, 그 내용 및 상호 약정사항을 특약사항에 기재하십시오.
2. 잔금 시까지의 각종 공과금은 매도자 부담으로 한다.
3. 본 특약사항에 기재되지 않은 사항은 민법상 계약에 관한 규정과 부동산매매 일반 관례에 따른다.
4. 현시설물 상태의 계약이나 계약시에 매도인이 고지하지 않은 부분에 하자가 있을 경우, 하자담보책임과는 별개로 매도인은 이를 수리해주기로 한다.
5. 00은행 채권최고액 금00원 상태의 계약으로 잔금일에 매도인이 상환하고 말소하기로 하며, 매도인은 잔금일까지 채무를 부담하는 등의 새로운 권리변동을 일으키지 않도록 한다.
6. 첨부서류 : 실제 첨부하여 교부한 서류만 기재. 예시) 중개대상물 확인·설명서
7. 계약체결일 이전에 발생한 위반사항이 추후 발견될 경우, 매도인은 이에 대한 원상복구 책임을 진다.`;

/** 전세계약서 특약사항 기본 문구 (수정·삭제 가능) */
export const DEFAULT_JEONSE_SPECIAL_TERMS = `1. 현 시설 상태에서의 임대차 계약이며, 등기사항 증명서를 확인하고, 계약을 체결함.
 * 등기사항증명서 권리사항은 확인설명서에 기재하며, 그 내용 및 상호 약정사항을 특약사항에 기재하십시오.
2. 잔금 시까지의 각종 공과금은 임대인 부담으로 한다.
3. 본 특약사항에 기재되지 않은 사항은 민법상 계약에 관한 규정과 부동산임대차 일반 관례에 따른다.
4. 현시설물 상태의 계약이나 계약시에 임대인이 고지하지 않은 부분에 하자가 있을 경우, 하자담보책임과는 별개로 임대인은 이를 수리해주기로 한다.
5. 00은행 채권최고액 금00원 상태의 계약으로 잔금일에 임대인이 상환하고 말소하기로 하며, 임대인은 잔금일(임차인 전입신고 익일)까지 채무를 부담하는 등의 새로운 권리변동을 일으키지 않도록 한다.
6. 첨부서류 : 실제 첨부하여 교부한 서류만 기재. 예시) 중개대상물 확인·설명서
7. 계약체결일 이전에 발생한 위반사항이 추후 발견될 경우, 임대인은 이에 대한 원상복구 책임을 진다.`;

/** 월세계약서 특약사항 기본 문구 (수정·삭제 가능) */
export const DEFAULT_MONTHLY_SPECIAL_TERMS = `1. 현 시설 상태에서의 임대차 계약이며, 등기사항 증명서를 확인하고, 계약을 체결함.
 * 등기사항증명서 권리사항은 확인설명서에 기재하며, 그 내용 및 상호 약정사항을 특약사항에 기재하십시오.
2. 잔금(입주) 시까지의 각종 공과금은 임대인 부담으로 하며, 입주일부터의 관리비·공과금은 임차인 부담으로 한다.
3. 본 특약사항에 기재되지 않은 사항은 민법상 계약에 관한 규정과 부동산임대차 일반 관례에 따른다.
4. 현시설물 상태의 계약이나 계약시에 임대인이 고지하지 않은 부분에 하자가 있을 경우, 하자담보책임과는 별개로 임대인은 이를 수리해주기로 한다.
5. 00은행 채권최고액 금00원 상태의 계약으로 잔금일에 임대인이 상환하고 말소하기로 하며, 임대인은 잔금일(임차인 전입신고 익일)까지 채무를 부담하는 등의 새로운 권리변동을 일으키지 않도록 한다.
6. 첨부서류 : 실제 첨부하여 교부한 서류만 기재. 예시) 중개대상물 확인·설명서
7. 계약체결일 이전에 발생한 위반사항이 추후 발견될 경우, 임대인은 이에 대한 원상복구 책임을 진다.`;

export function defaultSpecialTermsForDeal(dealType: string, clauses: string[] = []) {
  if (clauses.length) return clauses.map((c, i) => `${i + 1}. ${c}`).join("\n");
  if (dealType === "매매") return DEFAULT_SALE_SPECIAL_TERMS;
  if (dealType === "전세") return DEFAULT_JEONSE_SPECIAL_TERMS;
  if (dealType === "월세") return DEFAULT_MONTHLY_SPECIAL_TERMS;
  return "";
}
