"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  DEAL_CHECKLIST_STAGES,
  DEAL_STEPS,
  DEFAULT_DEAL_CHECKLIST,
  type DealChecklistStage,
  type DealStep,
} from "@/lib/constants";
import { syncCustomerStatus } from "@/lib/customer-status";
import { FormError, int, requiredStr, str, toErrorMessage } from "@/lib/form";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import type { ActionState } from "@/types";
import { logPropertyEvent } from "./properties";

/**
 * 매물에 연결된 진행 중 거래를 찾거나, 없으면 초안 거래를 만든다.
 * 계약서·확인설명서에서 연결 매물만 고른 경우에도 deal_id를 맞추기 위함.
 */
export async function ensureDealForProperty(
  propertyId: string
): Promise<{ ok: true; dealId: string; created: boolean } | { ok: false; error: string }> {
  try {
    const id = propertyId.trim();
    if (!id) return { ok: false, error: "매물을 선택해 주세요." };
    const { supabase, profile } = await getSession();

    const { data: existing, error: findError } = await supabase
      .from("deals")
      .select("id")
      .eq("property_id", id)
      .neq("stage", "취소")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (findError) throw findError;
    if (existing?.id) return { ok: true, dealId: existing.id, created: false };

    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("status, deal_type, price, monthly_rent, title")
      .eq("id", id)
      .single();
    if (propertyError) throw propertyError;

    const { data: created, error } = await supabase
      .from("deals")
      .insert({
        property_id: id,
        amount: property.price,
        monthly_rent: property.deal_type === "월세" ? property.monthly_rent : null,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error) throw error;

    const withLoan = property.deal_type !== "월세";
    const { error: checklistError } = await supabase.from("deal_checklist_items").insert(
      DEFAULT_DEAL_CHECKLIST.filter((item) => withLoan || !item.loanOnly).map((item, i) => ({
        deal_id: created.id,
        stage: item.stage,
        category: item.category,
        label: item.label,
        sort_order: i,
      }))
    );
    if (checklistError) throw checklistError;

    if (property.status !== "계약 완료") {
      await supabase.from("properties").update({ status: "계약 진행" }).eq("id", id);
    }
    await logPropertyEvent(id, "계약관리 시작(서식 작성)");
    revalidatePath("/contracts");
    return { ok: true, dealId: created.id, created: true };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}

export async function createDeal(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  let id: string;
  try {
    const propertyId = str(fd, "property_id");
    if (!propertyId) throw new FormError("거래할 매물을 선택해 주세요.");
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("status, deal_type, price, monthly_rent")
      .eq("id", propertyId)
      .single();
    if (propertyError) throw propertyError;

    const { data, error } = await supabase
      .from("deals")
      .insert({
        property_id: propertyId,
        customer_id: str(fd, "customer_id"),
        memo: str(fd, "memo"),
        // 조건 협의의 시작값은 매물 광고 금액
        amount: property.price,
        monthly_rent: property.deal_type === "월세" ? property.monthly_rent : null,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;

    const withLoan = property.deal_type !== "월세";
    const { error: checklistError } = await supabase.from("deal_checklist_items").insert(
      DEFAULT_DEAL_CHECKLIST.filter((item) => withLoan || !item.loanOnly).map((item, i) => ({
        deal_id: id,
        stage: item.stage,
        category: item.category,
        label: item.label,
        sort_order: i,
      }))
    );
    if (checklistError) throw checklistError;

    if (property.status !== "계약 완료") {
      await supabase.from("properties").update({ status: "계약 진행" }).eq("id", propertyId);
    }
    await syncCustomerStatus(supabase, str(fd, "customer_id"));
    await logPropertyEvent(propertyId, "계약관리 시작");
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/contracts");
  revalidatePath("/customers");
  redirect(`/contracts/${id}`);
}

export async function updateDeal(id: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  try {
    const { data: before } = await supabase.from("deals").select("customer_id").eq("id", id).single();
    const customerId = str(fd, "customer_id");
    const { error } = await supabase.from("deals").update({ customer_id: customerId, memo: str(fd, "memo") }).eq("id", id);
    if (error) throw error;
    if (before?.customer_id !== customerId) {
      await Promise.all([syncCustomerStatus(supabase, before?.customer_id), syncCustomerStatus(supabase, customerId)]);
    }
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  revalidatePath("/customers");
  return { message: "거래 정보를 저장했어요." };
}

const checked = (fd: FormData, key: string) => fd.get(key) === "on";

/** 단계별 입력값. 서류 확인은 체크리스트만 있어 입력값이 없다 */
function readStepValues(step: DealStep, fd: FormData, intent: string): TablesUpdate<"deals"> {
  switch (step) {
    case "조건 협의": {
      const amount = int(fd, "amount");
      if (intent === "next" && amount === null) throw new FormError("거래대금을 입력해 주세요.");
      return { amount, monthly_rent: int(fd, "monthly_rent"), move_in_date: str(fd, "move_in_date"), terms_note: str(fd, "terms_note") };
    }
    case "계약 준비":
      return {
        down_payment: int(fd, "down_payment"),
        down_payment_date: str(fd, "down_payment_date"),
        balance_date: str(fd, "balance_date"),
        commission: int(fd, "commission"),
        contract_date: str(fd, "contract_date"),
        lessor_name: str(fd, "lessor_name"),
        lessor_phone: str(fd, "lessor_phone"),
        lessor_account: str(fd, "lessor_account"),
        lessee_name: str(fd, "lessee_name"),
        lessee_phone: str(fd, "lessee_phone"),
        move_in_date: str(fd, "move_in_date"),
        loan_note: str(fd, "loan_note"),
        prep_note: str(fd, "prep_note"),
      };
    case "잔금 대기":
      return { commission_paid: checked(fd, "commission_paid"), balance_note: str(fd, "balance_note") };
    default:
      return {};
  }
}

/**
 * 단계 화면 저장. intent=next면 저장 후 다음 단계로 진행한다.
 * 이미 지난 단계를 다시 저장할 때는 진행 단계를 되돌리지 않는다.
 */
export async function saveDealStep(id: string, step: DealStep, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  if (!DEAL_STEPS.includes(step)) return { error: "단계를 확인해 주세요." };
  const intent = str(fd, "intent") ?? "save";
  const { supabase } = await getSession();
  const index = DEAL_STEPS.indexOf(step);
  const next = DEAL_STEPS[index + 1] ?? null;
  try {
    const { data: deal, error: readError } = await supabase.from("deals").select("stage, property_id, customer_id").eq("id", id).single();
    if (readError) throw readError;
    const values = readStepValues(step, fd, intent);
    const advance = intent === "next" && deal.stage === step;
    if (advance && next) values.stage = next;
    if (Object.keys(values).length) {
      const { error } = await supabase.from("deals").update(values).eq("id", id);
      if (error) throw error;
    }
    if (advance) {
      await syncCustomerStatus(supabase, deal.customer_id);
      await logPropertyEvent(deal.property_id, `거래 단계 진행: ${next ?? "거래 완료 대기"}`);
    }
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  if (intent === "next") redirect(`/contracts/${id}?step=${index + 2}`);
  return { message: "저장했어요." };
}

/** 마지막 단계: 거래 완료 (intent=complete | save) */
export async function completeDeal(id: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const intent = str(fd, "intent") ?? "save";
  const { supabase } = await getSession();
  try {
    const { data: deal, error: readError } = await supabase.from("deals").select("stage, property_id, customer_id").eq("id", id).single();
    if (readError) throw readError;
    if (deal.stage === "취소") throw new FormError("취소된 계약이에요.");

    const values: TablesUpdate<"deals"> = {
      closing_note: str(fd, "closing_note"),
      commission_paid: checked(fd, "commission_paid"),
    };
    const completing = intent === "complete" && deal.stage !== "완료";
    if (completing) {
      if (deal.stage !== "잔금 대기") throw new FormError("잔금 대기 단계까지 진행한 뒤 완료할 수 있어요.");
      values.stage = "완료";
    }

    const { error } = await supabase.from("deals").update(values).eq("id", id);
    if (error) throw error;

    if (completing) {
      await supabase.from("properties").update({ status: "계약 완료" }).eq("id", deal.property_id);
      await syncCustomerStatus(supabase, deal.customer_id);
      await logPropertyEvent(deal.property_id, "거래 완료");
    }
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  revalidatePath("/properties");
  revalidatePath("/customers");
  return { message: intent === "complete" ? "거래를 완료했어요." : "저장했어요." };
}

/** 계약 취소: 사유를 남기고 거래를 마무리한다. 매물은 다시 광고 중으로 돌린다 */
export async function cancelDeal(id: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  try {
    const reason = requiredStr(fd, "cancel_reason", "계약 취소 사유");
    const { data: deal, error: readError } = await supabase.from("deals").select("stage, property_id, customer_id").eq("id", id).single();
    if (readError) throw readError;
    if (deal.stage === "완료" || deal.stage === "취소") throw new FormError("이미 마무리된 계약이에요.");

    const { error } = await supabase.from("deals").update({ stage: "취소", cancel_reason: reason }).eq("id", id);
    if (error) throw error;
    await supabase.from("properties").update({ status: "광고 중" }).eq("id", deal.property_id).eq("status", "계약 진행");
    await syncCustomerStatus(supabase, deal.customer_id);
    // 취소된 계약의 공유 링크는 더 이상 열리지 않게 정리한다
    await supabase.from("deal_shares").delete().eq("deal_id", id);
    await logPropertyEvent(deal.property_id, `계약 취소: ${reason}`);
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  revalidatePath("/properties");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return { message: "계약을 취소했어요." };
}

/** 임대인·임차인에게 보낼 계약 진행 공유 링크 */
export async function createDealShare(dealId: string, days: number): Promise<ActionState & { token?: string }> {
  const { supabase, profile } = await getSession();
  const validDays = [3, 7, 14, 30].includes(days) ? days : 14;
  const { data, error } = await supabase
    .from("deal_shares")
    .insert({ deal_id: dealId, expires_at: new Date(Date.now() + validDays * 86400000).toISOString(), created_by: profile.id })
    .select("token")
    .single();
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/contracts/${dealId}`);
  return { token: data.token, message: "공유 링크를 만들었어요." };
}

export async function deleteDealShare(id: string, dealId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("deal_shares").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/contracts/${dealId}`);
  return { message: "링크를 삭제했어요. 더 이상 열람할 수 없어요." };
}

export async function deleteDeal(id: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { data: deal } = await supabase.from("deals").select("customer_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  await syncCustomerStatus(supabase, deal?.customer_id);
  revalidatePath("/contracts");
  revalidatePath("/customers");
  redirect("/contracts");
}

export async function toggleChecklistItem(itemId: string, dealId: string, done: boolean): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("deal_checklist_items").update({ done }).eq("id", itemId);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/contracts/${dealId}`);
  return {};
}

export async function addChecklistItem(
  dealId: string,
  stage: DealChecklistStage,
  _prev: ActionState | null,
  fd: FormData
): Promise<ActionState> {
  if (!DEAL_CHECKLIST_STAGES.includes(stage)) return { error: "단계를 확인해 주세요." };
  const { supabase } = await getSession();
  try {
    const { error } = await supabase.from("deal_checklist_items").insert({
      deal_id: dealId,
      stage,
      category: str(fd, "category") ?? "기타",
      label: requiredStr(fd, "label", "확인 항목"),
      sort_order: 1000,
    });
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath(`/contracts/${dealId}`);
  return { message: "항목을 추가했어요." };
}

export async function deleteChecklistItem(itemId: string, dealId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("deal_checklist_items").delete().eq("id", itemId);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/contracts/${dealId}`);
  return {};
}

export async function addDealClause(dealId: string, body: string): Promise<ActionState> {
  const text = body.trim();
  if (!text) return { error: "특약 문구를 입력해 주세요." };
  const { supabase } = await getSession();
  const { count } = await supabase.from("deal_clauses").select("id", { count: "exact", head: true }).eq("deal_id", dealId);
  const { error } = await supabase.from("deal_clauses").insert({ deal_id: dealId, body: text, sort_order: count ?? 0 });
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/contracts/${dealId}`);
  return { message: "특약을 추가했어요." };
}

export async function updateDealClause(clauseId: string, dealId: string, body: string): Promise<ActionState> {
  const text = body.trim();
  if (!text) return { error: "특약 문구를 입력해 주세요." };
  const { supabase } = await getSession();
  const { error } = await supabase.from("deal_clauses").update({ body: text }).eq("id", clauseId);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/contracts/${dealId}`);
  return { message: "특약을 수정했어요." };
}

export async function deleteDealClause(clauseId: string, dealId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("deal_clauses").delete().eq("id", clauseId);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/contracts/${dealId}`);
  return {};
}

export async function createOfficeClause(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  try {
    const { error } = await supabase.from("office_clauses").insert({
      category: str(fd, "category") ?? "기타",
      title: requiredStr(fd, "title", "제목"),
      body: requiredStr(fd, "body", "특약 문구"),
      created_by: profile.id,
    });
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/contracts");
  return { message: "사무소 특약을 저장했어요." };
}

export async function deleteOfficeClause(id: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("office_clauses").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/contracts");
  return { message: "삭제했어요." };
}
