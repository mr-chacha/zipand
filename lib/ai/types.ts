import type { DealType } from "@/lib/constants";

export type ConsultationDraft = {
  name: string | null;
  phone: string | null;
  deal_type: DealType | null;
  regions: string | null;
  budget_min: number | null;
  budget_max: number | null;
  move_in_date: string | null;
  must_have: string | null;
  exclude: string | null;
  memo: string | null;
  summary: string;
  sms_draft: string;
  transcript_excerpt: string | null;
  provider: string;
};

export type PropertyMatch = {
  id: string;
  title: string;
  deal_type: string;
  region: string | null;
  price: number | null;
  monthly_rent: number | null;
  reason: string;
};

export type LocationDraft = {
  road_width: string;
  road_paved: string;
  road_access: string;
  bus_stop: string;
  bus_minutes: string;
  bus_mode: string;
  subway_station: string;
  subway_minutes: string;
  subway_mode: string;
  parking: string;
  school_elem: string;
  school_elem_min: string;
  school_elem_mode: string;
  school_mid: string;
  school_mid_min: string;
  school_mid_mode: string;
  school_high: string;
  school_high_min: string;
  school_high_mode: string;
  note: string;
};

export type VisitFieldDraft = { label: string; value: string };

export type VisitDraft = {
  transcript: string;
  fields: VisitFieldDraft[];
  checklist_ok: string[];
  follow_ups: string[];
  memo: string;
  provider: string;
};

export type ClauseSuggestion = {
  title: string;
  body: string;
  reason: string;
  expert_review: boolean;
};

export type DocumentAiField = {
  label: string;
  value: string;
  evidence_text: string | null;
};

export type DocumentAiSignal = {
  level: "전문가 검토" | "확인 필요" | "참고";
  title: string;
  description: string | null;
  evidence_text: string | null;
  next_action: string | null;
};
