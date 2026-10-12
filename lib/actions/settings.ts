"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { FormError, requiredStr, str, toErrorMessage } from "@/lib/form";
import type { ActionState } from "@/types";

const OWNER_ONLY = "대표만 변경할 수 있어요.";

export async function updateOffice(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile, office } = await getSession();
  if (profile.role !== "owner") return { error: OWNER_ONLY };
  try {
    const { error } = await supabase
      .from("offices")
      .update({
        name: requiredStr(fd, "name", "사무소명"),
        registration_no: str(fd, "registration_no"),
        representative: str(fd, "representative"),
        phone: str(fd, "phone"),
        address: str(fd, "address"),
      })
      .eq("id", office.id);
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/", "layout");
  return { message: "사무소 정보를 저장했어요." };
}

export async function updateProfile(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        name: requiredStr(fd, "name", "이름"),
        phone: str(fd, "phone"),
        license_no: str(fd, "license_no"),
      })
      .eq("id", profile.id);
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/", "layout");
  return { message: "계정 정보를 저장했어요." };
}

export async function changePassword(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase } = await getSession();
  try {
    const password = requiredStr(fd, "password", "새 비밀번호");
    if (password.length < 8) throw new FormError("비밀번호는 8자 이상이어야 해요.");
    if (password !== str(fd, "password_confirm")) throw new FormError("비밀번호 확인이 일치하지 않아요.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      if (error.code === "same_password") throw new FormError("현재 비밀번호와 다른 비밀번호를 입력해 주세요.");
      if (error.code === "weak_password") throw new FormError("더 안전한 비밀번호를 입력해 주세요.");
      throw error;
    }
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  return { message: "비밀번호를 변경했어요." };
}

export async function createInvite(_prev: ActionState | null, fd: FormData): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  if (profile.role !== "owner") return { error: "대표만 초대할 수 있어요." };
  try {
    const email = requiredStr(fd, "email", "이메일").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new FormError("이메일 형식이 올바르지 않아요.");
    const role = str(fd, "role") === "staff" ? "staff" : "agent";

    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("email", email);
    if (count) throw new FormError("이미 사무소에 등록된 이메일이에요.");

    const { error } = await supabase.from("office_invites").insert({ email, role, invited_by: profile.id });
    if (error) throw error;
  } catch (e) {
    return { error: toErrorMessage(e) };
  }
  revalidatePath("/settings");
  return { message: "초대 링크를 만들었어요. 링크를 복사해 전달해 주세요." };
}

export async function revokeInvite(id: string): Promise<ActionState> {
  const { supabase } = await getSession();
  const { error } = await supabase.from("office_invites").delete().eq("id", id);
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/settings");
  return { message: "초대를 취소했어요." };
}

export async function updateMember(memberId: string, role: string, active: boolean): Promise<ActionState> {
  const { supabase, profile } = await getSession();
  if (profile.role !== "owner") return { error: OWNER_ONLY };
  const { error } = await supabase.rpc("update_member", { member_id: memberId, new_role: role, new_active: active });
  if (error) return { error: toErrorMessage(error) };
  revalidatePath("/settings");
  return { message: "구성원 정보를 변경했어요." };
}
