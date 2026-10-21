export const DEAL_TYPES = ["매매", "전세", "월세"] as const;
export const PROPERTY_TYPES = ["아파트", "오피스텔", "빌라", "원룸", "상가"] as const;
export const PROPERTY_STATUSES = ["임장 전", "광고 중", "계약 진행", "계약 완료", "보류"] as const;
export const DOC_TYPES = [
  "등기사항증명서",
  "건축물대장",
  "토지대장",
  "지적도",
  "토지이용계획확인서",
  "부동산종합공부",
  "기타",
] as const;
export const DOC_STATUSES = ["검토 필요", "검토 완료"] as const;
export const SIGNAL_LEVELS = ["전문가 검토", "확인 필요", "참고"] as const;
export const CUSTOMER_STATUSES = ["연락 전", "연락 완료", "진행 중", "관심 고객", "계약 완료", "중개 완료", "종료"] as const;
export const CUSTOMER_CLOSED_STATUSES = ["계약 완료", "중개 완료", "종료"] as const;
export const CONSULT_CHANNELS = ["방문", "전화", "메시지", "기타"] as const;
export const TASK_TYPES = ["임장", "상담", "문서", "계약", "중도금", "잔금", "연락", "기타"] as const;
export const DEAL_STAGES = ["서류 확인", "조건 협의", "계약 준비", "잔금 대기", "완료", "취소"] as const;
/** 다음 버튼으로 순서대로 진행하는 단계. 마지막(완료·취소)은 별도 처리 */
export const DEAL_STEPS = ["서류 확인", "조건 협의", "계약 준비", "잔금 대기"] as const;
export const DEAL_CHECKLIST_STAGES = ["서류 확인", "계약 준비", "잔금 대기"] as const;
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
export const MAINTENANCE_STATUSES = ["있음", "없음"] as const;
export const MAINTENANCE_ITEMS = ["전기", "수도", "가스", "인터넷", "TV", "주차", "공용관리비"] as const;

export const VISIT_FIELD_LABELS = ["방향", "채광", "수리 필요", "입주 가능일", "구조", "주차", "소음", "관리 상태"];

export const VISIT_FIELD_PLACEHOLDERS: Record<string, string> = {
  방향: "예) 남향, 남동향 (거실 기준)",
  채광: "예) 오전 채광 좋음, 앞 동에 가려짐",
  "수리 필요": "예) 도배·장판, 욕실 실리콘 교체",
  "입주 가능일": "예) 2026-11-01, 즉시 입주, 협의 가능",
  구조: "예) 판상형 3베이, 방 3 욕실 2",
  주차: "예) 지하주차장 세대당 1.2대",
  소음: "예) 대로변 차량 소음 있음, 조용함",
  "관리 상태": "예) 공용부 깨끗함, 엘리베이터 노후",
};

export const CUSTOM_OPTION = "__custom__";

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

/** 공부서류 주요 추출 항목 프리셋 (기획서 7.4) — AI 없이 문서 상세에서 수동 입력 */
export const DOC_FIELD_PRESETS: Record<DocType, string[]> = {
  등기사항증명서: [
    "소유자",
    "소재지",
    "갑구",
    "을구",
    "갑구 등기목적",
    "갑구 접수",
    "갑구 등기원인",
    "갑구 권리자 및 기타사항",
    "을구 등기목적",
    "을구 접수",
    "을구 등기원인",
    "을구 권리자 및 기타사항",
    "근저당권 채권최고액",
    "근저당권자",
    "압류·가압류",
    "전세권·임차권",
    "발급일",
  ],
  건축물대장: [
    "주용도",
    "위반건축물 여부",
    "전용면적",
    "건축면적",
    "연면적",
    "허가일",
    "사용승인일",
    "구조",
    "발급일",
  ],
  토지대장: ["지목", "면적", "소유자", "발급일"],
  지적도: ["소재지", "발급일"],
  토지이용계획확인서: ["용도지역", "용도지구", "용도구역", "발급일"],
  부동산종합공부: [
    "소재지",
    "지목",
    "소유자",
    "주용도",
    "구조",
    "대지면적",
    "건축면적",
    "연면적",
    "건폐율",
    "용적률",
    "개별공시지가",
    "발급일",
  ],
  기타: ["항목"],
};

/** 서류 종류 → 확인설명서 「근거자료」 체크 필드 */
export const DOC_TYPE_TO_DISCLOSURE_CHECK: Partial<Record<DocType, string>> = {
  등기사항증명서: "doc_registry",
  건축물대장: "doc_building_ledger",
  토지대장: "doc_land_ledger",
  지적도: "doc_cadastral",
  토지이용계획확인서: "doc_land_use",
  부동산종합공부: "doc_other",
};

export type DealChecklistStage = (typeof DEAL_CHECKLIST_STAGES)[number];
export type DealStep = (typeof DEAL_STEPS)[number];

/** 거래 생성 시 만드는 단계별 기본 체크리스트. loanOnly는 매매·전세 거래에만 추가 */
export const DEFAULT_DEAL_CHECKLIST: { stage: DealChecklistStage; category: string; label: string; loanOnly?: boolean }[] = [
  { stage: "서류 확인", category: "서류 확인", label: "등기사항증명서 최신본 발급·확인" },
  { stage: "서류 확인", category: "서류 확인", label: "건축물대장 확인 (위반건축물 여부)" },
  { stage: "서류 확인", category: "서류 확인", label: "토지이용계획확인서 확인" },
  { stage: "서류 확인", category: "서류 확인", label: "임대인/매도인 신분증·위임장 확인" },
  { stage: "서류 확인", category: "권리 확인", label: "선순위 채권·근저당 금액 확인" },
  { stage: "서류 확인", category: "권리 확인", label: "국세·지방세 체납 여부 확인 요청" },
  { stage: "계약 준비", category: "확인 서류·권리분석", label: "등기부등본 최종 확인" },
  { stage: "계약 준비", category: "확인 서류·권리분석", label: "건축물대장 최종 확인" },
  { stage: "계약 준비", category: "확인 서류·권리분석", label: "토지대장 확인" },
  { stage: "계약 준비", category: "확인 서류·권리분석", label: "권리분석 결과 정리" },
  { stage: "계약 준비", category: "서류 작업", label: "임대인(매도인) 인적사항 확인" },
  { stage: "계약 준비", category: "서류 작업", label: "입금 통장계좌 명의 확인" },
  { stage: "계약 준비", category: "서류 작업", label: "임차인(매수인) 인적사항 확인" },
  { stage: "계약 준비", category: "서류 작업", label: "입주날짜 재확인" },
  { stage: "계약 준비", category: "서류 작업", label: "은행 대출 가능 여부 확인", loanOnly: true },
  { stage: "계약 준비", category: "서류 작업", label: "중개대상물 확인·설명서 작성" },
  { stage: "잔금 대기", category: "잔금·인도", label: "잔금 입금 확인" },
  { stage: "잔금 대기", category: "잔금·인도", label: "잔금일 등기 재확인" },
  { stage: "잔금 대기", category: "잔금·인도", label: "관리비·공과금 정산" },
  { stage: "잔금 대기", category: "잔금·인도", label: "열쇠·출입카드 인도" },
  { stage: "잔금 대기", category: "잔금·인도", label: "전입신고·확정일자 안내" },
];

/** 거래 유형별 금액 항목 이름 */
export const DEAL_AMOUNT_LABEL: Record<string, string> = { 매매: "매매금", 전세: "전세금", 월세: "보증금" };

export const PLANS = [
  { id: "free", name: "Free", price: 0, description: "매물 기록과 기본 브리핑", features: ["매물·고객 관리", "기본 브리핑 링크", "문서 보관 1GB"] },
  { id: "basic", name: "Basic", price: 19000, description: "1인 중개사", features: ["Free 기능 전체", "AI 임장 정리", "AI 문서 분석", "브리핑 무제한"] },
  { id: "pro", name: "Pro", price: 39000, description: "높은 사용량", features: ["Basic 기능 전체", "상담 요약", "특약 추천", "우선 지원"] },
  { id: "office", name: "Office", price: 79000, description: "다중 사용자 사무소", features: ["Pro 기능 전체", "구성원 권한 관리", "공용 데이터", "감사 로그"] },
] as const;
