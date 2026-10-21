import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FormError } from "@/lib/errors";
import type { Database } from "@/lib/supabase/database.types";

type OfficeBilling = {
  id: string;
  billing_mode: string | null;
  ai_credit_balance: number;
};

/** 크레딧 과금일 때만 차감. 구독·미선택은 통과(구독 한도는 추후). */
export async function consumeAiCredit(
  supabase: SupabaseClient<Database>,
  office: OfficeBilling,
  amount = 1
) {
  if (office.billing_mode !== "credits") return;
  if ((office.ai_credit_balance ?? 0) < amount) {
    throw new FormError("AI 크레딧이 부족해요. 설정 → AI·요금에서 충전하거나 구독으로 바꿔 주세요.");
  }
  const next = office.ai_credit_balance - amount;
  const { error } = await supabase.from("offices").update({ ai_credit_balance: next }).eq("id", office.id);
  if (error) throw error;
}
