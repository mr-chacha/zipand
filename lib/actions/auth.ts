"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { str, toErrorMessage } from "@/lib/form";
import { validatePassword } from "@/lib/password";
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
  if (error) return { error: toErrorMessage(error) };

  redirect(safeNext(str(formData, "next")));
}

export async function signup(_prev: ActionState | null, formData: FormData): Promise<ActionState> {
  const email = str(formData, "email");
  const password = str(formData, "password");
  const inviteToken = str(formData, "invite_token");

  if (!email || !password) return { error: "이메일과 비밀번호를 입력해 주세요." };
  const passwordError = validatePassword(password, str(formData, "password_confirm"));
  if (passwordError) return { error: passwordError };
  if (formData.get("agree_terms") !== "on" || formData.get("agree_privacy") !== "on") {
    return { error: "필수 약관에 동의해 주세요." };
  }

  // 이름·사무소 이름은 가입 후 온보딩에서 받는다. 비어 있으면 가입 트리거가 기본값을 넣는다.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/confirm?next=/onboarding`,
      data: { invite_token: inviteToken },
    },
  });

  if (error) {
    // 가입 트리거(handle_new_user)가 초대 검증에 실패하면 Auth는 "Database error saving new user"만 돌려준다
    if (inviteToken && error.message.includes("Database error")) {
      return { error: "초대 정보가 유효하지 않거나 초대받은 이메일과 달라요." };
    }
    return { error: toErrorMessage(error) };
  }

  if (!data.session) {
    return { message: `${email}로 인증 메일을 보냈어요.\n메일의 링크를 누르면 가입이 완료됩니다.` };
  }

  redirect("/onboarding");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
