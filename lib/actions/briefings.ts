"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { toErrorMessage } from "@/lib/form";
import type { ActionState, BriefingSections } from "@/types";
import { logPropertyEvent } from "./properties";

export async function createBriefing(
  propertyId: string,
  sections: BriefingSections,
  comment: string,
  days: number
): Promise<ActionState & { token?: string }> {
  const { supabase, profile } = await getSession();
  const validDays = [3, 7, 14, 30].includes(days) ? days : 14;
  const { data, error } = await supabase
    .from("briefings")
    .insert({
      property_id: propertyId,
      sections: sections as unknown as never,
      comment: comment.trim() || null,
      expires_at: new Date(Date.now() + validDays * 86400000).toISOString(),
      created_by: profile.id,
    })
    .select("token")
    .single();
  if (error) return { error: toErrorMessage(error) };

  await logPropertyEvent(propertyId, `고객 브리핑 링크 생성 (${validDays}일)`);
  revalidatePath(`/properties/${propertyId}/briefing`);
  return { message: "공유 링크를 만들었어요.", token: data.token };
}

export async function deleteBriefing(id: string, propertyId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("briefings").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath(`/properties/${propertyId}/briefing`);
  return { message: "링크를 삭제했어요. 더 이상 열람할 수 없어요." };
}
