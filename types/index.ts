export type DealType = "매매" | "전세" | "월세";

export type PropertyType = "아파트" | "오피스텔" | "빌라" | "원룸" | "상가";

export type PropertyStatus = "임장 전" | "광고 중" | "계약 진행" | "계약 완료" | "보류";

export interface Property {
  id: string;
  title: string;
  address: string;
  region: string;
  dealType: DealType;
  propertyType: PropertyType;
  status: PropertyStatus;
  /** 매매가 또는 보증금 (만원) */
  price: number;
  /** 월세 (만원) */
  monthlyRent?: number;
  maintenanceFee?: number;
  areaM2: number;
  floor: number;
  totalFloors: number;
  direction: string;
  rooms: number;
  baths: number;
  availableFrom: string;
  manager: string;
  linkedCustomers: number;
  documentsCount: number;
  registeredAt: string;
  description: string;
  highlights: string[];
  internalMemo: string;
}

export type ExtractSource = "AI 추출" | "사용자 수정" | "직접 입력";

export interface VisitField {
  label: string;
  value: string;
  source: ExtractSource;
  note?: string;
}

export interface PropertyVisit {
  id: string;
  propertyId: string;
  visitedAt: string;
  photoCount: number;
  voiceDurationSec: number;
  transcript: string;
  fields: VisitField[];
  checklist: { label: string; checked: boolean }[];
  followUps: string[];
}

export type DocumentType = "등기사항증명서" | "건축물대장";

export type AnalysisStatus = "분석 중" | "검토 필요" | "검토 완료" | "실패";

export interface PropertyDocument {
  id: string;
  propertyId: string;
  propertyTitle: string;
  type: DocumentType;
  fileName: string;
  pages: number;
  status: AnalysisStatus;
  uploadedAt: string;
  issuedAt?: string;
  progress?: number;
  failReason?: string;
}

export interface Evidence {
  page: number;
  text: string;
}

export interface ExtractedField {
  label: string;
  value: string;
  confidence: number;
  evidence: Evidence;
  reviewed: boolean;
}

export type SignalLevel = "전문가 검토" | "확인 필요" | "참고";

export interface CheckSignal {
  id: string;
  level: SignalLevel;
  title: string;
  description: string;
  evidence: Evidence;
  nextAction: string;
}

export interface DocumentAnalysis {
  documentId: string;
  modelVersion: string;
  analyzedAt: string;
  fields: ExtractedField[];
  signals: CheckSignal[];
}

export type TaskType = "임장" | "상담" | "문서" | "계약" | "연락";

export interface TodayTask {
  id: string;
  time: string;
  type: TaskType;
  title: string;
  propertyId?: string;
  done: boolean;
}

export interface Deal {
  id: string;
  propertyId: string;
  propertyTitle: string;
  customerAlias: string;
  stage: "조건 협의" | "서류 확인" | "계약 준비" | "잔금 대기";
  dueDate: string;
}
