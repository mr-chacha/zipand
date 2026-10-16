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

export function contractFormHeading(propertyType: ContractPropertyType, dealType: ContractDealType) {
  return `${propertyType} ${dealType}계약서`;
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

/** 표준 매매계약서 일반조항 (제2조~제8조). 제2조 본문은 인도일 입력 칸 앞까지 */
export const STANDARD_SALE_ARTICLES = [
  {
    no: 2,
    title: "소유권이전 등",
    bodyBeforeDate:
      "매도인은 매매대금의 잔금 수령과 동시에 매수인에게 소유권이전등기에 필요한 모든 서류를 교부하고 등기절차에 협력하여야 하며, 위 부동산의 인도일은",
    bodyAfterDate: "로 한다.",
  },
  {
    no: 3,
    title: "제한물권 등의 소멸",
    body: "매도인은 위 부동산에 설정된 저당권·지상권·임차권 등 소유권의 행사를 제한하는 사유가 있거나, 제세공과금과 기타 부담금의 미납 등이 있을 때에는 잔금 수수일까지 그 권리의 하자 및 부담 등을 제거하여 완전한 소유권을 매수인에게 이전한다. 다만, 승계하기로 합의하는 권리 및 금액은 그러하지 아니하다.",
  },
  {
    no: 4,
    title: "지방세 등",
    body: "위 부동산에 관하여 발생한 수익의 귀속과 제세공과금 등의 부담은 위 부동산의 인도일을 기준으로 하되, 지방세의 납부의무 및 납부책임은 지방세법의 규정에 의한다.",
  },
  {
    no: 5,
    title: "계약의 해제",
    body: "매수인이 매도인에게 중도금(중도금이 없을 때에는 잔금)을 지불하기 전까지 매도인은 계약금의 배액을 상환하고, 매수인은 계약금을 포기하고 본 계약을 해제할 수 있다.",
  },
  {
    no: 6,
    title: "채무불이행과 손해배상의 예정",
    body: "매도인 또는 매수인이 본 계약상의 내용에 대하여 불이행이 있을 경우 그 상대방은 불이행한 자에 대하여 서면으로 최고하고 계약을 해제할 수 있다. 그리고 계약 당사자는 계약해제에 따른 손해배상을 각각 상대방에게 청구할 수 있으며, 손해배상에 대하여 별도의 약정이 없는 한 계약금을 손해배상의 기준으로 본다.",
  },
  {
    no: 7,
    title: "중개보수",
    body: "개업공인중개사는 매도인 또는 매수인의 본 계약 불이행에 대하여 책임을 지지 않는다. 또한 중개보수는 본 계약 체결과 동시에 계약 당사자 쌍방이 각각 지불하며, 개업공인중개사의 고의나 과실 없이 본 계약이 무효·취소 또는 해제되어도 중개보수는 지급한다. 공동중개인 경우 매도인과 매수인은 자신이 중개 의뢰한 개업공인중개사에게 각각 중개보수를 지급한다.",
  },
  {
    no: 8,
    title: "중개보수 외",
    body: "매도인 또는 매수인이 본 계약 이외의 업무를 의뢰한 경우 이에 관한 보수는 중개보수와는 별도로 지급하며 그 금액은 합의에 의한다.",
  },
] as const;

/** 임대차(전세·월세)용 일반조항 문구 치환 */
export function contractArticlesForDeal(dealType: ContractDealType) {
  if (dealType === "매매") return STANDARD_SALE_ARTICLES;
  return STANDARD_SALE_ARTICLES.map((article) => {
    const swap = (s: string) =>
      s
        .replaceAll("매도인", "임대인")
        .replaceAll("매수인", "임차인")
        .replaceAll("매매대금", "임대차보증금")
        .replaceAll("소유권이전등기", "임대차")
        .replaceAll("소유권이전", "인도")
        .replaceAll("완전한 소유권을", "목적물을")
        .replaceAll("소유권의 행사", "임대차의 목적물 사용");
    if ("bodyBeforeDate" in article) {
      return {
        ...article,
        title: article.no === 2 ? "인도 등" : article.title,
        bodyBeforeDate: swap(article.bodyBeforeDate),
        bodyAfterDate: article.bodyAfterDate,
      };
    }
    return { ...article, body: swap(article.body) };
  });
}
