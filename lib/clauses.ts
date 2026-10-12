export interface ClauseTemplate {
  id: string;
  category: string;
  title: string;
  body: string;
  /** 적용 전제 */
  premise: string;
  /** 분쟁 소지 */
  risk: string;
  expertReview: boolean;
}

/**
 * 상황별 특약 예시 문구 (기획서 7.6).
 * 실제 사용 전 거래 조건에 맞게 수정하고, 필요한 경우 전문가 검토를 받는다.
 */
export const CLAUSE_LIBRARY: ClauseTemplate[] = [
  {
    id: "loan-1",
    category: "전세자금대출",
    title: "전세자금대출 불승인 시 계약 해제",
    body: "임차인이 잔금 지급을 위해 신청한 전세자금대출이 임차인의 귀책사유 없이 불승인될 경우, 본 계약은 무효로 하며 임대인은 수령한 계약금을 즉시 임차인에게 반환한다.",
    premise: "임차인이 전세자금대출로 잔금 일부를 지급하는 경우",
    risk: "'귀책사유 없이'의 범위(신용 변동, 서류 미비 등)를 두고 다툼이 생길 수 있음",
    expertReview: false,
  },
  {
    id: "loan-2",
    category: "전세자금대출",
    title: "대출 실행을 위한 임대인 협조",
    body: "임대인은 임차인의 전세자금대출 실행에 필요한 서류 제공 및 질권설정 통지 수령 등 절차에 협조한다.",
    premise: "대출 기관이 임대인의 확인·동의를 요구하는 경우",
    risk: "협조 범위가 불명확하면 대출 지연 책임 공방 가능",
    expertReview: false,
  },
  {
    id: "mortgage-1",
    category: "근저당 말소",
    title: "잔금일 근저당권 말소",
    body: "임대인은 잔금 수령과 동시에 등기사항증명서 을구에 설정된 근저당권(채권최고액 금 ○○원)을 전액 상환하고 말소등기를 신청하며, 이를 이행하지 않을 경우 임차인은 계약을 해제하고 손해배상을 청구할 수 있다.",
    premise: "계약 시점에 선순위 근저당권이 설정되어 있는 경우",
    risk: "상환 확인 방법(상환영수증, 말소 접수증)을 명확히 하지 않으면 분쟁 소지",
    expertReview: true,
  },
  {
    id: "mortgage-2",
    category: "근저당 말소",
    title: "잔금 전 추가 권리 설정 금지",
    body: "임대인은 계약일부터 잔금일 및 임차인의 전입신고 다음 날까지 본 부동산에 근저당권 등 새로운 권리를 설정하지 않는다. 위반 시 임차인은 계약을 해제할 수 있으며 임대인은 계약금의 배액을 배상한다.",
    premise: "전입신고 효력 발생 전 공백 기간의 위험을 줄이고자 하는 경우",
    risk: "배상 범위 약정이 과도하다고 다툴 수 있음",
    expertReview: true,
  },
  {
    id: "pet-1",
    category: "반려동물",
    title: "반려동물 동반 거주 허용",
    body: "임대인은 임차인의 반려동물(종류: ○○, ○마리) 동반 거주를 허용한다. 임차인은 반려동물로 인한 훼손·오염에 대해 퇴거 시 원상회복하며, 소음 등으로 인한 이웃 민원 발생 시 성실히 해결한다.",
    premise: "임대인이 반려동물 거주에 동의한 경우",
    risk: "통상 손모와 반려동물로 인한 훼손의 구분이 어려움 — 입주 시 사진 기록 권장",
    expertReview: false,
  },
  {
    id: "balance-1",
    category: "잔금·인도",
    title: "인도 시점 및 상태",
    body: "임대인은 잔금 수령과 동시에 본 부동산을 현 시설 상태(입주 전 확인한 상태)로 임차인에게 인도하며, 인도 전 발생한 관리비·공과금은 임대인이 부담한다.",
    premise: "잔금일과 인도일이 같은 경우",
    risk: "'현 시설 상태'의 기준 — 임장 사진·체크리스트를 첨부하면 분쟁 예방에 도움",
    expertReview: false,
  },
  {
    id: "repair-1",
    category: "수리·원상회복",
    title: "입주 전 수리 이행",
    body: "임대인은 잔금일 전까지 다음 항목을 수리 완료한다: ○○(예: 주방 수전 교체, 작은방 도배). 미이행 시 임차인이 수리하고 그 비용을 잔금에서 공제할 수 있다.",
    premise: "임장에서 수리 필요 항목이 확인된 경우",
    risk: "수리 수준·비용 상한을 정하지 않으면 공제 금액 다툼 가능",
    expertReview: false,
  },
  {
    id: "repair-2",
    category: "수리·원상회복",
    title: "원상회복 범위",
    body: "임차인은 퇴거 시 임차인이 설치한 시설물을 철거하고 고의·과실로 인한 훼손을 원상회복한다. 다만 통상의 사용에 따른 노후·손모는 원상회복 대상에서 제외한다.",
    premise: "모든 임대차 계약",
    risk: "통상 손모의 범위 해석 차이",
    expertReview: false,
  },
  {
    id: "fee-1",
    category: "관리비 정산",
    title: "관리비·장기수선충당금 정산",
    body: "관리비는 잔금일을 기준으로 일할 정산한다. 장기수선충당금은 임차인이 납부한 경우 계약 종료 시 임대인이 임차인에게 반환한다.",
    premise: "공동주택 임대차",
    risk: "정산 기준일과 증빙 자료를 미리 합의하지 않으면 분쟁 소지",
    expertReview: false,
  },
];

export const CLAUSE_CATEGORIES = Array.from(new Set(CLAUSE_LIBRARY.map((c) => c.category)));
