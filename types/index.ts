import type { Tables } from "@/lib/supabase/database.types";

export type Office = Tables<"offices">;
export type Profile = Tables<"profiles">;
export type OfficeInvite = Tables<"office_invites">;
export type Property = Tables<"properties">;
export type PropertyPhoto = Tables<"property_photos">;
export type PropertyVisit = Tables<"property_visits">;
export type PropertyEvent = Tables<"property_events">;
export type PropertyDocument = Tables<"documents">;
export type DocumentField = Tables<"document_fields">;
export type DocumentSignal = Tables<"document_signals">;
export type Customer = Tables<"customers">;
export type Consultation = Tables<"consultations">;
export type Task = Tables<"tasks">;
export type Deal = Tables<"deals">;
export type DealChecklistItem = Tables<"deal_checklist_items">;
export type DealClause = Tables<"deal_clauses">;
export type DealForm = Tables<"deal_forms">;
export type DealFormShare = Tables<"deal_form_shares">;
export type OfficeClause = Tables<"office_clauses">;
export type Briefing = Tables<"briefings">;

export interface VisitField {
  label: string;
  value: string;
  note?: string;
}

export interface ChecklistEntry {
  label: string;
  checked: boolean;
}

export interface BriefingSections {
  photos: boolean;
  price: boolean;
  specs: boolean;
  description: boolean;
  highlights: boolean;
  followUps: boolean;
  contact: boolean;
}

/** 기능을 쓰기 전에 보완이 필요한 정보 */
export type ProfileNeed = "phone" | "office_name";

export interface ActionState {
  error?: string;
  message?: string;
  /** 작업 전에 보완해야 할 프로필·사무소 정보 */
  needs?: ProfileNeed[];
}
