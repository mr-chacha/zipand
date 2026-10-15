"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CONSULT_CHANNELS, CUSTOMER_STATUSES, DEAL_TYPES } from "@/lib/constants";
import { FormError } from "@/lib/errors";
import { int, kstLocalToIsoSafe, oneOf, requiredStr, str, toErrorMessage } from "@/lib/form";
import { isPropertyPath } from "@/lib/storage";
import type { ActionState } from "@/types";
import { logPropertyEvent } from "./properties";

function readCustomerForm(fd: FormData) {
  const dealType = str(fd, "deal_type");
  return {
    name: requiredStr(fd, "name", "고객명"),
    phone: str(fd, "phone"),
    deal_type: dealType && (DEAL_TYPES as readonly string[]).includes(dealType) ? dealType : null,
    regions: str(fd, "regions"),
    budget_min: int(fd, "budget_min"),
    budget_max: int(fd, "budget_max"),
    move_in_date: str(fd, "move_in_date"),
    must_have: str(fd, "must_have"),
    exclude: str(fd, "exclude"),
    memo: str(fd, "memo"),
    status: oneOf(fd, "status", CUSTOMER_STATUSES, "상태"),
    manager_id: str(fd, "manager_id"),
  };
}

export async function createCustomer(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  let id: string;
  try {
    const values = readCustomerForm(fd);
    const { data, error } = await supabase
      .from("customers")
      .insert({ ...values, manager_id: values.manager_id ?? profile.id, created_by: profile.id })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

export async function updateCustomer(id: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  try {
    const { error } = await supabase.from("customers").update(readCustomerForm(fd)).eq("id", id);
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

export async function deleteCustomer(id: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/customers");
  redirect("/customers");
}

export async function addConsultation(customerId: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile, office } = await getSession();
  try {
    const consultedAt = str(fd, "consulted_at");
    const audioPath = str(fd, "audio_path");
    if (audioPath && !isPropertyPath(audioPath, office.id, customerId)) throw new FormError("녹음 파일 경로가 올바르지 않아요.");
    const content = str(fd, "content") ?? "";
    if (!content && !audioPath) throw new FormError("상담 내용을 입력하거나 녹음을 첨부해 주세요.");
    const { error } = await supabase.from("consultations").insert({
      customer_id: customerId,
      channel: oneOf(fd, "channel", CONSULT_CHANNELS, "상담 방식"),
      content,
      consulted_at: consultedAt ? kstLocalToIsoSafe(consultedAt) : new Date().toISOString(),
      created_by: profile.id,
      audio_path: audioPath,
      audio_name: audioPath ? str(fd, "audio_name") : null,
      audio_size: audioPath ? int(fd, "audio_size") : null,
      audio_duration_sec: audioPath ? int(fd, "audio_duration_sec") : null,
    });
    if (error) throw error;
    await supabase.from("customers").update({ updated_at: new Date().toISOString() }).eq("id", customerId);
    await supabase.from("customers").update({ status: "연락 완료" }).eq("id", customerId).eq("status", "연락 전");
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return { message: "상담 기록을 저장했어요." };
}

export async function deleteConsultation(id: string, customerId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { data: removed, error } = await supabase.from("consultations").delete().eq("id", id).select("audio_path").maybeSingle();
  if (error) return { error: toErrorMessage(error) };
  if (removed?.audio_path) await supabase.storage.from("consultation-audio").remove([removed.audio_path]);
  revalidatePath(`/customers/${customerId}`);
  return { message: "상담 기록을 삭제했어요." };
}

export async function linkCustomerProperty(customerId: string, propertyId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase
    .from("customer_properties")
    .upsert({ customer_id: customerId, property_id: propertyId }, { onConflict: "customer_id,property_id" });
  if (error) return { error: toErrorMessage(error) };

  const { data: customer } = await supabase.from("customers").select("name").eq("id", customerId).single();
  await logPropertyEvent(propertyId, `고객 연결: ${customer?.name ?? ""}`);
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/properties/${propertyId}`);
  return { message: "연결했어요." };
}

export async function unlinkCustomerProperty(customerId: string, propertyId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase
    .from("customer_properties")
    .delete()
    .eq("customer_id", customerId)
    .eq("property_id", propertyId);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/properties/${propertyId}`);
  return { message: "연결을 해제했어요." };
}
