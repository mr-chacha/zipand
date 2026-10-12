import type { DocumentAnalysis, PropertyDocument } from "@/types";

export const documents: PropertyDocument[] = [
  {
    id: "d-2001",
    propertyId: "p-1001",
    propertyTitle: "래미안 리버뷰 102동 1503호",
    type: "등기사항증명서",
    fileName: "등기부등본_상암동1650_1503.pdf",
    pages: 4,
    status: "검토 필요",
    uploadedAt: "2026-10-10 10:12",
    issuedAt: "2026-10-10",
  },
  {
    id: "d-2002",
    propertyId: "p-1001",
    propertyTitle: "래미안 리버뷰 102동 1503호",
    type: "건축물대장",
    fileName: "건축물대장_상암동1650.pdf",
    pages: 2,
    status: "검토 완료",
    uploadedAt: "2026-10-10 10:14",
    issuedAt: "2026-10-10",
  },
  {
    id: "d-2003",
    propertyId: "p-1003",
    propertyTitle: "성수 그린빌라 301호",
    type: "건축물대장",
    fileName: "scan_20261011.jpg",
    pages: 1,
    status: "분석 중",
    uploadedAt: "2026-10-12 19:40",
    progress: 62,
  },
  {
    id: "d-2004",
    propertyId: "p-1003",
    propertyTitle: "성수 그린빌라 301호",
    type: "등기사항증명서",
    fileName: "등기_성수_흐림.jpg",
    pages: 1,
    status: "실패",
    uploadedAt: "2026-10-12 19:35",
    failReason: "이미지 해상도가 낮아 글자를 인식하지 못했습니다.",
  },
  {
    id: "d-2005",
    propertyId: "p-1006",
    propertyTitle: "판교 테크원 상가 1층 105호",
    type: "등기사항증명서",
    fileName: "등기_판교105.pdf",
    pages: 3,
    status: "검토 완료",
    uploadedAt: "2026-09-12 14:02",
    issuedAt: "2026-09-12",
  },
];

export function getDocument(id: string) {
  return documents.find((d) => d.id === id);
}

export function getDocumentsByProperty(propertyId: string) {
  return documents.filter((d) => d.propertyId === propertyId);
}

export const analyses: DocumentAnalysis[] = [
  {
    documentId: "d-2001",
    modelVersion: "doc-extract v0.3 / prompt 2026-10-01",
    analyzedAt: "2026-10-10 10:13",
    fields: [
      {
        label: "소유자",
        value: "홍*동 (단독 소유)",
        confidence: 0.97,
        evidence: { page: 2, text: "소유자 홍*동 7*0101-******* 서울특별시 마포구 …" },
        reviewed: true,
      },
      {
        label: "소재지",
        value: "서울 마포구 상암동 1650 제102동 제15층 제1503호",
        confidence: 0.95,
        evidence: { page: 1, text: "[집합건물] 서울특별시 마포구 상암동 1650 제102동 제15층 제1503호" },
        reviewed: true,
      },
      {
        label: "근저당권 채권최고액",
        value: "금 240,000,000원",
        confidence: 0.91,
        evidence: { page: 3, text: "근저당권설정 … 채권최고액 금240,000,000원 근저당권자 ○○은행" },
        reviewed: false,
      },
      {
        label: "근저당권자",
        value: "○○은행",
        confidence: 0.88,
        evidence: { page: 3, text: "근저당권자 주식회사○○은행 110111-*******" },
        reviewed: false,
      },
      {
        label: "발급일",
        value: "2026-10-10",
        confidence: 0.72,
        evidence: { page: 4, text: "발행일 2026/10/1O" },
        reviewed: false,
      },
    ],
    signals: [
      {
        id: "s-1",
        level: "확인 필요",
        title: "근저당권 설정 확인",
        description:
          "을구에 근저당권 설정 문구가 있습니다. 채권최고액은 실제 대출 잔액과 다를 수 있으므로 선순위 채권 규모를 별도로 확인해야 합니다.",
        evidence: { page: 3, text: "근저당권설정 2021년3월2일 제12345호 채권최고액 금240,000,000원" },
        nextAction: "임대인에게 대출 잔액 확인서 요청, 잔금일 말소 조건 특약 검토",
      },
      {
        id: "s-2",
        level: "참고",
        title: "발급일 인식 신뢰도 낮음",
        description: "발급일 문자 인식 신뢰도가 낮습니다(72%). 원문에서 날짜를 직접 대조해 주세요.",
        evidence: { page: 4, text: "발행일 2026/10/1O" },
        nextAction: "원문 4페이지에서 발급일 확인 후 값 수정",
      },
      {
        id: "s-3",
        level: "참고",
        title: "압류·가압류 문구 미발견",
        description:
          "분석 범위 내에서 압류·가압류 문구를 찾지 못했습니다. 문구가 없다는 것이 위험이 없다는 의미는 아닙니다.",
        evidence: { page: 3, text: "갑구 — 소유권에 관한 사항 (특이 기재 없음)" },
        nextAction: "계약 직전 최신 등기 재발급 후 재확인",
      },
    ],
  },
];

export function getAnalysis(documentId: string) {
  return analyses.find((a) => a.documentId === documentId);
}
