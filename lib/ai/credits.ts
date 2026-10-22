import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasAiAccess, type AiAccessOffice } from "@/lib/ai/access";
import { FormError } from "@/lib/errors";
import type { Database } from "@/lib/supabase/database.types";

type OfficeBilling = AiAccessOffice & { id: string };

/** 사용 권한 확인 후, 크레딧 과금일 때만 차감. 구독(유료)은 통과(한도는 추후). */
export async function consumeAiCredit(
  supabase: SupabaseClient<Database>,
  office: OfficeBilling,
  amount = 1
) {
  if (!hasAiAccess(office)) {
    throw new FormError("구독 후 혹은 크레딧 결제 후 사용할 수 있어요. 설정 → AI·요금에서 확인해 주세요.");
  }
  if (office.billing_mode !== "credits") return;
  if ((office.ai_credit_balance ?? 0) < amount) {
    throw new FormError("AI 크레딧이 부족해요. 설정 → AI·요금에서 충전하거나 구독으로 바꿔 주세요.");
  }
  const next = office.ai_credit_balance - amount;
  const { error } = await supabase.from("offices").update({ ai_credit_balance: next }).eq("id", office.id);
  if (error) throw error;
}
