"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { kstLocalToIsoSafe, lines, str, toErrorMessage } from "@/lib/form";
import type { ActionState, ChecklistEntry, VisitField } from "@/types";
import { logPropertyEvent } from "./properties";

export async function createVisit(propertyId: string, _prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  try {
    const labels = fd.getAll("field_label").map(String);
    const values = fd.getAll("field_value").map(String);
    const fields: VisitField[] = labels
      .map((label, i) => ({ label: label.trim(), value: (values[i] ?? "").trim() }))
      .filter((f) => f.label && f.value);

    const checklist: ChecklistEntry[] = fd
      .getAll("check_label")
      .map(String)
      .map((label) => ({ label, checked: fd.get(`check:${label}`) === "on" }));

    const followUps = lines(str(fd, "follow_ups"));
    const memo = str(fd, "memo");
    const audioPath = str(fd, "audio_path");

    if (fields.length === 0 && !memo && !audioPath && followUps.length === 0) {
      return { error: "기록할 내용을 하나 이상 입력해 주세요." };
    }

    const visitedAt = str(fd, "visited_at");
    const { error } = await supabase.from("property_visits").insert({
      property_id: propertyId,
      visited_at: visitedAt ? kstLocalToIsoSafe(visitedAt) : new Date().toISOString(),
      fields: fields as unknown as never,
      checklist: checklist as unknown as never,
      follow_ups: followUps,
      memo,
      audio_path: audioPath,
      created_by: profile.id,
    });
    if (error) throw error;

    const direction = fields.find((f) => f.label === "방향")?.value;
    const availableText = fields.find((f) => f.label === "입주 가능일")?.value ?? "";
    const dateMatch = availableText.match(/^(\d{4})[-./]\s*(\d{1,2})[-./]\s*(\d{1,2})\.?$/);
    const available = dateMatch
      ? {
          available_from: `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`,
          available_negotiable: false,
        }
      : availableText.includes("협의")
        ? { available_from: null, available_negotiable: true }
        : null;
    if (direction || available) {
      const { error: syncError } = await supabase
        .from("properties")
        .update({ ...(direction && { direction }), ...available })
        .eq("id", propertyId);
      if (syncError) throw syncError;
    }

    await supabase.from("properties").update({ status: "광고 중" }).eq("id", propertyId).eq("status", "임장 전");
    await logPropertyEvent(propertyId, `임장 기록 저장 (항목 ${fields.length}개)`);
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/visit`);
  return { message: "임장 기록을 저장했어요." };
}

export async function deleteVisit(visitId: string, propertyId: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { data: visit } = await supabase.from("property_visits").select("audio_path").eq("id", visitId).single();
  const { error } = await supabase.from("property_visits").delete().eq("id", visitId);
  if (error) return { error: toErrorMessage(error) };
  if (visit?.audio_path) await supabase.storage.from("visit-audio").remove([visit.audio_path]);
  revalidatePath(`/properties/${propertyId}/visit`);
  revalidatePath(`/properties/${propertyId}`);
  return { message: "임장 기록을 삭제했어요." };
}
