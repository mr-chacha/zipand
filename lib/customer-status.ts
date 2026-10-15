import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerStatus } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";

/** 계약 진행으로 정해지는 고객 상태. 이 상태들은 거래가 없어지면 '관심 고객'으로 돌린다 */
const DEAL_DRIVEN: CustomerStatus[] = ["진행 중", "계약 완료", "중개 완료"];

/**
 * 고객의 거래 단계에 맞춰 고객 상태를 맞춘다.
 * 진행 중인 거래가 있으면 잔금 대기 → 계약 완료, 그 외 → 진행 중 / 완료된 거래만 있으면 중개 완료
 * / 취소됐거나 거래가 없으면 계약 상태였던 고객만 관심 고객으로 돌린다.
 */
export async function syncCustomerStatus(supabase: SupabaseClient<Database>, customerId: string | null | undefined) {
  if (!customerId) return;
  const [{ data: deals }, { data: customer }] = await Promise.all([
    supabase.from("deals").select("stage").eq("customer_id", customerId),
    supabase.from("customers").select("status").eq("id", customerId).maybeSingle(),
  ]);
  if (!customer) return;

  const stages = (deals ?? []).map((d) => d.stage);
  const active = stages.filter((s) => s !== "완료" && s !== "취소");
  let next: CustomerStatus | null;
  if (active.length) next = active.includes("잔금 대기") ? "계약 완료" : "진행 중";
  else if (stages.includes("완료")) next = "중개 완료";
  else next = DEAL_DRIVEN.includes(customer.status as CustomerStatus) ? "관심 고객" : null;

  if (next && next !== customer.status) {
    await supabase.from("customers").update({ status: next }).eq("id", customerId);
  }
}
