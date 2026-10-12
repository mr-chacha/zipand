export const DEAL_TYPES = ["매매", "전세", "월세"] as const;
export const PROPERTY_TYPES = ["아파트", "오피스텔", "빌라", "원룸", "상가"] as const;
export const PROPERTY_STATUSES = ["임장 전", "광고 중", "계약 진행", "계약 완료", "보류"] as const;
export const DOC_TYPES = ["등기사항증명서", "건축물대장", "기타"] as const;
export const DOC_STATUSES = ["검토 필요", "검토 완료"] as const;
export const SIGNAL_LEVELS = ["전문가 검토", "확인 필요", "참고"] as const;
export const CUSTOMER_STATUSES = ["진행 중", "계약 완료", "보류", "종료"] as const;
export const CONSULT_CHANNELS = ["방문", "전화", "메시지", "기타"] as const;
export const TASK_TYPES = ["임장", "상담", "문서", "계약", "연락", "기타"] as const;
export const DEAL_STAGES = ["조건 협의", "서류 확인", "계약 준비", "잔금 대기", "완료", "취소"] as const;
export const DIRECTIONS = ["남향", "남동향", "남서향", "동향", "서향", "북향", "북동향", "북서향"] as const;

export type DealType = (typeof DEAL_TYPES)[number];
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];
export type DocType = (typeof DOC_TYPES)[number];
export type DocStatus = (typeof DOC_STATUSES)[number];
export type SignalLevel = (typeof SIGNAL_LEVELS)[number];
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type ConsultChannel = (typeof CONSULT_CHANNELS)[number];
export type TaskType = (typeof TASK_TYPES)[number];
export type DealStage = (typeof DEAL_STAGES)[number];

export const ROLE_LABELS: Record<string, string> = {
  owner: "대표",
  agent: "소속 중개사",
  staff: "직원",
};

export const VERIFICATION_LABELS: Record<string, string> = {
  pending: "인증 대기",
  verified: "인증 완료",
  rejected: "인증 반려",
};

/** 임장 기록 구조화 항목 (기획서 7.2) */
export const VISIT_FIELD_LABELS = ["방향", "채광", "수리 필요", "입주 가능일", "구조", "주차", "소음", "관리 상태"];

export const DEFAULT_VISIT_CHECKLIST = [
  "누수 흔적",
  "결로·곰팡이",
  "수압 확인",
  "보일러 작동",
  "창호 상태",
  "소음",
  "배수 상태",
  "전기·조명",
];

/** 공부서류 주요 추출 항목 프리셋 (기획서 7.4) */
export const DOC_FIELD_PRESETS: Record<DocType, string[]> = {
  등기사항증명서: ["소유자", "소재지", "근저당권 채권최고액", "근저당권자", "압류·가압류", "전세권·임차권", "발급일"],
  건축물대장: ["주용도", "위반건축물 여부", "전용면적", "사용승인일", "구조", "발급일"],
  기타: ["항목"],
};

export const DEFAULT_DEAL_CHECKLIST: { category: string; label: string }[] = [
  { category: "서류 확인", label: "등기사항증명서 최신본 발급·확인" },
  { category: "서류 확인", label: "건축물대장 확인 (위반건축물 여부)" },
  { category: "서류 확인", label: "토지이용계획확인서 확인" },
  { category: "서류 확인", label: "임대인/매도인 신분증·위임장 확인" },
  { category: "권리 확인", label: "선순위 채권·근저당 금액 확인" },
  { category: "권리 확인", label: "국세·지방세 체납 여부 확인 요청" },
  { category: "계약 준비", label: "중개대상물 확인·설명서 작성" },
  { category: "계약 준비", label: "특약 사항 정리 및 당사자 협의" },
  { category: "계약 준비", label: "계약금 입금 계좌 명의 확인" },
  { category: "잔금·인도", label: "잔금일 등기 재확인" },
  { category: "잔금·인도", label: "관리비·공과금 정산" },
  { category: "잔금·인도", label: "전입신고·확정일자 안내" },
];

export const PLANS = [
  { id: "free", name: "Free", price: 0, description: "매물 기록과 기본 브리핑", features: ["매물·고객 관리", "기본 브리핑 링크", "문서 보관 1GB"] },
  { id: "basic", name: "Basic", price: 19000, description: "1인 중개사", features: ["Free 기능 전체", "AI 임장 정리", "AI 문서 분석", "브리핑 무제한"] },
  { id: "pro", name: "Pro", price: 39000, description: "높은 사용량", features: ["Basic 기능 전체", "상담 요약", "특약 추천", "우선 지원"] },
  { id: "office", name: "Office", price: 79000, description: "다중 사용자 사무소", features: ["Pro 기능 전체", "구성원 권한 관리", "공용 데이터", "감사 로그"] },
] as const;
