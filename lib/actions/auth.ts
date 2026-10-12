"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/form";
import type { ActionState } from "@/types";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function login(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const email = str(formData, "email");
  const password = str(formData, "password");
  if (!email || !password) return { error: "이메일과 비밀번호를 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return { error: "이메일 인증이 완료되지 않았어요. 받은 메일의 인증 링크를 눌러주세요." };
    }
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect(safeNext(str(formData, "next")));
}

export async function signup(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const email = str(formData, "email");
  const password = str(formData, "password");
  const name = str(formData, "name");
  const inviteToken = str(formData, "invite_token");
  const officeName = str(formData, "office_name");

  if (!email || !password || !name) return { error: "이름, 이메일, 비밀번호를 입력해 주세요." };
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };
  if (!inviteToken && !officeName) return { error: "사무소 이름을 입력해 주세요." };
  if (formData.get("agree_terms") !== "on" || formData.get("agree_privacy") !== "on") {
    return { error: "필수 약관에 동의해 주세요." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/confirm?next=/dashboard`,
      data: {
        name,
        phone: str(formData, "phone"),
        license_no: str(formData, "license_no"),
        office_name: officeName,
        invite_token: inviteToken,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "이미 가입된 이메일입니다." };
    }
    if (error.message.includes("Database error")) {
      return { error: "초대 정보가 유효하지 않거나 초대받은 이메일과 다릅니다." };
    }
    return { error: error.message };
  }

  if (!data.session) {
    return { message: `${email}로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료됩니다.` };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
