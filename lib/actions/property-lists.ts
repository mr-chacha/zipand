"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { toErrorMessage } from "@/lib/form";
import type { ActionState } from "@/types";

const MAX_ITEMS = 20;

/** 고른 매물로 공유용 매물 리스트를 만들고 링크 토큰을 돌려준다 */
export async function createPropertyList(input: {
  title: string;
  comment: string;
  customerId: string | null;
  propertyIds: string[];
  days: number;
}): Promise<ActionState & { token?: string }> {
  const title = input.title.trim();
  const propertyIds = [...new Set(input.propertyIds)];
  if (!title) return { error: "리스트 제목을 입력해 주세요." };
  if (propertyIds.length === 0) return { error: "공유할 매물을 하나 이상 골라 주세요." };
  if (propertyIds.length > MAX_ITEMS) return { error: `매물은 한 리스트에 최대 ${MAX_ITEMS}개까지 담을 수 있어요.` };

  const { supabase, profile } = await getSession();
  const validDays = [3, 7, 14, 30].includes(input.days) ? input.days : 14;
  const { data: list, error } = await supabase
    .from("property_lists")
    .insert({
      title,
      comment: input.comment.trim() || null,
      customer_id: input.customerId,
      expires_at: new Date(Date.now() + validDays * 86400000).toISOString(),
      created_by: profile.id,
    })
    .select("id, token")
    .single();
  if (error) return { error: toErrorMessage(error) };

  const { error: itemsError } = await supabase
    .from("property_list_items")
    .insert(propertyIds.map((property_id, i) => ({ list_id: list.id, property_id, sort_order: i })));
  if (itemsError) {
    await supabase.from("property_lists").delete().eq("id", list.id);
    return { error: toErrorMessage(itemsError) };
  }

  revalidatePath("/properties/share");
  if (input.customerId) revalidatePath(`/customers/${input.customerId}`);
  return { token: list.token, message: "매물 리스트 링크를 만들었어요." };
}

export async function deletePropertyList(id: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("property_lists").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/properties/share");
  return { message: "링크를 삭제했어요. 더 이상 열람할 수 없어요." };
}
