/** 사무소 AI 사용 가능 여부 (구독 유료 플랜 또는 크레딧 잔액) */

export type AiAccessOffice = {
  billing_mode: string | null;
  plan_id: string;
  ai_credit_balance: number;
};

export function hasAiAccess(office: AiAccessOffice): boolean {
  if (office.billing_mode === "subscription") {
    return Boolean(office.plan_id) && office.plan_id !== "free";
  }
  if (office.billing_mode === "credits") {
    return (office.ai_credit_balance ?? 0) > 0;
  }
  return false;
}

export const AI_ACCESS_OK_LABEL = "사용 가능";
export const AI_ACCESS_LOCKED_LABEL = "구독 후 혹은 크레딧 결제 후 사용 가능";
