"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { TASK_TYPES } from "@/lib/constants";
import { kstLocalToIsoSafe, oneOf, requiredStr, str, toErrorMessage } from "@/lib/form";
import type { ActionState } from "@/types";

function revalidateTaskPaths(customerId?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  if (customerId) revalidatePath(`/customers/${customerId}`);
}

export async function createTask(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  let customerId: string | null = null;
  try {
    customerId = str(fd, "customer_id");
    const { error } = await supabase.from("tasks").insert({
      title: requiredStr(fd, "title", "할 일"),
      type: oneOf(fd, "type", TASK_TYPES, "종류"),
      due_at: kstLocalToIsoSafe(requiredStr(fd, "due_at", "일시")),
      property_id: str(fd, "property_id"),
      customer_id: customerId,
      assignee_id: str(fd, "assignee_id") ?? profile.id,
      created_by: profile.id,
    });
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidateTaskPaths(customerId);
  return { message: "할 일을 추가했어요." };
}

export async function toggleTask(id: string, done: boolean): Promise<ActionState> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("tasks").update({ done }).eq("id", id).select("customer_id").single();
  if (error) return { error: toErrorMessage(error) };
  revalidateTaskPaths(data.customer_id);
  return {};
}

export async function deleteTask(id: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { data, error } = await supabase.from("tasks").delete().eq("id", id).select("customer_id").single();
  if (error) return { error: toErrorMessage(error) };
  revalidateTaskPaths(data.customer_id);
  return { message: "할 일을 삭제했어요." };
}
