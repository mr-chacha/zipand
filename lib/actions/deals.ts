"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DEAL_STAGES, DEFAULT_DEAL_CHECKLIST, type DealStage } from "@/lib/constants";
import { FormError, int, requiredStr, str, toErrorMessage } from "@/lib/form";
import type { ActionState } from "@/types";
import { logPropertyEvent } from "./properties";

export async function createDeal(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  let id: string;
  try {
    const propertyId = str(fd, "property_id");
    if (!propertyId) throw new FormError("거래할 매물을 선택해 주세요.");
    const { data, error } = await supabase
      .from("deals")
      .insert({
        property_id: propertyId,
        customer_id: str(fd, "customer_id"),
        contract_date: str(fd, "contract_date"),
        balance_date: str(fd, "balance_date"),
        amount: int(fd, "amount"),
        memo: str(fd, "memo"),
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;

    const { error: checklistError } = await supabase.from("deal_checklist_items").insert(
      DEFAULT_DEAL_CHECKLIST.map((item, i) => ({ deal_id: id, category: item.category, label: item.label, sort_order: i }))
    );
    if (checklistError) throw checklistError;

    const { data: property } = await supabase.from("properties").select("status").eq("id", propertyId).single();
    if (property && property.status !== "계약 완료") {
      await supabase.from("properties").update({ status: "계약 진행" }).eq("id", propertyId);
    }
    await logPropertyEvent(propertyId, "계약 준비 시작");
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/contracts");
  redirect(`/contracts/${id}`);
}

export async function updateDeal(id: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  try {
    const { error } = await supabase
      .from("deals")
      .update({
        customer_id: str(fd, "customer_id"),
        contract_date: str(fd, "contract_date"),
        balance_date: str(fd, "balance_date"),
        amount: int(fd, "amount"),
        memo: str(fd, "memo"),
      })
      .eq("id", id);
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  return { message: "거래 정보를 저장했어요." };
}

export async function updateDealStage(id: string, stage: DealStage): Promise<ActionState> {
  if (!DEAL_STAGES.includes(stage)) return { error: "단계를 선택해 주세요." };
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("deals").update({ stage }).eq("id", id).select("property_id").single();
  if (error) return { error: toErrorMessage(error) };

  if (stage === "완료") await supabase.from("properties").update({ status: "계약 완료" }).eq("id", data.property_id);
  await logPropertyEvent(data.property_id, `거래 단계 변경: ${stage}`);
  revalidatePath(`/contracts/${id}`);
  revalidatePath("/contracts");
  return { message: `${stage} 단계로 변경했어요.` };
}

export async function deleteDeal(id: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/contracts");
  redirect("/contracts");
}

export async function toggleChecklistItem(itemId: string, dealId: string, done: boolean): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("deal_checklist_items").update({ done }).eq("id", itemId);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/contracts/${dealId}`);
  return {};
}

export async function addChecklistItem(dealId: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  try {
    const { error } = await supabase.from("deal_checklist_items").insert({
      deal_id: dealId,
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
