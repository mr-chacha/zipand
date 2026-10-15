"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { requiredStr, str, toErrorMessage } from "@/lib/form";
import type { ActionState } from "@/types";

/** 다음 단계 주소. /setup 밖으로는 보내지 않는다. */
function nextPath(fd: FormData) {
  const next = str(fd, "next");
  return next && next.startsWith("/setup") ? next : "/setup";
}

export async function saveSetupProfile(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        name: requiredStr(fd, "name", "이름"),
        phone: requiredStr(fd, "phone", "휴대폰 번호"),      })
      .eq("id", profile.id);
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/", "layout");
  redirect(nextPath(fd));
}

/** 마지막 단계에서 완료하거나 건너뛰면 호출. 이후 수정은 마이페이지에서 한다. */
export async function finishSetup(): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  const { error } = await supabase
    .from("profiles")
    .update({ setup_completed_at: new Date().toISOString() })
    .eq("id", profile.id);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
