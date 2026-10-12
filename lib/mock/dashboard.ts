import type { Deal, TodayTask } from "@/types";

export const currentUser = {
  name: "김중개",
  office: "집앤드 공인중개사사무소",
  role: "대표 중개사",
  plan: "Basic",
};

export const todayTasks: TodayTask[] = [
  { id: "t-1", time: "10:00", type: "연락", title: "상암동 전세 문의 고객 회신", propertyId: "p-1001", done: true },
  { id: "t-2", time: "14:00", type: "임장", title: "힐스테이트 오피스텔 812호 임장", propertyId: "p-1002", done: false },
  { id: "t-3", time: "15:30", type: "문서", title: "성수 그린빌라 등기 재업로드", propertyId: "p-1003", done: false },
  { id: "t-4", time: "17:00", type: "상담", title: "신혼부부 고객 전세 조건 상담", done: false },
  { id: "t-5", time: "18:00", type: "계약", title: "성수 빌라 특약 초안 검토", propertyId: "p-1003", done: false },
];

export const deals: Deal[] = [
  { id: "deal-1", propertyId: "p-1003", propertyTitle: "성수 그린빌라 301호", customerAlias: "박** 매수인", stage: "계약 준비", dueDate: "2026-10-18" },
  { id: "deal-2", propertyId: "p-1001", propertyTitle: "래미안 리버뷰 102동 1503호", customerAlias: "신혼부부 최**", stage: "서류 확인", dueDate: "2026-10-22" },
  { id: "deal-3", propertyId: "p-1004", propertyTitle: "e편한세상 송파 205동 702호", customerAlias: "정** 매수 희망", stage: "조건 협의", dueDate: "2026-10-30" },
];

export const aiUsage = {
  visitSummary: { used: 18, limit: 50 },
  documentAnalysis: { used: 7, limit: 20 },
  briefing: { used: 5, limit: 30 },
};
